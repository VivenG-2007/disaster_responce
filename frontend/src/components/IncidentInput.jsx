"use client";
/**
 * IncidentInput — AI Triad-powered incident reporter
 *
 * Features:
 *  - Text description with GPS auto-lock
 *  - Optional photo upload → analyzed by Gemini Vision
 *  - AI Triad: Gemini Vision → Gemini Flash → Groq failsafe
 *  - Firebase Storage upload when credentials are present
 *  - Drag-and-drop image support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Mic, Zap, Loader2, MapPin, AlertTriangle,
  CheckCircle, Camera, X, ImagePlus, Brain, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeWithAITriad, GEMINI_ENABLED } from '../lib/gemini';
import { FIREBASE_ENABLED, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ── Helpers ──────────────────────────────────────────────────────────────────
const AI_STAGES = [
  { id: 'uploading',  label: 'Uploading Image...',          icon: <ImagePlus size={14} /> },
  { id: 'vision',     label: 'Gemini Vision Analyzing...',  icon: <Camera size={14} /> },
  { id: 'flash',      label: 'Gemini Flash Triaging...',    icon: <Brain size={14} /> },
  { id: 'groq',       label: 'Groq Failsafe Engaged...',    icon: <Cpu size={14} /> },
  { id: 'dispatching',label: 'Dispatching Resources...',    icon: <Send size={14} /> },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the "data:<mime>;base64," prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
const IncidentInput = ({ onSubmit }) => {
  const [inputValue,  setInputValue]  = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStage,     setAiStage]     = useState(null); // current stage id
  const [aiEngine,    setAiEngine]    = useState(null); // last used engine
  const [dragOver,    setDragOver]    = useState(false);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [gpsCoords, setGpsCoords] = useState(null);

  // Photo state
  const [photo,        setPhoto]        = useState(null); // File object
  const [photoPreview, setPhotoPreview] = useState(null); // object URL

  const fileInputRef = useRef(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || 'http://localhost:5000';

  // ── GPS acquisition on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    setGpsStatus('acquiring');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('locked');
      },
      (err) => {
        console.warn('GPS denied or timed out:', err.message);
        setGpsStatus('denied');
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, []);

  // ── Photo handling ───────────────────────────────────────────────────────
  const attachPhoto = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const removePhoto = useCallback(() => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [photoPreview]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) attachPhoto(file);
  }, [attachPhoto]);

  // ── Main submit ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiEngine(null);

    try {
      let photoUrl       = null;
      let imageBase64    = null;
      let imageMimeType  = null;

      // ── Step 1: Upload photo to Firebase Storage (if present + enabled) ─
      if (photo) {
        if (FIREBASE_ENABLED && storage) {
          setAiStage('uploading');
          try {
            const storageRef = ref(storage, `incidents/${Date.now()}_${photo.name}`);
            await uploadBytes(storageRef, photo);
            photoUrl = await getDownloadURL(storageRef);
          } catch (err) {
            console.warn('[Storage] Upload failed, will use inline base64:', err.message);
          }
        }
        // Always convert to base64 for Gemini Vision (even if Storage upload failed)
        setAiStage('vision');
        imageBase64   = await fileToBase64(photo);
        imageMimeType = photo.type;
      }

      // ── Step 2: AI Triad analysis ────────────────────────────────────────
      setAiStage(photo ? 'vision' : 'flash');
      const triageResult = await analyzeWithAITriad({
        description:   inputValue,
        imageBase64,
        imageMimeType,
        backendUrl,
      }).catch((err) => {
        console.warn('[AI Triad] All engines failed:', err.message);
        return null;
      });

      if (triageResult?.ai_engine) setAiEngine(triageResult.ai_engine);
      setAiStage('dispatching');

      // ── Step 3: Hand off to parent (handles MongoDB/Firestore write + dispatch) ─
      await onSubmit(
        inputValue,
        gpsCoords,
        triageResult, // pre-analyzed result — parent may skip its own AI call
        photoUrl,
      );

      // Reset form
      setInputValue('');
      removePhoto();

    } finally {
      setIsAnalyzing(false);
      setAiStage(null);
    }
  };

  // ── UI helpers ───────────────────────────────────────────────────────────
  const gpsLabel = {
    idle:      { text: 'GPS: Initializing...',            color: 'text-slate-400',  icon: <MapPin size={11} /> },
    acquiring: { text: 'GPS: Acquiring Signal...',        color: 'text-amber-400',  icon: <MapPin size={11} className="animate-pulse" /> },
    locked:    { text: gpsCoords ? `GPS: ${gpsCoords.lat.toFixed(4)}°N, ${gpsCoords.lng.toFixed(4)}°E` : 'GPS: Locked', color: 'text-emerald-400', icon: <CheckCircle size={11} /> },
    denied:    { text: 'GPS: Denied — using Keesara default', color: 'text-red-400', icon: <AlertTriangle size={11} /> },
  }[gpsStatus];

  const currentStageInfo = AI_STAGES.find((s) => s.id === aiStage) || AI_STAGES[1];

  const engineBadge = {
    'gemini-vision': { label: '🔮 Gemini Vision', color: 'text-violet-400 border-violet-400/20 bg-violet-400/5' },
    'gemini-flash':  { label: '⚡ Gemini Flash',  color: 'text-[#7bd0ff] border-[#7bd0ff]/20 bg-[#7bd0ff]/5' },
    'groq-failsafe': { label: '🛡️ Groq Failsafe', color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  }[aiEngine] || null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`h-full w-full glass-morphism rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${dragOver ? 'border-[#7bd0ff]/50 bg-[#7bd0ff]/5' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header row */}
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Zap size={16} fill="currentColor" className={`text-[#7bd0ff] ${isAnalyzing ? 'animate-pulse' : ''}`} />
          <span className="font-black tracking-[0.2em] text-[10px] uppercase bg-[#7bd0ff]/10 px-2 py-0.5 rounded border border-[#7bd0ff]/20 text-[#7bd0ff]">
            AI Triad v5.0
          </span>
          {/* AI engine badges */}
          {GEMINI_ENABLED && (
            <span className="hidden sm:flex items-center gap-1 text-[8px] font-black tracking-widest uppercase text-violet-400 border border-violet-400/20 bg-violet-400/5 px-1.5 py-0.5 rounded">
              🔮 Gemini
            </span>
          )}
          {FIREBASE_ENABLED && (
            <span className="hidden sm:flex items-center gap-1 text-[8px] font-black tracking-widest uppercase text-orange-400 border border-orange-400/20 bg-orange-400/5 px-1.5 py-0.5 rounded">
              🔥 Firebase
            </span>
          )}
          {engineBadge && !isAnalyzing && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 text-[8px] font-black tracking-widest uppercase border px-1.5 py-0.5 rounded ${engineBadge.color}`}
            >
              {engineBadge.label}
            </motion.span>
          )}
        </div>

        {/* GPS badge */}
        <div className={`flex items-center gap-1.5 font-black text-[9px] tracking-widest uppercase ${gpsLabel.color}`}>
          {gpsLabel.icon}
          <span>{gpsLabel.text}</span>
        </div>
      </div>

      {/* GPS / Photo status bars */}
      <AnimatePresence>
        {gpsStatus === 'locked' && gpsCoords && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
              LIVE LOCATION LOCKED — Lat: {gpsCoords.lat.toFixed(5)}  Lng: {gpsCoords.lng.toFixed(5)}
            </span>
            <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-emerald-400/50">TRANSMITTING</span>
          </motion.div>
        )}
        {gpsStatus === 'denied' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-xl"
          >
            <AlertTriangle size={12} className="text-red-400 shrink-0" />
            <span className="text-[10px] font-bold text-red-400/80 tracking-wide">
              Location access denied — incident will be logged to Keesara Mandal default coordinates.
            </span>
          </motion.div>
        )}

        {/* Photo preview bar */}
        {photoPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-3 py-2 bg-violet-500/5 border border-violet-400/20 rounded-xl"
          >
            <img
              src={photoPreview} alt="Incident preview"
              className="w-10 h-10 rounded-lg object-cover border border-violet-400/30 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400">
                📸 Gemini Vision Ready
              </p>
              <p className="text-[9px] text-slate-500 truncate font-bold mt-0.5">{photo?.name}</p>
            </div>
            <button
              onClick={removePhoto}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10 active:scale-90"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* Drag-over overlay */}
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-[#7bd0ff]/10 border-2 border-dashed border-[#7bd0ff]/40 pointer-events-none"
          >
            <ImagePlus size={28} className="text-[#7bd0ff] mb-2" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-[#7bd0ff]">Drop Image for Vision Analysis</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input + Action row */}
      <div className="flex flex-1 gap-4 items-stretch relative min-h-0">
        <div className="flex-1 relative group">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the emergency — fire, accident, medical, flood... AI Triad will analyze and dispatch the nearest unit to your GPS location."
            className={`w-full h-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm font-bold text-[#dae2fd] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#7bd0ff]/30 focus:bg-white/[0.05] resize-none transition-all duration-500 shadow-inner backdrop-blur-sm ${isAnalyzing ? 'opacity-30 pointer-events-none' : ''}`}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          {/* Bottom-right toolbar */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2 text-slate-500">
            {/* Photo attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo for Gemini Vision analysis"
              className={`hover:text-violet-400 transition-all duration-200 hover:scale-110 active:scale-90 p-1 rounded-lg hover:bg-violet-400/10 ${photo ? 'text-violet-400' : ''}`}
            >
              <Camera size={16} />
            </button>
            <button className="hover:text-[#7bd0ff] transition-all duration-200 hover:scale-110 active:scale-90" title="Voice input (coming soon)">
              <Mic size={16} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => attachPhoto(e.target.files?.[0])}
          />
        </div>

        {/* Submit button */}
        <button
          id="incident-submit-btn"
          onClick={handleSend}
          disabled={isAnalyzing || !inputValue.trim()}
          className={`w-48 bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] hover:brightness-110 rounded-2xl flex flex-col items-center justify-center p-4 group transition-all duration-500 active:scale-95 shadow-xl shadow-blue-500/20 border border-white/20 relative overflow-hidden ${(isAnalyzing || !inputValue.trim()) ? 'opacity-50 grayscale' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {isAnalyzing ? (
            <>
              <Loader2 size={22} className="text-slate-900 mb-1.5 animate-spin relative z-10" />
              <span className="text-[8px] font-black tracking-[0.15em] text-slate-900 uppercase relative z-10 text-center leading-tight">
                {currentStageInfo.label.replace('...', '')}
              </span>
            </>
          ) : (
            <>
              <Send size={22} className="text-slate-900 mb-1.5 transform group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-500 relative z-10" />
              <span className="text-[9px] font-black tracking-[0.2em] text-slate-900 uppercase relative z-10">INITIATE TRIAGE</span>
              <div className="flex items-center gap-1 mt-1 relative z-10">
                {gpsStatus === 'locked' && <span className="text-[7px] font-black tracking-wider text-slate-900/60 uppercase">📍 GPS</span>}
                {photo && <span className="text-[7px] font-black tracking-wider text-slate-900/60 uppercase">📸 VISION</span>}
              </div>
            </>
          )}
        </button>
      </div>

      {/* Analyzing overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0b1326]/60 backdrop-blur-[6px] pointer-events-none flex flex-col items-center justify-center z-20 rounded-3xl gap-3"
          >
            {/* Stage indicators */}
            <div className="flex items-center gap-2">
              {currentStageInfo.icon && (
                <span className="text-[#7bd0ff] animate-pulse">{currentStageInfo.icon}</span>
              )}
              <span className="text-[11px] font-black tracking-[0.4em] text-[#7bd0ff] uppercase animate-pulse">
                {currentStageInfo.label}
              </span>
            </div>
            {/* Scan bar */}
            <div className="w-52 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-full h-full bg-gradient-to-r from-transparent via-[#7bd0ff] to-transparent"
              />
            </div>
            {/* Stage pills */}
            <div className="flex items-center gap-1.5 mt-1">
              {AI_STAGES.slice(1, 4).map((s) => (
                <span
                  key={s.id}
                  className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${aiStage === s.id ? 'border-[#7bd0ff]/40 bg-[#7bd0ff]/10 text-[#7bd0ff]' : 'border-white/5 text-slate-600'}`}
                >
                  {s.label.split(' ')[0]}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncidentInput;
