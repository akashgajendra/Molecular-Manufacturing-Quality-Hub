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
    // This payload now matches your backend: 
    // firstName, lastName, organization, username, email, password
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="z-10 w-full max-w-2xl">
        {/* <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-4">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">HelixGuard</h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">Node Provisioning Protocol</p>
        </div> */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-white tracking-tighter">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Microscope className="w-6 h-6" />
            </div>
            HELIXGUARD
          </Link>
        </div>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl ring-1 ring-white/5">
          <CardHeader className="border-b border-slate-800/50 pb-6">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              User Registration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Initialize your credentials to access the Molecular Manufacturing network.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Row 1: First and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">First Name</label>
                  <Input {...register("firstName")} className="bg-slate-950 border-slate-800 text-white h-11" placeholder="Jane" />
                  {errors.firstName && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Last Name</label>
                  <Input {...register("lastName")} className="bg-slate-950 border-slate-800 text-white h-11" placeholder="Doe" />
                  {errors.lastName && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Row 2: Organization */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Affiliated Organization</label>
                <Input {...register("organization")} className="bg-slate-950 border-slate-800 text-white h-11" placeholder="BioCore Research Systems" />
                {errors.organization && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.organization.message}</p>}
              </div>

              {/* Row 3: Username and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">System Username</label>
                  <Input {...register("username")} className="bg-slate-950 border-slate-800 text-white h-11" placeholder="j_doe_01" />
                  {errors.username && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Work Email</label>
                  <Input {...register("email")} type="email" className="bg-slate-950 border-slate-800 text-white h-11" placeholder="jane.doe@biocore.org" />
                  {errors.email && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 4: Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Security Key</label>
                <Input {...register("password")} type="password" className="bg-slate-950 border-slate-800 text-white h-11" placeholder="••••••••" />
                {errors.password && <p className="text-indigo-400 text-[10px] uppercase font-bold">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 font-black uppercase italic tracking-tight shadow-lg shadow-indigo-600/20 group">
                Initialize Access Terminal
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                <strong className="text-indigo-300 italic uppercase">BFF Protocol Active:</strong> Your registration will be proxied through our secure gateway. 2FA verification will be required upon initial uplink.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-xs text-slate-500 font-medium">
          Already verified? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-black italic uppercase tracking-tighter transition-colors">Login to Portal</Link>
        </p>
      </motion.div>
    </div>
  );
}