// In-memory audio cache — stores ElevenLabs audio buffers keyed by UUID.
// D-ID fetches these via /api/audio/[id] to drive lip sync.
// Entries auto-expire after 5 minutes to prevent memory leaks.

const TTL_MS = 5 * 60 * 1000;

interface Entry {
  buffer: Buffer;
  expiresAt: number;
}

const cache = new Map<string, Entry>();

export function storeAudio(id: string, buffer: Buffer): void {
  cache.set(id, { buffer, expiresAt: Date.now() + TTL_MS });
  // Prune expired entries
  for (const [k, v] of Array.from(cache.entries())) {
    if (Date.now() > v.expiresAt) cache.delete(k);
  }
}

export function getAudio(id: string): Buffer | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(id); return null; }
  return entry.buffer;
}
