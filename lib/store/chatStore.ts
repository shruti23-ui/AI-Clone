'use client';

import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;

  // TalkingHead speak function — registered by TalkingHeadAvatar once ready
  speakFn: ((text: string) => void) | null;
  registerSpeakFn: (fn: (text: string) => void) => void;

  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setLoading: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: 'intro',
      role: 'assistant',
      content:
        "I'm Shruti's AI clone — a digital version of her. Shruti is a final-year B.Tech student at NIT Jamshedpur, India, specialising in AI, Machine Learning, and Data Science. She's worked on medical imaging, steel defect detection, generative AI, RAG & LangGraph, and aviation technology. Check out her portfolio at the top, email her at priyashruti3112@gmail.com, or connect on LinkedIn!",
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  speakFn: null,

  registerSpeakFn: (fn) => set({ speakFn: fn }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),

  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content };
      }
      return { messages };
    }),

  setLoading: (v) => set({ isLoading: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setListening: (v) => set({ isListening: v }),
}));
