import { describe, expect, it } from "vitest";
import { preparePromptInput } from "../promptPreparation.js";
import { createAskAiRequest } from "../test-utils/requestBuilders.js";
import { createAskAiProvider } from "./createAskAiProvider.js";

describe("createAskAiProvider", () => {
  it("returns mock provider by default", async () => {
    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      askAiProvider: "mock"
    });

    const response = await provider.generateAnswer(preparePromptInput(createAskAiRequest()));

    expect(response.answer).toContain("MOCK RESPONSE");
  });

  it("returns bedrock readiness provider when bedrock selected", async () => {
    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      askAiProvider: "bedrock",
      awsRegion: "us-east-1",
      bedrockModelId: "anthropic.claude-v2"
    });

    await expect(
      provider.generateAnswer(preparePromptInput(createAskAiRequest()))
    ).rejects.toThrow(/readiness only/);
    await expect(
      provider.generateAnswer(preparePromptInput(createAskAiRequest()))
    ).rejects.toThrow(/region=us-east-1, model=anthropic\.claude-v2/);
  });
});
