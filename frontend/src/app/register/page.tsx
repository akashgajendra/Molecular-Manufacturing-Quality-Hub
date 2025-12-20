"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // Correct import for App Router
import Link from "next/link";

// UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../@/components/ui/card";
import { Input } from "../../../@/components/ui/input";
import { Button } from "../../../@/components/ui/button";
import { Microscope, UserPlus, ShieldCheck, ArrowRight, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  organization: z.string().min(2, "Organization name required"),
  username: z.string().min(4, "Username must be 4+ characters"),
  email: z.string().email("Valid professional email required"),
  password: z.string().min(8, "Security key must be 8+ characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  
  // --- State Hooks ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Delay redirect so user sees the success state
        setTimeout(() => router.push("/login"), 3600);
      } else {
        setError(result.detail || "Registration rejected by security node.");
      }
    } catch (err) {
      setError("Critical Uplink Failure: The registration node is unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-start pt-12 md:pt-16 p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="z-10 w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 font-black text-2xl text-white tracking-tighter">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Microscope className="w-7 h-7" />
            </div>
            HELIXGUARD
          </Link>
        </div>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 py-4 px-2">
          <CardHeader className="border-b border-slate-800/50 pb-8 px-8">
            <CardTitle className="text-white flex items-center gap-3 text-xl font-bold">
              <UserPlus className="w-6 h-6 text-indigo-400" />
              Node Provisioning
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Establish your verified credentials for the automated QC network.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-10 px-8">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center"
                >
                  <div className="bg-emerald-500/20 p-6 rounded-full mb-6">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Node Initialized</h2>
                  <p className="text-slate-400">Security credentials provisioned. Redirecting to checkpoint...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">{error}</p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</label>
                      <Input {...register("firstName")} disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4 focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g. Elena" />
                      {errors.firstName && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2.5 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</label>
                      <Input {...register("lastName")} disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4" placeholder="e.g. Vance" />
                      {errors.lastName && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Affiliated Organization</label>
                    <Input {...register("organization")} disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4" placeholder="e.g. Vector Bio-Manufacturing Group" />
                    {errors.organization && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.organization.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">System ID</label>
                      <Input {...register("username")} disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4" placeholder="e.g. evance_qc" />
                      {errors.username && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-2.5 text-left">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Professional Email</label>
                      <Input {...register("email")} type="email" disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4" placeholder="e.g. evance@vectorbio.org" />
                      {errors.email && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-left">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Security Key</label>
                    <Input {...register("password")} type="password" disabled={isLoading} className="bg-slate-950 border-slate-800 text-white h-14 px-4" placeholder="Minimum 8 characters..." />
                    {errors.password && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.password.message}</p>}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-16 text-lg font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 group mt-4 transition-all">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        Initialize Access Terminal
                        <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </AnimatePresence>

            <div className="mt-10 flex items-start gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed font-medium text-left">
                <span className="text-indigo-300 font-bold uppercase tracking-tight mr-1">BFF Protocol Active:</span> 
                Credentials will be encrypted via HttpOnly cookies. Your organization's node admin will receive a verification request upon submission.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-10 text-sm text-slate-500 font-medium">
          Already verified? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors ml-2">Login to Portal</Link>
        </p>
      </motion.div>
    </div>
  );
}