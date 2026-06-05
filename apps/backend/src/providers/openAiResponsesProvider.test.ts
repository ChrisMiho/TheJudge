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
});
