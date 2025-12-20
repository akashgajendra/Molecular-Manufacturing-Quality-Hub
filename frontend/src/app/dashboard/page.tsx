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
    type: string 
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
             <Link href="/dashboard/dispatch">
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
             <Inbox className="w-12 h-12 text-slate-700 mb-6" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Workers Dispatched</h2>
            <Link href="/dashboard/dispatch">
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">QC Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right px-8">Technical Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((item) => {
                const isSuccess = item.status === "PASS" || item.status === "COMPLETED" || item.status === "Verified";
                const isScientificFail = item.status === "FAIL";
                const isSystemError = item.status === "FAILED";
                const isWarning = item.status === "WARNING";
                const isPending = item.status === "PENDING" || item.status === "PROCESSING";

                return (
                  <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-indigo-400 py-5 px-6">
                      {item.id.slice(0, 8)}
                    </TableCell>
                    
                    <TableCell className="font-bold text-slate-200">
                      {item.method.replace('_', ' ')}
                    </TableCell>

                    {/* --- COLUMN 3: QC STATUS --- */}
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                        isSuccess && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        (isScientificFail || isSystemError) && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        isWarning && "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]",
                        isPending && "bg-slate-500/10 text-slate-400 border-slate-500/20 animate-pulse"
                      )}>
                        {item.status}
                      </span>
                    </TableCell>
                    
                    {/* --- COLUMN 4: TECHNICAL RESULT --- */}
                    <TableCell className="text-right px-8 py-5">
                      <div className="flex items-center justify-end gap-5">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase text-slate-600 font-bold tracking-widest mb-0.5">
                            {(isSuccess || isScientificFail || isWarning) ? "SPECIFICITY" : item.result.label}
                          </span>
                          <span className={cn(
                            "text-sm font-mono font-bold",
                            isSuccess && "text-emerald-400",
                            (isScientificFail || isSystemError) && "text-rose-500",
                            isWarning && "text-amber-400",
                            isPending && "text-slate-500 italic"
                          )}>
                            {isSystemError ? "TERMINATED" : 
                             (isSuccess || isScientificFail || isWarning) ? item.result.value : "SYNCING_NODE..."}
                          </span>
                        </div>
                        <div className="w-9 h-9 flex items-center justify-center">
                          {(isScientificFail || isSystemError) ? (
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-emerald-500/20" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
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