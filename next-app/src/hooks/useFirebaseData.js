"use client";
import React, { useEffect, useState, useRef } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";

// Fallback Mock Data for demo when Firebase is not set up (Keesara Mandal, Hyderabad)
const MOCK_VEHICLES = [
    { id: 'v1', name: 'FIRE-X9', type: 'firetruck', status: 'Responding', speed: 82, eta: '3m', position: [17.5210, 78.6650], color: '#ef4444' },
    { id: 'v2', name: 'AMB-041', type: 'ambulance', status: 'Available', speed: 0, eta: '-', position: [17.5250, 78.6600], color: '#7bd0ff' },
    { id: 'v3', name: 'PD-SEC7', type: 'police', status: 'On-scene', speed: 0, eta: '-', position: [17.5180, 78.6580], color: '#b7c8e1' }
];

const MOCK_INCIDENTS = [
    { id: 'i1', type: 'Structure Fire', severity: 'High', locationName: 'Keesara Gutta Hilltop', position: [17.5234, 78.6781], assignedVehicle: 'FIRE-X9', description: 'Structural integrity compromised near the main park.', timestamp: Date.now() },
    { id: 'i2', type: 'Medical Emergency', severity: 'Medium', locationName: 'Medchal Crossing', position: [17.5180, 78.6580], assignedVehicle: 'PD-SEC7', description: 'Traffic accident reported with minor casualties.', timestamp: Date.now() - 3600000 }
];

// Firebase Configuration (Safely handle missing keys)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase safely
let db = null;
try {
    if (firebaseConfig.apiKey !== "dummy") {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        db = getDatabase(app);
    }
} catch (e) {
    console.warn("Firebase initialization failed, using mock data mode.");
}

export const useFirebaseData = () => {
    const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
    const [incidents, setIncidents] = useState(MOCK_INCIDENTS);

    const incidentsDataRef = useRef(incidents);
    useEffect(() => {
        incidentsDataRef.current = incidents;
    }, [incidents]);

    useEffect(() => {
        if (!db) {
            // Simulate minor vehicle movement for mock mode
            const interval = setInterval(() => {
                setVehicles(prevVehicles => {
                    return prevVehicles.map(v => {
                        if (v.status !== 'Responding') return v;
                        
                        const target = incidentsDataRef.current.find(i => i.assignedVehicle === v.name) || incidentsDataRef.current[0];
                        if (!target) return v;

                        const [vLat, vLng] = v.position;
                        const [tLat, tLng] = target.position;

                        const step = 0.00015; // Increased speed for better visibility
                        const dLat = tLat - vLat;
                        const dLng = tLng - vLng;
                        const dist = Math.sqrt(dLat*dLat + dLng*dLng);

                        if (dist < 0.0005) {
                            return { ...v, status: 'On-scene', speed: 0, position: target.position };
                        }

                        return {
                            ...v,
                            speed: Math.floor(65 + Math.random() * 15),
                            position: [
                                vLat + (dLat / dist) * step,
                                vLng + (dLng / dist) * step
                            ]
                        };
                    });
                });
            }, 400);
            return () => clearInterval(interval);
        }

        const vehiclesRef = ref(db, 'vehicles');
        const incidentsRef = ref(db, 'incidents');

        const unsubscribeVehicles = onValue(vehiclesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setVehicles(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            }
        });

        const unsubscribeIncidents = onValue(incidentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setIncidents(list.sort((a, b) => b.timestamp - a.timestamp));
            }
        });

        return () => {
            unsubscribeVehicles();
            unsubscribeIncidents();
        };
    }, []);

    const reportIncident = async (incident) => {
        if (!db) {
            const newIncident = { ...incident, id: Date.now(), timestamp: Date.now() };
            setIncidents(prev => [newIncident, ...prev]);
            return;
        }
        const incidentsRef = ref(db, 'incidents');
        const newRef = push(incidentsRef);
        await set(newRef, { ...incident, timestamp: Date.now() });
    };

    return { vehicles, incidents, reportIncident };
};
