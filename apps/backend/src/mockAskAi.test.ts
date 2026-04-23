import { describe, expect, it } from "vitest";
import { buildMockAnswer } from "./mockAskAi.js";
import type { PromptContext } from "./types.js";

describe("mock answer ergonomics", () => {
  it("renders deterministic labeled debug output", () => {
    const context: PromptContext = {
      finalQuestion: "How does this resolve?",
      gameContext: {
        playerCount: 2,
        players: [
          { label: "Player 1", lifeTotal: 20 },
          { label: "Player 2", lifeTotal: 18 }
        ]
      },
      battlefieldContext: [{ name: "Rhystic Study", details: "Tax effect", targets: [{ kind: "none" }] }],
      orderedStack: [
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
          targets: [],
          manaSpent: 1,
          contextNotes: "",
          stackIndex: 0,
          stackRole: "bottom"
        },
        {
          cardId: "bolt",
          name: "Lightning Bolt",
          oracleText: "Lightning Bolt deals 3 damage to any target.",
          imageUrl: "",
          manaCost: "{R}",
          manaValue: 1,
          typeLine: "Instant",
          colors: ["R"],
          supertypes: [],
          subtypes: [],
          caster: "Player 3",
          targets: [
            { kind: "none" },
            { kind: "player", targetPlayer: "Player 4" },
            { kind: "other", targetDescription: "custom target detail" }
          ],
          manaSpent: 3,
          contextNotes: "cast for free",
          stackIndex: 1,
          stackRole: "top"
        }
      ]
    };

    const result = buildMockAnswer(context);

    expect(result.answer).toContain("MOCK RESPONSE");
    expect(result.answer).toContain("Final question: How does this resolve?");
    expect(result.answer).toContain("Stack order convention: bottom-to-top");
    expect(result.answer).toContain("General game context:");
    expect(result.answer).toContain("playerCount: 2");
    expect(result.answer).toContain("Player 1: lifeTotal=20");
    expect(result.answer).toContain("Player 2: lifeTotal=18");
    expect(result.answer).toContain("Optional battlefield context:");
    expect(result.answer).toContain("items: 1");
    expect(result.answer).toContain("1. [bottom] Opt (cardId: opt)");
    expect(result.answer).toContain("2. [top] Lightning Bolt (cardId: bolt)");
    expect(result.answer).toContain(
      "Caster: Player 3 | Targets: none:does-not-target | player:Player 4 | other:custom target detail"
    );
    expect(result.answer).toContain("Mana Spent: 3");
    expect(result.answer).toContain("Notes: cast for free");
    expect(result.answer).toContain("Colors: U | Supertypes: N/A | Subtypes: N/A");
  });
});
