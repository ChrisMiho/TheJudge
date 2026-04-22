import { describe, expect, it } from "vitest";
import { buildPromptContext } from "./promptContext.js";
import { MAX_ORACLE_TEXT_CHARS } from "./promptNormalization.js";
import type { AskAiRequest } from "./types.js";

function createStack(size: number): AskAiRequest["stack"] {
  return Array.from({ length: size }, (_, index) => ({
    cardId: `card-${index + 1}`,
    name: `Card ${index + 1}`,
    oracleText: `Oracle text ${index + 1}`,
    imageUrl: ""
  }));
}

describe("buildPromptContext", () => {
  it("applies fallback question for blank input", () => {
    const context = buildPromptContext({
      question: "   ",
      stack: createStack(1)
    });

    expect(context.finalQuestion).toBe("Resolve the stack");
  });

  it("keeps stack order for multi-card input", () => {
    const context = buildPromptContext({
      question: "How does this resolve?",
      stack: createStack(3)
    });

    expect(context.orderedStack.map((item) => item.cardId)).toEqual([
      "card-1",
      "card-2",
      "card-3"
    ]);
    expect(context.orderedStack.map((item) => item.stackRole)).toEqual([
      "bottom",
      "middle",
      "top"
    ]);
  });

  it("sets top role on single-card stacks", () => {
    const context = buildPromptContext({
      question: "Single",
      stack: createStack(1)
    });

    expect(context.orderedStack).toHaveLength(1);
    expect(context.orderedStack[0]?.stackIndex).toBe(0);
    expect(context.orderedStack[0]?.stackRole).toBe("top");
  });

  it("supports near-cap stacks while preserving indexes", () => {
    const context = buildPromptContext({
      question: "Near cap",
      stack: createStack(9)
    });

    expect(context.orderedStack).toHaveLength(9);
    expect(context.orderedStack[0]?.stackIndex).toBe(0);
    expect(context.orderedStack[8]?.stackIndex).toBe(8);
    expect(context.orderedStack[8]?.stackRole).toBe("top");
  });

  it("normalizes noisy text fields and truncates long oracle text", () => {
    const context = buildPromptContext({
      question: "  How   does\tthis resolve?\n",
      stack: [
        {
          cardId: "  card-1 ",
          name: "  Fancy   Name ",
          oracleText: `\n${"z".repeat(MAX_ORACLE_TEXT_CHARS + 60)}\n`,
          imageUrl: "  https://example.com/image.png  "
        }
      ]
    });

    expect(context.finalQuestion).toBe("How does this resolve?");
    expect(context.orderedStack[0]?.cardId).toBe("card-1");
    expect(context.orderedStack[0]?.name).toBe("Fancy Name");
    expect(context.orderedStack[0]?.imageUrl).toBe("https://example.com/image.png");
    expect((context.orderedStack[0]?.oracleText.length ?? 0) <= MAX_ORACLE_TEXT_CHARS).toBe(true);
  });
});
