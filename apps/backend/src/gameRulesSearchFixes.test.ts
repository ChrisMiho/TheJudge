// right-rules-in-order, slice B: the search fixes -- word matching (REQ-233), the concept map's
// place in the query (REQ-234), per-card search (REQ-235), the blend weight (REQ-182) and the loud
// dimension mismatch (REQ-181).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  buildQueryTokens,
  buildRetrievalQuery,
  compareRuleIds,
  extractRuleIds,
  findObsoleteGlossaryTerms,
  getDefaultScoringResources,
  HYBRID_BLEND_ALPHA,
  KEYWORD_SET_CHAR_BUDGET,
  keywordRuleSetsForCards,
  PER_CARD_RESERVED_SLOTS,
  perCardTextKey,
  retrievalInputFromPromptContext,
  retrieveRulesForQuery,
  retrieveRulesForQueryWithDebug,
  SUPPLEMENTAL_RELEVANCE_CUTOFF,
  turnStepSearchName,
  type GameRulesRuleIndexEntry,
  type GameRulesGlossaryEntry,
  type QueryToken,
  type ScoringResources
} from "./gameRulesRetrieval.js";
import type { PromptContext } from "./types/index.js";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");

function entry(ruleId: string, searchText: string, overrides: Partial<GameRulesRuleIndexEntry> = {}): GameRulesRuleIndexEntry {
  return {
    ruleId,
    sectionTitle: "Section",
    text: `${ruleId} text`,
    searchText,
    parentRuleIds: [ruleId.split(".")[0]!],
    ...overrides
  };
}

function resourcesWith(overrides: Partial<ScoringResources> = {}): ScoringResources {
  return {
    tokenStats: { N: 1000, df: new Map() },
    keywordVocabulary: new Set(["deathtouch"]),
    ruleEmbeddings: null,
    glossary: [],
    ...overrides
  };
}

function context(overrides: Partial<PromptContext> = {}): PromptContext {
  return {
    finalQuestion: "Does it work?",
    gameContext: { playerCount: 2, players: [], turnPhase: "cleanup", selectedZones: [] },
    populatedZones: [],
    orderedStack: [],
    ...overrides
  };
}

function zoneCard(overrides: Record<string, unknown>) {
  return {
    cardId: "card-1",
    name: "Test Card",
    oracleText: "",
    typeLine: "Creature",
    keywords: [] as string[],
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    colors: [],
    supertypes: [],
    subtypes: [],
    targets: [],
    ...overrides
  };
}

