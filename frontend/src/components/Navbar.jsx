"use client";
import React, { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Settings, MapPin, LogOut, ShieldAlert, Zap, Radio } from 'lucide-react';
import { useRole } from '../context/RoleContext';

/**
 * Navbar - Glassmorphic navigation component with real-time active route highlighting.
 */
const Navbar = () => {
  const pathname = usePathname();
  const { role, logout } = useRole();
  const [showNotifications, setShowNotifications] = useState(false);

  
  return (
    <header className="h-16 glass-morphism flex items-center justify-between px-6 z-[9999] fixed top-0 left-0 lg:left-64 right-0 !border-t-0 !border-l-0 !border-r-0 !shadow-none w-full lg:w-[calc(100%-16rem)]">
      <div className="flex items-center space-x-6">
        <Link href="/">
          <h1 className="text-xl font-black tracking-tighter text-[#dae2fd] select-none uppercase tracking-[0.3em] bg-gradient-to-r from-white to-[#7bd0ff] bg-clip-text text-transparent [-webkit-background-clip:text] cursor-pointer">Disaster Response</h1>
        </Link>
        
        <nav className="hidden md:flex items-center h-16 ml-8 space-x-2">
          <Link href="/" className={`h-10 px-4 flex items-center text-[10px] font-black tracking-[0.2em] transition-all rounded-lg uppercase border ${
            pathname === '/' 
              ? 'text-[#7bd0ff] bg-white/5 border-[#7bd0ff]/20 shadow-[0_0_15px_rgba(123,208,255,0.05)]' 
              : 'text-[#c6c6cd] hover:text-[#7bd0ff] hover:bg-white/5 border-transparent'
          }`}>
            DASHBOARD
          </Link>
          <Link href="/analytics" className={`h-10 px-4 flex items-center text-[10px] font-black tracking-[0.2em] transition-all rounded-lg uppercase border ${
            pathname === '/analytics' 
              ? 'text-[#7bd0ff] bg-white/5 border-[#7bd0ff]/20 shadow-[0_0_15px_rgba(123,208,255,0.05)]' 
              : 'text-[#c6c6cd] hover:text-[#7bd0ff] hover:bg-white/5 border-transparent'
          }`}>
            ANALYTICS
          </Link>
          <Link href="/resources" className={`h-10 px-4 flex items-center text-[10px] font-black tracking-[0.2em] transition-all rounded-lg uppercase border ${
            pathname === '/resources' 
              ? 'text-[#7bd0ff] bg-white/5 border-[#7bd0ff]/20 shadow-[0_0_15px_rgba(123,208,255,0.05)]' 
              : 'text-[#c6c6cd] hover:text-[#7bd0ff] hover:bg-white/5 border-transparent'
          }`}>
            RESOURCES
          </Link>
        </nav>
      </div>



      <div className="flex items-center space-x-5">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 glass-morphism rounded-xl text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10 active:scale-95 group shadow-lg shadow-red-500/5"
          title="Exit Portal"
        >
          <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-[0.1em] hidden sm:inline">Portal Exit</span>
        </button>

        <div className="flex items-center space-x-3 pr-4 border-r border-white/5 mr-4 relative">
          {/* 🔔 Live Tactical Notifications */}
          <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className={`relative text-[#c6c6cd] transition-all p-3 rounded-2xl active:scale-90 group border border-transparent shadow-inner ${showNotifications ? 'bg-white/10 text-emerald-400 border-emerald-400/20' : 'hover:text-emerald-400 hover:bg-white/5 hover:border-white/5'}`}
          >
            <Bell size={20} className={showNotifications ? '' : 'group-hover:rotate-12 transition-transform'} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-[#131b2e] shadow-[0_0_10px_#ef4444] animate-pulse"></span>
          </button>
          
          {/* ⚙️ System Configuration */}
          <button className="text-[#c6c6cd] hover:text-[#7bd0ff] transition-all p-3 hover:bg-white/5 rounded-2xl active:scale-90 group border border-transparent hover:border-white/5 shadow-inner">
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          </button>

          {/* 📬 Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 glass-morphism rounded-[24px] border border-white/5 shadow-2xl z-[9999] animate-in fade-in zoom-in duration-200 overflow-hidden backdrop-blur-3xl">
               <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#dae2fd]">Sector 7 Triage</h3>
                  <span className="text-[8px] bg-[#7bd0ff]/10 text-[#7bd0ff] px-2 py-0.5 rounded font-black uppercase">Live Updates</span>
               </div>
               <div className="max-h-80 overflow-y-auto custom-scrollbar bg-[#0b1326]/40">
                  {/* Alert 1 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20"><ShieldAlert size={16} /></div>
                        <div>
                           <p className="text-[11px] font-black text-[#dae2fd] uppercase group-hover:text-[#7bd0ff] transition-colors">Critical: Structure Fire</p>
                           <p className="text-[9px] text-slate-500 font-bold mt-0.5">Keesara Gutta Hilltop • 2m ago</p>
                        </div>
                     </div>
                  </div>
                  {/* Alert 2 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20"><Radio size={16} /></div>
                        <div>
                           <p className="text-[11px] font-black text-[#dae2fd] uppercase group-hover:text-emerald-400 transition-colors">Comms Established</p>
                           <p className="text-[9px] text-slate-500 font-bold mt-0.5">Medchal Sector Hub • 5m ago</p>
                        </div>
                     </div>
                  </div>
                  {/* Alert 3 */}
                  <div className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                     <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20"><Zap size={16} /></div>
                        <div>
                           <p className="text-[11px] font-black text-[#dae2fd] uppercase group-hover:text-[#7bd0ff] transition-colors">Neural Sync Complete</p>
                           <p className="text-[9px] text-slate-500 font-bold mt-0.5">Automated Dispatcher Node 4 • 12m ago</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-3 bg-white/5 text-center border-t border-white/5">
                  <button className="text-[9px] font-black text-[#7bd0ff] uppercase tracking-widest hover:underline">View All Broadcasts</button>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center group cursor-pointer hover:bg-white/[0.02] p-2 rounded-2xl transition-all border border-transparent hover:border-white/5 ml-2">
             {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                <UserButton afterSignOutUrl="/" />
             ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] flex items-center justify-center text-slate-900 shadow-xl ring-2 ring-white/5 group-hover:scale-105 transition-transform">
                   <MapPin size={22} />
                </div>
             )}
             <div className="hidden lg:block ml-4 pr-4">
                <p className="text-[11px] font-black tracking-[0.15em] text-[#dae2fd] uppercase leading-none mb-1">
                   {role === 'admin' ? 'Lead Dispatcher' : 'Citizen Unit 07'}
                </p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                   <p className="text-[9px] text-[#7bd0ff] font-bold uppercase tracking-[0.2em] opacity-70">
                      {role === 'admin' ? 'Keesara Command' : 'Safety Portal'}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

    </header>

  );
};

export default Navbar;
