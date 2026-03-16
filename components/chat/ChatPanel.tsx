'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/store/chatStore';
import { playClickSound, fetchTTS } from '@/components/avatar/TalkingHeadAvatar';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

const SUGGESTIONS = [
  'Who is Shruti?',
  'What projects has she built?',
  "What's the AI project she built?",
  'Tell me about her international exposure',
];

export default function ChatPanel() {
  const { messages, isLoading, speakFn, unlockFn, addMessage, updateLastMessage, setLoading } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const visibleMessages = messages.filter((m) => m.id !== 'intro');
  const hasMessages     = visibleMessages.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    unlockFn?.(); // unlock HTML5 audio during user gesture
    setInput('');
    addMessage({ role: 'user', content: trimmed });
    addMessage({ role: 'assistant', content: '' });
    setLoading(true);

    try {
      const allMessages = useChatStore.getState().messages;
      const history = allMessages
        .slice(0, -1).filter((m) => m.id !== 'intro').slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error('Chat failed');

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText  = '';
      let prefetchTimer: ReturnType<typeof setTimeout> | null = null;
      let ttsPreFetch: Promise<string | null> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        updateLastMessage(fullText);

        // Pre-fetch TTS when stream seems to be ending (no new chunk in 300ms)
        if (prefetchTimer) clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(() => { ttsPreFetch = fetchTTS(fullText); }, 300);
      }

      if (prefetchTimer) clearTimeout(prefetchTimer);
      const cachedB64 = ttsPreFetch ? await ttsPreFetch : null;
      speakFn?.(fullText, cachedB64);
    } catch {
      updateLastMessage("I'm sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoading, speakFn, addMessage, updateLastMessage, setLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex-none px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ boxShadow: '0 0 6px #22d3ee' }} />
            <span className="font-mono tracking-[0.2em] text-cyan-400/60" style={{ fontSize: 10 }}>
              ASK SHRUTI
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/shruti-priya3112/"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 active:scale-95"
              style={{ border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.65)' }}
              onClick={() => playClickSound()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            {/* Email */}
            <a
              href="https://mail.google.com/mail/?view=cm&to=priyashruti3112@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Email Shruti"
              className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 active:scale-95"
              style={{ border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.65)' }}
              onClick={() => playClickSound()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
            </a>
            {/* GitHub */}
            <a
              href="https://github.com/shruti23-ui"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 active:scale-95"
              style={{ border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.65)' }}
              onClick={() => playClickSound()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
              </svg>
            </a>
            {/* Portfolio */}
            <a
              href="https://shruti23-ui.github.io/Personal-Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono tracking-wider transition-all duration-200 hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-400/10 active:scale-95"
              style={{ fontSize: 11, color: 'rgba(34,211,238,0.9)', border: '1px solid rgba(34,211,238,0.35)', background: 'rgba(34,211,238,0.1)', boxShadow: '0 0 12px rgba(34,211,238,0.08)' }}
              onClick={() => playClickSound()}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
              PORTFOLIO
            </a>
          </div>
        </div>
      </div>

      {/* ── Message list (scrollable) ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(34,211,238,0.2) transparent',
        }}
      >
        {!hasMessages ? (
          /* Suggestion chips when no messages */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2 pt-2"
          >
            <p className="font-mono text-slate-600 tracking-widest text-center mb-3" style={{ fontSize: 10 }}>
              START A CONVERSATION
            </p>
            {SUGGESTIONS.map((q, i) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => { playClickSound(); sendMessage(q); }}
                className="text-left text-[11px] font-mono text-slate-400 px-4 py-2.5 rounded-xl
                           border transition-all duration-200
                           hover:text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/5
                           active:scale-95"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                ↳ {q}
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
          </AnimatePresence>
        )}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick chips when messages exist ── */}
      {hasMessages && (
        <div className="flex-none px-4 py-2 flex flex-wrap gap-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => { playClickSound(); sendMessage(q); }}
              disabled={isLoading}
              className="text-[10px] font-mono text-slate-500 px-2.5 py-1 rounded-full border
                         transition-all duration-200
                         hover:text-cyan-300 hover:border-cyan-400/25 hover:bg-cyan-400/5
                         disabled:opacity-30 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex-none px-4 pb-4 pt-2">
        <div
          className="rounded-2xl flex items-center gap-2 px-4 py-3 transition-all duration-300"
          style={{
            background: 'rgba(8,12,24,0.9)',
            backdropFilter: 'blur(24px)',
            border: input ? '1px solid rgba(34,211,238,0.2)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: input ? '0 0 0 1px rgba(34,211,238,0.06), 0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600
                       outline-none font-mono caret-cyan-400 disabled:opacity-40"
          />

          {/* Enter hint — shown while typing */}
          {input.trim() && (
            <span className="font-mono text-slate-600 shrink-0" style={{ fontSize: 9 }}>↵ enter</span>
          )}

          <MicButton onTranscript={sendMessage} />

          <button
            onClick={() => { playClickSound(); sendMessage(input); }}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                       disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            style={{
              background: input.trim() ? 'rgba(34,211,238,0.18)' : 'rgba(255,255,255,0.04)',
              border: input.trim() ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: input.trim() ? '0 0 12px rgba(34,211,238,0.15)' : 'none',
            }}
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mic button — MediaRecorder + Groq Whisper (works in all browsers incl. Brave) ──
function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [state, setState]  = useState<'idle' | 'listening' | 'processing' | 'unsupported'>('idle');
  const { setListening: setStoreListening } = useChatStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const rafRef           = useRef<number>(0);
  const [bars, setBars]  = useState([0.15, 0.25, 0.15, 0.25, 0.15, 0.25, 0.15]);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setBars([0.15, 0.25, 0.15, 0.25, 0.15, 0.25, 0.15]);
  }, []);

  const startVisualizer = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    analyserRef.current = analyser;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const NUM = 7, step = Math.floor(data.length / NUM);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setBars(Array.from({ length: NUM }, (_, i) => Math.max(0.08, (data[i * step] / 255))));
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const toggle = useCallback(async () => {
    if (state === 'unsupported' || state === 'processing') return;
    playClickSound();

    if (state === 'listening') {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) { setState('unsupported'); return; }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('unsupported');
      return;
    }

    startVisualizer(stream);
    setState('listening');
    setStoreListening(true);
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stopStream();
      setState('processing');
      setStoreListening(false);

      const ext  = mimeType.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const fd   = new FormData();
      fd.append('audio', blob, `rec.${ext}`);

      try {
        const res  = await fetch('/api/transcribe', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.text?.trim()) onTranscript(data.text.trim());
      } catch (e) {
        console.warn('[Mic] transcription failed:', e);
      } finally {
        setState('idle');
      }
    };

    recorder.start();
  }, [state, onTranscript, setStoreListening, startVisualizer, stopStream]);

  // Listening — animated pitch bars
  if (state === 'listening') {
    return (
      <button onClick={toggle} title="Stop recording"
        className="flex items-center gap-0.5 px-2 h-8 rounded-full active:scale-95 transition-all"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 3, height: `${Math.round(h * 20) + 4}px`,
            background: `rgba(248,113,113,${0.5 + h * 0.5})`,
            borderRadius: 2, transition: 'height 0.05s ease', minHeight: 4, maxHeight: 20,
          }} />
        ))}
      </button>
    );
  }

  // Processing — spinner
  if (state === 'processing') {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(139,92,246,0.08)' }}>
        <div className="w-3 h-3 rounded-full border border-t-purple-400 border-purple-400/20 animate-spin" />
      </div>
    );
  }

  // Unsupported
  if (state === 'unsupported') {
    return (
      <button title="Mic not available"
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>
    );
  }

  // Idle
  return (
    <button onClick={toggle} title="Start voice input"
      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    </button>
  );
}
