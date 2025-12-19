"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Microscope, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      {/* Soft Top Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,rgba(59,130,246,0.05),transparent_50%)]" />
      
      {/* Navigation Header */}
      <nav className="relative flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          HelixGuard
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className="relative pt-20 pb-32">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-slate-900 mb-8">
              Molecular Quality <br />
              <span className="text-blue-600">Control Hub.</span>
            </h1>
            
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              The unified orchestration layer for genomic manufacturing. 
              Verify CRISPR sequences, Peptide mass-spec, and Colony counts in one secure environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-lg group" asChild>
                <Link href="/dashboard/submit">
                  Launch Portal 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="text-sm text-slate-400 font-mono">
                Next.js 15 • HttpOnly Security • BFF Pattern
              </p>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-32 text-left"
          >
            <Feature 
              icon={<ShieldCheck className="text-blue-600" />}
              title="Secure BFF"
              description="Backend-for-Frontend proxy hides microservice logic and masks API secrets from the browser."
            />
            <Feature 
              icon={<Zap className="text-amber-500" />}
              title="Live Polling"
              description="Real-time status orchestration using TanStack Query for mission-critical analysis tracking."
            />
            <Feature 
              icon={<Microscope className="text-emerald-600" />}
              title="Precision Logic"
              description="Strict Zod validation for .mzML files, genomic sequences, and high-resolution plate scans."
            />
          </motion.div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-100 py-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-slate-400 text-sm">
          <p>© 2025 HelixGuard Molecular Systems</p>
          <div className="flex gap-6">
            <span>v1.0.4-stable</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 
              Systems Nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}