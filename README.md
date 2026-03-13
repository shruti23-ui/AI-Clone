# Shruti Priya — AI Portfolio Clone

> An interactive AI portfolio where visitors talk to a digital clone of Shruti Priya.
> The AI clone answers questions using a RAG pipeline, speaks with ElevenLabs voice,
> and animates a 3D avatar with lip sync.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, TailwindCSS |
| 3D | React Three Fiber, Three.js, Drei |
| Animation | Framer Motion |
| AI | OpenAI GPT-4o + LangChain RAG |
| Voice | ElevenLabs TTS + Web Speech API STT |
| State | Zustand |

---

## Setup Instructions

### 1. Clone & Install

```bash
cd "Shruti AI Clone"
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
OPENAI_API_KEY=sk-...           # Required — for GPT-4o + embeddings
ELEVENLABS_API_KEY=...          # Optional — for voice output
ELEVENLABS_VOICE_ID=...         # Optional — ElevenLabs voice ID for Shruti
```

**Getting your ElevenLabs Voice ID:**
1. Go to https://elevenlabs.io/
2. Create a free account
3. Use Voice Lab to clone a voice or pick from pre-built voices
4. Copy the Voice ID from the voice settings

### 3. Add Your Avatar (Optional)

Place a GLB avatar file at `public/avatar/avatar.glb`.

> **Note:** Ready Player Me shut down Jan 31, 2026.

Current alternatives (see `public/avatar/README.md` for full instructions):
- **Avaturn** (avaturn.me) — best replacement, photo-based, exports GLB with viseme blendshapes
- **VRoid Studio** (vroid.com) — anime-style, exports VRM → convert to GLB in Blender
- **Blender** — custom model, add shape keys named `viseme_aa`, `viseme_PP`, etc.
- **Sketchfab** — download any free GLB character for quick testing
- **Procedural fallback** — built-in 3D head with blinking + jaw animation, no setup needed

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page (avatar + chat)
│   ├── globals.css             # Global styles
│   └── api/
│       ├── chat/route.ts       # RAG chat endpoint (streaming)
│       └── tts/route.ts        # ElevenLabs TTS endpoint
│
├── components/
│   ├── avatar/
│   │   ├── AvatarCanvas.tsx    # Three.js canvas wrapper
│   │   ├── AvatarModel.tsx     # GLB loader + procedural fallback
│   │   └── LipSync.ts          # Viseme engine + LipSyncController
│   ├── chat/
│   │   ├── ChatInterface.tsx   # Main chat component
│   │   ├── ChatMessage.tsx     # Individual message bubble
│   │   ├── ChatInput.tsx       # Text + voice input
│   │   └── TypingIndicator.tsx # "Thinking..." animation
│   └── ui/
│       ├── Background.tsx      # Animated background
│       ├── StatusBar.tsx       # Top HUD bar
│       └── HUDOverlay.tsx      # Corner decorations
│
├── lib/
│   ├── store/chatStore.ts      # Zustand global state
│   ├── ai/prompts.ts           # System prompt builder
│   ├── hooks/
│   │   ├── useTTS.ts           # ElevenLabs TTS hook
│   │   └── useSTT.ts           # Web Speech API STT hook
│   └── rag/
│       ├── embeddings.ts       # OpenAI embeddings
│       ├── vectorstore.ts      # MemoryVectorStore (+ Pinecone option)
│       └── retriever.ts        # LangChain retriever
│
├── data/knowledge/             # RAG knowledge base (plain text)
│   ├── resume.txt
│   ├── projects.txt
│   └── research.txt
│
├── scripts/
│   └── ingest.ts              # RAG ingestion script
│
└── public/avatar/             # Place avatar.glb here
```

---

## API Endpoints

### `POST /api/chat`
Handles user messages through the RAG pipeline and streams the AI response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What projects has she built?" }
  ]
}
```

**Response:** Streaming text (Server-Sent Events via Vercel AI SDK)

---

### `POST /api/tts`
Converts text to voice audio using ElevenLabs.

**Request:**
```json
{ "text": "Hi, I'm Shruti Priya!" }
```

**Response:** `audio/mpeg` binary stream

---

## RAG Knowledge Base

Add or edit files in `data/knowledge/` to update what the AI knows.
Files are loaded automatically on first request. Supported format: plain `.txt`

Current files:
- `resume.txt` — education, experience, skills, awards
- `projects.txt` — detailed project descriptions
- `research.txt` — research background, publications, philosophy

To test retrieval:
```bash
npm run ingest
```

---

## Adding Pinecone (Production Vector DB)

1. Create an account at https://pinecone.io/
2. Create an index with dimension `1536` (text-embedding-3-small)
3. Add to `.env.local`:
   ```env
   PINECONE_API_KEY=...
   PINECONE_INDEX=shruti-portfolio
   ```
4. Uncomment the Pinecone code in `lib/rag/vectorstore.ts`
5. Run `npm run ingest` to populate

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy
```

Set environment variables in Vercel dashboard:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

### Netlify / Docker

For Docker, create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Customization

### Change the AI persona
Edit `lib/ai/prompts.ts` — modify the system prompt to change tone, personality, or constraints.

### Update knowledge base
Edit or add files in `data/knowledge/` — restart the server to reload.

### Change the voice
Set a different `ELEVENLABS_VOICE_ID` in `.env.local`.
Browse voices at https://elevenlabs.io/voice-library

### Swap the avatar
Replace `public/avatar/avatar.glb` with your own model.

---

## Performance Notes

- The 3D canvas is lazy-loaded (`dynamic(() => import(...), { ssr: false })`)
- AI responses stream token-by-token via Vercel AI SDK
- In-memory vector store initializes once per server process
- Three.js DPR capped at 1.5 for performance
- OrbitControls damping for smooth camera movement

---

Built with ❤️ by Shruti Priya — NIT Jamshedpur
