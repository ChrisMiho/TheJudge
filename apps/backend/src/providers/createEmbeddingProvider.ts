import type { ServerConfig } from "../config/index.js";
import type { EmbeddingProvider } from "./embeddingProvider.js";
import { mockEmbeddingProvider } from "./mockEmbeddingProvider.js";
import { localEmbeddingProvider } from "./localEmbeddingProvider.js";
import { createOpenAiEmbeddingProvider, type OpenAiEmbeddingsClient } from "./openAiEmbeddingProvider.js";

type CreateEmbeddingProviderOptions = {
  openAiClient?: OpenAiEmbeddingsClient;
};

/**
 * REQ-181: mirrors `createAskAiProvider`'s shape exactly. `EMBEDDING_PROVIDER`
 * defaults to `mock` and never auto-switches on `NODE_ENV` or deploy target.
 */
export function createEmbeddingProvider(
  config: ServerConfig,
  options: CreateEmbeddingProviderOptions = {}
): EmbeddingProvider {
  if (config.embeddingProvider === "local") {
    return localEmbeddingProvider;
  }

  if (config.embeddingProvider === "openai") {
    return createOpenAiEmbeddingProvider({
      apiKey: config.openAiApiKey ?? "",
      client: options.openAiClient
    });
  }

  return mockEmbeddingProvider;
}
