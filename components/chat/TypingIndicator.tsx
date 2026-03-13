'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-2.5"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
        S
      </div>

      {/* Typing bubble */}
      <div className="bg-gradient-to-br from-cyan-950/60 to-purple-950/60 border border-cyan-500/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
      </div>

      {/* Processing label */}
      <span className="text-xs font-mono text-slate-500 animate-pulse">thinking…</span>
    </motion.div>
  );
}
