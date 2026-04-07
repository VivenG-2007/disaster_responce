"use client";
import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  Polyline, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, 15, { animate: true, duration: 1.5 });
        }
    }, [coords, map]);
    return null;
};

const MouseCoordinates = ({ onMapClick }) => {
    const [coords, setCoords] = useState({ lat: 17.5234, lng: 78.6681 });
    
    useMapEvents({
        mousemove: (e) => {
            setCoords(e.latlng);
        },
        click: (e) => {
            if (onMapClick) onMapClick(e.latlng);
        }
    });


    return (
        <div className="absolute bottom-6 left-6 z-[1000] bg-[#171f33]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-3">
             <div className="p-1.5 rounded-lg bg-[#7bd0ff]/10 text-[#7bd0ff]">
                <MapPin size={14} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Tactical GPS - Click to Report</p>
                <p className="text-[11px] font-mono font-bold text-[#dae2fd]">
                   {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                </p>
             </div>
        </div>
    );
};


const HeatLayer = ({ points }) => {

    const map = useMap();
    useEffect(() => {
        if (!window.L || !window.L.heatLayer) return;
        const heat = window.L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);
        return () => map.removeLayer(heat);
    }, [map, points]);
    return null;
};

const MapComponent = ({ activeIncident, vehicles = [], incidents = [], heatmapMode = false, heatmapPoints = [], onMapClick }) => {

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const [realRoute, setRealRoute] = useState([]);

    const defaultCenter = [17.5234, 78.6681]; // Keesara Mandal, Hyderabad

    // Memoize icons to prevent re-creation on every render
    const vehicleIcons = React.useMemo(() => {
        const icons = {};
        vehicles.forEach(v => {
            const emoji = v.type === 'ambulance' ? '🚑' : v.type === 'firetruck' ? '🚒' : '🚓';
            const color = v.color;
            const key = `${v.type}-${v.color}`;
            if (!icons[key]) {
                icons[key] = L.divIcon({
                    html: `<div style="background-color: ${color}; filter: drop-shadow(0 0 10px ${color}); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2.5px solid rgba(255,255,255,0.9); box-shadow: 0 0 20px rgba(0,0,0,0.4);" class="vehicle-marker-core">${emoji}</div>`,
                    className: 'custom-div-icon',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });
            }
        });
        return icons;
    }, [vehicles]);

    const incidentIcon = React.useMemo(() => L.divIcon({
        html: `<div style="background-color: #ef4444; filter: drop-shadow(0 0 10px #ef4444); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 3px solid white; box-shadow: 0 0 20px rgba(0,0,0,0.5);" class="animate-pulse">🔥</div>`,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    }), []);

    useEffect(() => {
        // Fix Leaflet marker icon issues in Next.js
        if (typeof window !== 'undefined') {
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        }
    }, []);
    
    const assignedVehicle = activeIncident ? vehicles.find(v => v.name === activeIncident.assignedVehicle) : null;
    const routeCoordinates = (assignedVehicle && activeIncident) ? [assignedVehicle.position, activeIncident.position] : [];

    useEffect(() => {
        const fetchRealRoute = async () => {
            if (!assignedVehicle || !activeIncident) {
                setRealRoute([]);
                return;
            }
            if (!process.env.NEXT_PUBLIC_MAPS_API_KEY) {
                // No key, fallback immediately
                setRealRoute(routeCoordinates);
                return;
            }
            try {
                // Fetch actual road directions using Google Routes API
                const resp = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.NEXT_PUBLIC_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
                    },
                    body: JSON.stringify({
                        origin: { location: { latLng: { latitude: assignedVehicle.position[0], longitude: assignedVehicle.position[1] } } },
                        destination: { location: { latLng: { latitude: activeIncident.position[0], longitude: activeIncident.position[1] } } },
                        travelMode: 'DRIVE'
                    })
                });
                const data = await resp.json();
                if (data && data.routes && data.routes[0]) {
                    const encoded = data.routes[0].polyline.encodedPolyline;
                    const polyline = require('@mapbox/polyline');
                    const decoded = polyline.decode(encoded);
                    setRealRoute(decoded);
                } else {
                    setRealRoute(routeCoordinates);
                }
            } catch (e) {
                setRealRoute(routeCoordinates);
            }
        };
        fetchRealRoute();
    }, [assignedVehicle?.position[0], assignedVehicle?.position[1], activeIncident?.position[0], activeIncident?.position[1]]);

    const [mapLayer, setMapLayer] = useState('dark'); // 'dark', 'light', 'voyager'
    
    const tileLayers = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    };

    if (!mounted) return null;

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative border border-white/5 bg-[#0b1326]" id="map-parent">
            <MapContainer 
              key="sector-7-map"
              center={defaultCenter} 
              zoom={13} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%', background: '#0b1326' }}
            >
                <TileLayer
                    url={tileLayers[mapLayer]}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {heatmapMode && <HeatLayer points={heatmapPoints} />}
                
                {!heatmapMode && vehicles.map(v => (
                    <Marker 
                        key={v.id} 
                        position={v.position} 
                        icon={vehicleIcons[`${v.type}-${v.color}`]}
                    >
                        <Popup className="custom-popup">
                            <div className="p-3 bg-[#131b2e] text-[#dae2fd] border border-white/5 rounded-xl min-w-[140px]">
                                <h3 className="font-black text-sm text-primary tracking-tighter uppercase">{v.name}</h3>
                                <div className={`text-[10px] mt-1.5 px-2 py-0.5 rounded inline-block font-black tracking-widest uppercase ${
                                    v.status === 'Responding' ? 'bg-[#93000a] text-[#ffb4ab]' : 'bg-[#004c69] text-[#7bd0ff]'
                                }`}>
                                    Status: {v.status}
                                </div>
                                <div className="grid grid-cols-1 gap-2 mt-3 pt-3 border-t border-white/5">
                                    <div className="flex justify-between items-center px-1">
                                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Velocity</p>
                                       <p className="text-xs font-mono font-bold text-[#dae2fd]">{v.speed} km/h</p>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">ETA</p>
                                       <p className="text-xs font-mono font-bold text-[#dae2fd]">{v.eta}</p>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Render All Verified Incidents (Global Visibility) */}
                {incidents.map(inc => (
                    <Marker key={inc.id || Math.random()} position={inc.position} icon={incidentIcon}>
                        <Popup className="custom-popup" offset={[0, -20]}>
                            <div className="p-4 bg-[#131b2e] text-[#dae2fd] border border-white/5 rounded-2xl min-w-[180px] shadow-2xl">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <h4 className="font-black text-[9px] text-error tracking-[0.2em] uppercase opacity-60 mb-0.5 leading-none">COMMAND FEED</h4>
                                      <h3 className="font-black text-[14px] text-[#dae2fd] leading-tight mt-1">{inc.type}</h3>
                                   </div>
                                   <div className={`p-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none ${
                                       inc.severity === 'High' ? 'bg-error/10 border border-error/20 text-error' : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                                   }`}>
                                      {inc.severity}
                                   </div>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-white/5">
                                   <p className="text-[10px] text-[#c6c6cd] font-bold uppercase tracking-[0.05em] leading-relaxed opacity-60">
                                      {inc.description || 'Analysis complete.'}
                                   </p>
                                   <div className="text-[9px] font-bold text-[#7bd0ff]">
                                      RESPONDER: {inc.assignedVehicle || inc.assigned_vehicle || 'SEARCHING...'}
                                   </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {(activeIncident || heatmapMode) && !heatmapMode && (
                    <Marker position={activeIncident.position} icon={incidentIcon}>
                        <Popup className="custom-popup" offset={[0, -20]}>
                            <div className="p-4 bg-[#131b2e] text-[#dae2fd] border border-white/5 rounded-2xl min-w-[180px] shadow-2xl">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <h4 className="font-black text-[9px] text-error tracking-[0.2em] uppercase opacity-60 mb-0.5 leading-none">SECTOR 7 INTEL</h4>
                                      <h3 className="font-black text-[16px] text-[#dae2fd] leading-tight mt-1">{activeIncident.type}</h3>
                                   </div>
                                   <div className="p-1 px-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest leading-none">
                                      {activeIncident.severity}
                                   </div>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-white/5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#7bd0ff] animate-ping"></div>
                                      <p className="text-[10px] font-mono font-bold text-[#7bd0ff] tracking-tighter">
                                         {activeIncident.position[0].toFixed(5)}°N, {activeIncident.position[1].toFixed(5)}°E
                                      </p>
                                   </div>
                                   <p className="text-[10px] text-[#c6c6cd] font-bold uppercase tracking-[0.05em] leading-relaxed opacity-60">
                                      {activeIncident.description || 'Neural triage analysis pending...'}
                                   </p>
                                </div>
                            </div>
                        </Popup>
                        <RecenterMap coords={activeIncident.position} />
                    </Marker>
                )}

                {(realRoute.length > 0 || routeCoordinates.length > 0) && !heatmapMode && (
                    <Polyline 
                        positions={realRoute.length > 0 ? realRoute : routeCoordinates} 
                        pathOptions={{ 
                            color: '#7bd0ff', 
                            weight: realRoute.length > 2 ? 5 : 3, 
                            dashArray: realRoute.length > 2 ? undefined : '10, 10', 
                            lineJoin: 'round',
                            opacity: realRoute.length > 2 ? 0.8 : 0.6
                        }} 
                    />
                )}
                
                <MouseCoordinates onMapClick={onMapClick} />
            </MapContainer>



            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                <div className="bg-[#171f33]/80 backdrop-blur-xl border border-white/5 p-3 rounded-xl shadow-2xl flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-1">
                       LAYERS CONTROL
                   </div>
                   <div className="flex gap-2">
                      <button 
                         onClick={() => setMapLayer('dark')}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 font-black text-xs ${mapLayer === 'dark' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-[#2d3449] text-slate-400'}`}
                         title="Dark Street View"
                      >S</button>
                      <button 
                         onClick={() => setMapLayer('light')}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 font-black text-xs ${mapLayer === 'light' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-[#2d3449] text-slate-400'}`}
                         title="Light Terrain View"
                      >T</button>
                      <button 
                         onClick={() => setMapLayer('voyager')}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 font-black text-xs ${mapLayer === 'voyager' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-[#2d3449] text-slate-400'}`}
                         title="Voyager View"
                      >V</button>
                   </div>
                </div>
            </div>

            
            <div className="absolute top-4 right-4 z-[1000]">
                <div className="bg-[#171f33]/80 backdrop-blur-xl border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse shadow-2xl border-l-4 border-l-error">
                    <div className="w-2 h-2 rounded-full bg-error ring-2 ring-error/30"></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] opacity-90">LIVE FEED: SECTOR 7</span>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;
