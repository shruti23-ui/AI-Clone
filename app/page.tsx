'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import ChatPanel from '@/components/chat/ChatPanel';

const TalkingHeadAvatar = dynamic(
  () => import('@/components/avatar/TalkingHeadAvatar'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-400/30 text-[10px] font-mono tracking-[0.3em]">LOADING</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const isSpeaking = useChatStore((s) => s.isSpeaking);

  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col" style={{ background: '#04070f' }}>
      {/* Animated particle background */}
      <ParticleField />

      {/* Radial glow behind avatar */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse 55% 65% at 35% 55%, rgba(6,182,212,0.07) 0%, transparent 70%)',
      }} />

      {/* Fine grid overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* ── Top bar ── */}
      <TopBar isSpeaking={isSpeaking} />

      {/* ── Main content (below top bar) ── */}
      <div className="flex flex-1 min-h-0 pt-14">

        {/* ── Left: Avatar section ── */}
        <div className="relative flex-1 min-w-0 flex flex-col">

          {/* Name + tagline */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
            className="absolute top-5 left-0 right-0 z-10 flex flex-col items-center pointer-events-none"
          >
            <h1 className="pixel-name tracking-[0.18em]" style={{ fontSize: 'clamp(20px, 3.2vw, 52px)', lineHeight: 1.1 }}>
              <span style={{ color: '#e2e8f0' }}>SHRUTI </span>
              <span style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.45))' }}>PRIYA</span>
            </h1>
            {/* AI & ML Engineer badge */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="font-mono tracking-[0.25em] uppercase"
                style={{ fontSize: 'clamp(8px, 0.85vw, 11px)', color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>
                AI
              </span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 10 }}>&</span>
              <span className="font-mono tracking-[0.25em] uppercase"
                style={{ fontSize: 'clamp(8px, 0.85vw, 11px)', color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>
                ML Engineer
              </span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 9, margin: '0 4px' }}>·</span>
              <span className="font-mono tracking-[0.2em] uppercase"
                style={{ fontSize: 'clamp(7px, 0.7vw, 9px)', color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>Researcher</span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 9, margin: '0 4px' }}>·</span>
              <span className="font-mono tracking-[0.2em] uppercase"
                style={{ fontSize: 'clamp(7px, 0.7vw, 9px)', color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>Builder</span>
            </div>
          </motion.div>

          {/* Blue circles — only when speaking */}
          {isSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              {[1.0, 1.22, 1.48].map((scale, i) => (
                <div key={i} className="absolute rounded-full animate-ping" style={{
                  width: `${scale * 38}vmin`, height: `${scale * 38}vmin`,
                  border: `2px solid rgba(34,211,238,${0.6 - i * 0.15})`,
                  boxShadow: `0 0 40px rgba(34,211,238,${0.35 - i * 0.08})`,
                  animationDuration: `${1.4 + i * 0.5}s`,
                  animationDelay: `${i * 0.18}s`,
                }} />
              ))}
            </div>
          )}

          {/* 3D Avatar — fills entire left section */}
          <div className="absolute inset-0 z-0">
            <TalkingHeadAvatar />
          </div>

        </div>

        {/* ── Right: Chat sidebar ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.45 }}
          className="relative flex flex-col h-full z-20"
          style={{
            width: 'clamp(320px, 36vw, 460px)',
            background: 'rgba(4,7,15,0.72)',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <ChatPanel />
        </motion.div>
      </div>
    </main>
  );
}

// ── Floating particle field ───────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 75 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r:  Math.random() * 1.3 + 0.3,
      a:  Math.random() * 0.3 + 0.04,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ isSpeaking }: { isSpeaking: boolean }) {
  const isLoading   = useChatStore((s) => s.isLoading);
  const isListening = useChatStore((s) => s.isListening);

  const status = isListening ? { label: 'LISTENING', color: '#f87171', dot: '#ef4444' }
    : isSpeaking              ? { label: 'SPEAKING',  color: '#22d3ee', dot: '#06b6d4' }
    : isLoading               ? { label: 'THINKING',  color: '#a78bfa', dot: '#8b5cf6' }
    :                           { label: 'STANDBY',   color: '#334155', dot: '#1e293b' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="absolute top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-6"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(4,7,15,0.85)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <span className="font-mono tracking-widest" style={{ fontSize: 10, color: '#334155' }}>
        SHRUTI<span style={{ color: 'rgba(34,211,238,0.5)' }}>.</span>AI
      </span>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="w-1.5 h-1.5 rounded-full"
          style={{
            background: status.dot,
            boxShadow: status.label !== 'STANDBY' ? `0 0 6px ${status.dot}` : 'none',
            animation: status.label !== 'STANDBY' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
        <span className="font-mono tracking-[0.2em]" style={{ fontSize: 10, color: status.color }}>
          {status.label}
        </span>
      </div>

      <span className="font-mono tracking-widest" style={{ fontSize: 10, color: '#1e293b' }}>
        RAG · TTS · AI
      </span>
    </motion.div>
  );
}
