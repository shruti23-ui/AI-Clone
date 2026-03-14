'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import ChatPanel from '@/components/chat/ChatPanel';

const TalkingHeadAvatar = dynamic(
  () => import('@/components/avatar/TalkingHeadAvatar'),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(6,182,212,0.2)', borderTop: '2px solid #06b6d4', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(6,182,212,0.3)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em' }}>LOADING</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    ),
  }
);


export default function Home() {
  const isSpeaking = useChatStore((s) => s.isSpeaking);

  return (
    <main
      style={{
        position: 'relative',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#04070f',
      }}
    >
      {/* Ambient layers — behind everything */}
      <ParticleField />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.15) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse 90% 90% at 40% 50%, black 10%, transparent 100%)',
        opacity: 0.5,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 55% 70% at 35% 60%, rgba(6,182,212,0.08) 0%, transparent 72%)',
      }} />

      {/* Top bar — sits above everything */}
      <TopBar isSpeaking={isSpeaking} />

      {/*
        ─────────────────────────────────────────────────────────────────────
        MAIN CONTENT
        Two columns, flex row, sits below the 56px top bar.
        LEFT:  flex column — hero text (normal flow) + avatar (flex-1)
        RIGHT: chat panel (fixed width)
        ─────────────────────────────────────────────────────────────────────
      */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        paddingTop: 56, /* top bar height */
      }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>

          {/* Subtle top gradient so text stays readable over the avatar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 160,
            background: 'linear-gradient(to bottom, rgba(4,7,15,0.82) 0%, transparent 100%)',
            pointerEvents: 'none', zIndex: 5,
          }} />

          {/*
            HERO TEXT — absolute at the top, z-index 10 (above avatar z-index 1).
            Avatar fills the full column height — no more zoom/crop.
          */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              zIndex: 10,
              padding: '22px 24px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <h1 style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(20px, 3.2vw, 52px)',
              fontWeight: 700,
              letterSpacing: '0.18em',
              lineHeight: 1.1,
              margin: 0,
              color: '#e2e8f0',
              textAlign: 'center',
            }}>
              <span style={{ color: '#e2e8f0' }}>SHRUTI </span>
              <span style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.45))' }}>PRIYA</span>
            </h1>

            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'monospace', letterSpacing: '0.25em', textTransform: 'uppercase',
                fontSize: 'clamp(8px, 0.85vw, 11px)',
                color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)',
              }}>AI</span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 10 }}>&amp;</span>
              <span style={{
                fontFamily: 'monospace', letterSpacing: '0.25em', textTransform: 'uppercase',
                fontSize: 'clamp(8px, 0.85vw, 11px)',
                color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)',
              }}>ML Engineer</span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 9, margin: '0 2px' }}>·</span>
              <span style={{
                fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase',
                fontSize: 'clamp(7px, 0.7vw, 9px)',
                color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)',
              }}>Researcher</span>
              <span style={{ color: 'rgba(34,211,238,0.35)', fontSize: 9, margin: '0 2px' }}>·</span>
              <span style={{
                fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase',
                fontSize: 'clamp(7px, 0.7vw, 9px)',
                color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.5)',
              }}>Builder</span>
            </div>
          </motion.div>

          {/* AVATAR — fills the entire left column, z-index 1 (text floats above at z-10) */}
          <div style={{
            position: 'absolute', inset: 0,
            zIndex: 1,
          }}>

            {/* Speaking circles — rendered behind Three.js canvas (z-index 0) */}
            <AnimatePresence>
              {isSpeaking && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', zIndex: 0,
                }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        width: `${(1.0 + i * 0.26) * 38}vmin`,
                        height: `${(1.0 + i * 0.26) * 38}vmin`,
                        border: `${2.5 - i * 0.5}px solid rgba(34,211,238,${0.7 - i * 0.18})`,
                        boxShadow: `0 0 44px 4px rgba(34,211,238,${0.35 - i * 0.09}), inset 0 0 24px rgba(34,211,238,${0.07})`,
                      }}
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{
                        opacity: [0, 0.65 - i * 0.16, 0],
                        scale: [0.85, 1.2 + i * 0.16, 1.5 + i * 0.2],
                      }}
                      exit={{ opacity: 0, scale: 0.75 }}
                      transition={{
                        duration: 1.8 + i * 0.45,
                        repeat: Infinity,
                        ease: 'easeOut',
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* 3D Avatar — fills the avatar section, z-index 1 (above circles) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <TalkingHeadAvatar />
            </div>

          </div>
          {/* END avatar section */}

        </div>
        {/* END left column */}

        {/* ── RIGHT COLUMN: Chat panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.45 }}
          style={{
            width: 'clamp(340px, 38vw, 480px)',
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            zIndex: 20,
            background: 'rgba(4,7,15,0.78)',
            backdropFilter: 'blur(28px)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 2px 0 40px rgba(6,182,212,0.03)',
          }}
        >
          <ChatPanel />
        </motion.div>

      </div>
      {/* END main content */}

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

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.2 + 0.25,
      a: Math.random() * 0.22 + 0.04,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
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

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ isSpeaking }: { isSpeaking: boolean }) {
  const isLoading = useChatStore((s) => s.isLoading);
  const isListening = useChatStore((s) => s.isListening);

  const status = isListening ? { label: 'LISTENING', color: '#f87171', dot: '#ef4444' }
    : isSpeaking             ? { label: 'SPEAKING',  color: '#22d3ee', dot: '#06b6d4' }
    : isLoading              ? { label: 'THINKING',  color: '#a78bfa', dot: '#8b5cf6' }
    :                          { label: 'STANDBY',   color: '#334155', dot: '#1e293b' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 30, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(4,7,15,0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.85)',
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.22em', color: '#e2e8f0',
        }}>
          SHRUTI<span style={{ color: '#22d3ee' }}>.</span>AI
        </span>
      </div>

      {/* Status pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 14px', borderRadius: 99,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          display: 'inline-block',
          background: status.dot,
          boxShadow: status.label !== 'STANDBY' ? `0 0 6px ${status.dot}` : 'none',
          animation: status.label !== 'STANDBY' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      {/* Stack pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {['RAG', 'TTS', 'LLM'].map((pill) => (
          <span key={pill} style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em',
            color: 'rgba(34,211,238,0.42)',
            background: 'rgba(34,211,238,0.04)',
            border: '1px solid rgba(34,211,238,0.1)',
            borderRadius: 4, padding: '2px 8px',
          }}>
            {pill}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
