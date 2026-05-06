import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput
} from "@aws-sdk/client-bedrock-runtime";
import { createProviderTimeoutError, createProviderUnavailableError } from "../errors.js";
import type { AskAiProvider } from "./askAiProvider.js";

type BedrockProviderConfig = {
  awsRegion: string;
  modelId: string;
  timeoutMs: number;
  maxAttempts: number;
  client?: BedrockConverseClient;
};

export type BedrockConverseClient = {
  send(command: ConverseCommand, options?: { abortSignal?: AbortSignal }): Promise<BedrockConverseOutput>;
};

type BedrockConverseOutput = {
  output?: {
    message?: {
      content?: Array<{ text?: string }>;
    };
  };
};

function createConverseInput(modelId: string, promptText: string): ConverseCommandInput {
  return {
    modelId,
    messages: [
      {
        role: "user",
        content: [{ text: promptText }]
      }
    ]
  };
}

function extractTextFromConverseOutput(response: BedrockConverseOutput): string | undefined {
  const content = response.output?.message?.content;
  if (!content || content.length === 0) {
    return undefined;
  }

  const text = content
    .flatMap((block) => {
      if ("text" in block && typeof block.text === "string" && block.text.trim().length > 0) {
        return [block.text];
      }
      return [];
    })
    .join("\n")
    .trim();

  return text.length > 0 ? text : undefined;
}

export function createBedrockAskAiProvider(config: BedrockProviderConfig): AskAiProvider {
  const client =
    config.client ??
    new BedrockRuntimeClient({
      region: config.awsRegion,
      maxAttempts: config.maxAttempts
    });

  return {
    async generateAnswer(preparedPrompt) {
      try {
        const response = await client.send(new ConverseCommand(createConverseInput(config.modelId, preparedPrompt.promptText)), {
          abortSignal: AbortSignal.timeout(config.timeoutMs)
        });
        const text = extractTextFromConverseOutput(response);
        if (!text) {
          throw createProviderUnavailableError("Miho is working on it", "Bedrock response did not include text output.");
        }

        return { answer: text };
      } catch (error) {
        if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
          throw createProviderTimeoutError(
            "Miho is working on it",
            `Bedrock request timed out after ${config.timeoutMs}ms.`
          );
        }
        throw error;
      }
    }
  };
}