describe("REQ-233 token fixes in the query", () => {
  it("reads \"attacks.\", \"attacking\" and \"attacked\" as one word", () => {
    const resources = resourcesWith();
    const tokens = (text: string): string[] =>
      buildRetrievalQuery({ questionText: text, cards: [] }, resources).tokens.map((token) => token.token);
    expect(tokens("It attacks.")).toEqual(tokens("it is attacking"));
    expect(tokens("It attacks.")).toEqual(["attack"]);
  });

  it("drops a trailing sentence period and keeps a rule id's dots", () => {
    const query = buildRetrievalQuery({ questionText: "Does rule 514.3a end the turn.", cards: [] }, resourcesWith());
    expect(query.tokens.map((token) => token.token)).toContain("514.3a");
    expect(query.tokens.map((token) => token.token)).toContain("turn");
  });

  it("keeps \"can't\" whole", () => {
    const query = buildRetrievalQuery({ questionText: "Why can't it block?", cards: [] }, resourcesWith());
    expect(query.tokens.map((token) => token.token)).toContain("can't");
  });

  it("matches a rule whose stored search text is stemmed", () => {
    const index = [entry("506.1", "506.1 combat phase attack creatur"), entry("506.2", "506.2 unrelated")];
    const query = buildRetrievalQuery({ questionText: "Which creatures were attacking?", cards: [] }, resourcesWith());
    const result = retrieveRulesForQuery(query.tokens, query.queryRuleIds, index, new Set(), 5, resourcesWith());
    expect(result.map((rule) => rule.ruleId)).toEqual(["506.1"]);
  });

  it("gives every one of a card's own Scryfall keywords the keyword weight, even off the static vocabulary", () => {
    const query = buildRetrievalQuery(
      {
        questionText: "How does this work?",
        cards: [{ name: "Test Card", typeLine: "Creature", keywords: ["Enchant", "First strike", "Mill"], oracleText: "" }]
      },
      resourcesWith()
    );
    const byToken = new Map<string, QueryToken>(query.tokens.map((token) => [token.token, token]));
    for (const word of ["enchant", "first", "strike", "mill"]) {
      expect(byToken.get(word)?.isKeyword, word).toBe(true);
    }
    // A word that is only part of the card's name or type line is not a keyword.
    expect(byToken.get("creatur")?.isKeyword).toBe(false);
    expect(byToken.get("test")?.isKeyword).toBe(false);
  });

  it("weights the question, a card signal and a concept term as 3, 1 and 2, with keywords on top", () => {
    const query = buildRetrievalQuery(
      {
        questionText: "Does deathtouch matter?",
        cards: [{ name: "Test Card", typeLine: "Creature", keywords: [], oracleText: "At the beginning of your upkeep, draw a card." }]
      },
      resourcesWith()
    );
    const byToken = new Map<string, QueryToken>(query.tokens.map((token) => [token.token, token]));
    expect(byToken.get("deathtouch")).toMatchObject({ source: "question", isKeyword: true });
    expect(byToken.get("creatur")).toMatchObject({ source: "oracle" });
    expect(byToken.get("upkeep")).toMatchObject({ source: "concept", isKeyword: false });
  });

  it("drops counter, destroy, exile, sacrifice, trigger and replacement from the keyword vocabulary (14 words left)", () => {
    const vocabulary = (JSON.parse(readFileSync(resolve(dataDir, "gameRulesKeywordVocabulary.json"), "utf8")) as { tokens: string[] }).tokens;
    expect(vocabulary).toHaveLength(14);
    for (const verb of ["counter", "destroy", "exile", "sacrifice", "trigger", "replacement"]) {
      expect(vocabulary).not.toContain(verb);
    }
  });

  it("counts a bare three-digit number as a rule id only after rule, rules, CR or section", () => {
    expect(extractRuleIds("What does rule 613 say?")).toEqual(["613"]);
    expect(extractRuleIds("per CR 613 and rules 614")).toEqual(["613", "614"]);
    expect(extractRuleIds("see section 702")).toEqual(["702"]);
    expect(extractRuleIds("I have 613 life")).toEqual([]);
    expect(extractRuleIds("gain 100 life and 613")).toEqual([]);
  });

  it("always counts a dotted rule id, with up to two trailing letters", () => {
    expect(extractRuleIds("see 613.9 and 704.5aa and 514.3a")).toEqual(["613.9", "704.5aa", "514.3a"]);
    // "rule 613.9" is the dotted id, not a bare 613.
    expect(extractRuleIds("rule 613.9")).toEqual(["613.9"]);
  });

  it("does not boost rule 100 for \"100 life\"", () => {
    const query = buildQueryTokens(context({ finalQuestion: "I gain 100 life" }), new Set());
    expect(query.queryRuleIds).toEqual([]);
  });

  it("breaks ties in rule-book order: 704.5z before 704.5aa", () => {
    expect(["704.5aa", "704.5z", "704.5a", "704.5"].sort(compareRuleIds)).toEqual(["704.5", "704.5a", "704.5z", "704.5aa"]);
    expect(["514.10", "514.9", "513.1", "514"].sort(compareRuleIds)).toEqual(["513.1", "514", "514.9", "514.10"]);

    const index = [entry("704.5aa", "same"), entry("704.5z", "same")];
    const result = retrieveRulesForQuery(
      [{ token: "same", source: "question", isKeyword: false }],
      [],
      index,
      new Set(),
      5,
      resourcesWith({ tokenStats: { N: 100, df: new Map([["same", 2]]) } })
    );
    expect(result.map((rule) => rule.ruleId)).toEqual(["704.5z", "704.5aa"]);
  });
});

