"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Filter, Inbox, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Set this to [] to test the empty state
// const analysisData: any[] = []; 
const analysisData = [
  { 
    id: "ANL-7721", 
    method: "Colony Analysis", 
    status: "Verified", 
    result: { label: "Colony Map", value: "plate_001.png", type: "image" } 
  },
  { 
    id: "ANL-7718", 
    method: "Peptide MS", 
    status: "Verified", 
    result: { label: "Rel. Abundance", value: "88.4%", type: "data" } 
  },
  { 
    id: "ANL-7690", 
    method: "CRISPR Target", 
    status: "Failed", 
    result: { label: "Mismatches", value: "4", type: "warning" } 
  },
];

export default function AnalysisHistoryPage() {
  const isEmpty = analysisData.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Analysis History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of all verified molecular diagnostics and node outputs.</p>
        </div>
        
        {!isEmpty && (
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                placeholder="Search ID..." 
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
            <button className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
        {isEmpty ? (
          /* --- EMPTY STATE VIEW --- */
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-6 shadow-2xl shadow-indigo-500/5 relative">
              <Inbox className="w-12 h-12 text-slate-700" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">No Workers Dispatched</h2>
            <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed mb-8">
              The analysis ledger is currently empty. Initialize a new molecular worker node to begin the verification process.
            </p>
            
            <Link href="/dashboard/dispatch">
              <button className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 group">
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Initialize First Job
              </button>
            </Link>
          </div>
        ) : (
          /* --- TABLE VIEW --- */
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Analysis ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">QC Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right px-8">Technical Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.map((item) => (
                <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono font-bold text-indigo-400 py-5">{item.id}</TableCell>
                  <TableCell className="font-bold text-slate-200">{item.method}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                      item.status === "Verified" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-8 font-bold">
                    {/* Dynamic results logic here */}
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