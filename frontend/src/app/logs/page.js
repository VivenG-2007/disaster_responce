"use client";
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Terminal, Database, Shield, Radio, CheckCircle, XCircle } from 'lucide-react';

const LOG_ENTRIES = [
  { id: 1, type: 'AUTH', message: 'User Dispatcher_04 authenticated via Sector 7 Key', status: 'SUCCESS', time: '11:42:01' },
  { id: 2, type: 'SYSTEM', message: 'Vehicle Simulation System Initialized (Local Mode)', status: 'WARNING', time: '11:42:05' },
  { id: 3, type: 'NETWORK', message: 'Attempting connection to Firebase Secondary Node...', status: 'PENDING', time: '11:42:10' },
  { id: 4, type: 'FIREBASE', message: 'Connection Timeout: Falling back to Local Mock Data', status: 'ERROR', time: '11:42:15' },
  { id: 5, type: 'AI', message: 'Tactical Analyzer Hub ONLINE (v4.0.12)', status: 'SUCCESS', time: '11:42:20' },
  { id: 6, type: 'SECURITY', message: 'External intrusion attempt blocked from IP: 192.x.x.x', status: 'SUCCESS', time: '11:42:25' },
];

export default function LogsPage() {
  return (
    <div className="flex h-screen w-full bg-[#0b1326] overflow-hidden text-[#dae2fd]">
      <Sidebar />
      <div className="flex flex-col flex-1 relative overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col mt-16 p-8 overflow-y-auto">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">System Operations Log</h1>
              <p className="text-primary/60 text-xs font-bold tracking-[0.3em] uppercase">Sector 7 Real-time Audit Trail</p>
            </div>
            <div className="flex space-x-3">
               <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all">EXPORT CSV</button>
               <button className="bg-primary text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:brightness-110 transition-all">LIVE FEED ON</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {[ 
               { label: 'Uptime', value: '99.98%', icon: <Shield size={16}/> },
               { label: 'Active Relays', value: '14/15', icon: <Radio size={16}/> },
               { label: 'Data Sync Rate', value: '4ms', icon: <Database size={16}/> }
            ].map((stat, i) => (
              <div key={i} className="bg-[#171f33] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                 <div className="p-4 bg-primary/10 rounded-2xl text-primary">{stat.icon}</div>
                 <div>
                    <p className="text-[#c6c6cd] text-[10px] uppercase font-black tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black">{stat.value}</p>
                 </div>
              </div>
            ))}
          </div>

          <div className="bg-[#171f33] border border-white/5 rounded-2xl p-6 shadow-xl font-mono text-sm">
             <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-6">
                <Terminal size={20} className="text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tighter font-sans">Tactical Kernel Feed</h2>
             </div>
             
             <div className="space-y-3">
                {LOG_ENTRIES.map(log => (
                  <div key={log.id} className="grid grid-cols-6 gap-4 py-3 border-b border-white/5 last:border-none group hover:bg-white/5 px-2 transition-all rounded-lg">
                    <span className="text-white/20 font-bold col-span-1">[{log.time}]</span>
                    <span className={`font-black text-[10px] tracking-widest uppercase col-span-1 ${
                      log.type === 'AUTH' ? 'text-primary' : log.type === 'AI' ? 'text-purple-400' : 'text-slate-500'
                    }`}>{log.type}</span>
                    <span className="text-[#dae2fd] col-span-3 text-[11px] truncate uppercase tracking-widest font-bold opacity-80">{log.message}</span>
                    <span className={`col-span-1 flex items-center space-x-2 text-[9px] font-black tracking-widest justify-end ${
                       log.status === 'SUCCESS' ? 'text-green-500' : 
                       log.status === 'WARNING' ? 'text-amber-500' : 
                       log.status === 'ERROR' ? 'text-red-500' : 'text-slate-400'
                    }`}>
                       {log.status === 'SUCCESS' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                       <span>{log.status}</span>
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
