"use client";
import React, { useState } from 'react';
import { Send, Mic, Paperclip, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IncidentInput = ({ onSubmit }) => {
    const [inputValue, setInputValue] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim() || isAnalyzing) return;
        
        setIsAnalyzing(true);
        try {
            await onSubmit(inputValue);
            setInputValue('');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full w-full glass-morphism rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center space-x-2.5 text-[#7bd0ff] font-bold text-sm tracking-tight capitalize">
                    <Zap size={16} fill="currentColor" className={isAnalyzing ? 'animate-pulse' : ''} />
                    <span className="font-black tracking-[0.2em] text-[10px] uppercase bg-[#7bd0ff]/10 px-2 py-0.5 rounded border border-[#7bd0ff]/20">AI Neural Triage v4.0</span>
                </div>
                <div className="flex space-x-6">
                    <span className="text-[9px] text-[#dae2fd] font-black uppercase tracking-[0.2em] opacity-40">Status: <span className="text-[#7bd0ff] opacity-100">{isAnalyzing ? 'Analyzing...' : 'Standby'}</span></span>
                    <span className="text-[9px] text-[#dae2fd] font-black uppercase tracking-[0.2em] opacity-40">Confidence: <span className="text-[#a8ffb2] opacity-100">98.4%</span></span>
                </div>
            </div>

            <div className="flex flex-1 gap-5 items-stretch relative">
                <div className="flex-1 relative group">
                    <textarea 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="State coordinates or emergency nature for neural dispatch..."
                        className={`w-full h-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm font-bold text-[#dae2fd] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#7bd0ff]/30 focus:bg-white/[0.05] resize-none transition-all duration-500 shadow-inner backdrop-blur-sm ${
                            isAnalyzing ? 'opacity-30 pointer-events-none' : ''
                        }`}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center space-x-4 text-slate-500">
                        <button className="hover:text-[#7bd0ff] transition-all duration-200 hover:scale-110 active:scale-90">
                            <Mic size={18} />
                        </button>
                        <button className="hover:text-[#7bd0ff] transition-all duration-200 hover:scale-110 active:scale-90">
                            <Paperclip size={18} />
                        </button>
                    </div>
                </div>

                <button 
                   onClick={handleSend}
                   disabled={isAnalyzing}
                   className={`w-56 bg-gradient-to-br from-[#7bd0ff] to-[#006bb8] hover:brightness-110 rounded-2xl flex flex-col items-center justify-center p-5 group transition-all duration-500 active:scale-95 shadow-xl shadow-blue-500/20 border border-white/20 relative overflow-hidden ${
                       isAnalyzing ? 'opacity-50 grayscale' : ''
                   }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {isAnalyzing ? (
                        <>
                            <Loader2 size={24} className="text-slate-900 mb-2 animate-spin relative z-10" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-slate-900 uppercase relative z-10">SYNCING...</span>
                        </>
                    ) : (
                        <>
                            <Send size={24} className="text-slate-900 mb-2 transform group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-500 relative z-10" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-slate-900 uppercase relative z-10">INITIATE TRIAGE</span>
                        </>
                    )}
                </button>
            </div>

            {/* Analysis Overlay */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#7bd0ff]/5 backdrop-blur-[4px] pointer-events-none flex flex-col items-center justify-center z-20"
                    >
                        <div className="text-[11px] font-black tracking-[0.8em] text-[#7bd0ff] uppercase animate-pulse mb-2">
                            MODULATING NEURAL CORE
                        </div>
                        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                className="w-full h-full bg-gradient-to-r from-transparent via-[#7bd0ff] to-transparent"
                             />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default IncidentInput;
