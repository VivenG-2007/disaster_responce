"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from '@clerk/nextjs';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import IncidentPanel from '../components/IncidentPanel';
import IncidentInput from '../components/IncidentInput';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { ToastContainer, toast } from 'react-toastify';
import { useRole } from '../context/RoleContext';
import { User, ShieldCheck, LogOut, Activity, Map as MapIcon, Send } from 'lucide-react';

const MapComponent = dynamic(() => import('../components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#131b2e] rounded-2xl flex items-center justify-center text-[#7bd0ff] font-black tracking-widest animate-pulse uppercase tracking-[0.2em] shadow-inner">LOADING TACTICAL FEED...</div>
});


const INITIAL_INCIDENTS = [
  { id: 1, type: 'Structure Fire', severity: 'High', locationName: 'Keesara Gutta Hilltop', position: [17.5234, 78.6781], assignedVehicle: 'FIRE-X9', description: 'Structural integrity compromised near the main park.' },
  { id: 2, type: 'Medical Emergency', severity: 'Medium', locationName: 'Medchal Crossing', position: [17.5180, 78.6580], assignedVehicle: 'PD-SEC7', description: 'Traffic accident reported with minor casualties.' },
  { id: 3, type: 'Road Obstruction', severity: 'Low', locationName: 'ORR Junction - Keesara', position: [17.5450, 78.6650], assignedVehicle: 'PD-SEC9', description: 'Stranded vehicle blocking lane. Police assistance requested.' },
  { id: 4, type: 'Chemical Leak', severity: 'High', locationName: 'Industrial Zone East', position: [17.5050, 78.6950], assignedVehicle: 'FIRE-V2', description: 'Potentially toxic leak reported near storage units.' }
];

const INITIAL_VEHICLES = [
  { id: 'v1', name: 'FIRE-X9', type: 'firetruck', status: 'Responding', speed: 82, eta: '3m', position: [17.5210, 78.6650], color: '#ef4444' },
  { id: 'v2', name: 'AMB-041', type: 'ambulance', status: 'Available', speed: 0, eta: '-', position: [17.5250, 78.6600], color: '#7bd0ff' },
  { id: 'v3', name: 'PD-SEC7', type: 'police', status: 'On-scene', speed: 0, eta: '-', position: [17.5180, 78.6580], color: '#b7c8e1' },
  { id: 'v4', name: 'AMB-099', type: 'ambulance', status: 'Available', speed: 0, eta: '-', position: [17.5300, 78.6800], color: '#7bd0ff' },
  { id: 'v5', name: 'FIRE-V2', type: 'firetruck', status: 'Available', speed: 0, eta: '-', position: [17.5100, 78.6400], color: '#ef4444' },
  { id: 'v6', name: 'PD-SEC9', type: 'police', status: 'Patrolling', speed: 45, eta: '-', position: [17.5400, 78.6500], color: '#b7c8e1' }
];

const RoleSelector = ({ onSelect }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c18] relative px-6 overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7bd0ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
    
    <div className="glass-morphism p-12 rounded-[3.5rem] border border-white/5 shadow-2xl max-w-2xl w-full text-center relative z-10 scale-in-center">
      <div className="mb-14">
        <div className="w-20 h-20 bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-white/20">
           <Activity size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-3 bg-gradient-to-r from-white via-[#7bd0ff] to-white bg-clip-text text-transparent [-webkit-background-clip:text]">Nexus Command</h1>
        <p className="text-[11px] text-[#7bd0ff] font-black tracking-[0.4em] uppercase opacity-70">Identity Verification Sequence</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => onSelect('admin')}
          className="group relative flex flex-col items-center p-10 glass-morphism rounded-3xl border border-white/5 hover:border-[#7bd0ff]/30 transition-all hover:bg-white/5 active:scale-95 shadow-xl hover:shadow-[#7bd0ff]/5"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#7bd0ff]/10 flex items-center justify-center text-[#7bd0ff] mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-1 text-white">Manager</h3>
          <p className="text-[10px] text-[#7bd0ff] font-bold uppercase tracking-widest opacity-60">Command & Control</p>
        </button>

        <button 
          onClick={() => onSelect('people')}
          className="group relative flex flex-col items-center p-10 glass-morphism rounded-3xl border border-white/5 hover:border-emerald-400/30 transition-all hover:bg-white/5 active:scale-95 shadow-xl hover:shadow-emerald-400/5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <User size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-1 text-white">People</h3>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest opacity-60">Public View</p>
        </button>
      </div>

      <div className="mt-12 flex items-center justify-center gap-2 text-[9px] font-black tracking-[0.2em] text-[#c6c6cd] uppercase opacity-30">
        <MapIcon size={12} /> Live encryption active for Sector 7
      </div>
    </div>
  </div>
);
const IdentityLink = ({ children }) => {
  const isEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!isEnabled) return children(null);
  return <ClerkIdentityLink children={children} />;
};

