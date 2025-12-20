"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../@/components/ui/card";
import { Input } from "../../../../@/components/ui/input";
import { Button } from "../../../../@/components/ui/button";
import { Label } from "../../../../@/components/ui/label";
import { Microscope, FileUp, Zap, Beaker, Terminal, FileCode } from "lucide-react";

const analysisSchema = z.object({
  method: z.enum(["colony", "peptide", "crispr"]),
  sequenceEntry: z.string().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisSchema>;

export default function NewAnalysisPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: { method: "peptide" }
  });

  const selectedMethod = watch("method");
  const currentSequence = watch("sequenceEntry") || "";

  const onSubmit = async (data: AnalysisFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("method", data.method);
    if (data.sequenceEntry) formData.append("sequenceEntry", data.sequenceEntry);
    if (selectedFile) formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/submit-job", { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok) alert(`Success: Job ${result.job_id} Dispatched`);
      else alert(`Error: ${result.detail || 'Dispatch failed'}`);
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">New Analysis</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 p-10">
              <CardTitle className="text-white text-xl font-bold flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400" /> Worker Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {selectedMethod !== "colony" && (
                <div className="space-y-3 relative">
                  <div className="flex justify-between items-end">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {selectedMethod === "crispr" ? "gRNA Sequence Entry" : "Peptide Sequence"}
                    </Label>
                   {(selectedMethod === "crispr" || selectedMethod === "peptide") && (
                    <span className="text-[10px] font-black text-indigo-400 uppercase tabular-nums">
                      {currentSequence.length}{" "}
                      {selectedMethod === "crispr" ? "Bases" : "Amino Acids"}
                    </span>
                  )}
                  </div>
                  <Input {...register("sequenceEntry")} className="bg-slate-950 border-slate-800 h-16 text-lg font-mono text-white uppercase tracking-widest placeholder:text-slate-700" placeholder="ENTER SEQUENCE" />
                </div>
              )}

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
                {isSubmitting ? "Dispatching..." : "Dispatch Worker"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}