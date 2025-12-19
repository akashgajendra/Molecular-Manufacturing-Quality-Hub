"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Microscope, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <svg 
          className="absolute -right-20 top-0 h-full w-1/2 opacity-[0.07] text-indigo-500"
          viewBox="0 0 400 1000" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M150 0C150 100 250 150 250 250C250 350 150 400 150 500C150 600 250 650 250 750C250 850 150 900 150 1000" stroke="currentColor" strokeWidth="4"/>
          <path d="M250 0C250 100 150 150 150 250C150 350 250 400 250 500C250 600 150 650 150 750C150 850 250 900 250 1000" stroke="currentColor" strokeWidth="4"/>
          {[...Array(25)].map((_, i) => (
            <line key={i} x1="160" y1={i * 40} x2="240" y2={i * 40} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          ))}
        </svg>

        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          HelixGuard
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all" asChild>
            <Link href="/register">Initialize Lab</Link>
          </Button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-24 pb-32">
        <div className="max-w-5xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              V1.0 BFF Architecture
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.85]">
              Molecular <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                Manufacturing.
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
              A high-precision orchestration layer for genomic quality control. 
              Verify sequences and count colonies with military-grade verifiable precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <Button size="lg" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-lg group shadow-[0_0_30px_rgba(79,70,229,0.2)]" asChild>
                <Link href="/dashboard/submit">
                  Launch Portal 
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              
              <div className="flex flex-col text-left justify-center h-16">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">FastAPI Uplink</span>
                <span className="text-sm font-mono text-indigo-400 font-bold">
                  ENCRYPTED_CONNECTION_STABLE
                </span>
              </div>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left"
          >
            <DarkFeature 
              icon={<ShieldCheck className="text-indigo-400" />}
              title="Secure BFF Proxy"
              description="Next.js server-side route handlers ensure your microservice API keys never touch the client."
            />
            <DarkFeature 
              icon={<Zap className="text-indigo-400" />}
              title="Real-time Polling"
              description="Integrated TanStack Query keeps your analysis status synced every 5 seconds."
            />
            <DarkFeature 
              icon={<Microscope className="text-indigo-400" />}
              title="Binary Validation"
              description="Strict Zod schemas for .mzML mass-spec data and CRISPR genomic sequence strings."
            />
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-12 relative z-10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-slate-500 text-xs font-mono uppercase tracking-[0.3em]">
          <p>© 2025 HelixGuard Systems</p>
          <div className="flex gap-8">
            <span className="text-indigo-500/50">Next.js 15.1</span>
            <span className="text-indigo-500/50">FastAPI / Python</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DarkFeature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm group hover:border-indigo-500/50 transition-all">
      <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-white tracking-tight mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm font-medium">
        {description}
      </p>
    </div>
  );
}