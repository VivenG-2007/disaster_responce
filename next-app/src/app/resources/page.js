"use client";
import React from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Package, Truck, Shield, Wrench, AlertCircle, CircleCheck, FlaskConical, Radio } from 'lucide-react';

const ResourceItem = ({ icon: Icon, name, count, status, color }) => (
  <div className="glass-morphism rounded-3xl p-5 border border-white/5 hover:border-white/10 group transition-all duration-500 hover:-translate-y-1">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-2xl bg-${color}/10 border border-${color}/10 text-${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-black text-[#dae2fd] tracking-tight uppercase group-hover:text-[#7bd0ff] transition-colors">{name}</h3>
        <p className="text-[10px] font-bold text-[#c6c6cd] opacity-40 uppercase tracking-widest mt-0.5">Inventory Count: {count}</p>
      </div>
      <div className="text-right">
         <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border border-${color}/20 bg-${color}/5 text-${color} uppercase tracking-widest`}>
            {status}
         </span>
      </div>
    </div>
    <div className="mt-5 flex gap-2">
       <button className="flex-1 py-2 rounded-xl bg-white/5 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-all border border-transparent hover:border-white/5">Details</button>
       <button className="flex-1 py-2 rounded-xl bg-white/5 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-all border border-transparent hover:border-white/5">Deploy</button>
    </div>
  </div>
);

export default function ResourcesPage() {
  return (
    <div className="flex h-screen w-full bg-[#080c18] overflow-hidden text-[#dae2fd] relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7bd0ff]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Sidebar />
      <div className="flex flex-col flex-1 relative overflow-hidden z-10">
        <Navbar />
        <main className="flex-1 mt-16 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex justify-between items-center bg-white/5 p-8 rounded-3xl border border-white/5 shadow-inner">
               <div>
                  <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Resource Logistics</h1>
                  <p className="text-sm text-[#7bd0ff] font-bold tracking-widest uppercase opacity-80 leading-none">Global Supply & Unit Readiness</p>
               </div>
               <div className="flex items-center gap-6">
                  <div className="text-right">
                     <span className="text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">System Status</span>
                     <div className="flex items-center gap-2 mt-1">
                        <CircleCheck size={16} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-400 uppercase tracking-tighter">Connected</span>
                     </div>
                  </div>
                  <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black tracking-widest uppercase hover:bg-white/10 transition-all">Audit Logs</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <ResourceItem icon={Truck} name="Engine 14-X" count="4" status="Operational" color="[#7bd0ff]" />
               <ResourceItem icon={Shield} name="Alpha Response" count="22" status="Deployed" color="red-500" />
               <ResourceItem icon={FlaskConical} name="Medical Core" count="150" status="Optimal" color="emerald-400" />
               <ResourceItem icon={Wrench} name="Triage Kits" count="45" status="Ready" color="blue-400" />

               <ResourceItem icon={Package} name="Food Supplies" count="2.4k" status="Restock" color="amber-500" />
               <ResourceItem icon={Radio} name="Comms Hub" count="8" status="Active" color="indigo-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="glass-morphism rounded-3xl p-8 border border-white/5">
                  <h3 className="text-xs font-black tracking-[0.3em] uppercase opacity-60 mb-8 border-b border-white/5 pb-4">Critical Stock Alerts</h3>
                  <div className="space-y-4">
                     {[
                        { name: 'Oxygen Concentrators', level: '12%', status: 'Low', color: 'red-500' },
                        { name: 'Water Reservoirs', level: '45%', status: 'Medium', color: 'amber-500' },
                        { name: 'Rescue Harnesses', level: '8%', status: 'Critical', color: 'red-600' }
                     ].map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 shadow-inner">
                           <div className="flex justify-between items-center">
                              <span className="font-bold text-sm tracking-tight uppercase">{item.name}</span>
                              <span className={`text-[10px] font-black text-${item.color} uppercase tracking-widest`}>{item.status}</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full bg-${item.color}`} style={{ width: item.level }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="glass-morphism rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#7bd0ff]/10 border border-[#7bd0ff]/20 flex items-center justify-center text-[#7bd0ff] shadow-2xl">
                     <Package size={40} />
                  </div>
                  <div>
                     <h4 className="text-xl font-black uppercase tracking-tighter">Logistics Synchronization</h4>
                     <p className="text-xs text-[#c6c6cd] font-bold tracking-widest mt-2 uppercase opacity-60">Sync your global inventory with drone dispatch AI</p>
                  </div>
                  <button className="w-full bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] text-slate-900 py-4 rounded-2xl font-black text-[12px] tracking-widest shadow-xl shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all">
                     UPDATE ALL INVENTORIES
                  </button>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
