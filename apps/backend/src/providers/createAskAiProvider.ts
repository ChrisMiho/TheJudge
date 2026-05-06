import type { ServerConfig } from "../config.js";
import type { AskAiProvider } from "./askAiProvider.js";
import { createBedrockAskAiProvider, type BedrockConverseClient } from "./bedrockReadinessProvider.js";
import { mockAskAiProvider } from "./mockAskAiProvider.js";

type CreateAskAiProviderOptions = {
  bedrockClient?: BedrockConverseClient;
};

export function createAskAiProvider(config: ServerConfig, options: CreateAskAiProviderOptions = {}): AskAiProvider {
  if (config.askAiProvider === "bedrock") {
    return createBedrockAskAiProvider({
      awsRegion: config.awsRegion ?? "unknown",
      modelId: config.bedrockModelId ?? "unknown",
      timeoutMs: config.bedrockTimeoutMs ?? 15000,
      maxAttempts: config.bedrockMaxAttempts ?? 2,
      client: options.bedrockClient
    });
  }

  return mockAskAiProvider;
}
