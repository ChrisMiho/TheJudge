import { describe, expect, it } from "vitest";
import { preparePromptInput } from "../promptPreparation.js";
import { createAskAiProvider } from "./createAskAiProvider.js";

const baseRequest = {
  question: "How does this resolve?",
  gameContext: {
    playerCount: 2 as const,
    players: [
      { label: "Player 1" as const, lifeTotal: 20 },
      { label: "Player 2" as const, lifeTotal: 20 }
    ]
  },
  battlefieldContext: [],
  stack: [
    {
      cardId: "opt",
      name: "Opt",
      oracleText: "Scry 1, then draw a card.",
      imageUrl: "",
      manaCost: "{U}",
      manaValue: 1,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: [],
      caster: "Player 1" as const,
      targets: []
    }
  ]
};

describe("createAskAiProvider", () => {
  it("returns mock provider by default", async () => {
    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      askAiProvider: "mock"
    });

    const response = await provider.generateAnswer(preparePromptInput(baseRequest));

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
      provider.generateAnswer(preparePromptInput(baseRequest))
    ).rejects.toThrow(/readiness only/);
    await expect(
      provider.generateAnswer(preparePromptInput(baseRequest))
    ).rejects.toThrow(/region=us-east-1, model=anthropic\.claude-v2/);
  });
});
