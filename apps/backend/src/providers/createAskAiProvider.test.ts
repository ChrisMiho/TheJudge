import { describe, expect, it } from "vitest";
import { DEFAULT_OPENAI_MAX_RETRIES, DEFAULT_OPENAI_TIMEOUT_MS } from "../config/index.js";
import { preparePromptInput } from "../prompt/preparation.js";
import { createAskAiRequest } from "../test-utils/requestBuilders.js";
import { createAskAiProvider } from "./createAskAiProvider.js";

describe("Backend - Providers", () => {
  describe("createAskAiProvider", () => {
    it("returns mock provider by default", async () => {
      const provider = createAskAiProvider({
        port: 3000,
        debugLoggingEnabled: false,
        payloadLoggingEnabled: false,
        askAiProvider: "mock",
        comboEnrichmentEnabled: true,
        embeddingProvider: "mock"
      });

      const response = await provider.generateAnswer(preparePromptInput(createAskAiRequest()));

      expect(response.answer).toContain("MOCK RESPONSE");
    });

    it("returns openai provider when openai selected", async () => {
      const fakeOpenAiClient = {
        responses: {
          async create() {
            return { output_text: "openai response body" };
          }
        }
      };

      const provider = createAskAiProvider(
        {
          port: 3000,
          debugLoggingEnabled: false,
          payloadLoggingEnabled: false,
          askAiProvider: "openai",
          comboEnrichmentEnabled: true,
          embeddingProvider: "mock",
          openAiApiKey: "sk-test",
          openAiModel: "gpt-4.1-mini",
          openAiTimeoutMs: 15000,
          openAiMaxRetries: 2
        },
        {
          openAiClient: fakeOpenAiClient
        }
      );

      const response = await provider.generateAnswer(preparePromptInput(createAskAiRequest()));
      expect(response.answer).toBe("openai response body");
    });

    it("maps empty openai text output to provider-unavailable contract errors", async () => {
      const fakeOpenAiClient = {
        responses: {
          async create() {
            return {};
          }
        }
      };

      const provider = createAskAiProvider(
        {
          port: 3000,
          debugLoggingEnabled: false,
          payloadLoggingEnabled: false,
          askAiProvider: "openai",
          comboEnrichmentEnabled: true,
          embeddingProvider: "mock",
          openAiApiKey: "sk-test",
          openAiModel: "gpt-4.1-mini",
          openAiTimeoutMs: 15000,
          openAiMaxRetries: 2
        },
        {
          openAiClient: fakeOpenAiClient
        }
      );

      await expect(provider.generateAnswer(preparePromptInput(createAskAiRequest()))).rejects.toMatchObject({
        code: "PROVIDER_UNAVAILABLE"
      });
    });

    it("falls back to gpt-6-luna, a 30000 ms budget and 1 retry when config omits them", async () => {
      const seen: { model?: string; calls: number } = { calls: 0 };
      const fakeOpenAiClient = {
        responses: {
          async create(params: { model: string; input: string }) {
            seen.calls += 1;
            seen.model = params.model;
            if (seen.calls === 1) throw new Error("Connection error.");
            return { output_text: "second try" };
          }
        }
      };

      const provider = createAskAiProvider(
        {
          port: 3000,
          debugLoggingEnabled: false,
          payloadLoggingEnabled: false,
          askAiProvider: "openai",
          comboEnrichmentEnabled: true,
          embeddingProvider: "mock",
          openAiApiKey: "sk-test"
        },
        { openAiClient: fakeOpenAiClient }
      );

      const response = await provider.generateAnswer(preparePromptInput(createAskAiRequest()));
      expect(response.answer).toBe("second try");
      expect(seen.model).toBe("gpt-6-luna");
      expect(seen.calls).toBe(2);
      expect(DEFAULT_OPENAI_TIMEOUT_MS).toBe(30000);
      expect(DEFAULT_OPENAI_MAX_RETRIES).toBe(1);
    });

    it("maps openai timeout errors to provider-timeout contract errors", async () => {
      const fakeOpenAiClient = {
        responses: {
          async create() {
            throw new Error("request timed out");
          }
        }
      };

      const provider = createAskAiProvider(
        {
          port: 3000,
          debugLoggingEnabled: false,
          payloadLoggingEnabled: false,
          askAiProvider: "openai",
          comboEnrichmentEnabled: true,
          embeddingProvider: "mock",
          openAiApiKey: "sk-test",
          openAiModel: "gpt-4.1-mini",
          openAiTimeoutMs: 15000,
          openAiMaxRetries: 2
        },
        {
          openAiClient: fakeOpenAiClient
        }
      );

      await expect(provider.generateAnswer(preparePromptInput(createAskAiRequest()))).rejects.toMatchObject({
        code: "PROVIDER_TIMEOUT"
      });
    });
  });
});
