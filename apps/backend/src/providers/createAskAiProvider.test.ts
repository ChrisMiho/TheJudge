import { describe, expect, it } from "vitest";
import { preparePromptInput } from "../promptPreparation.js";
import { createAskAiRequest } from "../test-utils/requestBuilders.js";
import { createAskAiProvider } from "./createAskAiProvider.js";

describe("createAskAiProvider", () => {
  it("returns mock provider by default", async () => {
    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      payloadLoggingEnabled: false,
      askAiProvider: "mock"
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
