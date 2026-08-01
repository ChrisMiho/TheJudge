import { describe, expect, it } from "vitest";
import {
  buildZoneScopeSentence,
  formatConversationHistorySection,
  formatSupplementalRulesSection
} from "./promptFormatting.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn } from "../types/index.js";

describe("Backend - Ask AI", () => {
  describe("buildZoneScopeSentence", () => {
    it("lists all zones when none are populated", () => {
      const sentence = buildZoneScopeSentence(["stack"], []);
      expect(sentence).toContain("stack, battlefield, hand, graveyard, exile, library, command");
      expect(sentence).toContain("Zones with no cards or not included");
    });

    it("excludes populated zones from scope sentence", () => {
      const sentence = buildZoneScopeSentence(["stack", "battlefield"], ["stack", "battlefield"]);
      expect(sentence).toContain("hand, graveyard, exile, library, command");
      expect(sentence).not.toContain("stack");
      expect(sentence).not.toContain("battlefield");
    });

    it("uses canonical zone order in scope sentence", () => {
      const sentence = buildZoneScopeSentence(["stack"], ["stack"]);
      const colonIdx = sentence.indexOf(":");
      const zonesPart = sentence.slice(colonIdx + 2);
      expect(zonesPart.startsWith("battlefield")).toBe(true);
    });

    it("returns all-included string when every zone is populated", () => {
      const allZones = ["stack", "battlefield", "hand", "graveyard", "exile", "library", "command"] as const;
      const sentence = buildZoneScopeSentence([...allZones], [...allZones]);
      expect(sentence).toBe("(all zones included)");
    });
  });

  describe("formatSupplementalRulesSection", () => {
    it("returns empty string when no rules provided", () => {
      expect(formatSupplementalRulesSection([])).toBe("");
    });

    it("renders header, disclaimer, and rule entries", () => {
      const rules: RetrievedGameRule[] = [
        { ruleId: "116.1", sectionTitle: "Timing", text: "Unless a spell or ability has a timing restriction.", score: 10 },
        { ruleId: "116.2a", sectionTitle: "Timing", text: "A player may cast an instant spell any time.", score: 5 }
      ];
      const section = formatSupplementalRulesSection(rules);
      expect(section).toContain("ADDITIONAL RELEVANT RULE EXCERPTS");
      expect(section).toContain("They do not override the user's submitted game state");
      expect(section).toContain("116.1. Unless a spell or ability has a timing restriction.");
      expect(section).toContain("116.2a. A player may cast an instant spell any time.");
    });
  });

  describe("formatConversationHistorySection", () => {
    it("returns empty string for empty turns array", () => {
      expect(formatConversationHistorySection([])).toBe("");
    });

    it("formats each turn as User:/Assistant: prefixed lines under header", () => {
      const turns: ConversationTurn[] = [
        { role: "user", content: "What happens?" },
        { role: "assistant", content: "It resolves." }
      ];
      const section = formatConversationHistorySection(turns);
      expect(section).toContain("CONVERSATION HISTORY");
      expect(section).toContain("User: What happens?");
      expect(section).toContain("Assistant: It resolves.");
    });
  });
});
