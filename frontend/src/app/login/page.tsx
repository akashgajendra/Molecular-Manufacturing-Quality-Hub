"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Microscope, LockKeyhole, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "System ID is required"),
  password: z.string().min(1, "Security key is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginValues) => {
    console.log("Authentication Sequence Initiated:", data);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-start pt-12 md:pt-16 p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="z-10 w-full max-w-md">
        
        {/* Horizontal Branding Style You Prefer */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 font-black text-2xl text-white tracking-tighter">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Microscope className="w-7 h-7" />
            </div>
            HELIXGUARD
          </Link>
        </div>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 py-2">
          <CardHeader className="border-b border-slate-800/50 pb-6 px-8 pt-6">
            <CardTitle className="text-white flex items-center gap-3 text-lg font-bold">
              <LockKeyhole className="w-5 h-5 text-indigo-400" />
              Security Checkpoint
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to establish a secure uplink.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-8 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">System ID</label>
                <Input 
                  {...register("username")} 
                  className="bg-slate-950 border-slate-800 text-white h-14 px-4 text-base focus:ring-2 focus:ring-indigo-500/50" 
                  placeholder="e.g. evance_qc" 
                />
                {errors.username && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Security Key</label>
                  <Link href="#" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">Forgot Key?</Link>
                </div>
                <Input 
                  {...register("password")} 
                  type="password" 
                  className="bg-slate-950 border-slate-800 text-white h-14 px-4 text-base" 
                  placeholder="••••••••" 
                />
                {errors.password && <p className="text-indigo-400 text-[10px] uppercase font-bold ml-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 text-base font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 group mt-2 transition-all">
                Authenticate Uplink
                <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-tight font-medium">
                Authorization attempts are logged via <span className="text-amber-500/80 font-bold uppercase">Secure Audit Trail</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          New Node? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors ml-2">Provision Credentials</Link>
        </p>
      </motion.div>
    </div>
  );
}