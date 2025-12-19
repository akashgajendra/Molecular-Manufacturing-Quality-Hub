"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileImage, BarChart3, Binary, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// This simulates the data structure coming from your FastAPI backend
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Analysis History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of all verified molecular diagnostics and node outputs.</p>
        </div>
        
        {/* Simple Toolbar for a clean look */}
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
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
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
                
                <TableCell className="text-right px-8">
                   <div className="flex items-center justify-end gap-3 font-bold">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.result.label}:</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm",
                          item.result.type === "warning" ? "text-rose-400" : "text-white"
                        )}>
                          {item.result.value}
                        </span>
                        {item.result.type === "image" && (
                          <button className="p-1 hover:bg-indigo-500/20 rounded transition-colors group">
                            <Download className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                          </button>
                        )}
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