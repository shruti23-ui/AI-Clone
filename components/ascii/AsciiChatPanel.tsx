'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import { playClickSound } from '@/components/avatar/TalkingHeadAvatar';

export default function AsciiChatPanel({ convMode, onConvModeChange }:
  { convMode: boolean; onConvModeChange: (v: boolean) => void }) {

  const { messages, isLoading, speakFn, addMessage, updateLastMessage, setLoading } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const visible = messages.filter(m => m.id !== 'intro');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    setInput('');
    addMessage({ role: 'user', content: t });
    addMessage({ role: 'assistant', content: '' });
    setLoading(true);
    try {
      const history = useChatStore.getState().messages
        .slice(0, -1).filter(m => m.id !== 'intro').slice(-12)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let full     = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        updateLastMessage(full);
      }
      speakFn?.(full);
    } catch { updateLastMessage("Sorry, something went wrong."); }
    finally { setLoading(false); }
  }, [isLoading, speakFn, addMessage, updateLastMessage, setLoading]);

  const MONO = '"Courier New", Courier, monospace';

  return (
    <div style={{
      width: '100%', maxWidth: 640,
      border: '1px solid #999', background: '#fff',
      fontFamily: MONO, fontSize: 13,
    }}>
      {/* Messages */}
      <div style={{ maxHeight: 240, overflowY: 'auto', padding: '8px 12px' }}>
        {visible.map(m => (
          <div key={m.id} style={{ marginBottom: 6, lineHeight: 1.4 }}>
            <span style={{ color: '#555', marginRight: 4 }}>{m.role === 'user' ? ':.' : ":''"}</span>
            <span style={{ color: m.role === 'user' ? '#111' : '#222' }}>{m.content || (isLoading ? '...' : '')}</span>
          </div>
        ))}
        {isLoading && (
          <div style={{ color: '#555' }}><span style={{ marginRight: 4 }}>:''</span>...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #ccc' }} />

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8 }}>
        <span style={{ color: '#555' }}>::</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); playClickSound(); send(input); } }}
          placeholder="Ask about Shruti"
          disabled={isLoading}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: MONO, fontSize: 13, color: '#111',
          }}
        />
        <MicBtn onTranscript={send} />
        <button
          onClick={() => { playClickSound(); send(input); }}
          disabled={!input.trim() || isLoading}
          style={{
            background: 'none', border: '1px solid #999', cursor: 'pointer',
            fontFamily: MONO, fontSize: 11, padding: '2px 8px', color: '#333',
          }}
        >send</button>
      </div>

      {/* Conv mode toggle */}
      <div style={{ borderTop: '1px solid #ccc', padding: '6px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.15em', color: '#444' }}>CONVERSATION MODE</span>
        <button
          onClick={() => { playClickSound(); onConvModeChange(!convMode); }}
          style={{
            width: 32, height: 14, padding: 0, border: '1px solid #888',
            background: convMode ? '#333' : '#ccc', cursor: 'pointer', position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: 1, left: convMode ? 17 : 1,
            width: 11, height: 10, background: convMode ? '#fff' : '#666',
            display: 'block', transition: 'left 0.15s',
          }} />
        </button>
        <span style={{ fontSize: 11, color: '#444' }}>{convMode ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
}

function MicBtn({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [on, setOn] = useState(false);
  const recRef = useRef<any>(null);
  const { setListening } = useChatStore();
  const MONO = '"Courier New", Courier, monospace';

  const toggle = async () => {
    playClickSound();
    if (on) { recRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }); } catch { return; }
    const r = new SR();
    recRef.current = r;
    r.lang = 'en-US'; r.interimResults = false;
    r.onstart = () => { setOn(true); setListening(true); };
    r.onend   = () => { setOn(false); setListening(false); };
    r.onerror = () => { setOn(false); setListening(false); };
    r.onresult = (e: any) => { const t = e.results[0]?.[0]?.transcript; if (t) onTranscript(t); };
    r.start();
  };

  return (
    <button onClick={toggle} style={{
      background: 'none', border: '1px solid #999', cursor: 'pointer',
      fontFamily: MONO, fontSize: 11, padding: '2px 6px', color: on ? '#c00' : '#333',
    }}>
      {on ? '■' : '●'}
    </button>
  );
}