const ClerkIdentityLink = ({ children }) => {
  const { user } = useUser();
  return children(user);
};

function DashboardMain({ user }) {
  const { role, updateRole, logout, isLoading } = useRole();
  const { vehicles, incidents, reportIncident, dataSource } = useFirebaseData();
  const { getToken } = useAuth();
  const [activeIncident, setActiveIncident] = useState(null);
  const [localVehicles, setLocalVehicles] = useState(INITIAL_VEHICLES);
  const [localIncidents, setLocalIncidents] = useState(INITIAL_INCIDENTS);
  
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // 🔐 Automated Admin Identity Verification
  const ADMIN_EMAILS = [
    '25r11a05cm@gcet.edu.in', // Lead Tactical Commander
    'viven@nexus.com', 
    'viven@example.com' 
  ];

  const handleIdentitySync = (identityUser) => {
    if (identityUser && !role) {
       const email = identityUser.primaryEmailAddress?.emailAddress;
       if (ADMIN_EMAILS.includes(email)) {
          updateRole('admin');
       } else {
          updateRole('people');
       }
    }
  };

  useEffect(() => {
     handleIdentitySync(user);
  }, [user, role]);

  useEffect(() => {
    if (role === 'people') {
       const fetchHeatmap = async () => {
           try {
               const res = await fetch(`${backendUrl}/api/heatmap`);
               if (res.ok) {
                   const data = await res.json();
                   if (data.points && data.points.length > 0) {
                       setHeatmapPoints(data.points);
                       return;
                   }
               }
           } catch (e) {
               console.warn('Failed to fetch heatmap, falling back to local simulation');
           }
           
           // Mock Elasticsearch-style random heatmap density around Keesara (Fallback)
           const points = [];
           for (let i = 0; i < 150; i++) {
              points.push([
                 17.5234 + (Math.random() - 0.5) * 0.12,
                 78.6681 + (Math.random() - 0.5) * 0.12,
                 Math.random() * 0.8
              ]);
           }
           setHeatmapPoints(points);
       };
       fetchHeatmap();
    }
  }, [backendUrl, role]);

  if (isLoading) return <div className="h-screen bg-[#080c18] flex items-center justify-center animate-pulse text-[#7bd0ff] font-black tracking-[0.5em] uppercase text-xs">VERIFYING NEURAL LINK...</div>;
  if (!role) return <RoleSelector onSelect={updateRole} />;

  // Prioritize real database data as soon as it arrives!
  const displayVehicles = vehicles.length > 0 ? vehicles : (localVehicles || INITIAL_VEHICLES);
  const displayIncidents = incidents.length > 0 ? incidents : (localIncidents || INITIAL_INCIDENTS);

  const handleSubmitReport = async (description, customCoords = null, triageResult = null, photoUrl = null) => {
     toast.info("Broadcast sequence initiated...", { theme: 'dark', autoClose: 1000 });
     
     try {
         const token = await getToken().catch(() => null);

         // Build request body — if IncidentInput already ran the AI Triad,
         // pass the pre-analyzed result to skip double analysis on the backend.
         const body = {
           description,
           lat: customCoords?.lat || 17.5234,
           lng: customCoords?.lng || 78.6681,
           ...(triageResult ? { preAnalyzed: triageResult } : {}),
           ...(photoUrl ? { photoUrl } : {}),
         };

         const response = await fetch(`${backendUrl}/api/report`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               ...(token ? { Authorization: `Bearer ${token}` } : {})
             },
             body: JSON.stringify(body)
         });

         if (response.ok) {
            const { tacticalData } = await response.json();
            const engine = tacticalData?.ai_engine || triageResult?.ai_engine || 'AI';
            toast.success(`VERIFIED: ${(tacticalData.type || 'incident').toUpperCase()} — SEVERITY: ${(tacticalData.severity || '?').toUpperCase()} [${engine}]`, { theme: 'dark' });
            return;
         }

         console.warn('Backend report request failed:', response.status);
     } catch (err) {
         console.warn("[HYBRID OFFLINE] Falling back to local simulation.", err);
     }

     // 🛡️ FALLBACK: LOCAL MOCK LOGIC (if backend + AI are both offline)
     setTimeout(async () => {
         const desc = (description || '').toLowerCase();
         const pos = customCoords ? [customCoords.lat, customCoords.lng] : [17.5234 + (Math.random() - 0.5) * 0.05, 78.6681 + (Math.random() - 0.5) * 0.05];
         
         // Use pre-analyzed result if available, else crude keyword triage
         let type = triageResult?.type || 'Emergency Contact';
         let severity = triageResult?.severity || 'Medium';
         let requiredType = 'police';
         if (!triageResult) {
           if (desc.includes('fire')) { type = 'Structure Fire'; severity = 'High'; requiredType = 'firetruck'; }
           else if (desc.includes('injury') || desc.includes('accident') || desc.includes('crash')) { type = 'Medical Emergency'; severity = 'High'; requiredType = 'ambulance'; }
         } else {
           requiredType = (triageResult.vehicles_required || ['police'])[0];
         }

         const analyzedFleet = displayVehicles.map(v => {
             const dist = Math.sqrt(Math.pow(v.position[0]-pos[0], 2) + Math.pow(v.position[1]-pos[1], 2));
             const typeScore = v.type === requiredType ? 100 : v.type === 'ambulance' ? 50 : 20; 
             const shiftFatigue = Math.random() * 0.25;
             return { ...v, tacticalScore: (typeScore / (dist * 1000 + 1)) * (1 - shiftFatigue) };
         });

         const sortedFleet = [...analyzedFleet].sort((a,b) => b.tacticalScore - a.tacticalScore);
         const responder = sortedFleet[0];

         toast.info(`NEURAL CO-PILOT: Allocating ${responder.name}`, { theme: 'dark' });

         const newIncident = {
             id: Date.now(),
             type,
             severity,
             locationName: customCoords ? `${customCoords.lat.toFixed(4)}°N, ${customCoords.lng.toFixed(4)}°E` : 'Sector 7 Area Feed',
             position: pos,
             assigned_vehicle: responder.name,
             assignedVehicle: responder.name,
             description: `[OFFLINE TRIAGE] ${description}`,
             photoUrl: photoUrl || null,
             timestamp: Date.now()
         };

         await reportIncident(newIncident);
         toast.success("Tactical assignment SYNCED across all Nodes.", { theme: 'dark' });
     }, 1500);
  };


  const handleMapClick = (latlng) => {
     if (role === 'people') {
        toast.info(`Reporting request at ${latlng.lat.toFixed(4)}°N. Analyzing environment...`, { theme: 'dark' });
        handleSubmitReport("Citizen reported emergency via tactical map click.", latlng);
     } else {
        toast.info(`Admin override: Marking incident at ${latlng.lat.toFixed(4)}°N`, { theme: 'dark' });
        handleSubmitReport("Manager-level tactical marker placement.", latlng);
     }
  };

  // Data source badge helper
  const sourceBadge = {
    firebase: { label: '🔥 Firebase Live', color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' },
    mongodb:  { label: '⚡ MongoDB Live',  color: 'text-[#7bd0ff] border-[#7bd0ff]/20 bg-[#7bd0ff]/5' },
    mock:     { label: '🔶 Mock Data',     color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  }[dataSource] || { label: '● Connecting...', color: 'text-slate-400 border-slate-400/20' };


  // PEOPLE (CITIZEN) VIEW
  if (role === 'people') {
    return (
      <div className="flex flex-col h-screen w-full bg-[#080c18] text-[#dae2fd] relative font-sans overflow-hidden">
        {/* ✨ Premium Global Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#7bd0ff]/10 rounded-full blur-[160px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

        <Navbar />
        
        <main className="flex-1 mt-16 flex flex-col p-6 space-y-6 overflow-hidden z-10">
           {/* 📊 REAL-TIME SAFETY METRICS (HEADER) */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                  { label: 'Active Incidents', val: displayIncidents.length, color: 'text-error', icon: <Activity size={18} /> },
                  { label: 'Verified Responders', val: '6', color: 'text-[#7bd0ff]', icon: <ShieldCheck size={18} /> },
                  { label: 'Emergency Load', val: 'Low', color: 'text-emerald-400', icon: <Activity size={18} /> },
                  { label: 'Regional Safety', val: '98%', color: 'text-[#dae2fd]', icon: <User size={18} /> }
              ].map((stat, i) => (
                 <div key={i} className="glass-morphism p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-[#7bd0ff]/30 transition-all cursor-default">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{stat.label}</p>
                       <h3 className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.val}</h3>
                    </div>
                    <div className={`${stat.color} opacity-30 group-hover:opacity-100 transition-opacity`}>
                       {stat.icon}
                    </div>
                 </div>
              ))}
           </div>

           {/* 🗺️ MAIN TACTICAL GRID (2-Column Layout) */}
           <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
              {/* LEFT: Tactical Safety Map */}
              <div className="flex-[2.5] relative rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group">
                 <MapComponent 
                    heatmapMode={true} 
                    heatmapPoints={heatmapPoints} 
                    vehicles={displayVehicles} 
                    incidents={displayIncidents.slice(0, 10)}
                    onMapClick={handleMapClick}
                 />
                 
                 {/* Map Overlay Badge */}
                 <div className="absolute top-8 left-8 z-[1000] bg-[#0b1326]/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-3xl">
                    <div className="relative">
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                       <div className="absolute top-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                    </div>
                    <div>
                       <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#dae2fd]">Sector 7 Live Cluster Feed</span>
                       <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Hyderabad-Keesara Mandal Grid</span>
                    </div>
                    {/* Data source badge */}
                    <span className={`ml-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${sourceBadge.color}`}>
                      {sourceBadge.label}
                    </span>
                 </div>
              </div>

              {/* RIGHT: Verified Alerts Sidebar (Read-only) */}
              <div className="flex-1 glass-morphism rounded-[3rem] border border-white/5 p-8 flex flex-col min-w-[320px] shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-60">Verified Alerts</h3>
                    <div className="p-1.5 px-3 rounded-full bg-error/10 border border-error/20 text-error text-[8px] font-black uppercase tracking-widest">LIVE FEED</div>
                 </div>
                 
                 <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                    {displayIncidents.map(inc => (
                       <div key={inc.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="text-xs font-black text-white group-hover:text-[#7bd0ff] transition-colors">{inc.type.split('-')[0]}</h4>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${inc.severity === 'High' ? 'bg-error/10 text-error' : 'bg-[#7bd0ff]/10 text-[#7bd0ff]'}`}>{inc.severity}</span>
                          </div>
                          <p className="text-[10px] leading-relaxed opacity-50 font-bold uppercase tracking-tight">{inc.locationName}</p>
                       </div>
                    ))}
                 </div>

                 <button onClick={logout} className="mt-8 w-full py-4 glass-morphism rounded-2xl border border-white/5 text-red-400/60 hover:text-red-400 font-black text-[10px] tracking-[0.3em] uppercase transition-all hover:bg-red-500/5 active:scale-95">
                    <LogOut size={14} className="inline mr-3" /> Terminate Portal Session
                 </button>
              </div>
           </div>

           {/* ✍️ COMMUNITY REPORTING HUB (FOOTER) */}
           <div className="glass-morphism p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-2 relative overflow-hidden group">
              <div className="absolute top-[-50%] left-[-10%] w-[30%] h-[200%] bg-blue-500/5 rotate-12 pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                 <div className="max-w-[240px]">
                    <div className="flex items-center gap-3 mb-3">
                       <Send size={14} className="text-[#7bd0ff]" />
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#7bd0ff]">Incident Pulse</h3>
                    </div>
                    <p className="text-[11px] font-black text-[#8a9db8] leading-relaxed uppercase tracking-tight">Report local crises directly to the neural command center. 99% AI triage accuracy.</p>
                 </div>
                 <div className="flex-1 w-full">
                    <IncidentInput onSubmit={handleSubmitReport} />
                 </div>
              </div>
           </div>
        </main>
        
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="dark"
          style={{ zIndex: 99999 }}
          toastStyle={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.05)', color: '#dae2fd', fontFamily: 'Inter, sans-serif', zIndex: 99999 }}
        />
      </div>
    );
  }

  // ADMIN VIEW (CURRENT DASHBOARD)
  return (
    <div className="flex h-screen w-full bg-[#080c18] overflow-hidden text-[#dae2fd] selection:bg-[#7bd0ff]/30 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7bd0ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <Sidebar />
      <div className="flex flex-col flex-1 relative overflow-hidden z-10">
        <Navbar />
        <main className="flex-1 flex flex-row mt-16 overflow-hidden">
          <div className="flex-1 flex flex-col relative p-6 space-y-6">
            <div className="flex-1 min-h-0 relative">
               <MapComponent 
                 activeIncident={activeIncident} 
                 vehicles={displayVehicles} 
                 incidents={displayIncidents}
                 onMapClick={handleMapClick}
                 heatmapMode={role === 'people'}
                 heatmapPoints={heatmapPoints}
               />
            </div>
            <div className="h-48 shrink-0">
               <IncidentInput onSubmit={handleSubmitReport} />
            </div>
          </div>
          <IncidentPanel incidents={displayIncidents} onSelect={setActiveIncident} activeId={activeIncident?.id} />
        </main>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        theme="dark"
        pauseOnFocusLoss={false}
        hideProgressBar={false}
        style={{ zIndex: 99999 }}
        toastStyle={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.07)', color: '#dae2fd', fontFamily: 'Inter, sans-serif', zIndex: 99999 }}
      />
    </div>
  );
}

const AuthGate = ({ children }) => {
  const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!isClerkEnabled) return <>{children}</>;

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c18] relative px-6 text-center">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7bd0ff]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="glass-morphism p-14 rounded-[4rem] border border-white/5 shadow-2xl max-w-md w-full relative z-10 transition-all">
                <div className="w-24 h-24 bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-3xl shadow-blue-500/30">
                   <ShieldCheck size={48} className="text-white" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-[#dae2fd] drop-shadow-sm">Sector 7 Access</h1>
                <p className="text-[11px] text-[#dae2fd] font-black tracking-[0.4em] uppercase opacity-80 mb-10 leading-loose">Secure Terminal Sequence Required</p>
                
                <div className="bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] p-[1px] rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                   <div className="bg-[#131b2e] rounded-[15px] overflow-hidden hover:bg-transparent transition-colors">
                      <SignInButton mode="modal">
                        <button className="w-full py-4 px-8 text-[11px] font-black uppercase tracking-[0.3em] text-[#dae2fd] hover:text-slate-900 transition-colors">
                           Authorize Session
                        </button>
                      </SignInButton>
                   </div>
                </div>
                
                <p className="mt-8 text-[9px] font-black tracking-widest text-[#c6c6cd] uppercase opacity-30">
                  Authorized Personnel Only • Node Mumbai-7
                </p>
            </div>
        </div>
      </SignedOut>
    </>
  );
};

export default function Home() {
  return (
    <AuthGate>
       <IdentityLink>
          {(user) => <DashboardMain user={user} />}
       </IdentityLink>
    </AuthGate>
  );
}
