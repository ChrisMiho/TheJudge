import OpenAI from "openai";
import { AppError, createProviderTimeoutError, createProviderUnavailableError } from "../errors.js";
import type { AskAiProvider } from "./askAiProvider.js";

type OpenAiProviderConfig = {
  apiKey: string;
  model: string;
  /** REQ-231: the overall answer budget in ms, covering every attempt of one request. */
  timeoutMs: number;
  /** Retries allowed inside the budget; 0 means never retry. */
  maxRetries: number;
  client?: OpenAiResponsesClient;
};

export type OpenAiRequestOptions = {
  signal?: AbortSignal;
  timeout?: number;
  maxRetries?: number;
};

export type OpenAiResponsesClient = {
  responses: {
    create(
      params: { model: string; input: string },
      options?: OpenAiRequestOptions
    ): Promise<OpenAiResponseOutput>;
  };
};

type OpenAiResponseOutput = {
  output_text?: string;
};

// Pause before a retry of a fast failure. A retry only starts when this pause
// and a useful slice of budget still fit inside the overall deadline.
const RETRY_DELAY_MS = 250;
const MIN_RETRY_BUDGET_MS = 500;

class BudgetExpiredError extends Error {
  constructor() {
    super("OpenAI answer budget expired.");
    this.name = "BudgetExpiredError";
  }
}

function extractText(response: OpenAiResponseOutput): string | undefined {
  const text = response.output_text?.trim();
  return text && text.length > 0 ? text : undefined;
}

// Classify by cause, not message alone: the SDK's abort and timeout error
// classes, plus any timeout-worded message, all mean the budget ran out.
function isTimeoutCause(error: unknown): boolean {
  if (error instanceof BudgetExpiredError) return true;
  if (!(error instanceof Error)) return false;
  if (error.name === "APIUserAbortError" || error.name === "APIConnectionTimeoutError") return true;
  return /timeout|timed out|aborted/i.test(error.message);
}

// A quick failure worth another try: dropped connection, 429, or a 5xx.
function isRetryableFastFailure(error: unknown): boolean {
  if (!(error instanceof Error) || error instanceof AppError) return false;
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") return status === 429 || status >= 500;
  return error.name === "APIConnectionError" || /connection|econnreset|socket|network|fetch failed/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createOpenAiAskAiProvider(config: OpenAiProviderConfig): AskAiProvider {
  // The SDK's own retries and timeout are turned off: the provider owns one
  // overall deadline and passes the remaining budget to each attempt.
  const client =
    config.client ??
    new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeoutMs,
      maxRetries: 0
    });

  return {
    async generateAnswer(preparedPrompt) {
      const deadline = Date.now() + config.timeoutMs;
      const controller = new AbortController();
      let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
      const expired = new Promise<never>((_, reject) => {
        deadlineTimer = setTimeout(() => {
          controller.abort();
          reject(new BudgetExpiredError());
        }, config.timeoutMs);
      });
      // The race below may settle first; never leave this rejection unhandled.
      expired.catch(() => undefined);

      try {
        for (let attempt = 0; ; attempt += 1) {
          try {
            const remaining = Math.max(1, deadline - Date.now());
            const response = await Promise.race([
              client.responses.create(
                { model: config.model, input: preparedPrompt.promptText },
                { signal: controller.signal, timeout: remaining, maxRetries: 0 }
              ),
              expired
            ]);
            const text = extractText(response);
            if (!text) {
              throw createProviderUnavailableError(
                "Miho is working on it",
                "OpenAI response did not include text output."
              );
            }

            return { answer: text };
          } catch (error) {
            if (isTimeoutCause(error) || Date.now() >= deadline) throw error;
            const canRetry =
              attempt < config.maxRetries &&
              isRetryableFastFailure(error) &&
              deadline - Date.now() > RETRY_DELAY_MS + MIN_RETRY_BUDGET_MS;
            if (!canRetry) throw error;
            await Promise.race([sleep(RETRY_DELAY_MS), expired]);
          }
        }
      } catch (error) {
        if (isTimeoutCause(error) || Date.now() >= deadline) {
          throw createProviderTimeoutError(
            "Miho is working on it",
            `OpenAI request exceeded the ${config.timeoutMs}ms answer budget.`
          );
        }

        if (error instanceof AppError) throw error;

        if (error instanceof Error) {
          throw createProviderUnavailableError("Miho is working on it", `OpenAI request failed: ${error.message}`);
        }

        throw error;
      } finally {
        if (deadlineTimer) clearTimeout(deadlineTimer);
      }
    }
  };
}
