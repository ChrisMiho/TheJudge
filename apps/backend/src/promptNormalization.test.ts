import { describe, expect, it } from "vitest";
import {
  MAX_ORACLE_TEXT_CHARS,
  buildPromptText,
  normalizeCardText,
  normalizeQuestion,
  normalizeWhitespace,
  truncateOracleText
} from "./promptNormalization.js";
import type { PromptContext } from "./types.js";

const baseContext: PromptContext = {
  finalQuestion: "How does this resolve?",
  orderedStack: [
    {
      cardId: "card-1",
      name: "Opt",
      oracleText: "Scry 1, then draw a card.",
      imageUrl: "",
      stackIndex: 0,
      stackRole: "bottom"
    },
    {
      cardId: "card-2",
      name: "Counterspell",
      oracleText: "Counter target spell.",
      imageUrl: "",
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
    expect(first.indexOf("QUESTION")).toBeLessThan(first.indexOf("ORDERED STACK (BOTTOM TO TOP)"));
  });

  it("includes uncertainty and non-invention guardrails", () => {
    const prompt = buildPromptText(baseContext);

    expect(prompt).toContain("State uncertainty when context is incomplete.");
    expect(prompt).toContain("Do not invent hidden state, targets, or board conditions.");
  });
});