describe("REQ-233 obsolete terms through the glossary", () => {
  const glossary: GameRulesGlossaryEntry[] = [
    { term: "Mana Burn", definition: "Older versions stated that unspent mana caused a player to lose life.", obsolete: true },
    { term: "Play", definition: "To play a land. (Obsolete) Casting used to be playing.", obsolete: true, obsoleteSense: true },
    { term: "During", definition: "Some older cards used the phrase during phase.", obsolete: true },
    { term: "Remove from the Game, Removed", definition: "An obsolete term for exile.", obsolete: true },
    { term: "Trample", definition: "A keyword.", obsolete: false }
  ];
  const tokenStats = { N: 1000, df: new Map([["dure", 151], ["remov", 109]]) };

  it("finds an obsolete term the question uses, and returns its definition", () => {
    const found = findObsoleteGlossaryTerms("Does mana burn still exist?", glossary, tokenStats);
    expect(found.terms).toEqual(["Mana Burn"]);
    expect(found.definitionText).toContain("unspent mana");
  });

  it("matches a multi-word alternate, but not a live single word or a single obsolete sense", () => {
    expect(findObsoleteGlossaryTerms("Can it remove from the game a card?", glossary, tokenStats).terms).toEqual([
      "Remove from the Game, Removed"
    ]);
    expect(findObsoleteGlossaryTerms("Is a card removed during the turn? Can I play it?", glossary, tokenStats).terms).toEqual([]);
  });

  it("adds the definition's words to the word query at concept weight and to the embedded text", () => {
    const resources = resourcesWith({ glossary, tokenStats });
    const query = buildRetrievalQuery({ questionText: "Does mana burn exist?", cards: [] }, resources);
    expect(query.obsoleteTerms).toEqual(["Mana Burn"]);
    expect(query.queryText).toContain("unspent mana caused a player to lose life");
    expect(query.tokens.find((token) => token.token === "unspent")).toMatchObject({ source: "concept" });
  });

  it("never delivers a glossary entry as an excerpt: the glossary is not part of the rule index", () => {
    const index = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as GameRulesRuleIndexEntry[];
    expect(index.some((rule) => rule.text.startsWith("Mana Burn"))).toBe(false);
  });

  it("works with the committed glossary", () => {
    const resources = getDefaultScoringResources();
    const found = findObsoleteGlossaryTerms("Does mana burn exist?", resources.glossary ?? [], resources.tokenStats);
    expect(found.terms).toEqual(["Mana Burn"]);
  });
});

describe("REQ-178 / REQ-234 the main query", () => {
  it("never carries a card's raw oracle text, in the word query or the embedded text", () => {
    const oracle = "Whenever a creature you control dies, exile target graveyard filler wording";
    const query = buildRetrievalQuery(
      { questionText: "What happens?", cards: [{ name: "Test Card", typeLine: "Creature", keywords: [], oracleText: oracle }] },
      resourcesWith()
    );
    expect(query.queryText).not.toContain("graveyard filler wording");
    expect(query.queryText).not.toContain("exile target");
    expect(query.tokens.map((token) => token.token)).not.toContain("filler");
  });

  it("adds the concept terms the cards' wording produced to the word query and the embedded text", () => {
    const query = buildRetrievalQuery(
      {
        questionText: "What happens?",
        cards: [{ name: "Test Card", typeLine: "Creature", keywords: [], oracleText: "At the beginning of your upkeep, draw a card." }]
      },
      resourcesWith()
    );
    expect(query.conceptTerms).toEqual(["upkeep step triggered ability", "draw card"]);
    expect(query.queryText).toBe("What happens? Test Card Creature upkeep step triggered ability, draw card");
    expect(query.tokens.find((token) => token.token === "upkeep")).toMatchObject({ source: "concept" });
  });

  it("adds the In-Depth turn step to the word query and the embedded text", () => {
    const query = buildRetrievalQuery(retrievalInputFromPromptContext(context()), resourcesWith());
    expect(query.queryText).toContain("cleanup step");
    expect(query.tokens.find((token) => token.token === "cleanup")).toMatchObject({ source: "concept" });
  });

  it("names every phase and combat step the way the rule book does", () => {
    expect(turnStepSearchName("untap")).toBe("untap step");
    expect(turnStepSearchName("main_1")).toBe("precombat main phase");
    expect(turnStepSearchName("main_2")).toBe("postcombat main phase");
    expect(turnStepSearchName("end_step")).toBe("end step");
    expect(turnStepSearchName("combat", "declare_blockers")).toBe("declare blockers step");
    expect(turnStepSearchName("combat")).toBe("combat phase");
  });

  it("leaves Quick Lookup (no turn step) without a step word", () => {
    const query = buildRetrievalQuery({ questionText: "Does it work?", cards: [] }, resourcesWith());
    expect(query.queryText).toBe("Does it work?");
  });

  it("builds game and lookup queries through the same builder", () => {
    const card = zoneCard({ oracleText: "Draw a card." });
    const game = retrievalInputFromPromptContext(context({ populatedZones: [{ zoneId: "battlefield", items: [card as never] }] }));
    expect(game.cards).toHaveLength(1);
    expect(game.turnStep).toBe("cleanup step");
  });
});

