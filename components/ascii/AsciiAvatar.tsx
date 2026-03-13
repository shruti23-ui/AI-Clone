'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chatStore';

const AVATAR_URL = '/avatar/avatar.glb';
// ASCII density palette: space=transparent bg, then light→dark
const CHARS = ' .1vVyY0bBdD';
const COLS   = 72;
const ROWS   = 52;
// background color of TalkingHead canvas is near-black; skip those pixels
const BG_THRESHOLD = 18; // luma < this → background → space

function loadTalkingHeadClass(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).__TalkingHead) { resolve((window as any).__TalkingHead); return; }
    const id = '__th_loader__';
    if (document.getElementById(id)) {
      const poll = setInterval(() => {
        if ((window as any).__TalkingHead) { clearInterval(poll); resolve((window as any).__TalkingHead); }
      }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error('timeout')); }, 20000);
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
    script.onerror = (e) => reject(new Error('load failed: ' + e));
    document.head.appendChild(script);
    setTimeout(() => reject(new Error('timeout')), 20000);
  });
}

function pixelsToAscii(ctx: CanvasRenderingContext2D, srcCanvas: HTMLCanvasElement): string {
  ctx.drawImage(srcCanvas, 0, 0, COLS, ROWS);
  const { data } = ctx.getImageData(0, 0, COLS, ROWS);
  let out = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = (r * COLS + c) * 4;
      const luma = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
      if (luma < BG_THRESHOLD) { out += ' '; continue; }
      // Invert: bright pixels (skin/hair) → denser chars
      const idx = Math.floor((luma / 255) * (CHARS.length - 2)) + 1;
      out += CHARS[Math.min(idx, CHARS.length - 1)];
    }
    out += '\n';
  }
  return out;
}

interface Props {
  onReady?: () => void;
  onAudioUnlock?: () => void;
}

export default function AsciiAvatar({ onReady, onAudioUnlock }: Props) {
  const hiddenRef  = useRef<HTMLDivElement>(null);  // TalkingHead renders here (invisible)
  const offscreen  = useRef<HTMLCanvasElement | null>(null);
  const offCtx     = useRef<CanvasRenderingContext2D | null>(null);
  const headRef    = useRef<any>(null);
  const rafRef     = useRef<number>(0);
  const introPlayed = useRef(false);
  const [ascii, setAscii]     = useState('');
  const [ready, setReady]     = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { registerSpeakFn, setSpeaking } = useChatStore();

  // setup offscreen canvas for pixel reading
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = COLS; c.height = ROWS;
    offscreen.current = c;
    offCtx.current = c.getContext('2d', { willReadFrequently: true });
  }, []);

  // Init TalkingHead
  useEffect(() => {
    if (!hiddenRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const TalkingHead = await loadTalkingHeadClass();
        if (cancelled) return;
        const head = new TalkingHead(hiddenRef.current, {
          ttsEndpoint: '/api/gtts',
          lipsyncModules: ['en'],
          cameraView: 'upper',
          modelPixelRatio: 0.5,
          modelFPS: 25,
        });
        headRef.current = head;
        await head.showAvatar(
          { url: AVATAR_URL, body: 'F', avatarMood: 'happy',
            ttsLang: 'en-US', ttsVoice: 'en-US-Neural2-F', lipsyncLang: 'en' },
        );
        if (cancelled) return;

        // inject viseme aliases → mouthOpen for lip sync
        const mo = head.mtAvatar?.mouthOpen;
        if (mo?.ms?.length) {
          const tmpl = { ...mo, value:0, base:0, applied:0, needsUpdate:true };
          ['aa','E','I','O','U','PP','SS','TH','DD','FF','kk','nn','RR','CH','sil'].forEach(v => {
            head.mtAvatar['viseme_'+v] = { ...tmpl };
          });
        }

        registerSpeakFn((text: string) => {
          head.audioCtx?.resume();
          setSpeaking(true);
          head.speakText(text, {}, () => setSpeaking(false));
        });

        setReady(true);
        onReady?.();

        // RAF loop: canvas → ASCII
        const tick = () => {
          if (cancelled) return;
          const glCanvas = hiddenRef.current?.querySelector('canvas') as HTMLCanvasElement;
          if (glCanvas && offCtx.current) {
            try {
              setAscii(pixelsToAscii(offCtx.current, glCanvas));
            } catch {}
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.error('[AsciiAvatar]', e);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      headRef.current?.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = useCallback(() => {
    if (audioUnlocked) return;
    setAudioUnlocked(true);
    setAudioUnlocked(true);
    headRef.current?.audioCtx?.resume();
    onAudioUnlock?.();
    if (!introPlayed.current && headRef.current) {
      introPlayed.current = true;
      setTimeout(() => {
        setSpeaking(true);
        headRef.current.speakText(
          "Hi! I'm Shruti Priya. Ask me anything about my work, projects, or research.",
          {}, () => setSpeaking(false)
        );
      }, 300);
    }
  }, [audioUnlocked, onAudioUnlock, setSpeaking]);

  return (
    <div onClick={unlock} style={{ cursor: 'default', position: 'relative' }}>
      {/* Hidden TalkingHead renderer */}
      <div ref={hiddenRef} style={{
        position: 'absolute', top: -9999, left: -9999,
        width: 480, height: 480, opacity: 0, pointerEvents: 'none',
      }} />

      {/* ASCII art output */}
      <pre style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 'clamp(7px, 1.1vw, 11px)',
        lineHeight: 1.18,
        color: '#1a1a1a',
        letterSpacing: '0.05em',
        margin: 0,
        userSelect: 'none',
        minHeight: `${ROWS * 1.18}em`,
        whiteSpace: 'pre',
      }}>
        {ascii || (ready ? '' : '         loading...')}
      </pre>

      {/* Audio prompt */}
      {ready && !audioUnlocked && (
        <div style={{
          position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, fontFamily: 'monospace', color: '#555',
          whiteSpace: 'nowrap', cursor: 'pointer',
        }}>
          ▶ click to enable audio
        </div>
      )}
    </div>
  );
}
