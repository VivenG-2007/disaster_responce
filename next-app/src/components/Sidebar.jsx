"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, Truck, Database, Settings, Shield, PlusCircle } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href, badge }) => {
  const pathname = usePathname();
  const active = pathname === href;
  
  return (
    <Link href={href || "#"}>
      <div className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-300 group rounded-xl mx-2 ${
        active 
          ? 'bg-[#7bd0ff]/10 text-[#7bd0ff] shadow-[0_0_20px_rgba(123,208,255,0.05)] border border-[#7bd0ff]/20' 
          : 'text-[#c6c6cd] hover:bg-white/5 hover:text-[#dae2fd] border border-transparent'
      }`}>
        <Icon size={18} className={`${active ? 'text-[#7bd0ff]' : 'text-[#c6c6cd] group-hover:text-[#dae2fd] transition-colors'} stroke-[2.5px]`} />
        <span className="hidden lg:block text-[11px] tracking-[0.1em] font-black font-sans uppercase">{label}</span>
        {badge && (
          <span className="ml-auto hidden lg:inline-block bg-[#93000a] text-[#ffb4ab] text-[10px] px-2 py-0.5 rounded-lg font-black ring-1 ring-white/10 uppercase shadow-lg shadow-red-500/20">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-20 lg:w-64 glass-morphism h-screen flex flex-col z-50 transition-all duration-500">
      <div className="px-6 py-8 border-b border-white/5 mb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#7bd0ff]/10 rounded-xl flex items-center justify-center border border-[#7bd0ff]/20 shadow-[0_0_20px_rgba(123,208,255,0.15)] ring-1 ring-white/5">
            <Shield size={24} className="text-[#7bd0ff]" fill="currentColor" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <h1 className="font-black text-[15px] text-[#dae2fd] leading-tight tracking-tight uppercase">Command Center</h1>
            <p className="text-[10px] text-[#7bd0ff]/60 font-bold tracking-[0.2em] uppercase">Sector 7 Admin</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
        <SidebarItem icon={LayoutDashboard} label="DASHBOARD" href="/" />
        <SidebarItem icon={AlertTriangle} label="ANALYTICS" href="/analytics" />
        <SidebarItem icon={Truck} label="RESOURCES" href="/resources" />
        <SidebarItem icon={Database} label="SYSTEM LOGS" href="/logs" />
      </nav>
      
      <div className="p-4 mt-auto mb-4 shrink-0 px-6">
        <button className="w-full bg-gradient-to-br from-[#7bd0ff] to-[#008abb] text-slate-900 py-3.5 rounded-xl font-black text-[11px] tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 border border-white/10 uppercase">
          <PlusCircle size={16} /> 
          REPORT INCIDENT
        </button>
      </div>
      
      <div className="py-4 border-t border-white/5 mx-6 mb-2 shrink-0">
        <SidebarItem icon={Settings} label="SETTINGS" href="#" />
      </div>
    </aside>


  );
};

export default Sidebar;
