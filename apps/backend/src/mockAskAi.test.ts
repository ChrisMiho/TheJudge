import { describe, expect, it } from "vitest";
import { buildMockAnswer } from "./mockAskAi.js";
import { buildPromptText, getPromptDiagnostics } from "./promptNormalization.js";
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

    const result = buildMockAnswer({
      context,
      promptText: buildPromptText(context),
      diagnostics: getPromptDiagnostics(buildPromptText(context))
    });

    expect(result.answer).toContain("MOCK RESPONSE");
    expect(result.answer).toContain("PROMPT STATS");
    expect(result.answer).toContain("Prompt chars:");
    expect(result.answer).toContain("Prompt remaining chars:");
    expect(result.answer).toContain("Prompt utilization:");
    expect(result.answer).toContain("Prompt near limit:");
    expect(result.answer).toContain("Prompt exceeds budget:");
    expect(result.answer).toContain("Estimated input tokens (~4 chars/token):");
    expect(result.answer).toContain("Estimated token budget (~4 chars/token):");
    expect(result.answer).toContain("Estimated remaining tokens (~4 chars/token):");
    expect(result.answer).toContain("FULL PROMPT (SENT TO BEDROCK)");
    expect(result.answer).toContain("SYSTEM ROLE PREAMBLE");
    expect(result.answer).toContain("INSTRUCTIONS");
    expect(result.answer).toContain("QUESTION");
    expect(result.answer).toContain("ORDERED STACK CONTEXT (BOTTOM TO TOP)");
  });
});
