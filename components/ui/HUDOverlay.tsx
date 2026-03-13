'use client';

import { motion } from 'framer-motion';

export default function HUDOverlay() {
  return (
    <>
      {/* Bottom-left HUD block */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="fixed bottom-6 left-6 z-20 space-y-1 font-mono text-[10px] text-slate-600"
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400/40">◈</span>
          <span>SYSTEM: SHRUTI_CLONE_v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-400/40">◈</span>
          <span>MODEL: GPT-4o + RAG PIPELINE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-pink-400/40">◈</span>
          <span>VOICE: ELEVENLABS TTS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400/40">◈</span>
          <span>RENDERER: THREE.JS + WEBGL</span>
        </div>
      </motion.div>

      {/* Bottom-right — Navigation hints */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="fixed bottom-6 right-6 z-20 text-right font-mono text-[10px] text-slate-600 space-y-1"
      >
        <p>DRAG TO ROTATE AVATAR</p>
        <p>CLICK MIC TO SPEAK</p>
        <p>PRESS ENTER TO SEND</p>
      </motion.div>

      {/* Top-right corner brackets */}
      <div className="fixed top-14 right-4 z-10 w-8 h-8 pointer-events-none">
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400/20" />
      </div>
      <div className="fixed bottom-4 left-4 z-10 w-8 h-8 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400/20" />
      </div>
    </>
  );
}
