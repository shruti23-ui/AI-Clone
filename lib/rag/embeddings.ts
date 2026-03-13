import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: 'embedding-001',
    });
  }
  return embeddingsInstance;
}
