"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../@/components/ui/card";
import { Input } from "../../../../@/components/ui/input";
import { Button } from "../../../../@/components/ui/button";
import { Label } from "../../../../@/components/ui/label";
import { Microscope, FileUp, Zap, Beaker, Terminal, FileCode } from "lucide-react";

const analysisSchema = z.object({
  method: z.enum(["colony", "peptide", "crispr"]),
  sampleId: z.string().min(3, "Unique Sample ID required"),
  plateId: z.string().optional(),
  targetGene: z.string().optional(),
});

type AnalysisFormValues = z.infer<typeof analysisSchema>;

export default function NewAnalysisPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: { method: "peptide" } // Defaulting to Peptide as requested
  });

  const selectedMethod = watch("method");

  const onSubmit = async (data: AnalysisFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">New Analysis</h1>
        <p className="text-slate-500 font-medium mt-1">Configure worker parameters for molecular verification.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Col: Method Selection (1/4 width) */}
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
                onClick={() => setValue("method", item.id as any)}
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

        {/* Right Col: Configuration Form (3/4 width) */}
        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl h-full">
            <CardHeader className="border-b border-slate-800/50 pb-8 pt-8 px-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-3">
                    <Zap className="w-6 h-6 text-amber-400" />
                    Worker Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-2">
                    Define parameters for {selectedMethod.toUpperCase()} processing.
                  </CardDescription>
                </div>
                <div className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded">
                  v1.0.4-STABLE
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 space-y-10">
              {/* Universal Sample ID - Full Width */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Universal Sample ID</Label>
                <Input 
                  {...register("sampleId")} 
                  className="bg-slate-950 border-slate-800 h-16 text-lg font-mono focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                  placeholder="e.g. SPL-990-ALPHA" 
                />
              </div>

              {/* Method-Specific Upload/Input Area */}
              <div className="min-h-[240px]">
                {selectedMethod === "peptide" && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Mass Spectrometry Data (.mZML)</Label>
                    <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-950/50 group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                      <input type="file" accept=".mzML" className="hidden" />
                      <div className="bg-slate-900 p-4 rounded-full border border-slate-800 group-hover:scale-110 transition-transform">
                        <FileCode className="w-10 h-10 text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white uppercase tracking-widest">Select Raw Data File</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Strict format requirement: .mZML only</p>
                      </div>
                    </label>
                  </div>
                )}

                {selectedMethod === "colony" && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Plate Grid ID</Label>
                      <Input {...register("plateId")} className="bg-slate-950 border-slate-800 h-14" placeholder="e.g. GRID-A1" />
                    </div>
                    <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-950/50 group hover:border-indigo-500/50 transition-all cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" />
                      <FileUp className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upload Plate Scan (PNG/TIFF)</p>
                    </label>
                  </div>
                )}

                {selectedMethod === "crispr" && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Target Gene Symbol</Label>
                      <Input {...register("targetGene")} className="bg-slate-950 border-slate-800 h-14 font-mono" placeholder="e.g. BRCA1" />
                    </div>
                    <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                      <Terminal className="w-5 h-5 text-indigo-400 mt-1" />
                      <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed tracking-wide">
                        CRISPR mismatch worker utilizes <span className="text-indigo-400">Predictor v4.2</span>. Execution will be proxied through the secure compute node.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-16 font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 text-lg transition-all"
              >
                {isSubmitting ? "Provisioning Node..." : "Dispatch Worker"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}