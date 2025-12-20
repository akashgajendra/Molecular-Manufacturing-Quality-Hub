"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table";
import { Download, Inbox, PlusCircle, Clock, Search, Filter, AlertCircle } from "lucide-react"; 
import { cn } from "../../../src/lib/utils";
import Link from "next/link";

interface Job {
  id: string;
  method: string;
  status: string;
  result: { label: string; value: string; type: string };
}

export default function AnalysisHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Uplink error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const isEmpty = jobs.length === 0;

  if (isLoading) return (
    <div className="p-20 text-center text-slate-500 uppercase font-black tracking-widest animate-pulse">
      Syncing Ledger...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Analysis History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of all verified molecular diagnostics and node outputs.</p>
        </div>
        {!isEmpty && (
          <div className="flex gap-3">
             <Link href="/new-analysis">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                New Analysis
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* --- CONTENT --- */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-6 relative">
              <Inbox className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Workers Dispatched</h2>
            <Link href="/new-analysis">
              <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all">
                <PlusCircle className="w-5 h-5" />
                Initialize First Job
              </button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">Analysis ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">QC Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right px-8">Technical Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((item) => (
                <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono font-bold text-indigo-400 py-5 px-6">{item.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-bold text-slate-200">{item.method.replace('_', ' ')}</TableCell>
                  
                  {/* --- UPDATED COLOR LOGIC --- */}
                  <TableCell>
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                      // GREEN for success
                      (item.status === "COMPLETED" || item.status === "Verified") && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      // RED for failures
                      item.status === "FAILED" && "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
                      // AMBER for pending/processing
                      (item.status === "PENDING" || item.status === "PROCESSING") && "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                    )}>
                      {item.status}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right px-8">
                    <div className="flex items-center justify-end gap-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase text-slate-600 font-bold tracking-widest">
                          {item.result.label}
                        </span>
                        <span className={cn(
                          "text-sm font-mono font-bold",
                          item.status === "FAILED" ? "text-rose-500" : "text-slate-200"
                        )}>
                          {item.status === "FAILED" ? "TERMINATED" : item.result.value}
                        </span>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                        {item.status === "FAILED" ? (
                          <AlertCircle className="w-4 h-4 text-rose-500 animate-bounce" />
                        ) : item.status === "COMPLETED" ? (
                          <Download className="w-4 h-4 text-indigo-400 cursor-pointer" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}