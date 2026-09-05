import OpenAI from "openai";
import type { EmbeddingProvider } from "./embeddingProvider.js";

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export type OpenAiEmbeddingsClient = {
  embeddings: {
    create(params: { model: string; input: string }): Promise<{ data: Array<{ embedding: number[] }> }>;
  };
};

type OpenAiEmbeddingProviderConfig = {
  apiKey: string;
  client?: OpenAiEmbeddingsClient;
};

/**
 * REQ-181: seam-selectable for live mode only, never the default (SCOPE-B/D).
 * The one embedding path that makes a per-request external call — choosing
 * it is explicit, unlike `mock` and `local`.
 */
export function createOpenAiEmbeddingProvider(config: OpenAiEmbeddingProviderConfig): EmbeddingProvider {
  const client = config.client ?? new OpenAI({ apiKey: config.apiKey });

  return {
    async embed(text) {
      try {
        const response = await client.embeddings.create({ model: OPENAI_EMBEDDING_MODEL, input: text });
        return response.data[0]?.embedding ?? null;
      } catch (error) {
        console.warn("[embedding] openai provider failed; falling back to lexical retrieval.", error);
        return null;
      }
    }
  };
}
