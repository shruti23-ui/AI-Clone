// D-ID Streaming API proxy
// Actions: create | sdp | ice | speak | close
//
// On first 'create': uploads the avatar image to D-ID's CDN → get public URL
// Then uses that URL to create a WebRTC stream.
// speak: generates ElevenLabs audio → D-ID TTS fallback if localhost

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { storeAudio } from '@/lib/audio-cache';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DID_API  = 'https://api.d-id.com';
const VOICE_ID = 'nc2Vl5hShcxvKJ6EZJEP';

const DID_EMAIL = 'priyashruti3112@gmail.com';
function didAuth() {
  const key = process.env.DID_API_KEY ?? '';
  return `Basic ${Buffer.from(`${DID_EMAIL}:${key}`).toString('base64')}`;
}

function audioBaseUrl() {
  return (
    process.env.DID_AUDIO_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  );
}

// Cache the uploaded D-ID image URL so we only upload once per server process
let cachedAvatarUrl: string | null = null;

async function getAvatarUrl(): Promise<string> {
  if (cachedAvatarUrl) return cachedAvatarUrl;

  console.log('[DID] Uploading avatar image to D-ID CDN...');
  const imagePath = join(process.cwd(), 'public', 'avatar', 'shruti-avatar.png');
  const imageBuffer = await readFile(imagePath);

  const form = new FormData();
  form.append(
    'image',
    new Blob([imageBuffer], { type: 'image/png' }),
    'shruti-avatar.png'
  );

  const res = await fetch(`${DID_API}/images`, {
    method: 'POST',
    headers: { Authorization: didAuth() },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image upload failed ${res.status}: ${err}`);
  }

  const data = await res.json();
  // D-ID returns { url: "https://..." }
  cachedAvatarUrl = data.url as string;
  console.log('[DID] Avatar uploaded:', cachedAvatarUrl);
  return cachedAvatarUrl;
}

async function generateElevenLabsAudio(text: string): Promise<Buffer | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (!res.ok) {
      console.error(`[DID/ElevenLabs] ${res.status}: ${await res.text().catch(() => '')}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error('[DID/ElevenLabs] Exception:', e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const auth = didAuth();

  if (!process.env.DID_API_KEY) {
    return NextResponse.json({ error: 'DID_API_KEY not configured' }, { status: 500 });
  }

  try {
    switch (action) {

      // ── Create WebRTC stream ────────────────────────────────────────────────
      case 'create': {
        // Upload image to D-ID CDN first (cached after first call)
        const avatarUrl = await getAvatarUrl();
        console.log('[DID] Creating stream with avatar:', avatarUrl);

        const res = await fetch(`${DID_API}/talks/streams`, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: avatarUrl,
            config: { stitch: true, result_format: 'mp4' },
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('[DID] Create stream failed:', res.status, err);
          return NextResponse.json({ error: err }, { status: res.status });
        }
        const data = await res.json();
        console.log('[DID] Stream created:', data.id);
        return NextResponse.json(data);
      }

      // ── SDP exchange ────────────────────────────────────────────────────────
      case 'sdp': {
        const res = await fetch(`${DID_API}/talks/streams/${body.id}/sdp`, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: body.answer, session_id: body.session_id }),
        });
        return NextResponse.json(await res.json());
      }

      // ── ICE candidate ───────────────────────────────────────────────────────
      case 'ice': {
        const res = await fetch(`${DID_API}/talks/streams/${body.id}/ice`, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate: body.candidate,
            sdpMid: body.sdpMid,
            sdpMLineIndex: body.sdpMLineIndex,
            session_id: body.session_id,
          }),
        });
        return NextResponse.json(await res.json());
      }

      // ── Speak ───────────────────────────────────────────────────────────────
      case 'speak': {
        const text: string = body.text ?? '';
        if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

        let scriptPayload: object;
        const base = audioBaseUrl();
        const isLocalhost = base.includes('localhost') || base.includes('127.0.0.1');

        if (!isLocalhost) {
          // Production: generate ElevenLabs audio, cache, pass URL to D-ID
          const audioBuffer = await generateElevenLabsAudio(text);
          if (audioBuffer) {
            const audioId = randomUUID();
            storeAudio(audioId, audioBuffer);
            const audioUrl = `${base}/api/audio/${audioId}`;
            console.log('[DID] Using ElevenLabs audio_url:', audioUrl);
            scriptPayload = {
              script: { type: 'audio', audio_url: audioUrl },
              config: { stitch: true },
              session_id: body.session_id,
            };
          } else {
            scriptPayload = {
              script: { type: 'text', input: text, provider: { type: 'microsoft', voice_id: 'en-US-JennyNeural' } },
              config: { stitch: true },
              session_id: body.session_id,
            };
          }
        } else {
          // Localhost: D-ID can't reach us — use D-ID's own TTS for lip sync
          console.log('[DID] Localhost detected — using D-ID TTS (Microsoft Jenny)');
          scriptPayload = {
            script: { type: 'text', input: text, provider: { type: 'microsoft', voice_id: 'en-US-JennyNeural' } },
            config: { stitch: true },
            session_id: body.session_id,
          };
        }

        const res = await fetch(`${DID_API}/talks/streams/${body.id}`, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify(scriptPayload),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('[DID] Speak failed:', res.status, err);
          return NextResponse.json({ error: err }, { status: res.status });
        }
        return NextResponse.json(await res.json());
      }

      // ── Close stream ────────────────────────────────────────────────────────
      case 'close': {
        await fetch(`${DID_API}/talks/streams/${body.id}`, {
          method: 'DELETE',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: body.session_id }),
        }).catch(() => {});
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[DID] Unexpected error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
