'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import { textToVisemes, LipSyncController } from '@/components/avatar/LipSync';

export function useTTS() {
  const { setSpeaking, setViseme, setAudioElement, stopSpeaking } = useChatStore();

  const speak = useCallback(async (text: string) => {
    stopSpeaking();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        console.warn('[TTS] Request failed:', res.status);
        // Still animate mouth without audio
        runLipSync(text, null);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudioElement(audio);

      // Start lip sync
      const controller = runLipSync(text, audio);

      audio.onended = () => {
        setSpeaking(false);
        setViseme(null);
        setAudioElement(null);
        URL.revokeObjectURL(url);
        controller?.stop();
      };

      audio.onerror = () => {
        setSpeaking(false);
        setViseme(null);
        controller?.stop();
      };

      setSpeaking(true);
      await audio.play();
    } catch (err) {
      console.error('[TTS] Error:', err);
      setSpeaking(false);
      setViseme(null);
    }
  }, [setSpeaking, setViseme, setAudioElement, stopSpeaking]);

  return { speak, stopSpeaking };
}

function runLipSync(text: string, audio: HTMLAudioElement | null): LipSyncController {
  const { setSpeaking, setViseme } = useChatStore.getState();

  const visemes = textToVisemes(text);
  const ctrl = new LipSyncController(visemes, setViseme);

  setSpeaking(true);
  ctrl.start();

  // Auto-stop if no audio (fallback)
  if (!audio) {
    setTimeout(() => {
      setSpeaking(false);
      setViseme(null);
    }, ctrl.totalDuration + 200);
  }

  return ctrl;
}
