"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Microscope, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterValues) => {
    console.log("Backend Payload:", data);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-start pt-12 md:pt-20 p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="z-10 w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-white tracking-tighter">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Microscope className="w-6 h-6" />
            </div>
            HELIXGUARD
          </Link>
        </div>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="border-b border-slate-800/50 pb-5">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              User Registration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create your credentials for the Molecular Manufacturing network.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">First Name</label>
                  <Input {...register("firstName")} className="bg-slate-950 border-slate-800 text-white h-10" placeholder="Jane" />
                  {errors.firstName && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Name</label>
                  <Input {...register("lastName")} className="bg-slate-950 border-slate-800 text-white h-10" placeholder="Doe" />
                  {errors.lastName && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Affiliated Organization</label>
                <Input {...register("organization")} className="bg-slate-950 border-slate-800 text-white h-10" placeholder="BioCore Research Systems" />
                {errors.organization && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.organization.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Username</label>
                  <Input {...register("username")} className="bg-slate-950 border-slate-800 text-white h-10" placeholder="j_doe_01" />
                  {errors.username && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.username.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Work Email</label>
                  <Input {...register("email")} type="email" className="bg-slate-950 border-slate-800 text-white h-10" placeholder="jane.doe@biocore.org" />
                  {errors.email && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Key</label>
                <Input {...register("password")} type="password" className="bg-slate-950 border-slate-800 text-white h-10" placeholder="••••••••" />
                {errors.password && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-bold uppercase tracking-tight shadow-lg shadow-indigo-600/20 group mt-2">
                Initialize Access Terminal
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                <span className="text-indigo-300 font-bold uppercase tracking-tight">BFF Protocol Active:</span> Your registration will be proxied through our secure gateway. 2FA verification will be required upon initial uplink.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-xs text-slate-500 font-medium">
          Already verified? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-tighter transition-colors">Login to Portal</Link>
        </p>
      </motion.div>
    </div>
  );
}