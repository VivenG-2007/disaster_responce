"use client";
/**
 * useFirebaseData — Hybrid real-time data hook
 *
 * When Firebase credentials are present:
 *   • Reads incidents + vehicles from Firestore (real-time onSnapshot listeners)
 *   • Writes new incidents to Firestore AND the Node.js gateway (dual-write)
 *
 * When Firebase credentials are absent (failsafe):
 *   • Falls back to Socket.io → MongoDB via the Node.js backend
 *   • Runs a client-side vehicle simulation when the socket is offline
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { io } from 'socket.io-client';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { FIREBASE_ENABLED, firestore } from '../lib/firebase';

// ── Mock data (shown while real data loads or when everything is offline) ────
const MOCK_VEHICLES = [
  { id: 'v1', name: 'FIRE-X9',  type: 'firetruck', status: 'Responding', speed: 82,  eta: '3m', position: [17.5210, 78.6650], color: '#ef4444' },
  { id: 'v2', name: 'AMB-041',  type: 'ambulance', status: 'Available',  speed: 0,   eta: '-',  position: [17.5250, 78.6600], color: '#7bd0ff' },
  { id: 'v3', name: 'PD-SEC7',  type: 'police',    status: 'On-scene',   speed: 0,   eta: '-',  position: [17.5180, 78.6580], color: '#b7c8e1' },
  { id: 'v4', name: 'AMB-099',  type: 'ambulance', status: 'Available',  speed: 0,   eta: '-',  position: [17.5300, 78.6800], color: '#7bd0ff' },
  { id: 'v5', name: 'FIRE-V2',  type: 'firetruck', status: 'Available',  speed: 0,   eta: '-',  position: [17.5100, 78.6400], color: '#ef4444' },
  { id: 'v6', name: 'PD-SEC9',  type: 'police',    status: 'Patrolling', speed: 45,  eta: '-',  position: [17.5400, 78.6500], color: '#b7c8e1' },
];

const MOCK_INCIDENTS = [
  {
    id: 'i1', type: 'Structure Fire', severity: 'High',
    locationName: 'Keesara Gutta Hilltop',
    position: [17.5234, 78.6781], assignedVehicle: 'FIRE-X9',
    description: 'Structural integrity compromised near the main park.',
    timestamp: Date.now(), status: 'active',
  },
  {
    id: 'i2', type: 'Medical Emergency', severity: 'Medium',
    locationName: 'Medchal Crossing',
    position: [17.5180, 78.6580], assignedVehicle: 'PD-SEC7',
    description: 'Traffic accident reported with minor casualties.',
    timestamp: Date.now() - 3_600_000, status: 'active',
  },
];

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useFirebaseData = () => {
  const [vehicles,  setVehicles]  = useState(MOCK_VEHICLES);
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);

  // socket.io handle (used only in MongoDB failsafe path)
  const [socket,    setSocket]    = useState(null);
  const [dataSource, setDataSource] = useState('mock'); // 'firebase' | 'mongodb' | 'mock'

  const { getToken } = useAuth();
  const nodeApiUrl = process.env.NEXT_PUBLIC_API_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || 'http://localhost:5000';

  // Keep a ref to incidents so the vehicle simulation closure is always fresh
  const incidentsRef = useRef(incidents);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);

  // ── Path A: Firestore real-time listeners ────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_ENABLED || !firestore) return;

    console.log('[Data] Using Firestore real-time path');
    setDataSource('firebase');

    // Incidents — latest 200, ordered by timestamp desc
    const incQ = query(
      collection(firestore, 'incidents'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const unsubIncidents = onSnapshot(incQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncidents(list.length > 0 ? list : MOCK_INCIDENTS);
    }, (err) => {
      console.warn('[Firestore] Incidents snapshot error:', err.message);
    });

    // Vehicles — all documents
    const unsubVehicles = onSnapshot(
      collection(firestore, 'vehicles'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setVehicles(list.length > 0 ? list : MOCK_VEHICLES);
      },
      (err) => {
        console.warn('[Firestore] Vehicles snapshot error:', err.message);
      }
    );

    return () => {
      unsubIncidents();
      unsubVehicles();
    };
  }, []); // run once on mount

  // ── Path B: Socket.io → MongoDB (failsafe when Firestore is off) ─────────
  useEffect(() => {
    if (FIREBASE_ENABLED) return; // skip — Firestore handles data

    console.log('[Data] Using Socket.io / MongoDB failsafe path');

    const socketIo = io(nodeApiUrl, { transports: ['websocket', 'polling'] });

    socketIo.on('connect', () => {
      console.log('[Socket.io] ✅ Connected to MongoDB gateway');
      setSocket(socketIo);
      setDataSource('mongodb');
    });

    socketIo.on('connect_error', () => {
      console.warn('[Socket.io] ⚠️  Offline — showing mock data');
      setDataSource('mock');
    });

    socketIo.on('vehicles_update', (data) => {
      if (!data) return;
      const list = Object.values(data);
      setVehicles(list.length > 0 ? list : MOCK_VEHICLES);
    });

    socketIo.on('incidents_update', (data) => {
      if (!data) return;
      const list = Object.values(data).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setIncidents(list.length > 0 ? list : MOCK_INCIDENTS);
    });

    return () => socketIo.disconnect();
  }, [nodeApiUrl]);

  // ── Path B only: client-side vehicle simulation when socket is gone ──────
  useEffect(() => {
    if (FIREBASE_ENABLED) return;
    if (socket?.connected) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== 'Responding') return v;
          const target =
            incidentsRef.current.find(
              (i) => i.assignedVehicle === v.name || i.assigned_vehicle === v.id
            ) || incidentsRef.current[0];
          if (!target) return v;

          const [vLat, vLng] = v.position;
          const [tLat, tLng] = target.position;
          const step = 0.00015;
          const dLat = tLat - vLat;
          const dLng = tLng - vLng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          if (dist < 0.0005) {
            return { ...v, status: 'On-scene', speed: 0, position: target.position };
          }
          // Add random jitter to simulate actual city block navigation
          const driftLat = (Math.random() - 0.5) * 0.0003;
          const driftLng = (Math.random() - 0.5) * 0.0003;

          return {
            ...v,
            speed: Math.floor(65 + Math.random() * 15),
            position: [
               vLat + (dLat / dist) * step + driftLat, 
               vLng + (dLng / dist) * step + driftLng
            ],
          };
        })
      );
    }, 400);

    return () => clearInterval(interval);
  }, [socket]);

  // ── Incident reporting (dual-write: Firestore + Node.js gateway) ─────────
  const reportIncident = useCallback(async (incident) => {
    const token = await getToken().catch(() => null);

    // Always try the Node.js backend (it handles full triage + vehicle dispatch)
    try {
      await fetch(`${nodeApiUrl}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(incident),
      });
    } catch (err) {
      console.warn('[Report] Node.js gateway unreachable:', err.message);
    }

    // Also write to Firestore when available (enables cross-device real-time sync)
    if (FIREBASE_ENABLED && firestore) {
      try {
        await addDoc(collection(firestore, 'incidents'), {
          ...incident,
          timestamp: serverTimestamp(),
          _source: 'client',
        });
      } catch (err) {
        console.warn('[Firestore] Write failed:', err.message);
      }
    }

    // Optimistic local update as fallback
    if (!FIREBASE_ENABLED) {
      setIncidents((prev) => [
        { ...incident, id: String(Date.now()), timestamp: Date.now() },
        ...prev,
      ]);
    }
  }, [nodeApiUrl, getToken]);

  return { vehicles, incidents, reportIncident, dataSource };
};
