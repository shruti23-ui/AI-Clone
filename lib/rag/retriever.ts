import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { getVectorStore } from './vectorstore';

let retrieverInstance: VectorStoreRetriever | null = null;

export async function getRetriever(): Promise<VectorStoreRetriever> {
  if (retrieverInstance) return retrieverInstance;

  const store = await getVectorStore();

  retrieverInstance = store.asRetriever({
    k: 4, // Return top 4 most relevant chunks
    searchType: 'similarity',
  });

  return retrieverInstance;
}
