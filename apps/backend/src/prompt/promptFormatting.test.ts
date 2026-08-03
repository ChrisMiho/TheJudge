import { describe, expect, it } from "vitest";
import {
  buildZoneScopeSentence,
  formatConversationHistorySection,
  formatGameContext,
  formatSupplementalRulesSection
} from "./promptFormatting.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ConversationTurn, PromptContext } from "../types/index.js";

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

  describe("formatGameContext — player counter lines", () => {
    const baseGameContext: PromptContext["gameContext"] = {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
      selectedZones: ["stack"]
    };

    function contextWithPlayers(players: PromptContext["gameContext"]["players"]): PromptContext {
      return {
        finalQuestion: "Test",
        gameContext: { ...baseGameContext, players },
        populatedZones: [],
        orderedStack: []
      };
    }

    it("appends one ordered counter line immediately after a populated player's life line", () => {
      const context = contextWithPlayers([
        {
          label: "Player 1",
          lifeTotal: 40,
          poison: 3,
          commanderDamage: [{ from: "Player 2", amount: 5 }],
          counters: [{ name: "Monarch", amount: 1 }]
        },
        { label: "Player 2", lifeTotal: 20 }
      ]);

      const lines = formatGameContext(context).split("\n");
      const lifeLineIndex = lines.indexOf("Player 1: lifeTotal=40");

      expect(lifeLineIndex).toBeGreaterThan(-1);
      expect(lines[lifeLineIndex + 1]).toBe("Player 1 counters: poison=3, commanderDamage[Player 2]=5, Monarch=1");
    });

    it("orders scalar fields poison, experience, energy before commander damage and generic counters", () => {
      const context = contextWithPlayers([
        {
          label: "Player 1",
          lifeTotal: 40,
          energy: 2,
          experience: 1,
          poison: 3,
          counters: [{ name: "Monarch", amount: 1 }],
          commanderDamage: [{ from: "Player 2", amount: 5 }]
        },
        { label: "Player 2", lifeTotal: 20 }
      ]);

      const formatted = formatGameContext(context);
      expect(formatted).toContain("Player 1 counters: poison=3, experience=1, energy=2, commanderDamage[Player 2]=5, Monarch=1");
    });

    it("orders commander-damage entries by PlayerLabel regardless of input order", () => {
      const context = contextWithPlayers([
        {
          label: "Player 1",
          lifeTotal: 40,
          commanderDamage: [
            { from: "Player 3", amount: 2 },
            { from: "Player 2", amount: 5 }
          ]
        },
        { label: "Player 2", lifeTotal: 20 },
        { label: "Player 3", lifeTotal: 20 }
      ]);

      const formatted = formatGameContext(context);
      expect(formatted).toContain("Player 1 counters: commanderDamage[Player 2]=5, commanderDamage[Player 3]=2");
    });

    it("adds no counter line for a player with no populated values", () => {
      const context = contextWithPlayers([
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ]);

      const formatted = formatGameContext(context);
      expect(formatted).not.toContain("counters:");
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
