import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { formatGameRulesSection, loadGameRulesTopics, type GameRulesTopic } from "./gameRules.js";

const sampleTopics: GameRulesTopic[] = [
  {
    id: "stack-basics",
    title: "The Stack",
    ruleNumbers: ["405.1", "405.2"],
    excerpt: "405.1. When a spell is cast, the physical card is put on the stack.\n405.2. The stack keeps track of order."
  },
  {
    id: "abilities-trigger-basics",
    title: "Triggered Ability Basics",
    ruleNumbers: ["603.1"],
    excerpt: "603.1. Triggered abilities have a trigger condition and an effect."
  }
];

function writeTempArtifact(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "game-rules-test-"));
  const filePath = join(dir, "gameRulesByTopic.json");
  writeFileSync(filePath, JSON.stringify(content), "utf8");
  return filePath;
}

describe("Backend - Game Rules", () => {
  describe("loadGameRulesTopics", () => {
    it("loads and sorts topics by id from a valid artifact", () => {
      const filePath = writeTempArtifact([sampleTopics[1], sampleTopics[0]]);
      const topics = loadGameRulesTopics(filePath);
      expect(topics).toHaveLength(2);
      expect(topics[0]!.id).toBe("abilities-trigger-basics");
      expect(topics[1]!.id).toBe("stack-basics");
    });

    it("returns empty array when file is missing", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const topics = loadGameRulesTopics("/tmp/does-not-exist-game-rules.json");
      expect(topics).toEqual([]);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it("returns empty array and warns when artifact is malformed JSON", () => {
      const dir = mkdtempSync(join(tmpdir(), "game-rules-test-"));
      const filePath = join(dir, "bad.json");
      writeFileSync(filePath, "{ not valid json", "utf8");
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const topics = loadGameRulesTopics(filePath);
      expect(topics).toEqual([]);
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it("returns empty array when artifact is an empty array", () => {
      const filePath = writeTempArtifact([]);
      const topics = loadGameRulesTopics(filePath);
      expect(topics).toEqual([]);
    });

    it("skips entries with missing required fields", () => {
      const filePath = writeTempArtifact([
        sampleTopics[0],
        { id: "bad-entry", title: "No excerpt or ruleNumbers" }
      ]);
      const topics = loadGameRulesTopics(filePath);
      expect(topics).toHaveLength(1);
      expect(topics[0]!.id).toBe("stack-basics");
    });
  });

  describe("formatGameRulesSection", () => {
    it("returns empty string for empty topics array", () => {
      expect(formatGameRulesSection([])).toBe("");
    });

    it("includes GAME RULES header and disclaimer", () => {
      const section = formatGameRulesSection(sampleTopics);
      expect(section).toContain("GAME RULES (reference)");
      expect(section).toContain(
        "Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text."
      );
    });

    it("includes all topic titles and excerpts", () => {
      const section = formatGameRulesSection(sampleTopics);
      expect(section).toContain("The Stack");
      expect(section).toContain("405.1. When a spell is cast");
      expect(section).toContain("Triggered Ability Basics");
      expect(section).toContain("603.1. Triggered abilities have a trigger condition");
    });

    it("is deterministic across calls with same input", () => {
      expect(formatGameRulesSection(sampleTopics)).toBe(formatGameRulesSection(sampleTopics));
    });
  });
});
