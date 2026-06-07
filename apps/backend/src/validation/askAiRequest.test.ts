import { describe, expect, it } from "vitest";
import { askAiRequestSchema } from "./askAiRequest.js";

function validTurn(role: "user" | "assistant", content = "Some message") {
  return { role, content };
}

function validRequest() {
  return {
    question: "How does this resolve?",
    gameContext: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
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
        turnPhase: "main_1",
        selectedZones: ["stack"],
        zones: {}
      }
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects control characters in the question", () => {
    const controlChar = String.fromCharCode(7);
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      question: `bad${controlChar}question`
    });
    expect(parsed.success).toBe(false);
  });
});

describe("askAiRequestSchema — conversationHistory", () => {
  it("accepts a request with conversationHistory omitted", () => {
    expect(askAiRequestSchema.safeParse(validRequest()).success).toBe(true);
  });

  it("accepts a valid 2-turn history [user, assistant]", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [validTurn("user"), validTurn("assistant")]
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a valid 4-turn history [user, assistant, user, assistant]", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [
        validTurn("user"),
        validTurn("assistant"),
        validTurn("user"),
        validTurn("assistant")
      ]
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty conversationHistory array", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: []
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects conversationHistory with more than 20 turns", () => {
    const turns: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (let i = 0; i < 21; i++) {
      turns.push(validTurn(i % 2 === 0 ? "user" : "assistant"));
    }
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: turns
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a message with content longer than 10000 characters", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [
        validTurn("user", "a".repeat(10001)),
        validTurn("assistant")
      ]
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a history that starts with role: assistant", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [validTurn("assistant"), validTurn("user")]
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-alternating roles [user, user]", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [validTurn("user"), validTurn("user")]
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a history whose last entry is role: user", () => {
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [validTurn("user")]
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects control characters in conversationHistory content", () => {
    const controlChar = String.fromCharCode(7);
    const parsed = askAiRequestSchema.safeParse({
      ...validRequest(),
      conversationHistory: [
        validTurn("user", `bad${controlChar}content`),
        validTurn("assistant")
      ]
    });
    expect(parsed.success).toBe(false);
  });
});
