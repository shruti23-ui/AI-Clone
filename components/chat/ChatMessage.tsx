'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/store/chatStore';

interface Props {
  message: Message;
}

type HindiState = 'idle' | 'loading' | 'playing';

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const [hindiState, setHindiState] = useState<HindiState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleHindi = useCallback(async () => {
    if (hindiState === 'playing') {
      audioRef.current?.pause();
      audioRef.current = null;
      setHindiState('idle');
      return;
    }
    if (hindiState === 'loading' || !message.content?.trim()) return;

    setHindiState('loading');
    try {
      const res = await fetch('/api/sarvam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });
      if (!res.ok) throw new Error('Sarvam failed');
      const data = await res.json();
      if (!data.audioContent) throw new Error('No audio');

      const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`);
      audioRef.current = audio;
      setHindiState('playing');
      audio.onended = () => { audioRef.current = null; setHindiState('idle'); };
      audio.onerror = () => { audioRef.current = null; setHindiState('idle'); };
      await audio.play();
    } catch (e) {
      console.error('[Hindi]', e);
      setHindiState('idle');
    }
  }, [hindiState, message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${isUser
          ? 'bg-slate-700 text-slate-300'
          : 'bg-gradient-to-br from-cyan-400 to-purple-600 text-white'
        }`}
      >
        {isUser ? 'You' : 'S'}
      </div>

      {/* Bubble + Hindi button */}
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed w-full
            ${isUser
              ? 'bg-slate-700/60 text-slate-200 rounded-tr-sm'
              : 'bg-gradient-to-br from-cyan-950/60 to-purple-950/60 border border-cyan-500/10 text-slate-100 rounded-tl-sm'
            }`}
        >
          {message.content ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-cyan-300 font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-black/30 rounded px-1 py-0.5 font-mono text-xs text-cyan-300">
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse rounded-sm" />
          )}

          {/* Timestamp */}
          <p className={`text-[10px] mt-1.5 font-mono opacity-30 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Hindi listen button — assistant messages only */}
        {!isUser && message.content && (
          <button
            onClick={handleHindi}
            disabled={hindiState === 'loading'}
            title={hindiState === 'playing' ? 'Stop Hindi audio' : 'Listen in Hindi'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontSize: 10,
              letterSpacing: '0.05em',
              border: hindiState === 'playing'
                ? '1px solid rgba(251,146,60,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              color: hindiState === 'playing' ? 'rgba(251,146,60,0.9)' : 'rgba(148,163,184,0.5)',
              background: hindiState === 'playing' ? 'rgba(251,146,60,0.08)' : 'transparent',
            }}
          >
            {hindiState === 'loading' && (
              <>
                <div className="w-2.5 h-2.5 rounded-full border border-t-orange-400 border-orange-400/20 animate-spin" />
                <span>अनुवाद...</span>
              </>
            )}
            {hindiState === 'playing' && (
              <>
                <span className="flex items-end gap-px" style={{ height: 12 }}>
                  {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
                    <span key={i} className="w-0.5 rounded-sm bg-orange-400 inline-block"
                      style={{
                        height: `${h * 100}%`,
                        animation: `hindiBar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </span>
                <span>हिंदी बंद करें</span>
                <style>{`@keyframes hindiBar { from { opacity: 0.4; transform: scaleY(0.5); } to { opacity: 1; transform: scaleY(1); } }`}</style>
              </>
            )}
            {hindiState === 'idle' && (
              <>
                <span>🇮🇳</span>
                <span>हिंदी में सुनें</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
