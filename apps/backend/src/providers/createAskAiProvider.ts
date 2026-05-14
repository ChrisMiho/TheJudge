import type { ServerConfig } from "../config.js";
import type { AskAiProvider } from "./askAiProvider.js";
import { createOpenAiAskAiProvider, type OpenAiResponsesClient } from "./openAiResponsesProvider.js";
import { mockAskAiProvider } from "./mockAskAiProvider.js";

type CreateAskAiProviderOptions = {
  openAiClient?: OpenAiResponsesClient;
};

export function createAskAiProvider(config: ServerConfig, options: CreateAskAiProviderOptions = {}): AskAiProvider {
  if (config.askAiProvider === "openai") {
    return createOpenAiAskAiProvider({
      apiKey: config.openAiApiKey ?? "",
      model: config.openAiModel ?? "gpt-4.1-mini",
      timeoutMs: config.openAiTimeoutMs ?? 15000,
      maxRetries: config.openAiMaxRetries ?? 2,
      client: options.openAiClient
    });
  }

  return mockAskAiProvider;
}
