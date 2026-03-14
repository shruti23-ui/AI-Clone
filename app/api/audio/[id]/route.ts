// Serves cached ElevenLabs audio buffers so D-ID can fetch them by URL.
// D-ID's streaming API needs a publicly accessible audio URL to drive lip sync.

import { NextRequest, NextResponse } from 'next/server';
import { getAudio } from '@/lib/audio-cache';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const buffer = getAudio(params.id);
  if (!buffer) {
    return new NextResponse('Audio not found or expired', { status: 404 });
  }
  return new NextResponse(buffer.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
