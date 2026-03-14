'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/store/chatStore';
import { fetchTTS } from '@/components/avatar/TalkingHeadAvatar';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

export default function ChatInterface() {
  const {
    messages,
    isLoading,
    speakFn,
    addMessage,
    updateLastMessage,
    setLoading,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      addMessage({ role: 'user', content: text });
      addMessage({ role: 'assistant', content: '' });
      setLoading(true);

      try {
        const allMessages = useChatStore.getState().messages;
        const chatHistory = allMessages
          .slice(0, -1)
          .filter((m) => m.id !== 'intro' || m.role === 'user')
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatHistory }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
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
      } catch (err) {
        console.error('[Chat]', err);
        updateLastMessage("I'm sorry, I had trouble responding. Please try again!");
      } finally {
        setLoading(false);
      }
    },
    [isLoading, speakFn, addMessage, updateLastMessage, setLoading]
  );

  return (
    <div className="flex flex-col h-full glass rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold">
            SP
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Shruti Priya</p>
          <p className="text-xs text-cyan-400/70 font-mono mt-0.5">
            AI/ML Engineer · Online
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-500 font-mono">RAG ACTIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-3">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
