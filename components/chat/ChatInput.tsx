'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/store/chatStore';
import { useSTT } from '@/lib/hooks/useSTT';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, isSpeaking, stopSpeaking } = useChatStore();

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
      textareaRef.current?.focus();
    },
    [disabled, onSend]
  );

  const { startListening, stopListening } = useSTT(handleSend);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(value);
    }
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const suggestions = [
    'Who is Shruti?',
    'Tell me about her work at MadScientist, USA',
    'What did she research at TU Crete, Greece?',
    'What is the Steel Defect Detection project?',
  ];

  return (
    <div className="space-y-2">
      {/* Quick suggestion chips */}
      {value.length === 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={disabled}
              className="text-[10px] font-mono px-2 py-1 rounded-full border border-cyan-500/20
                         text-cyan-400/70 hover:text-cyan-300 hover:border-cyan-400/50
                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isListening}
            placeholder={isListening ? 'Listening…' : 'Ask me anything…'}
            rows={1}
            className="w-full resize-none bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5
                       text-sm text-slate-200 placeholder-slate-500 outline-none
                       focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       max-h-32 overflow-y-auto font-sans"
            style={{ lineHeight: '1.5' }}
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-cyan-400 wave-bar"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mic button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMic}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isListening
              ? 'bg-red-500/20 border border-red-500/50 text-red-400'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'
            }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <MicIcon isListening={isListening} />
        </motion.button>

        {/* Send / Stop button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isSpeaking) stopSpeaking();
            else handleSend(value);
          }}
          disabled={!isSpeaking && (!value.trim() || disabled)}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${isSpeaking
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          title={isSpeaking ? 'Stop speaking' : 'Send message'}
        >
          {isSpeaking ? <StopIcon /> : <SendIcon />}
        </motion.button>
      </div>
    </div>
  );
}

function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {isListening ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
          <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
