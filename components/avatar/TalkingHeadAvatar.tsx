'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chatStore';

const AVATAR_URL = '/avatar/avatar.glb';
const INTRO_TEXT =
  "Hello! I'm Shruti's AI clone — a digital version of her. My name is Shruti Priya, and I'm an AI and machine learning engineer at NIT Jamshedpur, India. My journey in technology has been driven by curiosity, research, and the desire to build systems that solve meaningful real-world problems — from medical imaging research in Greece to generative AI in the US. Feel free to ask me anything, check out the portfolio, or connect on LinkedIn!";

// Tiny silent WAV — played synchronously on first click to unlock HTML5 Audio permission
// Once this plays during a user gesture, all subsequent async audio.play() calls work
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

type Status = 'loading' | 'ready' | 'error';

// ---------------------------------------------------------------------------
// Click sound
// ---------------------------------------------------------------------------
let _clickCtx: AudioContext | null = null;
export function playClickSound() {
  try {
    if (!_clickCtx) _clickCtx = new AudioContext();
    const ctx = _clickCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

// ---------------------------------------------------------------------------
// TTS fetch
// ---------------------------------------------------------------------------
async function fetchTTS(text: string): Promise<string | null> {
  try {
    const res = await fetch('/api/gtts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error('[TTS] Failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    if (!data.audioContent) {
      console.error('[TTS] No audioContent:', JSON.stringify(data).slice(0, 200));
      return null;
    }
    console.log('[TTS] OK, size:', data.audioContent.length);
    return data.audioContent;
  } catch (e) {
    console.error('[TTS] Exception:', e);
    return null;
  }
}

function playBase64Audio(b64: string, onDone?: () => void): HTMLAudioElement {
  const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
  audio.volume = 1.0;
  audio.onended = () => onDone?.();
  audio.onerror = (e) => { console.error('[Audio] Error:', e); onDone?.(); };
  const p = audio.play();
  if (p) p.catch((e) => { console.error('[Audio] play() rejected:', e); onDone?.(); });
  return audio;
}

// ---------------------------------------------------------------------------
// TalkingHead loader
// ---------------------------------------------------------------------------
function loadTalkingHeadClass(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).__TalkingHead) { resolve((window as any).__TalkingHead); return; }
    const id = '__th_loader__';
    if (document.getElementById(id)) {
      const poll = setInterval(() => {
        if ((window as any).__TalkingHead) { clearInterval(poll); resolve((window as any).__TalkingHead); }
      }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error('TalkingHead timeout')); }, 20000);
      return;
    }
    const script = document.createElement('script');
    script.id = id; script.type = 'module';
    script.textContent = `
      import { TalkingHead } from '/talkinghead/talkinghead.mjs?v=9';
      window.__TalkingHead = TalkingHead;
      window.dispatchEvent(new CustomEvent('talkinghead-ready'));
    `;
    window.addEventListener('talkinghead-ready', () => resolve((window as any).__TalkingHead), { once: true });
    script.onerror = (e) => reject(new Error('Script load failed: ' + e));
    document.head.appendChild(script);
    setTimeout(() => reject(new Error('TalkingHead timeout 20s')), 20000);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TalkingHeadAvatar() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const headRef       = useRef<any>(null);
  const introPlayed   = useRef(false);
  const introCacheRef = useRef<string | null>(null);
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const audioUnlocked = useRef(false); // true once silent WAV has played
  const jawRafRef     = useRef<number | null>(null);

  const [status, setStatus]     = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const { registerSpeakFn, setSpeaking } = useChatStore();

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
  }, []);

  // ── Jaw animation ─────────────────────────────────────────────────────────
  // Fix: use `realtime` field (instant, no easing) instead of `system` field.
  // TalkingHead's `system` uses acc=0.01 rad/s² → ~500ms ramp, too slow for jaw.
  // `realtime` bypasses the exponential smoother and applies values each frame.
  const startJaw = useCallback(() => {
    if (jawRafRef.current) cancelAnimationFrame(jawRafRef.current);
    const t0 = performance.now();
    const tick = () => {
      const h = headRef.current;
      if (h) {
        const t = (performance.now() - t0) / 1000;
        const v = Math.max(0, Math.sin(t * 8) * 0.55 + Math.sin(t * 14) * 0.2) * 0.45;

        // Primary: realtime bypasses TalkingHead's exponential smoothing
        let driven = false;
        for (const key of ['jawOpen', 'mouthOpen']) {
          const entry = h.mtAvatar?.[key];
          if (entry && entry.ms && entry.ms.length > 0) {
            entry.realtime = v;
            entry.needsUpdate = true;
            driven = true;
          }
        }

        // Fallback: write directly to Three.js morphTargetInfluences
        if (!driven && h.morphs) {
          for (const mesh of h.morphs) {
            const dict = mesh.morphTargetDictionary;
            if (!dict) continue;
            for (const key of ['jawOpen', 'mouthOpen', 'Jaw_Open', 'mouth_open']) {
              const idx = dict[key];
              if (idx !== undefined) { mesh.morphTargetInfluences[idx] = v; driven = true; }
            }
          }
        }
      }
      jawRafRef.current = requestAnimationFrame(tick);
    };
    jawRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopJaw = useCallback(() => {
    if (jawRafRef.current) { cancelAnimationFrame(jawRafRef.current); jawRafRef.current = null; }
    const h = headRef.current;
    if (h) {
      for (const key of ['jawOpen', 'mouthOpen']) {
        const entry = h.mtAvatar?.[key];
        if (entry && entry.ms) { entry.realtime = null; entry.needsUpdate = true; }
      }
      if (h.morphs) {
        for (const mesh of h.morphs) {
          const dict = mesh.morphTargetDictionary;
          if (!dict) continue;
          for (const key of ['jawOpen', 'mouthOpen', 'Jaw_Open', 'mouth_open']) {
            const idx = dict[key];
            if (idx !== undefined) mesh.morphTargetInfluences[idx] = 0;
          }
        }
      }
    }
  }, []);

  // ── Unlock HTML5 audio via silent WAV during user gesture ─────────────────
  // This MUST be called synchronously inside a click/keydown handler.
  // Once a silent audio.play() succeeds, sticky activation is set —
  // all subsequent async audio.play() calls on this page work without restriction.
  const unlockHtmlAudio = useCallback((): Promise<void> => {
    if (audioUnlocked.current) return Promise.resolve();
    audioUnlocked.current = true;
    const silent = new Audio(SILENT_WAV);
    silent.volume = 0;
    return silent.play().then(() => {
      console.log('[Audio] HTML5 unlocked via silent WAV');
    }).catch((e) => {
      console.warn('[Audio] Silent unlock failed:', e);
    });
  }, []);

  // ── Play TTS audio (jaw starts immediately, audio when ready) ────────────
  const speak = useCallback((text: string, cachedB64?: string | null) => {
    setSpeaking(true);
    stopCurrent();
    startJaw(); // mouth moves immediately while TTS loads
    headRef.current?.audioCtx?.resume().catch(() => {});

    const doPlay = (b64: string) => {
      audioRef.current = playBase64Audio(b64, () => {
        stopJaw();
        setSpeaking(false);
      });
    };

    if (cachedB64) {
      doPlay(cachedB64);
    } else {
      fetchTTS(text).then((b64) => {
        if (!b64) {
          console.error('[Avatar] TTS failed — no audio. Speaking without voice.');
          // Jaw still moves for estimated duration, then stops
          const wordCount = text.split(' ').length;
          setTimeout(() => { stopJaw(); setSpeaking(false); }, wordCount * 400 + 1000);
          return;
        }
        doPlay(b64);
      });
    }
  }, [setSpeaking, stopCurrent, startJaw, stopJaw]);

  // ── Intro — idempotent ────────────────────────────────────────────────────
  const playIntro = useCallback(() => {
    if (!headRef.current || introPlayed.current) return;
    introPlayed.current = true;
    console.log('[Avatar] Playing intro');
    speak(INTRO_TEXT, introCacheRef.current);
  }, [speak]);

  // ── First interaction: unlock audio then play intro ───────────────────────
  const handleFirstInteraction = useCallback(async () => {
    setShowPrompt(false);
    await unlockHtmlAudio(); // synchronous unlock during user gesture
    playIntro();
  }, [unlockHtmlAudio, playIntro]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        // Pre-fetch intro audio while TalkingHead loads
        fetchTTS(INTRO_TEXT).then((b64) => {
          if (b64) { introCacheRef.current = b64; console.log('[Avatar] Intro pre-cached'); }
          else console.warn('[Avatar] Intro pre-cache failed — will fetch on demand');
        });

        const TalkingHead = await loadTalkingHeadClass();
        if (cancelled) return;

        const head = new TalkingHead(containerRef.current, {
          ttsEndpoint: '/api/gtts',
          lipsyncModules: ['en'],
          cameraView: 'upper',
          modelPixelRatio: window.devicePixelRatio || 1,
          modelFPS: 30,
          modelMovementFactor: 1,
        });
        headRef.current = head;

        await head.showAvatar(
          { url: AVATAR_URL, body: 'F', avatarMood: 'neutral',
            ttsLang: 'en-US', ttsVoice: 'en-US-Neural2-F', lipsyncLang: 'en' },
          (p: number) => console.log('[Avatar] Load:', Math.round(p * 100) + '%')
        );
        if (cancelled) return;

        console.log('[Avatar] Ready');
        setStatus('ready');

        // Mute TalkingHead's own TTS audio
        if (head.audioSpeechGainNode)
          head.audioSpeechGainNode.gain.setValueAtTime(0, head.audioCtx.currentTime);
        if (head.audioBackgroundGainNode)
          head.audioBackgroundGainNode.gain.setValueAtTime(0, head.audioCtx.currentTime);

        // Natural standing pose
        if (head.poseTemplates?.side)
          head.setPoseFromTemplate(head.poseTemplates.side, 500);

        console.log('[Avatar] Mouth morphTargets:',
          Object.keys(head.mtAvatar).filter(k =>
            k.startsWith('jaw') || k.startsWith('mouth') || k.startsWith('viseme')
          )
        );

        // Register speak function for chat responses
        registerSpeakFn((text: string) => {
          speak(text);
        });

        // Try autoplay with real verification
        setTimeout(async () => {
          if (introPlayed.current) return;
          const b64 = introCacheRef.current;
          if (!b64) { setShowPrompt(true); return; }
          try {
            const probe = new Audio(`data:audio/mpeg;base64,${b64}`);
            probe.volume = 1.0;
            await probe.play();
            await new Promise(r => setTimeout(r, 150));
            if (probe.paused || probe.currentTime < 0.01) {
              probe.pause();
              setShowPrompt(true);
              return;
            }
            if (introPlayed.current) { probe.pause(); return; }
            // Autoplay confirmed working
            audioUnlocked.current = true;
            introPlayed.current = true;
            setSpeaking(true);
            startJaw();
            audioRef.current = probe;
            probe.onended = () => { stopJaw(); setSpeaking(false); };
            head.audioCtx?.resume().catch(() => {});
          } catch {
            setShowPrompt(true);
          }
        }, 700);

        // Document-level listener — first click/key anywhere unlocks
        const onInteract = () => {
          document.removeEventListener('click', onInteract, true);
          document.removeEventListener('keydown', onInteract, true);
          handleFirstInteraction();
        };
        document.addEventListener('click', onInteract, true);
        document.addEventListener('keydown', onInteract, true);

      } catch (err: any) {
        console.error('[Avatar] Init error:', err);
        setStatus('error');
        setErrorMsg(err?.message ?? String(err));
      }
    };

    init();
    return () => {
      cancelled = true;
      headRef.current?.stop?.();
      stopCurrent();
      stopJaw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid rgba(6,182,212,0.2)', borderTop: '2px solid #06b6d4',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: 'rgba(6,182,212,0.4)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.2em' }}>
            LOADING AVATAR
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === 'ready' && showPrompt && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: 24, padding: '8px 20px', backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap', animation: 'fadeIn 0.8s ease',
          pointerEvents: 'none', zIndex: 50,
        }}>
          <p style={{ color: 'rgba(6,182,212,0.8)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', margin: 0 }}>
            🔊 CLICK ANYWHERE TO HEAR SHRUTI
          </p>
          <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
        }}>
          <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 11, fontFamily: 'monospace' }}>AVATAR ERROR</p>
          <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: 10, fontFamily: 'monospace', maxWidth: 400, textAlign: 'center' }}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
