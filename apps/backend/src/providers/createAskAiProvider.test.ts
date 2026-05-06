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

  it("returns bedrock provider when bedrock selected", async () => {
    const fakeBedrockClient = {
      async send() {
        return {
          output: {
            message: {
              content: [{ text: "bedrock response body" }]
            }
          }
        };
      }
    };

    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      payloadLoggingEnabled: false,
      askAiProvider: "bedrock",
      awsRegion: "us-east-1",
      bedrockModelId: "anthropic.claude-v2",
      bedrockTimeoutMs: 15000,
      bedrockMaxAttempts: 2
    }, {
      bedrockClient: fakeBedrockClient
    });

    const response = await provider.generateAnswer(preparePromptInput(createAskAiRequest()));
    expect(response.answer).toBe("bedrock response body");
  });

  it("maps empty bedrock text output to provider-unavailable contract errors", async () => {
    const fakeBedrockClient = {
      async send() {
        return {
          output: {
            message: {
              content: []
            }
          }
        };
      }
    };

    const provider = createAskAiProvider(
      {
        port: 3000,
        debugLoggingEnabled: false,
        payloadLoggingEnabled: false,
        askAiProvider: "bedrock",
        awsRegion: "us-east-1",
        bedrockModelId: "anthropic.claude-v2",
        bedrockTimeoutMs: 15000,
        bedrockMaxAttempts: 2
      },
      {
        bedrockClient: fakeBedrockClient
      }
    );

    await expect(provider.generateAnswer(preparePromptInput(createAskAiRequest()))).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE"
    });
  });
});
