import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Groq is OpenAI-compatible — just swap the base URL and API key
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const runtime = 'nodejs';
export const maxDuration = 30;

// Load all knowledge files once at module startup (no embeddings, no API call)
function loadAllKnowledge(): string {
  try {
    const dir = path.join(process.cwd(), 'data', 'knowledge');
    if (!fs.existsSync(dir)) return '';
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.txt'))
      .map((f) => {
        const name = path.basename(f, '.txt').toUpperCase();
        const content = fs.readFileSync(path.join(dir, f), 'utf-8').trim();
        return `=== ${name} ===\n${content}`;
      })
      .join('\n\n');
  } catch {
    return '';
  }
}

const FULL_KNOWLEDGE = loadAllKnowledge();

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(FULL_KNOWLEDGE);

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const openaiStream = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
      cancel() {
        openaiStream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
