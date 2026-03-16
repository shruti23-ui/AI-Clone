// Sarvam AI — Hindi translation + TTS
// Flow: English text → Sarvam translate → Hindi text → Sarvam TTS → base64 WAV

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SARVAM_KEY = process.env.SARVAM_API_KEY!;

async function translateToHindi(text: string): Promise<string> {
  // Sarvam supports max ~1000 chars per request — chunk if needed
  const chunks = chunkText(text, 900);
  const translated: string[] = [];

  for (const chunk of chunks) {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: chunk,
        source_language_code: 'en-IN',
        target_language_code: 'hi-IN',
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Sarvam translate error ${res.status}: ${err}`);
    }

    const data = await res.json();
    translated.push(data.translated_text ?? chunk);
  }

  return translated.join(' ');
}

async function hindiTTS(text: string): Promise<string> {
  // Sarvam TTS supports max ~500 chars per input item
  const chunks = chunkText(text, 450);

  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: chunks,
      target_language_code: 'hi-IN',
      speaker: 'anushka',
      pitch: 0,
      pace: 1.4,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: false,
      model: 'bulbul:v2',
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Sarvam TTS error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.audios?.length) throw new Error('Sarvam TTS returned no audio');

  // If multiple chunks, concatenate the WAV PCM data
  if (data.audios.length === 1) return data.audios[0];
  return concatWavBase64(data.audios);
}

// Split text at sentence boundaries to stay under Sarvam's char limit
function chunkText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur) { chunks.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

// Concatenate multiple WAV base64 strings (strips all headers except first)
function concatWavBase64(wavB64Array: string[]): string {
  const buffers = wavB64Array.map((b64) => Buffer.from(b64, 'base64'));
  // WAV header is 44 bytes; keep first header, append PCM data from rest
  const first = buffers[0];
  const rest = buffers.slice(1).map((b) => b.slice(44));
  const totalPcm = rest.reduce((s, b) => s + b.length, first.slice(44).length);
  const combined = Buffer.alloc(44 + totalPcm);
  first.copy(combined, 0, 0, 44); // copy header
  // Update data chunk size in header
  combined.writeUInt32LE(totalPcm, 40);
  combined.writeUInt32LE(36 + totalPcm, 4);
  let offset = 44;
  first.copy(combined, offset, 44); offset += first.length - 44;
  for (const r of rest) { r.copy(combined, offset); offset += r.length; }
  return combined.toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'No text' }, { status: 400 });

    if (!SARVAM_KEY) {
      console.error('[Sarvam] SARVAM_API_KEY not set');
      return NextResponse.json({ error: 'SARVAM_API_KEY not configured' }, { status: 500 });
    }

    // Limit to first ~500 chars (2-3 sentences) to stay within timeout + API limits
    const trimmed = text.length > 500
      ? text.slice(0, 500).replace(/[^.!?]*$/, '').trim() || text.slice(0, 500)
      : text.trim();

    console.log(`[Sarvam] Translating ${trimmed.length} chars`);

    const hindiText = await translateToHindi(trimmed);
    console.log(`[Sarvam] Hindi: ${hindiText.slice(0, 80)}...`);

    const audioB64 = await hindiTTS(hindiText);
    console.log(`[Sarvam] Audio OK: ${audioB64.length} chars`);

    return NextResponse.json({ audioContent: audioB64, hindiText });
  } catch (err: any) {
    console.error('[Sarvam] Error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Sarvam failed' }, { status: 500 });
  }
}
