import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildQueryText,
  buildQueryTokens,
  collectCuratedRuleIds,
  loadGameRulesKeywordVocabulary,
  loadGameRulesRuleIndex,
  loadGameRulesTokenStats,
  retrieveSupplementalRules,
  retrieveSupplementalRulesWithDebug,
  type GameRulesRuleIndexEntry,
  type RetrievedGameRule,
  type ScoringResources
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

function makeResources(N: number, df: Record<string, number>, keywords: string[] = []): ScoringResources {
  return {
    tokenStats: { N, df: new Map(Object.entries(df)) },
    keywordVocabulary: new Set(keywords)
  };
}

function battlefieldCard(oracleText: string, name = "Test Card", typeLine = "Creature") {
  return {
    zoneId: "battlefield" as const,
    items: [
      {
        cardId: "test-card",
        name,
        oracleText,
        typeLine,
        imageUrl: "",
        manaCost: "",
        manaValue: 0,
        colors: [],
        supertypes: [],
        subtypes: [],
        targets: []
      }
    ]
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

// ---------------------------------------------------------------------------
// buildQueryText
// ---------------------------------------------------------------------------

describe("buildQueryText", () => {
  it("includes oracle text and typeLine for non-stack zone items", () => {
    const context = makeContext({
      populatedZones: [
        {
          zoneId: "battlefield",
          items: [
            {
              cardId: "rhystic-study",
              name: "Rhystic Study",
              oracleText: "Whenever a player casts a spell, unless that player pays {1}, you draw a card.",
              typeLine: "Enchantment",
              contextNotes: "Tax effect",
              imageUrl: "",
              manaCost: "{2}{U}",
              manaValue: 3,
              colors: ["U"],
              supertypes: [],
              subtypes: [],
              owner: "Player 1",
              targets: []
            }
          ]
        }
      ]
    });

    const queryText = buildQueryText(context);
    expect(queryText).toContain("Rhystic Study");
    expect(queryText).toContain("Enchantment");
    expect(queryText).toContain("Whenever a player casts a spell");
    expect(queryText).toContain("Tax effect");
  });

  it("includes contextNotes only when present on non-stack items", () => {
    const context = makeContext({
      populatedZones: [
        {
          zoneId: "hand",
          items: [
            {
              cardId: "lightning-bolt",
              name: "Lightning Bolt",
              oracleText: "Lightning Bolt deals 3 damage to any target.",
              typeLine: "Instant",
              imageUrl: "",
              manaCost: "{R}",
              manaValue: 1,
              colors: ["R"],
              supertypes: [],
              subtypes: [],
              targets: []
            }
          ]
        }
      ]
    });

    const queryText = buildQueryText(context);
    expect(queryText).toContain("Lightning Bolt");
    expect(queryText).toContain("Lightning Bolt deals 3 damage");
    expect(queryText).toContain("Instant");
  });
});

// ---------------------------------------------------------------------------
// buildQueryTokens (provenance, DEC-046)
// ---------------------------------------------------------------------------

describe("buildQueryTokens", () => {
  it("tags question tokens as question source and flags vocabulary keywords", () => {
    const context = makeContext({
      finalQuestion: "Does cascade trigger here",
      populatedZones: [battlefieldCard("flying creature")]
    });
    const { tokens } = buildQueryTokens(context, new Set(["cascade"]));
    const cascade = tokens.find((t) => t.token === "cascade");
    const flying = tokens.find((t) => t.token === "flying");

    expect(cascade).toMatchObject({ source: "question", isKeyword: true });
    expect(flying).toMatchObject({ source: "oracle", isKeyword: false });
  });

  it("dedupes a token across sources, preferring question provenance", () => {
    const context = makeContext({
      finalQuestion: "flying matters",
      populatedZones: [battlefieldCard("flying ability")]
    });
    const { tokens } = buildQueryTokens(context, new Set());
    const flyingEntries = tokens.filter((t) => t.token === "flying");
    expect(flyingEntries).toHaveLength(1);
    expect(flyingEntries[0]!.source).toBe("question");
  });

  it("extracts rule ids from the combined query text", () => {
    const context = makeContext({ finalQuestion: "What does 702.85 mean for cascade?" });
    const { queryRuleIds } = buildQueryTokens(context, new Set());
    expect(queryRuleIds).toContain("702.85");
  });
});

// ---------------------------------------------------------------------------
// IDF scoring, boosts, and tie-break (DEC-046)
// ---------------------------------------------------------------------------

describe("retrieveSupplementalRules — IDF scoring (DEC-046)", () => {
  it("ranks a question keyword above oracle-sourced noise", () => {
    const index = [
      makeEntry({ ruleId: "702.85", sectionTitle: "Cascade", text: "702.85. Cascade.", searchText: "702.85 cascade", parentRuleIds: ["702"] }),
      makeEntry({ ruleId: "100.1", sectionTitle: "General", text: "100.1. General.", searchText: "100.1 resolve", parentRuleIds: ["100"] })
    ];
    const context = makeContext({
      finalQuestion: "How does cascade work",
      populatedZones: [battlefieldCard("resolve")]
    });
    const resources = makeResources(3432, { cascade: 4, resolve: 100 }, ["cascade"]);
    const result = retrieveSupplementalRules(context, index, new Set(), 5, resources);

    expect(result[0]!.ruleId).toBe("702.85");
    const cascadeScore = result.find((r) => r.ruleId === "702.85")!.score;
    const noiseScore = result.find((r) => r.ruleId === "100.1")!.score;
    expect(cascadeScore).toBeGreaterThan(noiseScore);
  });

  it("boosts a keyword found in oracle text above generic low-IDF rules", () => {
    const index = [
      makeEntry({ ruleId: "702.2", sectionTitle: "Deathtouch", text: "702.2. Deathtouch.", searchText: "702.2 deathtouch lethal damage", parentRuleIds: ["702"] }),
      makeEntry({ ruleId: "100.6", sectionTitle: "General", text: "100.6. General.", searchText: "100.6 general rules game", parentRuleIds: ["100"] })
    ];
    const context = makeContext({
      finalQuestion: "What about damage rules",
      populatedZones: [battlefieldCard("Deathtouch")]
    });
    const resources = makeResources(3432, { deathtouch: 9, damage: 179, rules: 50 }, ["deathtouch"]);
    const result = retrieveSupplementalRules(context, index, new Set(), 5, resources);

    expect(result[0]!.ruleId).toBe("702.2");
    expect(result[0]!.score).toBeGreaterThan(result[1]!.score);
  });

  it("retains the exact rule-id (+100) and parent-id (+20) bonuses", () => {
    const index = [
      makeEntry({ ruleId: "405.1", sectionTitle: "The Stack", text: "405.1.", searchText: "405.1 stack", parentRuleIds: ["405"] }),
      makeEntry({ ruleId: "405.6", sectionTitle: "The Stack", text: "405.6.", searchText: "405.6 stack", parentRuleIds: ["405"] })
    ];
    // Exact mention of 405.1; bare "405" present so 405.6 gets the parent bonus.
    const context = makeContext({ finalQuestion: "Explain rules 405 and 405.1" });
    const resources = makeResources(3432, { stack: 201 }, []);
    const result = retrieveSupplementalRules(context, index, new Set(), 5, resources);

    const exact = result.find((r) => r.ruleId === "405.1")!;
    const parent = result.find((r) => r.ruleId === "405.6")!;
    expect(exact.score).toBeGreaterThanOrEqual(100);
    expect(parent.score).toBeGreaterThanOrEqual(20);
    expect(exact.score).toBeGreaterThan(parent.score);
  });

  it("breaks score ties by highest matched-token IDF before rule id", () => {
    // df products are equal (2*18 == 6*6) so the weighted totals are bit-identical,
    // but entry X has a higher single-token IDF than entry Y.
    const index = [
      makeEntry({ ruleId: "400.1", sectionTitle: "X", text: "400.1.", searchText: "alpha bravo", parentRuleIds: ["400"] }),
      makeEntry({ ruleId: "300.1", sectionTitle: "Y", text: "300.1.", searchText: "charlie delta", parentRuleIds: ["300"] })
    ];
    const context = makeContext({ finalQuestion: "alpha bravo charlie delta", gameContext: { playerCount: 2, players: [], turnPhase: "main_1", selectedZones: [] } });
    const resources = makeResources(1000, { alpha: 2, bravo: 18, charlie: 6, delta: 6 }, []);
    const result = retrieveSupplementalRules(context, index, new Set(), 5, resources);

    expect(result[0]!.ruleId).toBe("400.1");
    expect(result[0]!.score).toBeCloseTo(result[1]!.score, 10);
  });

  it("falls back to rule id ascending when score and top-token IDF tie", () => {
    const index = [
      makeEntry({ ruleId: "300.1", sectionTitle: "P", text: "300.1.", searchText: "alpha", parentRuleIds: ["300"] }),
      makeEntry({ ruleId: "200.1", sectionTitle: "Q", text: "200.1.", searchText: "alpha", parentRuleIds: ["200"] })
    ];
    const context = makeContext({ finalQuestion: "alpha", gameContext: { playerCount: 2, players: [], turnPhase: "main_1", selectedZones: [] } });
    const resources = makeResources(1000, { alpha: 2 }, []);
    const result = retrieveSupplementalRules(context, index, new Set(), 5, resources);

    expect(result.map((r) => r.ruleId)).toEqual(["200.1", "300.1"]);
  });

  it("still excludes curated rule ids from the supplemental pool", () => {
    const index = [
      makeEntry({ ruleId: "702.85", searchText: "702.85 cascade", parentRuleIds: ["702"] }),
      makeEntry({ ruleId: "702.86", searchText: "702.86 cascade", parentRuleIds: ["702"] })
    ];
    const context = makeContext({ finalQuestion: "cascade", gameContext: { playerCount: 2, players: [], turnPhase: "main_1", selectedZones: [] } });
    const resources = makeResources(3432, { cascade: 4 }, ["cascade"]);
    const result = retrieveSupplementalRules(context, index, new Set(["702.85"]), 5, resources);

    expect(result.map((r) => r.ruleId)).not.toContain("702.85");
    expect(result.map((r) => r.ruleId)).toContain("702.86");
  });
});

// ---------------------------------------------------------------------------
// Resource loaders (token stats + keyword vocabulary)
// ---------------------------------------------------------------------------

describe("loadGameRulesTokenStats", () => {
  it("parses N and per-token df into a map", () => {
    const dir = mkdtempSync(join(tmpdir(), "game-rules-stats-test-"));
    const filePath = join(dir, "stats.json");
    writeFileSync(filePath, JSON.stringify({ N: 3432, tokens: { cascade: { df: 4 }, damage: { df: 179 } } }), "utf8");
    const stats = loadGameRulesTokenStats(filePath);
    expect(stats?.N).toBe(3432);
    expect(stats?.df.get("cascade")).toBe(4);
    expect(stats?.df.get("damage")).toBe(179);
  });

  it("returns null and warns when the file is missing", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = loadGameRulesTokenStats("/tmp/does-not-exist-token-stats-xyz789.json");
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe("loadGameRulesKeywordVocabulary", () => {
  it("parses a { tokens: [...] } shape and lowercases entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "game-rules-vocab-test-"));
    const filePath = join(dir, "vocab.json");
    writeFileSync(filePath, JSON.stringify({ tokens: ["Cascade", "DEATHTOUCH"] }), "utf8");
    const vocab = loadGameRulesKeywordVocabulary(filePath);
    expect(vocab.has("cascade")).toBe(true);
    expect(vocab.has("deathtouch")).toBe(true);
  });

  it("parses a bare array shape", () => {
    const dir = mkdtempSync(join(tmpdir(), "game-rules-vocab-test-"));
    const filePath = join(dir, "vocab-array.json");
    writeFileSync(filePath, JSON.stringify(["trample", "lifelink"]), "utf8");
    const vocab = loadGameRulesKeywordVocabulary(filePath);
    expect(vocab.has("trample")).toBe(true);
    expect(vocab.has("lifelink")).toBe(true);
  });

  it("returns an empty set and warns when the file is missing", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const vocab = loadGameRulesKeywordVocabulary("/tmp/does-not-exist-vocab-xyz789.json");
    expect(vocab.size).toBe(0);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
