import { describe, expect, it } from "vitest";
import { askAiRequestSchema } from "./askAiRequest.js";

function validRequest() {
  return {
    question: "How does this resolve?",
    gameContext: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "stack_resolving",
      selectedZones: ["stack"],
      zones: {
        stack: [
          {
            cardId: "opt",
            name: "Opt",
            oracleText: "Scry 1, then draw a card."
          }
        ]
      }
    }
  };
}

describe("askAiRequestSchema", () => {
  it("accepts a minimal valid zone-based payload", () => {
    const parsed = askAiRequestSchema.safeParse(validRequest());
    expect(parsed.success).toBe(true);
  });

  it("rejects payloads with mismatched playerCount", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      gameContext: {
        ...validRequest().gameContext,
        playerCount: 3
      }
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty selected zones with no cards", () => {
    const parsed = askAiRequestSchema.safeParse({
      question: "Resolve",
      gameContext: {
        playerCount: 2,
        players: [
          { label: "Player 1", lifeTotal: 20 },
          { label: "Player 2", lifeTotal: 20 }
        ],
        turnPhase: "stack_resolving",
        selectedZones: ["stack"],
        zones: {}
      }
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects control characters in the question", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      question: "bad\u0007question"
    });
    expect(parsed.success).toBe(false);
  });
});
