'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Deep radial gradient base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.04)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,_rgba(139,92,246,0.06)_0%,_transparent_60%)]" />

      {/* Floating orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
                   bg-cyan-500/5 blur-[80px]"
      />
      <motion.div
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full
                   bg-purple-500/5 blur-[80px]"
      />
      <motion.div
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -30, 10, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full
                   bg-pink-500/3 blur-[60px]"
      />

      {/* Scan line */}
      <motion.div
        initial={{ y: '-5%' }}
        animate={{ y: '105%' }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
      />

      {/* Vertical accent lines */}
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent" />
      <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/4 to-transparent" />
    </div>
  );
}
