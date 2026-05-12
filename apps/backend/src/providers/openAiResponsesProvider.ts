import OpenAI from "openai";
import { createProviderTimeoutError, createProviderUnavailableError } from "../errors.js";
import type { AskAiProvider } from "./askAiProvider.js";

type OpenAiProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  client?: OpenAiResponsesClient;
};

export type OpenAiResponsesClient = {
  responses: {
    create(params: { model: string; input: string }): Promise<OpenAiResponseOutput>;
  };
};

type OpenAiResponseOutput = {
  output_text?: string;
};

function extractText(response: OpenAiResponseOutput): string | undefined {
  const text = response.output_text?.trim();
  return text && text.length > 0 ? text : undefined;
}

export function createOpenAiAskAiProvider(config: OpenAiProviderConfig): AskAiProvider {
  const client =
    config.client ??
    new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeoutMs,
      maxRetries: config.maxRetries
    });

  return {
    async generateAnswer(preparedPrompt) {
      try {
        const response = await client.responses.create({
          model: config.model,
          input: preparedPrompt.promptText
        });
        const text = extractText(response);
        if (!text) {
          throw createProviderUnavailableError("Miho is working on it", "OpenAI response did not include text output.");
        }

        return { answer: text };
      } catch (error) {
        if (error instanceof Error && /timeout|timed out/i.test(error.message)) {
          throw createProviderTimeoutError(
            "Miho is working on it",
            `OpenAI request timed out after ${config.timeoutMs}ms.`
          );
        }

        if (error instanceof Error) {
          throw createProviderUnavailableError("Miho is working on it", `OpenAI request failed: ${error.message}`);
        }

        throw error;
      }
    }
  };
}
