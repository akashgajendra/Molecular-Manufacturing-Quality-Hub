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
  sampleId: z.string().min(3, "Entry required"), // For CRISPR this is the gRNA string
  plateId: z.string().optional(),
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

  const onSubmit = async (data: AnalysisFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    formData.append("method", data.method);
    formData.append("sampleId", data.sampleId); 
    if (data.plateId) formData.append("plateId", data.plateId);

    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (data.method !== "crispr") {
      alert("File upload required for this method.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/submit-job", {
        method: "POST",
        body: formData, 
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Success: Job ${result.jobId} Dispatched`);
      } else {
        alert(`Error: ${result.detail || 'Dispatch failed'}`);
      }
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">New Analysis</h1>
        <p className="text-slate-500 font-medium mt-1">Configure worker parameters for molecular verification.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
           <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Analysis Method</Label>
           {[
             { id: "colony", label: "Colony QC", icon: Microscope },
             { id: "peptide", label: "Peptide MS", icon: Beaker },
             { id: "crispr", label: "CRISPR Target", icon: Terminal }
           ].map((item) => (
             <button
                key={item.id}
                type="button"
                onClick={() => {
                  setValue("method", item.id as any);
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all font-bold text-sm uppercase tracking-widest ${
                  selectedMethod === item.id 
                  ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10" 
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </button>
           ))}
        </div>

        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl h-full">
            <CardHeader className="border-b border-slate-800/50 pb-8 pt-8 px-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl font-bold flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  Worker Configuration
                </CardTitle>
                <div className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded">
                  v1.0.4-STABLE
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 space-y-10">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                  {selectedMethod === "crispr" ? "gRNA Sequence Entry" : "Universal Sample ID"}
                </Label>
                {/* FIXED: text-white added to ensure visibility during typing */}
                <Input 
                  {...register("sampleId")} 
                  className="bg-slate-950 border-slate-800 h-16 text-lg font-mono uppercase tracking-widest text-white placeholder:text-slate-700 focus:ring-2 focus:ring-indigo-500/50" 
                  placeholder={selectedMethod === "crispr" ? "ATCG..." : "SPL-990-ALPHA"} 
                />
              </div>

              <div className="min-h-[160px]">
                {selectedMethod === "peptide" && (
                  <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-950/50 hover:border-indigo-500/50 cursor-pointer transition-all">
                    <input type="file" accept=".mzML" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    <FileCode className={selectedFile ? "text-indigo-400" : "text-slate-600"} size={40} />
                    <p className="text-xs font-bold text-slate-400 uppercase">{selectedFile ? selectedFile.name : "Select .mZML File"}</p>
                  </label>
                )}

                {selectedMethod === "colony" && (
                  <div className="space-y-6">
                    <Input 
                      {...register("plateId")} 
                      className="bg-slate-950 border-slate-800 h-14 text-white placeholder:text-slate-700" 
                      placeholder="GRID-A1" 
                    />
                    <label className="border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-950/50 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      <FileUp className={selectedFile ? "text-indigo-400" : "text-slate-600"} size={32} />
                      <p className="text-xs font-bold text-slate-400 uppercase">{selectedFile ? selectedFile.name : "Upload Plate Scan"}</p>
                    </label>
                  </div>
                )}

                {selectedMethod === "crispr" && (
                  <div className="p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-5">
                    <Terminal className="w-6 h-6 text-indigo-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-300 font-bold uppercase tracking-wider leading-relaxed">
                        Direct Sequence Analysis active.
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">No binary file upload required for gRNA mismatch verification.</p>
                    </div>
                  </div>
                )}
              </div>

              <Button disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-16 font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 text-lg transition-all">
                {isSubmitting ? "Dispatching Worker..." : "Dispatch Worker"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}