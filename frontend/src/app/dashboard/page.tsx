"use client";

import { useEffect, useState } from "react";
// Ensure you see 'Clock' here in the imports
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table";
import { Download, Search, RefreshCcw, Inbox, PlusCircle, Loader2, Clock } from "lucide-react"; 
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

  if (isLoading) return <div className="p-20 text-center text-slate-500 uppercase font-black tracking-widest animate-pulse">Syncing...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">Analysis History</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
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
              <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                <TableCell className="font-mono font-bold text-indigo-400 py-5 px-6">{item.id}</TableCell>
                <TableCell className="font-bold text-slate-200">{item.method}</TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                    item.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
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
                      
                      {/* --- BRIGHTER CLOCK LOGIC --- */}
                      <div className="flex items-center gap-2">
                        {item.status === "PENDING" && (
                          <div className="relative flex items-center justify-center">
                             {/* The Glow effect */}
                             <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full animate-pulse" />
                             <Clock className="w-3.5 h-3.5 text-amber-400 relative z-10 animate-spin-slow" />
                          </div>
                        )}
                        <span className={cn(
                          "text-sm font-mono font-bold",
                          item.status === "PENDING" ? "text-amber-500/80" : "text-slate-200"
                        )}>
                          {item.result.value}
                        </span>
                      </div>
                    </div>

                    <div className="w-9 h-9 flex items-center justify-center">
                      {item.status === "COMPLETED" && item.result.type === "image" ? (
                        <Download className="w-4 h-4 text-indigo-400 cursor-pointer" />
                      ) : item.status === "PENDING" ? (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      ) : null}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}