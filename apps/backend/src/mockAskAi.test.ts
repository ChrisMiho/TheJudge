import { describe, expect, it } from "vitest";
import { buildMockAnswer } from "./mockAskAi.js";
import type { PromptContext } from "./types.js";

describe("mock answer ergonomics", () => {
  it("renders deterministic labeled debug output", () => {
    const context: PromptContext = {
      finalQuestion: "How does this resolve?",
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
          stackIndex: 1,
          stackRole: "top"
        }
      ]
    };

    const result = buildMockAnswer(context);

    expect(result.answer).toContain("MOCK RESPONSE");
    expect(result.answer).toContain("Final question: How does this resolve?");
    expect(result.answer).toContain("Stack order convention: bottom-to-top");
    expect(result.answer).toContain("1. [bottom] Opt (cardId: opt)");
    expect(result.answer).toContain("2. [top] Lightning Bolt (cardId: bolt)");
    expect(result.answer).toContain("Colors: U | Supertypes: N/A | Subtypes: N/A");
  });
});
