// TTS via ElevenLabs only — voice ID nc2Vl5hShcxvKJ6EZJEP (strictly, no fallbacks)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function parseMarks(ssml: string): string[] {
  return Array.from(ssml.matchAll(/<mark name='(\d+)'\/>/g), m => m[1]);
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

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'nc2Vl5hShcxvKJ6EZJEP';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ssml: string      = body?.input?.ssml ?? '';
    const plainText: string = body?.input?.text ?? body?.text ?? '';
    const text = plainText || ssml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const marks = parseMarks(ssml);

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) {
      console.error('[TTS] ELEVENLABS_API_KEY is not set in environment');
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    console.log(`[TTS] Requesting ElevenLabs voice ${VOICE_ID} — text length: ${text.length}`);

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
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
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[TTS] ElevenLabs error — status: ${res.status}, body: ${errText}`);
      return NextResponse.json(
        { error: `ElevenLabs TTS failed: ${res.status} — ${errText}` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const dur = estimateDurationFromText(text);
    const timepoints = syntheticTimepoints(marks, dur);

    console.log(`[TTS] ElevenLabs OK — ${audioBuffer.byteLength}B, ~${dur.toFixed(2)}s`);
    return NextResponse.json({ audioContent: base64Audio, timepoints });

  } catch (error) {
    console.error('[TTS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
