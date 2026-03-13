/**
 * RAG Ingestion Script
 * Run: npm run ingest
 *
 * Reads all .txt files from data/knowledge/, splits them into chunks,
 * embeds them, and saves to your vector store.
 *
 * For the default in-memory store, this runs automatically on first request.
 * For Pinecone, run this script once to populate the index.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

async function ingest() {
  console.log('🚀 Starting RAG ingestion...\n');

  const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge');

  if (!fs.existsSync(knowledgeDir)) {
    console.error('❌ Knowledge directory not found:', knowledgeDir);
    process.exit(1);
  }

  const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.txt'));
  console.log(`📄 Found ${files.length} knowledge files:`, files);

  const docs: Document[] = [];

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
    console.log(`  ✓ Loaded: ${file} (${content.length} chars)`);
  }

  // Split
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });
  const chunks = await splitter.splitDocuments(docs);
  console.log(`\n✂️  Split into ${chunks.length} chunks`);

  // Embed
  console.log('\n🧠 Creating embeddings...');
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });

  // For Pinecone integration, replace MemoryVectorStore with PineconeStore:
  const store = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  console.log('✅ Vector store populated!');

  // Test retrieval
  console.log('\n🔍 Testing retrieval...');
  const testQuery = 'What is ByteVision?';
  const results = await store.similaritySearch(testQuery, 3);
  console.log(`Query: "${testQuery}"`);
  console.log(`Results: ${results.length} chunks found`);
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.metadata.source}: ${r.pageContent.slice(0, 100)}...`);
  });

  console.log('\n✅ Ingestion complete!');
  console.log('💡 The in-memory store initializes automatically on each server start.');
  console.log('💡 For production, connect Pinecone and run this script to pre-populate the index.');
}

ingest().catch(console.error);
