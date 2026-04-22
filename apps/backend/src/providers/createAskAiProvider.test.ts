import { describe, expect, it } from "vitest";
import { createAskAiProvider } from "./createAskAiProvider.js";

describe("createAskAiProvider", () => {
  it("returns mock provider by default", async () => {
    const provider = createAskAiProvider({
      port: 3000,
      debugLoggingEnabled: false,
      askAiProvider: "mock"
    });

    const response = await provider.generateAnswer({
      question: "How does this resolve?",
      gameContext: {
        playerCount: 2,
        players: [
          { label: "Player 1", lifeTotal: 20 },
          { label: "Player 2", lifeTotal: 20 }
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
          caster: "Player 1",
          targets: []
        }
      ]
    });

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
      provider.generateAnswer({
        question: "How does this resolve?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
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
            caster: "Player 1",
            targets: []
          }
        ]
      })
    ).rejects.toThrow(/readiness only/);
  });
});
