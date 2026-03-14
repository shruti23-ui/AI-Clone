'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/lib/store/chatStore';

const INTRO_TEXT =
  "Hello! I'm Shruti's AI clone — a digital version of her. My name is Shruti Priya, and I'm an AI and machine learning engineer at NIT Jamshedpur, India. My journey in technology has been driven by curiosity, research, and the desire to build systems that solve meaningful real-world problems — from medical imaging in Greece to generative AI in the US. Feel free to ask me anything, explore her GitHub from the top, connect through email or LinkedIn, or check out her portfolio!";

type ConnState = 'idle' | 'connecting' | 'ready' | 'error';

export default function DIDAvatar() {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const pcRef        = useRef<RTCPeerConnection | null>(null);
  const streamIdRef  = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const introPlayed  = useRef(false);
  const isSpeakingRef = useRef(false);

  const [connState, setConnState]     = useState<ConnState>('idle');
  const [errorMsg, setErrorMsg]       = useState('');
  const [showPrompt, setShowPrompt]   = useState(false);
  const [isVideoLive, setIsVideoLive] = useState(false);

  const { registerSpeakFn, registerStopFn, setSpeaking } = useChatStore();

  // ── Connect WebRTC stream with D-ID ────────────────────────────────────────
  const connect = useCallback(async (): Promise<boolean> => {
    if (pcRef.current) return true; // already connected
    setConnState('connecting');

    try {
      const res = await fetch('/api/did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const { id, offer, ice_servers, session_id } = await res.json();
      streamIdRef.current  = id;
      sessionIdRef.current = session_id;

      const pc = new RTCPeerConnection({ iceServers: ice_servers });
      pcRef.current = pc;

      // Attach incoming video track
      pc.ontrack = (e) => {
        const stream = e.streams[0];
        if (!stream || !videoRef.current) return;
        videoRef.current.srcObject = stream;

        // Show video only when it has actual pixel data
        stream.getVideoTracks()[0]?.addEventListener('unmute', () => {
          setIsVideoLive(true);
        });
      };

      // D-ID sends stream/done via data channel
      pc.ondatachannel = (e) => {
        e.channel.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.event === 'stream/done' || data.event === 'stream/ready') {
              if (data.event === 'stream/done') {
                setSpeaking(false);
                isSpeakingRef.current = false;
                setIsVideoLive(false);
              }
            }
          } catch {}
        };
      };

      // Forward ICE candidates to D-ID
      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate) return;
        await fetch('/api/did', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ice',
            id,
            session_id,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
          }),
        }).catch(() => {});
      };

      // SDP exchange
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch('/api/did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sdp', id, session_id, answer }),
      });

      setConnState('ready');
      console.log('[DID] Stream ready:', id);
      return true;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error('[DID] Connect error:', msg);
      setErrorMsg(msg);
      setConnState('error');
      return false;
    }
  }, [setSpeaking]);

  // ── Speak via D-ID ─────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (isSpeakingRef.current) return;
    if (!pcRef.current) {
      const ok = await connect();
      if (!ok) return;
    }
    isSpeakingRef.current = true;
    setSpeaking(true);
    setShowPrompt(false);

    try {
      const res = await fetch('/api/did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'speak',
          id: streamIdRef.current,
          session_id: sessionIdRef.current,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.error('[DID] Speak error:', e?.message ?? e);
      setSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, [connect, setSpeaking]);

  const stopSpeaking = useCallback(() => {
    setSpeaking(false);
    isSpeakingRef.current = false;
    setIsVideoLive(false);
  }, [setSpeaking]);

  // ── First click → play intro ────────────────────────────────────────────────
  const handleFirstInteraction = useCallback(() => {
    if (introPlayed.current) return;
    introPlayed.current = true;
    setShowPrompt(false);
    speak(INTRO_TEXT);
  }, [speak]);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    registerSpeakFn(speak);
    registerStopFn(stopSpeaking);

    connect().then((ok) => {
      if (ok) {
        // Try autoplay intro after short delay
        setTimeout(() => {
          if (introPlayed.current) return;
          // Test if autoplay is allowed
          const probe = new Audio();
          const canAuto = probe.play();
          if (canAuto) {
            canAuto
              .then(() => {
                probe.pause();
                introPlayed.current = true;
                speak(INTRO_TEXT);
              })
              .catch(() => setShowPrompt(true));
          } else {
            setShowPrompt(true);
          }
        }, 1000);

        // Document-level first-interaction listener
        const onInteract = () => {
          document.removeEventListener('click', onInteract, true);
          document.removeEventListener('keydown', onInteract, true);
          handleFirstInteraction();
        };
        document.addEventListener('click', onInteract, true);
        document.addEventListener('keydown', onInteract, true);
      }
    });

    return () => {
      if (streamIdRef.current && sessionIdRef.current) {
        fetch('/api/did', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'close',
            id: streamIdRef.current,
            session_id: sessionIdRef.current,
          }),
        }).catch(() => {});
      }
      pcRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>

      {/* D-ID video — fades in when live (has actual animation) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center bottom',
          opacity: isVideoLive ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Loading spinner */}
      {connState === 'connecting' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid rgba(6,182,212,0.2)', borderTop: '2px solid #06b6d4',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: 'rgba(6,182,212,0.4)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.2em', margin: 0 }}>
            CONNECTING
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Click-to-hear prompt */}
      {connState === 'ready' && showPrompt && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
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

      {/* Error state */}
      {connState === 'error' && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(239,68,68,0.55)', fontSize: 10, fontFamily: 'monospace', margin: 0 }}>
            AVATAR OFFLINE — {errorMsg || 'restart dev server & check DID_API_KEY'}
          </p>
        </div>
      )}
    </div>
  );
}
