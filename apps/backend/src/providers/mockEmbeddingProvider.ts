import type { EmbeddingProvider } from "./embeddingProvider.js";

/**
 * REQ-181/SCOPE-D: the default. Performs no embedding and makes no external
 * call — System 3 falls back to lexical retrieval, so a checkout with no
 * model access and no network behaves exactly as it did before this feature.
 */
export const mockEmbeddingProvider: EmbeddingProvider = {
  async embed() {
    return null;
  }
};
