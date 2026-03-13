'use client';

import { useRef, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chatStore';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSTT(onResult: (transcript: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { setListening } = useChatStore();

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('[STT] Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      console.warn('[STT] Error:', e.error);
      setListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) onResult(transcript.trim());
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [onResult, setListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, [setListening]);

  return { startListening, stopListening };
}
