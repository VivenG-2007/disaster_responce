"use client";
import React from 'react';
import { MoreHorizontal, MapPin, Clock, ArrowRight, Truck } from 'lucide-react';

const IncidentPanel = ({ incidents, onSelect, activeId }) => {
  return (
    <aside className="w-96 glass-morphism h-full flex flex-col z-30 shrink-0 !border-y-0 !border-r-0 !shadow-none">
      <div className="p-6 border-b border-white/5 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#dae2fd] opacity-70">Tactical Feed</h2>
          <span className="bg-[#7bd0ff]/10 text-[#7bd0ff] px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] ring-1 ring-[#7bd0ff]/20 uppercase shadow-lg shadow-blue-500/10">
            {incidents.length} ACTIVE
          </span>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-lg bg-white/10 text-[9px] font-black tracking-[0.2em] text-[#dae2fd] uppercase border border-white/5 shadow-inner">All</button>
          <button className="flex-1 py-2 rounded-lg bg-transparent text-[9px] font-black tracking-[0.2em] text-[#c6c6cd] hover:bg-white/5 transition-all uppercase">Critical</button>
          <button className="flex-1 py-2 rounded-lg bg-transparent text-[9px] font-black tracking-[0.2em] text-[#c6c6cd] hover:bg-white/5 transition-all uppercase">Sector 7</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {incidents.map((incident) => {
          const severity = (incident.severity || '').toLowerCase();
          const isHigh = severity === 'high' || severity === 'critical';
          const isMed = severity === 'medium';
          const isActive = activeId === incident.id;
          
          return (
            <div 
              key={incident.id} 
              role="button"
              onClick={() => onSelect(incident)}
              className={`p-5 rounded-2xl relative overflow-hidden group transition-all duration-500 border cursor-pointer hover:translate-x-1 ${
                isActive 
                  ? 'bg-white/10 border-[#7bd0ff]/40 shadow-[0_0_30px_rgba(123,208,255,0.1)] ring-1 ring-white/5' 
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] shadow-sm ${
                  isHigh ? 'bg-[#93000a] text-[#ffb4ab]' : isMed ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {isHigh ? 'CRITICAL ALERT' : isMed ? 'SIGNAL YELLOW' : 'ROUTINE'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 tracking-widest font-bold">04:12:01</span>
              </div>

              <h4 className={`text-[13px] font-black mb-1 transition-colors leading-snug uppercase tracking-tight ${
                isActive ? 'text-[#7bd0ff]' : 'text-[#dae2fd] group-hover:text-[#7bd0ff]'
              }`}>
                {incident.type}
              </h4>
              
              <p className="text-[11px] text-[#c6c6cd] line-clamp-2 mb-4 leading-relaxed font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                {incident.description}
              </p>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-1">
                <div className="flex -space-x-2 text-[#dae2fd]">
                   <div className="w-7 h-7 rounded-full bg-red-500 border-2 border-[#131b2ef0] flex items-center justify-center shadow-xl ring-1 ring-white/10"><Truck size={12} className="fill-current text-white" /></div>
                   <div className="w-7 h-7 rounded-full bg-[#7bd0ff] border-2 border-[#131b2ef0] flex items-center justify-center shadow-xl ring-1 ring-white/10"><Clock size={12} className="text-slate-900" /></div>
                </div>
                
                <button className="text-[9px] font-black text-[#7bd0ff] flex items-center gap-1 group-hover:translate-x-1 transition-transform tracking-[0.2em] uppercase">
                  DETAILS <ArrowRight size={12} />
                </button>
              </div>

              {isActive && (
                <div className="absolute top-0 right-0 p-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] shadow-[0_0_10px_#7bd0ff] animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-white/[0.03] border-t border-white/5 mt-auto shrink-0 backdrop-blur-md rounded-t-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-[8px] font-black text-[#c6c6cd] uppercase tracking-[0.3em] mb-1 opacity-50">Response Time</div>
            <div className="text-sm font-black font-mono text-[#7bd0ff] tracking-widest bg-[#7bd0ff]/5 py-1 rounded-lg border border-[#7bd0ff]/10">04:22M</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-black text-[#c6c6cd] uppercase tracking-[0.3em] mb-1 opacity-50">Operational</div>
            <div className="text-sm font-black font-mono text-[#7bd0ff] tracking-widest bg-[#7bd0ff]/5 py-1 rounded-lg border border-[#7bd0ff]/10">14 / 20</div>
          </div>
        </div>
      </div>
    </aside>

  );
};

export default IncidentPanel;
