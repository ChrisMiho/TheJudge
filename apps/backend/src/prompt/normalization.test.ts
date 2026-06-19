import { describe, expect, it } from "vitest";
import {
  normalizeCardText,
  normalizeQuestion,
  normalizeWhitespace,
  truncateConversationHistory,
  truncateOracleText
} from "./normalization.js";
import type { ConversationTurn } from "../types/index.js";

describe("prompt normalization", () => {
  it("normalizes whitespace consistently", () => {
    expect(normalizeWhitespace("  A   B\nC\tD  ")).toBe("A B C D");
    expect(normalizeQuestion("  What   happens\t now? ")).toBe("What happens now?");
  });

  it("truncates long oracle text with deterministic suffix", () => {
    const longText = "x".repeat(550);
    const truncated = truncateOracleText(longText, 500);

    expect(truncated.length).toBe(500);
    expect(truncated.endsWith(" ...(truncated)")).toBe(true);
  });

  it("normalizes and truncates card text", () => {
    const longText = `  line one\n\n${"y".repeat(600)}  `;
    const normalized = normalizeCardText(longText);

    expect(normalized.includes("\n")).toBe(false);
    expect(normalized.trim().length).toBeGreaterThan(0);
  });
});

describe("truncateConversationHistory", () => {
  it("returns all turns when total chars are within budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "World" }
    ];
    expect(truncateConversationHistory(turns, 100)).toEqual(turns);
  });

  it("removes oldest turns first until within budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "a".repeat(3000) },
      { role: "assistant", content: "b".repeat(3000) },
      { role: "user", content: "newer question" },
      { role: "assistant", content: "newer answer" }
    ];
    const result = truncateConversationHistory(turns, 6000);
    expect(result.length).toBeLessThan(turns.length);
    expect(result[result.length - 1]?.content).toBe("newer answer");
  });

  it("returns empty array when all turns exceed budget", () => {
    const turns: ConversationTurn[] = [
      { role: "user", content: "a".repeat(4000) },
      { role: "assistant", content: "b".repeat(4000) }
    ];
    const result = truncateConversationHistory(turns, 100);
    expect(result).toEqual([]);
  });
});
