import { describe, expect, it } from "vitest";
import { hasExplicitComboIntent } from "./intent.js";

describe("Backend - Ask AI", () => {
  describe("Combo intent", () => {
    it.each([
      "Does this combo go infinite?",
      "is this a loop",
      "win condition",
      "COMBOS",
      "What combos do I have?",
      "Am I about to go infinite here?",
      "does this go infinite",
      "Is this my win condition?"
    ])("detects explicit combo intent in %j", (question) => {
      expect(hasExplicitComboIntent(question)).toBe(true);
    });

    it.each([
      "good synergy",
      "how does this interaction work",
      "works with my commander",
      "What happens when this resolves?",
      "Can I respond to that trigger?"
    ])("does not treat broad language %j as combo intent", (question) => {
      expect(hasExplicitComboIntent(question)).toBe(false);
    });

    it.each(["comboing", "discombobulate", "Discombobulate is on the stack", "recombobulator", "looping"])(
      "does not match %j across a word boundary",
      (question) => {
        expect(hasExplicitComboIntent(question)).toBe(false);
      }
    );

    it("matches phrases across arbitrary whitespace", () => {
      expect(hasExplicitComboIntent("is this a win\n  condition")).toBe(true);
    });

    it("returns false for empty or absent text", () => {
      expect(hasExplicitComboIntent("")).toBe(false);
      expect(hasExplicitComboIntent(undefined)).toBe(false);
    });
  });
});
