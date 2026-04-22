import type { ServerConfig } from "../config.js";
import type { AskAiProvider } from "./askAiProvider.js";
import { createBedrockReadinessProvider } from "./bedrockReadinessProvider.js";
import { mockAskAiProvider } from "./mockAskAiProvider.js";

export function createAskAiProvider(config: ServerConfig): AskAiProvider {
  if (config.askAiProvider === "bedrock") {
    return createBedrockReadinessProvider({
      awsRegion: config.awsRegion ?? "unknown",
      modelId: config.bedrockModelId ?? "unknown"
    });
  }

  return mockAskAiProvider;
}
