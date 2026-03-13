'use client';

import { motion } from 'framer-motion';
import { useChatStore } from '@/lib/store/chatStore';

export default function StatusBar() {
  const { isSpeaking, isListening, isLoading } = useChatStore();

  const getStatus = () => {
    if (isListening) return { label: 'LISTENING', color: 'text-red-400', dot: 'bg-red-400' };
    if (isSpeaking) return { label: 'SPEAKING', color: 'text-cyan-400', dot: 'bg-cyan-400' };
    if (isLoading) return { label: 'PROCESSING', color: 'text-purple-400', dot: 'bg-purple-400' };
    return { label: 'IDLE', color: 'text-slate-500', dot: 'bg-slate-600' };
  };

  const { label, color, dot } = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-6
                 border-b border-white/5 bg-background/80 backdrop-blur-sm"
    >
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
          <div className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
        </div>
        <span className="text-xs font-mono font-medium text-slate-300 tracking-widest">
          SHRUTI<span className="text-cyan-400">.</span>AI
        </span>
      </div>

      {/* Center — Status */}
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dot} ${label !== 'IDLE' ? 'animate-pulse' : ''}`} />
        <span className={`text-[10px] font-mono tracking-widest ${color}`}>{label}</span>
      </div>

      {/* Right — System info */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-slate-600">GPT-4o + RAG</span>
        <span className="text-[10px] font-mono text-slate-600">ElevenLabs TTS</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400/60">LIVE</span>
        </div>
      </div>
    </motion.div>
  );
}