describe("REQ-181 / REQ-182 blend and loud mismatch", () => {
  it("blends meaning 0.65 and words 0.35", () => {
    expect(HYBRID_BLEND_ALPHA).toBe(0.65);
    expect(HYBRID_BLEND_ALPHA).toBeGreaterThanOrEqual(0.5);
    expect(HYBRID_BLEND_ALPHA).toBeLessThanOrEqual(0.7);
  });

  it("reports an OpenAI-sized query vector against the 384-dimension rule vectors with one error naming both sizes, then ranks lexically", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dims = 384;
    const embeddings = {
      model: "committed-model",
      dims,
      ruleIds: ["601.2"],
      vectors: [Array.from({ length: dims }, () => 0.05)]
    };
    const wrongSizedVector = Array.from({ length: 1536 }, () => 0.01);
    const result = retrieveRulesForQueryWithDebug(
      [{ token: "cast", source: "question", isKeyword: false }],
      [],
      [entry("601.2", "601.2 cast")],
      new Set(),
      5,
      resourcesWith({ ruleEmbeddings: embeddings, tokenStats: { N: 100, df: new Map([["cast", 3]]) } }),
      wrongSizedVector
    );
    expect(result.debug.usedSemantic).toBe(false);
    expect(result.selected.map((rule) => rule.ruleId)).toEqual(["601.2"]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const message = String(errorSpy.mock.calls[0]![0]);
    expect(message).toContain("1536");
    expect(message).toContain("384");
    // Asked again, the diagnostic is not repeated.
    retrieveRulesForQueryWithDebug([], [], [entry("601.2", "601.2 cast")], new Set(), 5, resourcesWith({ ruleEmbeddings: embeddings }), wrongSizedVector);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

describe("REQ-235 per-card search", () => {
  // Twelve rules on a two-dimension plane, at angles. The main query vector sits at 0.5 degrees, so
  // the main ranking is the eight rules at 0..7 degrees (100.1..107.1); the four others sit at 45,
  // 60, 75 and 90 degrees (108.1..111.1) and are reached only through a card.
  const angles = (degrees: number): number[] => [Math.cos((degrees * Math.PI) / 180), Math.sin((degrees * Math.PI) / 180)];
  const ids = Array.from({ length: 12 }, (_, i) => `${100 + i}.1`);
  const vectors = [0, 1, 2, 3, 4, 5, 6, 7, 45, 60, 75, 90].map(angles);
  const index = ids.map((id) => entry(id, `${id} word`));
  const embeddings = { model: "m", dims: 2, ruleIds: ids, vectors };
  const resources = resourcesWith({ ruleEmbeddings: embeddings, tokenStats: { N: 100, df: new Map([["word", 90]]) } });
  const mainVector = angles(0.5);
  const tokens: QueryToken[] = [];
  const select = (max: number, cards: Array<{ cardName: string; vector: number[] }>, queryVector: number[] | null = mainVector, exclude = new Set<string>()) =>
    retrieveRulesForQueryWithDebug(tokens, [], index, exclude, max, resources, queryVector, "q", [], cards);

  it("reserves two slots: the main ranking keeps the first max - 2", () => {
    expect(PER_CARD_RESERVED_SLOTS).toBe(2);
    const result = select(10, [
      { cardName: "A", vector: angles(45) },
      { cardName: "B", vector: angles(90) }
    ]);
    const selected = result.selected.map((rule) => rule.ruleId);
    expect(selected).toHaveLength(10);
    expect(selected.slice(0, 8)).toEqual(ids.slice(0, 8));
    expect(selected.slice(8)).toEqual(["108.1", "111.1"]);
    expect(result.debug.perCardSelected).toEqual([
      { ruleId: "108.1", cardName: "A" },
      { ruleId: "111.1", cardName: "B" }
    ]);
  });

  it("takes cards in order of their best score, and skips a card whose top rule is already selected", () => {
    const result = select(10, [
      { cardName: "Far", vector: angles(75.5) },
      { cardName: "Same as main", vector: angles(1.2) }, // best score of all, but its top rule is already one of the main eight
      { cardName: "Duplicate of Far", vector: angles(75.5) },
      { cardName: "Closer", vector: angles(61.5) }
    ]);
    // Cards come in order of their best score. The card whose top rule is already selected is
    // skipped, and so is the second card pointing at a rule an earlier card just took.
    expect(result.debug.perCardSelected).toEqual([
      { ruleId: "110.1", cardName: "Far" },
      { ruleId: "109.1", cardName: "Closer" }
    ]);
  });

  it("fills a slot the cards leave open from the main ranking, never exceeding the cap", () => {
    // The relevance cutoff (REQ-190) may leave fewer than ten, never more.
    const none = select(10, [{ cardName: "Same as main", vector: angles(1.2) }]);
    expect(none.selected.length).toBeGreaterThanOrEqual(8);
    expect(none.selected.length).toBeLessThanOrEqual(10);
    expect(none.debug.perCardSelected).toEqual([]);
    const oneCard = select(10, [{ cardName: "A", vector: angles(75.5) }]);
    expect(oneCard.selected.length).toBeGreaterThanOrEqual(9);
    expect(oneCard.selected.length).toBeLessThanOrEqual(10);
    expect(oneCard.debug.perCardSelected).toHaveLength(1);
  });

  it("is a separate query: a card's text never changes the main eight", () => {
    const withCard = select(10, [{ cardName: "A", vector: angles(90) }]);
    const without = select(10, []);
    expect(withCard.selected.slice(0, 8).map((rule) => rule.ruleId)).toEqual(without.selected.slice(0, 8).map((rule) => rule.ruleId));
  });

  it("keeps the two per-card slots in a larger-cap test leg", () => {
    const result = select(9, [
      { cardName: "A", vector: angles(45) },
      { cardName: "B", vector: angles(90) }
    ]);
    expect(result.selected).toHaveLength(9);
    expect(result.debug.perCardSelected).toHaveLength(2);
    expect(result.selected.slice(7).map((rule) => rule.ruleId)).toEqual(["108.1", "111.1"]);
  });

  it("does nothing without a query vector (the mock provider and the lexical fallback)", () => {
    const result = select(10, [{ cardName: "A", vector: angles(45) }], null);
    expect(result.debug.usedSemantic).toBe(false);
    expect(result.debug.perCardSelected).toEqual([]);
  });

  it("honours the exact-number curated exclusion", () => {
    const result = select(10, [{ cardName: "A", vector: angles(45) }], mainVector, new Set(["108.1"]));
    expect(result.selected.map((rule) => rule.ruleId)).not.toContain("108.1");
  });

  it("keys a card's search text by a hash of the text", () => {
    expect(perCardTextKey("Draw a card.")).toMatch(/^[0-9a-f]{64}$/);
    expect(perCardTextKey("Draw a card.")).toBe(perCardTextKey("Draw a card."));
    expect(perCardTextKey("Draw a card.")).not.toBe(perCardTextKey("Draw two cards."));
  });

  it("lists one search text per distinct card with oracle text", () => {
    const query = buildRetrievalQuery(
      {
        questionText: "q",
        cards: [
          { cardId: "a", name: "A", typeLine: "Instant", oracleText: "Draw a card." },
          { cardId: "a", name: "A", typeLine: "Instant", oracleText: "Draw a card." },
          { cardId: "b", name: "B", typeLine: "Land", oracleText: "" },
          { cardId: "c", name: "C", typeLine: "Sorcery", oracleText: "Draw two cards." }
        ]
      },
      resourcesWith()
    );
    expect(query.perCardTexts.map((card) => card.cardName)).toEqual(["A", "C"]);
    expect(query.queryText).not.toContain("Draw two cards");
  });
});

describe("REQ-190 relevance cutoff", () => {
  // Rules at angles from a query at 0.5 degrees: cosine to the query falls as the angle grows.
  const angles = (degrees: number): number[] => [Math.cos((degrees * Math.PI) / 180), Math.sin((degrees * Math.PI) / 180)];
  const degrees = [0, 1, 2, 3, 4, 5, 6, 7, 45, 60, 75, 90];
  const ids = degrees.map((_, i) => `${100 + i}.1`);
  const embeddings = { model: "m", dims: 2, ruleIds: ids, vectors: degrees.map(angles) };
  const resources = resourcesWith({ ruleEmbeddings: embeddings, tokenStats: { N: 100, df: new Map([["word", 90]]) } });
  const index = ids.map((id) => entry(id, `${id} word`));
  const run = (queryRuleIds: string[], queryVector: number[] | null, max = 15) =>
    retrieveRulesForQueryWithDebug([], queryRuleIds, index, new Set(), max, resources, queryVector, "q", []);

  it("drops main candidates scoring under 0.6 of the top one, so a cap of 15 does not pad the list", () => {
    expect(SUPPLEMENTAL_RELEVANCE_CUTOFF).toBe(0.6);
    const result = run([], angles(0.5));
    const selected = result.selected.map((rule) => rule.ruleId);
    expect(selected.slice(0, 8)).toEqual(ids.slice(0, 8));
    expect(selected.length).toBeLessThan(12);
    expect(selected).not.toContain("111.1");
    expect(result.debug.usedSemantic).toBe(true);
  });

  it("keeps a rule the question cites by number even when its blend is far under the cutoff", () => {
    const result = run(["111.1"], angles(0.5));
    expect(result.selected.map((rule) => rule.ruleId)).toContain("111.1");
  });

  it("the lexical-only fallback keeps a plain top-N with no cutoff", () => {
    const result = retrieveRulesForQueryWithDebug([{ token: "word", source: "question", isKeyword: false }], [], index, new Set(), 12, resources, null, "q", []);
    expect(result.debug.usedSemantic).toBe(false);
    expect(result.selected).toHaveLength(12);
  });
});

describe("REQ-235 keyword sets", () => {
  const piece = (ruleId: string, title: string, text: string) =>
    entry(ruleId, `${ruleId} word`, { text, keywordTitle: title, parentRuleIds: [ruleId.replace(/[a-z]+$/, ""), ruleId.split(".")[0]!] });
  const long = (n: number) => "x".repeat(n);
  const index: GameRulesRuleIndexEntry[] = [
    entry("100.1", "100.1 word"),
    piece("702.2a", "Deathtouch", "702.2a short"),
    piece("702.2b", "Deathtouch", "702.2b short"),
    piece("702.2c", "Deathtouch", "702.2c short"),
    piece("702.9a", "Flying", long(5000)),
    piece("702.9b", "Flying", long(2000)),
    piece("702.19a", "Trample", "702.19a short")
  ];
  const card = (name: string, keywords: string[], oracleText = "text") => ({ name, typeLine: "Creature", keywords, oracleText });
  const resources = resourcesWith();
  const run = (cards: ReturnType<typeof card>[], exclude = new Set<string>()) =>
    retrieveRulesForQueryWithDebug(
      [{ token: "word", source: "question", isKeyword: false }],
      [],
      index,
      exclude,
      1,
      resources,
      null,
      "q",
      [],
      [],
      keywordRuleSetsForCards(cards, index)
    );

  it("matches a card's Scryfall keyword to the rule's title and adds every lettered piece after the excerpts", () => {
    const sets = keywordRuleSetsForCards([card("Snake", ["Deathtouch"])], index);
    expect(sets).toEqual([{ cardName: "Snake", keyword: "Deathtouch", ruleId: "702.2", pieceIds: ["702.2a", "702.2b", "702.2c"] }]);
    const result = run([card("Snake", ["Deathtouch"])]);
    expect(result.selected).toHaveLength(4);
    expect(result.selected.slice(1).map((rule) => rule.ruleId)).toEqual(["702.2a", "702.2b", "702.2c"]);
    expect(result.debug.keywordSetSelected.map((hit) => hit.cardName)).toEqual(["Snake", "Snake", "Snake"]);
  });

  it("skips pieces already selected or excluded, and cards with no oracle text or no matching keyword", () => {
    const excluded = run([card("Snake", ["Deathtouch"])], new Set(["702.2b"]));
    expect(excluded.selected.map((rule) => rule.ruleId)).not.toContain("702.2b");
    expect(keywordRuleSetsForCards([card("Vanilla", [], "text"), card("Blank", ["Deathtouch"], "")], index)).toEqual([]);
    expect(keywordRuleSetsForCards([card("Odd", ["Not A Keyword"])], index)).toEqual([]);
  });

  it("skips a set whole when it would overflow the character budget, and keeps later sets", () => {
    expect(KEYWORD_SET_CHAR_BUDGET).toBe(6000);
    // Flying alone is 7,000 characters; the Trample set still fits.
    const result = run([card("Bird", ["Flying", "Trample"])]);
    const ids = result.selected.map((rule) => rule.ruleId);
    expect(ids).not.toContain("702.9a");
    expect(ids).not.toContain("702.9b");
    expect(ids).toContain("702.19a");
  });

  it("counts one set per rule even when two cards share the keyword", () => {
    const sets = keywordRuleSetsForCards([card("A", ["Deathtouch"]), card("B", ["Deathtouch"])], index);
    expect(sets).toHaveLength(1);
  });
});
