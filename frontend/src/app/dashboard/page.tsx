import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileImage, BarChart3, Binary } from "lucide-react";
import { cn } from "@/lib/utils";

const mockJobs = [
  { id: "ANL-7721", type: "Colony Analysis", status: "Verified", dynamicLabel: "Colony Map", dynamicValue: "view_img.png" },
  { id: "ANL-7718", type: "Peptide MS", status: "Verified", dynamicLabel: "Rel. Abundance", dynamicValue: "88.4%" },
  { id: "ANL-7690", type: "CRISPR Target", status: "Failed", dynamicLabel: "Mismatches", dynamicValue: "4" },
];

export default function AnalysisHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Analysis History</h1>
        <p className="text-slate-500 font-medium mt-1">Archive of all verified molecular diagnostics and node outputs.</p>
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
            {mockJobs.map((job) => (
              <TableRow key={job.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                <TableCell className="font-mono font-bold text-indigo-400 py-5">{job.id}</TableCell>
                <TableCell className="font-bold text-slate-200">{job.type}</TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                    job.status === "Verified" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}>
                    {job.status}
                  </span>
                </TableCell>
                <TableCell className="text-right px-8">
                   <div className="flex items-center justify-end gap-3 font-bold">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{job.dynamicLabel}:</span>
                      <span className="text-sm text-white flex items-center gap-2">
                        {job.dynamicValue}
                        {job.type === "Colony Analysis" && <Download className="w-4 h-4 text-indigo-400 cursor-pointer" />}
                      </span>
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