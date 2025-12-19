"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Microscope, PlusCircle, History, Settings, LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'New Analysis', href: '/dashboard/dispatch', icon: PlusCircle },
  { name: 'Analysis History', href: '/dashboard/ledger', icon: History },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Add logic here to clear cookies/tokens
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200">
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-950/50 backdrop-blur-md">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 font-black text-xl text-white tracking-tighter">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
              <Microscope className="w-5 h-5" />
            </div>
            HELIXGUARD
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
                pathname === item.href 
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg uppercase tracking-widest transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#020617]">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Uplink: Active
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
             Worker Status: <span className="text-emerald-400 ml-1">Standby</span>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}