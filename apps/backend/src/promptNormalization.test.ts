import { describe, expect, it } from "vitest";
import {
  MAX_ORACLE_TEXT_CHARS,
  MAX_PROMPT_CHAR_BUDGET,
  buildPromptText,
  normalizeCardText,
  normalizeQuestion,
  normalizeWhitespace,
  truncateOracleText
} from "./promptNormalization.js";
import type { PromptContext } from "./types.js";

const baseContext: PromptContext = {
  finalQuestion: "How does this resolve?",
  gameContext: {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 17 }
    ]
  },
  battlefieldContext: [{ name: "Rhystic Study", details: "Tax effect", targets: [{ kind: "none" }] }],
  orderedStack: [
    {
      cardId: "card-1",
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
      cardId: "card-2",
      name: "Counterspell",
      oracleText: "Counter target spell.",
      imageUrl: "",
      manaCost: "{U}{U}",
      manaValue: 2,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: [],
      caster: "Player 3",
      targets: [
        { kind: "stack", targetCardId: "card-1", targetCardName: "Opt" },
        { kind: "none" },
        { kind: "other", targetDescription: "custom context target" }
      ],
      manaSpent: 5,
      contextNotes: "kicker paid",
      stackIndex: 1,
      stackRole: "top"
    }
  ]
};

describe("prompt normalization", () => {
  it("normalizes whitespace consistently", () => {
    expect(normalizeWhitespace("  A   B\nC\tD  ")).toBe("A B C D");
    expect(normalizeQuestion("  What   happens\t now? ")).toBe("What happens now?");
  });

  it("truncates long oracle text with deterministic suffix", () => {
    const longText = "x".repeat(MAX_ORACLE_TEXT_CHARS + 50);
    const truncated = truncateOracleText(longText);

    expect(truncated.length).toBe(MAX_ORACLE_TEXT_CHARS);
    expect(truncated.endsWith(" ...(truncated)")).toBe(true);
  });

  it("normalizes and truncates card text", () => {
    const longText = `  line one\n\n${"y".repeat(MAX_ORACLE_TEXT_CHARS + 10)}  `;
    const normalized = normalizeCardText(longText);

    expect(normalized.includes("\n")).toBe(false);
    expect(normalized.length).toBe(MAX_ORACLE_TEXT_CHARS);
  });
});

describe("buildPromptText", () => {
  it("builds deterministic prompt output with fixed section order", () => {
    const first = buildPromptText(baseContext);
    const second = buildPromptText(baseContext);

    expect(first).toBe(second);
    expect(first.indexOf("INSTRUCTIONS")).toBeLessThan(first.indexOf("QUESTION"));
    expect(first.indexOf("QUESTION")).toBeLessThan(first.indexOf("GENERAL GAME CONTEXT"));
    expect(first.indexOf("GENERAL GAME CONTEXT")).toBeLessThan(first.indexOf("OPTIONAL BATTLEFIELD CONTEXT"));
    expect(first.indexOf("OPTIONAL BATTLEFIELD CONTEXT")).toBeLessThan(
      first.indexOf("ORDERED STACK CONTEXT (BOTTOM TO TOP)")
    );
  });

  it("includes uncertainty and non-invention guardrails", () => {
    const prompt = buildPromptText(baseContext);

    expect(prompt).toContain("State uncertainty when context is incomplete.");
    expect(prompt).toContain("Do not invent hidden state, targets, or board conditions.");
    expect(prompt).toContain("playerCount: 2");
    expect(prompt).toContain("caster: Player 3");
    expect(prompt).toContain("manaSpent: 5");
    expect(prompt).toContain("targets: stack:Opt (card-1) | none:does-not-target | other:custom context target");
    expect(prompt).toContain("Stack item 1 (bottom)");
    expect(prompt).toContain("Stack item 2 (top)");
  });

  it("renders optional battlefield section explicitly when empty", () => {
    const prompt = buildPromptText({
      ...baseContext,
      battlefieldContext: []
    });

    expect(prompt).toContain("OPTIONAL BATTLEFIELD CONTEXT");
    expect(prompt).toContain("OPTIONAL BATTLEFIELD CONTEXT\n(none)");
  });

  it("stays under configured prompt budget for normal payloads", () => {
    const prompt = buildPromptText(baseContext);
    expect(prompt.length).toBeLessThan(MAX_PROMPT_CHAR_BUDGET);
  });
});
