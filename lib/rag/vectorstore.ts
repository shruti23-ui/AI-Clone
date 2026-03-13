/**
 * Vector store factory.
 * Default: MemoryVectorStore (no infra needed).
 * Switch to Pinecone by setting PINECONE_API_KEY in .env
 */

import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddings } from './embeddings';
import fs from 'fs';
import path from 'path';

let vectorStore: MemoryVectorStore | null = null;

async function loadKnowledgeBase(): Promise<Document[]> {
  const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge');
  const docs: Document[] = [];

  if (!fs.existsSync(knowledgeDir)) {
    console.warn('[RAG] Knowledge directory not found:', knowledgeDir);
    return docs;
  }

  const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.txt'));

  for (const file of files) {
    const filePath = path.join(knowledgeDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const category = path.basename(file, '.txt');

    docs.push(
      new Document({
        pageContent: content,
        metadata: { source: file, category },
      })
    );
  }

  console.log(`[RAG] Loaded ${docs.length} knowledge files`);
  return docs;
}

export async function getVectorStore(): Promise<MemoryVectorStore> {
  if (vectorStore) return vectorStore;

  const embeddings = getEmbeddings();
  const rawDocs = await loadKnowledgeBase();

  if (rawDocs.length === 0) {
    // Return empty store if no knowledge files
    vectorStore = new MemoryVectorStore(embeddings);
    return vectorStore;
  }

  // Split documents into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  const splitDocs = await splitter.splitDocuments(rawDocs);
  console.log(`[RAG] Split into ${splitDocs.length} chunks`);

  // Create vector store
  vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  console.log('[RAG] Vector store ready');

  return vectorStore;
}

// For Pinecone integration (uncomment when PINECONE_API_KEY is set):
/*
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

export async function getPineconeVectorStore() {
  const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = client.Index(process.env.PINECONE_INDEX!);
  return PineconeStore.fromExistingIndex(getEmbeddings(), { pineconeIndex: index });
}
*/
