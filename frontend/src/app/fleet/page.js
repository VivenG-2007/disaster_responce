"use client";
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Truck, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

const MOCK_FLEET = [
  { id: 'V-101', name: 'FIRE-X9', status: 'RESPONDING', health: 98, lastService: '2d ago', type: 'Fire Truck' },
  { id: 'V-102', name: 'AMB-041', status: 'AVAILABLE', health: 100, lastService: '1w ago', type: 'Ambulance' },
  { id: 'V-103', name: 'PD-SEC7', status: 'ON-SCENE', health: 92, lastService: '3d ago', type: 'Police Unit' },
  { id: 'V-104', name: 'RESCUE-2', status: 'MAINTENANCE', health: 65, lastService: 'Now', type: 'Heavy Rescue' },
];

export default function FleetPage() {
  return (
    <div className="flex h-screen w-full bg-[#0b1326] overflow-hidden text-[#dae2fd]">
      <Sidebar />
      <div className="flex flex-col flex-1 relative overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col mt-16 p-8 overflow-y-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Vehicle Fleet</h1>
            <p className="text-primary/60 text-xs font-bold tracking-[0.3em] uppercase">Sector 7 Asset Management Console</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {MOCK_FLEET.map(vehicle => (
              <div key={vehicle.id} className="bg-[#171f33] border border-white/5 p-6 rounded-2xl shadow-xl hover:bg-white/5 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Truck size={20} />
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest ${
                    vehicle.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500' : 
                    vehicle.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-1">{vehicle.name}</h3>
                <p className="text-[#c6c6cd] text-[10px] uppercase tracking-widest font-bold mb-6">{vehicle.type}</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                       <span>Engine Health</span>
                       <span className={vehicle.health < 80 ? 'text-amber-500' : 'text-primary'}>{vehicle.health}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${vehicle.health}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Last Service: {vehicle.lastService}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#171f33] border border-white/5 rounded-2xl p-6 shadow-xl">
             <h2 className="text-lg font-black uppercase mb-6 tracking-tighter flex items-center space-x-3">
                <Activity size={18} className="text-primary" />
                <span>Operational Status Feed</span>
             </h2>
             <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-none">
                    <div className="flex items-center space-x-4">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest">FIRE-X9 Deployment Success</p>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Sector 7 Central - 09:4{i} AM</p>
                       </div>
                    </div>
                    <button className="text-[10px] font-black text-primary hover:underline underline-offset-4 tracking-widest uppercase">Details</button>
                  </div>
                ))}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
