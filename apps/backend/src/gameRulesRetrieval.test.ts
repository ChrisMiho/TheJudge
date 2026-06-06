import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  collectCuratedRuleIds,
  loadGameRulesRuleIndex,
  retrieveSupplementalRules,
  retrieveSupplementalRulesWithDebug,
  type GameRulesRuleIndexEntry,
  type RetrievedGameRule
} from "./gameRulesRetrieval.js";
import type { GameRulesTopic } from "./gameRules.js";
import type { PromptContext } from "./types/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeTempIndex(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "game-rules-index-test-"));
  const filePath = join(dir, "gameRulesRuleIndex.json");
  writeFileSync(filePath, JSON.stringify(content), "utf8");
  return filePath;
}

function makeEntry(overrides: Partial<GameRulesRuleIndexEntry> = {}): GameRulesRuleIndexEntry {
  return {
    ruleId: "100.1",
    sectionTitle: "General",
    text: "100.1. These Magic rules apply to any Magic game.",
    searchText: "100.1 general 100.1. these magic rules apply any magic game",
    parentRuleIds: ["100"],
    ...overrides
  };
}

function makeContext(overrides: Partial<PromptContext> = {}): PromptContext {
  return {
    finalQuestion: "What happens when a spell resolves?",
    gameContext: {
      playerCount: 2,
      players: [],
      turnPhase: "main_1",
      selectedZones: ["stack", "hand"]
    },
    populatedZones: [],
    orderedStack: [],
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// loadGameRulesRuleIndex
// ---------------------------------------------------------------------------

describe("loadGameRulesRuleIndex", () => {
  it("returns [] and warns when file is missing", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = loadGameRulesRuleIndex("/tmp/does-not-exist-rule-index-abc123.json");
    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("returns [] and warns when file is malformed JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "game-rules-index-test-"));
    const filePath = join(dir, "bad.json");
    writeFileSync(filePath, "{ not valid json", "utf8");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = loadGameRulesRuleIndex(filePath);
    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("loads and returns valid entries", () => {
    const entries = [
      makeEntry({ ruleId: "100.1" }),
      makeEntry({ ruleId: "405.1", sectionTitle: "The Stack", text: "405.1. The stack.", searchText: "405.1 stack", parentRuleIds: ["405"] })
    ];
    const filePath = writeTempIndex(entries);
    const result = loadGameRulesRuleIndex(filePath);
    expect(result).toHaveLength(2);
    expect(result[0]!.ruleId).toBe("100.1");
    expect(result[1]!.ruleId).toBe("405.1");
  });

  it("skips entries missing required fields", () => {
    const filePath = writeTempIndex([
      makeEntry({ ruleId: "100.1" }),
      { ruleId: "bad", sectionTitle: "Missing text and searchText" }
    ]);
    const result = loadGameRulesRuleIndex(filePath);
    expect(result).toHaveLength(1);
    expect(result[0]!.ruleId).toBe("100.1");
  });
});

// ---------------------------------------------------------------------------
// collectCuratedRuleIds
// ---------------------------------------------------------------------------

describe("collectCuratedRuleIds", () => {
  it("flattens ruleNumbers from all topics into a Set", () => {
    const topics: GameRulesTopic[] = [
      { id: "stack-basics", title: "The Stack", ruleNumbers: ["405.1", "405.2"], excerpt: "" },
      { id: "triggered", title: "Triggered Abilities", ruleNumbers: ["603.1", "405.1"], excerpt: "" }
    ];
    const ids = collectCuratedRuleIds(topics);
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(3);
    expect(ids.has("405.1")).toBe(true);
    expect(ids.has("405.2")).toBe(true);
    expect(ids.has("603.1")).toBe(true);
  });

  it("returns empty Set for no topics", () => {
    const ids = collectCuratedRuleIds([]);
    expect(ids.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// retrieveSupplementalRules
// ---------------------------------------------------------------------------

describe("retrieveSupplementalRules", () => {
  it("returns [] for empty index", () => {
    const context = makeContext();
    const result = retrieveSupplementalRules(context, [], new Set());
    expect(result).toEqual([]);
  });

  it("matches exact rule ID mention in question", () => {
    const index = [
      makeEntry({ ruleId: "405.1", sectionTitle: "The Stack", text: "405.1. The stack.", searchText: "405.1 stack", parentRuleIds: ["405"] })
    ];
    const context = makeContext({ finalQuestion: "What does rule 405.1 say about the stack?" });
    const result = retrieveSupplementalRules(context, index, new Set());
    expect(result).toHaveLength(1);
    expect(result[0]!.ruleId).toBe("405.1");
    expect(result[0]!.score).toBeGreaterThanOrEqual(100);
  });

  it("matches by keyword overlap", () => {
    const index = [
      makeEntry({
        ruleId: "603.1",
        sectionTitle: "Triggered Abilities",
        text: "603.1. Triggered abilities have a trigger condition and an effect.",
        searchText: "603.1 triggered abilities trigger condition effect",
        parentRuleIds: ["603"]
      }),
      makeEntry({
        ruleId: "700.1",
        sectionTitle: "Unrelated",
        text: "700.1. Something unrelated.",
        searchText: "700.1 something unrelated completely different",
        parentRuleIds: ["700"]
      })
    ];
    const context = makeContext({ finalQuestion: "How do triggered abilities work? What triggers condition?" });
    const result = retrieveSupplementalRules(context, index, new Set());
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.ruleId).toBe("603.1");
  });

  it("never returns rules whose ruleId is in excludeRuleIds", () => {
    const index = [
      makeEntry({ ruleId: "405.1", sectionTitle: "The Stack", text: "405.1. The stack.", searchText: "405.1 stack", parentRuleIds: ["405"] }),
      makeEntry({ ruleId: "405.2", sectionTitle: "The Stack 2", text: "405.2. More stack.", searchText: "405.2 stack more", parentRuleIds: ["405"] })
    ];
    const context = makeContext({ finalQuestion: "What does rule 405.1 and 405.2 say?" });
    const excludeRuleIds = new Set(["405.1"]);
    const result = retrieveSupplementalRules(context, index, excludeRuleIds);
    expect(result.every((r) => r.ruleId !== "405.1")).toBe(true);
    const ruleIds = result.map((r) => r.ruleId);
    expect(ruleIds).not.toContain("405.1");
  });

  it("caps results at max", () => {
    const index = Array.from({ length: 10 }, (_, i) => {
      const id = `${400 + i}.1`;
      return makeEntry({
        ruleId: id,
        sectionTitle: `Section ${i}`,
        text: `${id}. Rule about stack triggered abilities.`,
        searchText: `${id} rule stack triggered abilities`,
        parentRuleIds: [String(400 + i)]
      });
    });
    const context = makeContext({ finalQuestion: "How do triggered abilities work on stack?" });
    const result = retrieveSupplementalRules(context, index, new Set(), 2);
    expect(result).toHaveLength(2);
  });

  it("returns [] when no rules score positively", () => {
    const index = [
      makeEntry({
        ruleId: "200.1",
        sectionTitle: "Objects",
        text: "200.1. The parts of a card.",
        searchText: "200.1 parts",
        parentRuleIds: ["200"]
      })
    ];
    // Query has zero keyword overlap with the entry
    const context = makeContext({ finalQuestion: "xyz zzz qqq" });
    const result = retrieveSupplementalRules(context, index, new Set());
    expect(result).toEqual([]);
  });

  it("returns results sorted by score descending", () => {
    const index = [
      makeEntry({
        ruleId: "405.1",
        sectionTitle: "The Stack",
        text: "405.1. The stack.",
        searchText: "405.1 stack",
        parentRuleIds: ["405"]
      }),
      makeEntry({
        ruleId: "405.2",
        sectionTitle: "The Stack 2",
        text: "405.2. More stack content.",
        searchText: "405.2 stack content",
        parentRuleIds: ["405"]
      })
    ];
    // Exact mention of 405.1 only
    const context = makeContext({ finalQuestion: "What does rule 405.1 say?" });
    const result = retrieveSupplementalRules(context, index, new Set());
    // 405.1 should score higher due to exact match
    expect(result[0]!.ruleId).toBe("405.1");
  });

  it("returns scored RetrievedGameRule objects with ruleId, sectionTitle, text, score", () => {
    const entry = makeEntry({
      ruleId: "405.1",
      sectionTitle: "The Stack",
      text: "405.1. The stack.",
      searchText: "405.1 stack",
      parentRuleIds: ["405"]
    });
    const context = makeContext({ finalQuestion: "What does rule 405.1 say?" });
    const result = retrieveSupplementalRules(context, [entry], new Set());
    expect(result[0]).toMatchObject<Partial<RetrievedGameRule>>({
      ruleId: "405.1",
      sectionTitle: "The Stack",
      text: "405.1. The stack."
    });
    expect(typeof result[0]!.score).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// retrieveSupplementalRulesWithDebug
// ---------------------------------------------------------------------------

describe("retrieveSupplementalRulesWithDebug", () => {
  it("returns selected and runnerUp arrays with debug when index is populated", () => {
    const index = Array.from({ length: 8 }, (_, i) => {
      const id = `${400 + i}.1`;
      return makeEntry({
        ruleId: id,
        sectionTitle: `Section ${i}`,
        text: `${id}. Rule about stack triggered abilities.`,
        searchText: `${id} rule stack triggered abilities`,
        parentRuleIds: [String(400 + i)]
      });
    });
    const context = makeContext({ finalQuestion: "How do triggered abilities work on stack?" });
    const result = retrieveSupplementalRulesWithDebug(context, index, new Set(), 5);

    expect(result.selected.length).toBeLessThanOrEqual(5);
    expect(result.runnerUp.length).toBeLessThanOrEqual(10);
    expect(result.selected.length + result.runnerUp.length).toBeLessThanOrEqual(8);
    expect(result.debug.candidatesScored).toBeGreaterThan(0);
    expect(typeof result.debug.queryText).toBe("string");
    expect(Array.isArray(result.debug.queryTokens)).toBe(true);
    expect(Array.isArray(result.debug.queryRuleIds)).toBe(true);
  });

  it("debug.selected scores are numbers matching result.selected", () => {
    const entry = makeEntry({
      ruleId: "405.1",
      sectionTitle: "The Stack",
      text: "405.1. The stack.",
      searchText: "405.1 stack",
      parentRuleIds: ["405"]
    });
    const context = makeContext({ finalQuestion: "What does rule 405.1 say?" });
    const result = retrieveSupplementalRulesWithDebug(context, [entry], new Set(), 5);

    expect(result.debug.selected).toHaveLength(result.selected.length);
    if (result.debug.selected[0]) {
      expect(typeof result.debug.selected[0].score).toBe("number");
      expect(result.debug.selected[0].ruleId).toBe(result.selected[0]?.ruleId);
    }
  });

  it("excludedCuratedRuleCount matches excluded entries", () => {
    const index = [
      makeEntry({ ruleId: "405.1", searchText: "405.1 stack", parentRuleIds: ["405"] }),
      makeEntry({ ruleId: "405.2", searchText: "405.2 stack more", parentRuleIds: ["405"] })
    ];
    const context = makeContext({ finalQuestion: "What does rule 405.1 and 405.2 say?" });
    const result = retrieveSupplementalRulesWithDebug(context, index, new Set(["405.1"]), 5);

    expect(result.debug.excludedCuratedRuleCount).toBe(1);
    expect(result.selected.every((r) => r.ruleId !== "405.1")).toBe(true);
  });

  it("runnerUp length is capped at 10", () => {
    const index = Array.from({ length: 20 }, (_, i) => {
      const id = `${400 + i}.1`;
      return makeEntry({
        ruleId: id,
        sectionTitle: `Section ${i}`,
        text: `${id}. Rule about stack triggered abilities.`,
        searchText: `${id} rule stack triggered abilities`,
        parentRuleIds: [String(400 + i)]
      });
    });
    const context = makeContext({ finalQuestion: "How do triggered abilities work on stack?" });
    const result = retrieveSupplementalRulesWithDebug(context, index, new Set(), 5);

    expect(result.runnerUp.length).toBeLessThanOrEqual(10);
  });

  it("returns empty selected and runnerUp with debug for empty index", () => {
    const context = makeContext();
    const result = retrieveSupplementalRulesWithDebug(context, [], new Set(), 5);

    expect(result.selected).toEqual([]);
    expect(result.runnerUp).toEqual([]);
    expect(result.debug.candidatesScored).toBe(0);
    expect(result.debug.excludedCuratedRuleCount).toBe(0);
  });
});
