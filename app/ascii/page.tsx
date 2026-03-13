'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import AsciiChatPanel from '@/components/ascii/AsciiChatPanel';
import { useChatStore } from '@/lib/store/chatStore';

const AsciiAvatar = dynamic(() => import('@/components/ascii/AsciiAvatar'), { ssr: false });

const MONO = '"Courier New", Courier, monospace';

// Big pixel-block name using CSS — mimics Matthew's ANSI PNG style
function PixelName() {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0 16px', userSelect: 'none' }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 'clamp(20px, 5vw, 56px)',
        fontWeight: 900,
        color: '#000',
        letterSpacing: '0.06em',
        lineHeight: 1.15,
        textShadow: '3px 3px 0 #999',
      }}>
        SHRUTI
      </div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 'clamp(18px, 4.5vw, 50px)',
        fontWeight: 900,
        color: '#000',
        letterSpacing: '0.06em',
        lineHeight: 1.15,
        textShadow: '3px 3px 0 #999',
      }}>
        PRIYA
      </div>
    </div>
  );
}

export default function AsciiPage() {
  const [convMode, setConvMode] = useState(false);
  const isSpeaking  = useChatStore(s => s.isSpeaking);
  const isListening = useChatStore(s => s.isListening);
  const isLoading   = useChatStore(s => s.isLoading);
  const speakFn     = useChatStore(s => s.speakFn);

  // Conversation mode: auto-listen after Shruti speaks
  const convRef = { current: convMode };
  useEffect(() => { convRef.current = convMode; }, [convMode]);

  // Voice auto-loop for conversation mode
  useEffect(() => {
    if (!convMode || isSpeaking || isLoading || isListening) return;
    // After a short pause when conversation mode is on and Shruti just finished — start listening
    const t = setTimeout(() => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR || !convRef.current) return;
      const r = new SR();
      r.lang = 'en-US'; r.interimResults = false;
      r.onresult = (e: any) => {
        const txt = e.results[0]?.[0]?.transcript;
        if (txt && speakFn) {
          // fire chat via sendMessage equivalent
          document.dispatchEvent(new CustomEvent('ascii-voice-input', { detail: txt }));
        }
      };
      r.onerror = () => {};
      try { r.start(); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [convMode, isSpeaking, isLoading, isListening, speakFn]);

  const statusLabel = isListening ? '● LISTENING' : isSpeaking ? '◉ SPEAKING' : isLoading ? '○ THINKING' : '';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#d0ccc4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: MONO,
    }}>
      {/* Name */}
      <PixelName />

      {/* Status */}
      <div style={{ height: 18, fontSize: 11, color: '#555', fontFamily: MONO, letterSpacing: '0.1em', marginBottom: 4 }}>
        {statusLabel}
      </div>

      {/* ASCII Avatar */}
      <div style={{ marginBottom: 24 }}>
        <AsciiAvatar />
      </div>

      {/* Chat */}
      <AsciiChatPanel convMode={convMode} onConvModeChange={setConvMode} />

      {/* Footer */}
      <div style={{ marginTop: 24, marginBottom: 16, fontSize: 10, color: '#888', fontFamily: MONO }}>
        shruti.ai · AI Engineer · NIT Jamshedpur
      </div>
    </div>
  );
}
