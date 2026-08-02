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

function validLookupRequest() {
  return {
    mode: "lookup" as const,
    question: "What does trample do?"
  };
}

describe("Backend - Ask AI", () => {
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

    it("defaults an omitted mode to game", () => {
      const parsed = askAiRequestSchema.safeParse(validRequest());

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.mode).toBe("game");
      }
    });

    it("accepts an explicit game mode", () => {
      expect(
        askAiRequestSchema.safeParse({
          ...validRequest(),
          mode: "game"
        }).success
      ).toBe(true);
    });

    it("accepts lookup mode without a card", () => {
      expect(askAiRequestSchema.safeParse(validLookupRequest()).success).toBe(true);
    });

    it("accepts and normalizes a lookup card reference", () => {
      const parsed = askAiRequestSchema.safeParse({
        ...validLookupRequest(),
        card: {
          cardId: "opt",
          name: "Opt",
          oracleText: "Scry 1, then draw a card."
        }
      });

      expect(parsed.success).toBe(true);
      if (parsed.success && parsed.data.mode === "lookup") {
        expect(parsed.data.card).toEqual({
          cardId: "opt",
          name: "Opt",
          oracleText: "Scry 1, then draw a card.",
          imageUrl: "",
          manaCost: "",
          manaValue: 0,
          typeLine: "",
          colors: [],
          supertypes: [],
          subtypes: []
        });
      }
    });

    it("rejects gameContext in lookup mode", () => {
      expect(
        askAiRequestSchema.safeParse({
          ...validLookupRequest(),
          gameContext: validRequest().gameContext
        }).success
      ).toBe(false);
    });

    it("rejects a card in game mode", () => {
      expect(
        askAiRequestSchema.safeParse({
          ...validRequest(),
          mode: "game",
          card: {
            cardId: "opt",
            name: "Opt",
            oracleText: "Scry 1, then draw a card."
          }
        }).success
      ).toBe(false);
    });

    it.each([
      ["targets", []],
      ["caster", "Player 1"],
      ["owner", "Player 1"],
      ["contextNotes", "Cast during combat"],
      ["manaSpent", 1]
    ])(
      "rejects the game-state card field %s in lookup mode",
      (field, value) => {
        expect(
          askAiRequestSchema.safeParse({
            ...validLookupRequest(),
            card: {
              cardId: "opt",
              name: "Opt",
              oracleText: "Scry 1, then draw a card.",
              [field]: value
            }
          }).success
        ).toBe(false);
      }
    );

    it.each([
      ["game", () => ({ ...validRequest(), question: "x".repeat(301) })],
      ["lookup", () => ({ ...validLookupRequest(), question: "x".repeat(301) })]
    ])("rejects questions over 300 characters in %s mode", (_mode, createRequest) => {
      expect(askAiRequestSchema.safeParse(createRequest()).success).toBe(false);
    });

    it.each([
      ["game", () => ({ ...validRequest(), question: `bad${String.fromCharCode(7)}question` })],
      ["lookup", () => ({ ...validLookupRequest(), question: `bad${String.fromCharCode(7)}question` })]
    ])("rejects question control characters in %s mode", (_mode, createRequest) => {
      expect(askAiRequestSchema.safeParse(createRequest()).success).toBe(false);
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

    it.each([
      ["game", () => validRequest()],
      ["lookup", () => validLookupRequest()]
    ])("applies conversationHistory validation in %s mode", (_mode, createRequest) => {
      const validHistory = [validTurn("user"), validTurn("assistant")];
      const invalidHistory = [validTurn("assistant"), validTurn("user")];

      expect(
        askAiRequestSchema.safeParse({
          ...createRequest(),
          conversationHistory: validHistory
        }).success
      ).toBe(true);
      expect(
        askAiRequestSchema.safeParse({
          ...createRequest(),
          conversationHistory: invalidHistory
        }).success
      ).toBe(false);
    });
  });
});
