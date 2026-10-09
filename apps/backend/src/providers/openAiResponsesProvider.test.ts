import OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors.js";
import { createOpenAiAskAiProvider, type OpenAiResponsesClient } from "./openAiResponsesProvider.js";

function createMockClient(response: { output_text?: string }): OpenAiResponsesClient {
  return {
    responses: {
      create: vi.fn(async () => response)
    }
  };
}

describe("Backend - Providers", () => {
  describe("createOpenAiAskAiProvider", () => {
    it("returns answer text from OpenAI response output", async () => {
      const client = createMockClient({ output_text: "  Resolved cleanly  " });
      const provider = createOpenAiAskAiProvider({
        apiKey: "test-key",
        model: "gpt-test",
        timeoutMs: 1000,
        maxRetries: 0,
        client
      });

      const result = await provider.generateAnswer({
        context: {} as never,
        promptText: "prompt",
        diagnostics: {} as never
      });

      expect(result.answer).toBe("Resolved cleanly");
    });

    it("throws provider unavailable when response has no text", async () => {
      const client = createMockClient({});
      const provider = createOpenAiAskAiProvider({
        apiKey: "test-key",
        model: "gpt-test",
        timeoutMs: 1000,
        maxRetries: 0,
        client
      });

      await expect(
        provider.generateAnswer({
          context: {} as never,
          promptText: "prompt",
          diagnostics: {} as never
        })
      ).rejects.toMatchObject({
        code: "PROVIDER_UNAVAILABLE"
      } satisfies Partial<AppError>);
    });

    it("maps timeout failures to provider timeout errors", async () => {
      const client: OpenAiResponsesClient = {
        responses: {
          create: vi.fn(async () => {
            throw new Error("request timed out");
          })
        }
      };
      const provider = createOpenAiAskAiProvider({
        apiKey: "test-key",
        model: "gpt-test",
        timeoutMs: 1000,
        maxRetries: 0,
        client
      });

      await expect(
        provider.generateAnswer({
          context: {} as never,
          promptText: "prompt",
          diagnostics: {} as never
        })
      ).rejects.toMatchObject({
        code: "PROVIDER_TIMEOUT"
      } satisfies Partial<AppError>);
    });

    const prepared = { context: {} as never, promptText: "prompt", diagnostics: {} as never };

    // A fake attempt that honours the abort signal, like the real SDK does.
    function hangUntilAborted(signal?: AbortSignal): Promise<never> {
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => reject(new OpenAI.APIUserAbortError()));
      });
    }

    it("cuts off a slow attempt at the overall deadline and maps it to PROVIDER_TIMEOUT (504)", async () => {
      const create = vi.fn(async (_params: unknown, options?: { signal?: AbortSignal }) =>
        hangUntilAborted(options?.signal)
      );
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 150,
        maxRetries: 2,
        client: { responses: { create } }
      });

      const started = Date.now();
      await expect(provider.generateAnswer(prepared)).rejects.toMatchObject({
        code: "PROVIDER_TIMEOUT",
        status: 504
      } satisfies Partial<AppError>);
      expect(Date.now() - started).toBeLessThan(1000);
      // A slow answer that used the budget is never started over.
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("cuts off a client that ignores the abort signal at the deadline", async () => {
      const create = vi.fn(() => new Promise<never>(() => undefined));
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 100,
        maxRetries: 1,
        client: { responses: { create } }
      });

      await expect(provider.generateAnswer(prepared)).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("classifies the SDK abort error (APIUserAbortError) by cause as PROVIDER_TIMEOUT, never PROVIDER_UNAVAILABLE", async () => {
      const create = vi.fn(async () => {
        // Non-default message that matches no timeout wording: cause, not text, must decide.
        throw new OpenAI.APIUserAbortError({ message: "cancelled by caller" });
      });
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 5000,
        maxRetries: 1,
        client: { responses: { create } }
      });

      const error = await Promise.resolve(provider.generateAnswer(prepared)).catch((e: unknown) => e);
      expect(error).toMatchObject({ code: "PROVIDER_TIMEOUT", status: 504 });
      expect((error as AppError).code).not.toBe("PROVIDER_UNAVAILABLE");
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("retries an SDK connection error by cause even when its message matches no connection wording", async () => {
      const create = vi
        .fn()
        .mockRejectedValueOnce(new OpenAI.APIConnectionError({ message: "upstream hiccup" }))
        .mockResolvedValueOnce({ output_text: "recovered" });
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 5000,
        maxRetries: 1,
        client: { responses: { create } }
      });

      await expect(provider.generateAnswer(prepared)).resolves.toEqual({ answer: "recovered" });
      expect(create).toHaveBeenCalledTimes(2);
    });

    it("retries a fast failure inside the budget", async () => {
      const create = vi
        .fn()
        .mockRejectedValueOnce(new Error("Connection error."))
        .mockResolvedValueOnce({ output_text: "second try" });
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 5000,
        maxRetries: 1,
        client: { responses: { create } }
      });

      await expect(provider.generateAnswer(prepared)).resolves.toEqual({ answer: "second try" });
      expect(create).toHaveBeenCalledTimes(2);
    });

    it("starts no retry once the budget is spent", async () => {
      const create = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 120));
        throw new Error("Connection error.");
      });
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 100,
        maxRetries: 3,
        client: { responses: { create } }
      });

      await expect(provider.generateAnswer(prepared)).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("never retries when maxRetries is 0", async () => {
      const create = vi.fn(async () => {
        throw new Error("Connection error.");
      });
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-test",
        timeoutMs: 5000,
        maxRetries: 0,
        client: { responses: { create } }
      });

      await expect(provider.generateAnswer(prepared)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("sends model and prompt only, with no reasoning-effort value", async () => {
      const create = vi.fn(async () => ({ output_text: "ok" }));
      const provider = createOpenAiAskAiProvider({
        apiKey: "k",
        model: "gpt-6-luna",
        timeoutMs: 5000,
        maxRetries: 1,
        client: { responses: { create } }
      });

      await provider.generateAnswer(prepared);
      expect((create.mock.calls[0] as unknown[])[0]).toEqual({ model: "gpt-6-luna", input: "prompt" });
    });
  });
});
