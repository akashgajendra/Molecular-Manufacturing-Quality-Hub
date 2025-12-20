"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../@/components/ui/card";
import { Input } from "../../../../@/components/ui/input";
import { Button } from "../../../../@/components/ui/button";
import { Label } from "../../../../@/components/ui/label";
import { Microscope, FileUp, Zap, Beaker, Terminal, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const analysisSchema = z.object({
  method: z.enum(["colony", "peptide", "crispr"]),
  sequenceEntry: z.string().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisSchema>;

export default function NewAnalysisPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // NEW: Status Modal State
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, jobId?: string } | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: { method: "peptide" }
  });

  const selectedMethod = watch("method");
  const currentSequence = watch("sequenceEntry") || "";

  const onSubmit = async (data: AnalysisFormValues) => {
    setIsSubmitting(true);
    setStatus(null); // Reset status
    
    const formData = new FormData();
    formData.append("method", data.method);
    if (data.sequenceEntry) formData.append("sequenceEntry", data.sequenceEntry);
    if (selectedFile) formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/submit-job", { method: "POST", body: formData });
      const result = await response.json();
      
      if (response.ok) {
        setStatus({ type: 'success', message: 'Job Submitted', jobId: result.job_id });
        // Optional: Reset form on success
        reset();
        setSelectedFile(null);
      } else {
        setStatus({ type: 'error', message: result.detail || 'Dispatch Protocol Failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network Interrupt: Backend Unreachable' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto space-y-8">
      {/* --- STATUS OVERLAY MODAL --- */}
      {status && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              {status.type === 'success' ? (
                <div className="bg-emerald-500/10 p-4 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
              ) : (
                <div className="bg-red-500/10 p-4 rounded-full">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-white font-black uppercase tracking-widest text-xl">{status.message}</h2>
              {status.jobId && (
                <p className="text-indigo-400 font-mono text-sm tracking-tighter">JOB_ID: {status.jobId}</p>
              )}
            </div>

            <Button 
              onClick={() => setStatus(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest"
            >
              Acknowledge
            </Button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-white uppercase tracking-tight">New Analysis</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Method Sidebar */}
        <div className="md:col-span-1 space-y-4">
           {["colony", "peptide", "crispr"].map((m) => (
             <button key={m} type="button" onClick={() => { setValue("method", m as any); setSelectedFile(null); }}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border font-bold text-sm uppercase tracking-widest transition-all ${selectedMethod === m ? "bg-indigo-600/10 border-indigo-500 text-white" : "bg-slate-900/50 border-slate-800 text-slate-500"}`}>
               {m === 'colony' && <Microscope className="w-5 h-5" />}
               {m === 'peptide' && <Beaker className="w-5 h-5" />}
               {m === 'crispr' && <Terminal className="w-5 h-5" />}
               {m === 'crispr' ? 'CRISPR Target' : m === 'colony' ? 'Colony QC' : 'Peptide MS'}
             </button>
           ))}
        </div>

        {/* Configuration Card */}
        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 p-10">
              <CardTitle className="text-white text-xl font-bold flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400" /> Worker Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {/* Sequence Input */}
              {selectedMethod !== "colony" && (
                <div className="space-y-3 relative">
                  <div className="flex justify-between items-end">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {selectedMethod === "crispr" ? "gRNA Sequence Entry" : "Peptide Sequence"}
                    </Label>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tabular-nums">
                      {currentSequence.length} {selectedMethod === "crispr" ? "Bases" : "Amino Acids"}
                    </span>
                  </div>
                  <Input {...register("sequenceEntry")} className="bg-slate-950 border-slate-800 h-16 text-lg font-mono text-white uppercase tracking-widest placeholder:text-slate-700" placeholder="ENTER SEQUENCE" />
                </div>
              )}

              {/* File Upload */}
              {selectedMethod !== "crispr" && (
                <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-950/50 hover:border-indigo-500/50 cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  <FileUp className={selectedFile ? "text-indigo-400" : "text-slate-600"} size={40} />
                  <p className="text-xs font-bold text-slate-400 uppercase">{selectedFile ? selectedFile.name : `Select ${selectedMethod === 'peptide' ? '.mzML' : 'Image'} File`}</p>
                </label>
              )}

              {selectedMethod === "crispr" && (
                 <div className="p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                   <Terminal className="w-5 h-5 text-indigo-400 mt-1" />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Direct Sequence Analysis active. No file upload required.</p>
                 </div>
              )}

              <Button disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-16 font-black uppercase tracking-[0.3em] transition-all">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Dispatching...
                  </div>
                ) : "Dispatch Worker"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}