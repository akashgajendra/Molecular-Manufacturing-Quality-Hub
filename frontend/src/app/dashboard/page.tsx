"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../@/components/ui/table";
import { Download, Inbox, PlusCircle, Clock, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"; 
import { cn } from "../../../src/lib/utils";
import Link from "next/link";

interface Job {
  id: string;
  method: string;
  status: string;
  result: { 
    label: string; 
    value: string; 
    type: string;
    download_url?: string; // New Field
  };
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

  if (isLoading) return (
    <div className="p-20 text-center text-slate-500 uppercase font-black tracking-widest animate-pulse">
      Syncing Ledger...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Analysis History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of all verified molecular diagnostics and node outputs.</p>
        </div>
        {jobs.length > 0 && (
          <Link href="/dashboard/dispatch">
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              New Analysis
            </button>
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <Inbox className="w-12 h-12 text-slate-700 mb-6" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Workers Dispatched</h2>
            <Link href="/dashboard/dispatch">
              <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all">
                <PlusCircle className="w-5 h-5" /> Initialize First Job
              </button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">Analysis ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">QC Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right px-8">Technical Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((item) => {
                const isSuccess = ["PASS", "COMPLETED", "Verified"].includes(item.status);
                const isFail = ["FAIL", "FAILED"].includes(item.status);
                const isWarning = item.status === "WARNING";
                const isPending = ["PENDING", "PROCESSING"].includes(item.status);
                const isNotFound = item.result.label.includes("NOT DETECTED");

                return (
                  <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-indigo-400 py-5 px-6">{item.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-bold text-slate-200">{item.method}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                        isSuccess && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        isFail && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        (isWarning || isPending) && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-8 py-5">
                      <div className="flex items-center justify-end gap-5">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase text-slate-600 font-bold tracking-widest mb-0.5">{item.result.label}</span>
                          <span className={cn(
                            "text-sm font-mono font-bold",
                            (isSuccess && !isNotFound) && "text-emerald-400",
                            (isFail || isNotFound) && "text-rose-500",
                            isWarning && "text-amber-400",
                            isPending && "text-slate-500 italic"
                          )}>
                            {item.status === "FAILED" ? "TERMINATED" : item.result.value}
                          </span>
                        </div>
                        <div className="w-9 h-9 flex items-center justify-center">
                          {/* If a download URL exists, show Download button, else show status icon */}
                          {item.result.download_url ? (
                            <a 
                              href={item.result.download_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full transition-all border border-indigo-500/20"
                              title="Download Annotated Image"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          ) : isFail || isNotFound ? (
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-emerald-500/20" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}