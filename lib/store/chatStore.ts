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

  speakFn: ((text: string) => void) | null;
  stopFn: (() => void) | null;
  registerSpeakFn: (fn: (text: string) => void) => void;
  registerStopFn: (fn: () => void) => void;
  stopSpeaking: () => void;

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
        "Hello! I'm Shruti's AI clone — a digital version of her. I'm an AI and machine learning engineer at National Institute of Technology Jamshedpur, India, driven by curiosity, research, and the desire to build systems that solve meaningful real-world problems — from medical imaging in Greece to generative AI in the US. Feel free to ask me anything, explore her GitHub, connect through email or LinkedIn, or check out her portfolio!",
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  speakFn: null,
  stopFn: null,

  registerSpeakFn: (fn) => set({ speakFn: fn }),
  registerStopFn: (fn) => set({ stopFn: fn }),
  stopSpeaking: () => {
    const { stopFn } = useChatStore.getState();
    stopFn?.();
    set({ isSpeaking: false });
  },

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
