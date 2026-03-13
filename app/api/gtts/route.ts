// TTS proxy for TalkingHead.
// Priority: ElevenLabs → Cartesia → Google TTS → OpenAI TTS
// TalkingHead sends SSML with <mark> tags and expects:
//   { audioContent: "<base64>", timepoints: [{ markName, timeSeconds }] }

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function parseMarks(ssml: string): string[] {
  return [...ssml.matchAll(/<mark name='(\d+)'\/>/g)].map(m => m[1]);
}

function wavDuration(buf: ArrayBuffer): number {
  try {
    const view = new DataView(buf);
    const byteRate = view.getUint32(28, true);
    const dataSize = view.getUint32(40, true);
    if (byteRate > 0) return dataSize / byteRate;
  } catch {}
  return 0;
}

function syntheticTimepoints(marks: string[], durationSec: number) {
  const n = marks.length + 1;
  return marks.map((markName, i) => ({
    markName,
    timeSeconds: parseFloat(((durationSec * (i + 1)) / n).toFixed(4)),
  }));
}

function estimateDurationFromText(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, (wordCount / 150) * 60);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ssml: string      = body?.input?.ssml ?? '';
    const plainText: string = body?.input?.text ?? body?.text ?? '';
    const text = plainText || ssml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const marks = parseMarks(ssml);

    // ── 1. ElevenLabs (PRIMARY — natural female voice) ────────────────────────
    const elevenKey   = process.env.ELEVENLABS_API_KEY;
    const elevenVoice = 'YBUy3hgxByXQkFaPha1c';

    if (elevenKey) {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoice}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
          }),
        });
        if (res.ok) {
          const audioBuffer = await res.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          const dur = estimateDurationFromText(text);
          const timepoints = syntheticTimepoints(marks, dur);
          console.log(`[/api/gtts] ElevenLabs OK — ${audioBuffer.byteLength}B, ~${dur.toFixed(2)}s`);
          return NextResponse.json({ audioContent: base64Audio, timepoints });
        }
        const errText = await res.text();
        console.warn('[/api/gtts] ElevenLabs failed:', res.status, errText);
      } catch (e) {
        console.warn('[/api/gtts] ElevenLabs error:', e);
      }
    }

    // ── 2. Cartesia (voice clone — fallback) ──────────────────────────────────
    const cartesiaKey   = process.env.CARTESIA_API_KEY;
    const cartesiaVoice = process.env.CARTESIA_VOICE_ID ?? 'ad0d748e-d6ac-4373-ac45-790634a1c0d1';

    if (cartesiaKey) {
      try {
        const res = await fetch('https://api.cartesia.ai/tts/bytes', {
          method: 'POST',
          headers: {
            'Cartesia-Version': '2025-04-16',
            'X-API-Key': cartesiaKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: 'sonic-3',
            transcript: text,
            voice: { mode: 'id', id: cartesiaVoice },
            output_format: { container: 'mp3', bit_rate: 128000, sample_rate: 44100 },
            speed: 'normal',
          }),
        });
        if (res.ok) {
          const audioBuffer = await res.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          const dur = estimateDurationFromText(text);
          const timepoints = syntheticTimepoints(marks, dur);
          console.log(`[/api/gtts] Cartesia OK — ${audioBuffer.byteLength}B`);
          return NextResponse.json({ audioContent: base64Audio, timepoints });
        }
        console.warn('[/api/gtts] Cartesia failed:', res.status);
      } catch (e) {
        console.warn('[/api/gtts] Cartesia error:', e);
      }
    }

    // ── 3. Google Cloud TTS ────────────────────────────────────────────────────
    const googleKey = process.env.GOOGLE_TTS_API_KEY;
    if (googleKey) {
      try {
        const res = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
              audioConfig: { audioEncoding: 'MP3' },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.audioContent) {
            const dur = estimateDurationFromText(text);
            const timepoints = syntheticTimepoints(marks, dur);
            console.log('[/api/gtts] Google TTS OK');
            return NextResponse.json({ audioContent: data.audioContent, timepoints });
          }
        }
        console.warn('[/api/gtts] Google TTS failed:', res.status);
      } catch (e) {
        console.warn('[/api/gtts] Google TTS error:', e);
      }
    }

    // ── 4. OpenAI TTS fallback ─────────────────────────────────────────────────
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'tts-1', input: text, voice: 'nova', response_format: 'mp3' }),
        });
        if (res.ok) {
          const audioBuffer = await res.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          const timepoints = syntheticTimepoints(marks, estimateDurationFromText(text));
          console.log('[/api/gtts] OpenAI TTS OK');
          return NextResponse.json({ audioContent: base64Audio, timepoints });
        }
        console.warn('[/api/gtts] OpenAI TTS failed:', res.status);
      } catch (e) {
        console.warn('[/api/gtts] OpenAI TTS error:', e);
      }
    }

    return NextResponse.json({ error: 'All TTS providers failed' }, { status: 502 });
  } catch (error) {
    console.error('[/api/gtts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
