import {
  DEFAULT_OPENAI_MAX_RETRIES,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_TIMEOUT_MS,
  type ServerConfig
} from "../config/index.js";
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
      model: config.openAiModel ?? DEFAULT_OPENAI_MODEL,
      timeoutMs: config.openAiTimeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS,
      maxRetries: config.openAiMaxRetries ?? DEFAULT_OPENAI_MAX_RETRIES,
      client: options.openAiClient
    });
  }

  return mockAskAiProvider;
}
