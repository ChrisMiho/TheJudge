import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import { loadGameRulesRuleIndex, type GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import type { CardDetailEntry } from "../cardDetail.js";
import type { LookupAskAiRequest } from "../types/index.js";
import { ALWAYS_ON_TOPIC_IDS } from "../gameRulesTopicSelection.js";
import { preparePromptInput } from "./preparation.js";
import type { CardDetailIndex } from "./context.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** REQ-176: System 3 now scores query tokens off the server-resolved descriptive
 * block, not the request card — build a synthetic per-test index so these
 * fixtures still exercise oracle-text-driven retrieval. */
function cardDetailIndexFrom(
  cards: Array<Partial<CardDetailEntry> & { cardId: string }>
): CardDetailIndex {
  const index = new Map<string, CardDetailEntry>();
  for (const card of cards) {
    index.set(card.cardId, {
      oracleText: card.oracleText ?? "",
      typeLine: card.typeLine ?? "",
      manaCost: card.manaCost ?? "",
      manaValue: card.manaValue ?? 0,
      colors: card.colors ?? [],
      supertypes: card.supertypes ?? [],
      subtypes: card.subtypes ?? [],
      // REQ-180: System 3's per-card keyword signal comes from this field,
      // not from tokenizing oracleText — fixtures that want a card to drive
      // retrieval must carry it explicitly.
      keywords: card.keywords ?? []
    });
  }
  return index;
}

const topics: GameRulesTopic[] = [
  ...ALWAYS_ON_TOPIC_IDS.map((id) => ({
    id,
    title: id,
    ruleNumbers: [`${100 + ALWAYS_ON_TOPIC_IDS.indexOf(id)}.1`],
    excerpt: `${id} excerpt`
  })),
  { id: "combat-phase-structure", title: "Combat", ruleNumbers: ["500.1"], excerpt: "combat excerpt" }
];

const ruleIndex: GameRulesRuleIndexEntry[] = [
  {
    ruleId: "702.2",
    sectionTitle: "Deathtouch",
    text: "Deathtouch is a static ability.",
    searchText: "702.2 deathtouch static ability lethal damage",
    parentRuleIds: ["702"]
  }
];

describe("Backend - Ask AI", () => {
  describe("preparePromptInput lookup mode", () => {
    it("uses exactly the always-on topics and question-driven supplemental rules without a card", () => {
      const request: LookupAskAiRequest = { mode: "lookup", question: "How does deathtouch work?" };
      const prepared = preparePromptInput(request, {
        gameRulesTopics: topics,
        gameRulesRuleIndex: ruleIndex,
        collectEnrichmentDebug: true
      });

      expect(prepared.enrichmentDebug?.curatedGameRules.topicIds).toEqual(
        topics.filter((topic) => ALWAYS_ON_TOPIC_IDS.includes(topic.id as (typeof ALWAYS_ON_TOPIC_IDS)[number])).map((topic) => topic.id)
      );
      expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("702.2");
      expect(prepared.enrichmentDebug?.rulings.cardsConsidered).toEqual([]);
      expect(prepared.promptText).not.toContain("CARD (looked up)");
    });

    it("scores supplemental rules from an attached card's keywords and includes its rulings (REQ-180)", () => {
      const request: LookupAskAiRequest = {
        mode: "lookup",
        question: "What does this thing do?",
        cards: [
          {
            cardId: "questing-beast",
            name: "Questing Beast",
            oracleText: "Vigilance, deathtouch, haste",
            imageUrl: "",
            manaCost: "{2}{G}{G}",
            manaValue: 4,
            typeLine: "Legendary Creature — Beast",
            colors: ["G"],
            supertypes: ["Legendary"],
            subtypes: ["Beast"],
            keywords: ["Deathtouch"]
          }
        ]
      };
      const prepared = preparePromptInput(request, {
        gameRulesTopics: topics,
        gameRulesRuleIndex: ruleIndex,
        cardRulingsIndex: new Map([
          ["questing-beast", [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]]
        ]),
        cardDetailIndex: cardDetailIndexFrom(request.cards ?? []),
        collectEnrichmentDebug: true
      });

      expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("702.2");
      expect(prepared.enrichmentDebug?.rulings.cardsConsidered).toEqual([
        { cardId: "questing-beast", name: "Questing Beast" }
      ]);
      expect(prepared.promptText).toContain("CARD (looked up)");
      expect(prepared.promptText).toContain("OFFICIAL RULINGS (WotC reference)");
    });

    it("scores supplemental rules and rulings from every attached card, in order (REQ-167)", () => {
      const request: LookupAskAiRequest = {
        mode: "lookup",
        question: "How do these two abilities interact?",
        cards: [
          {
            cardId: "questing-beast",
            name: "Questing Beast",
            oracleText: "Vigilance, deathtouch, haste",
            imageUrl: "",
            manaCost: "{2}{G}{G}",
            manaValue: 4,
            typeLine: "Legendary Creature — Beast",
            colors: ["G"],
            supertypes: ["Legendary"],
            subtypes: ["Beast"]
            // No `keywords` here on purpose: the retrieval hit below must come
            // from the second card, proving the query is built from every
            // attached card, not only the first.
          },
          {
            cardId: "snapcaster-mage",
            name: "Snapcaster Mage",
            oracleText: "Flash. When Snapcaster Mage enters, target instant or sorcery card in your graveyard gains flashback.",
            imageUrl: "",
            manaCost: "{1}{U}",
            manaValue: 2,
            typeLine: "Creature — Human Wizard",
            colors: ["U"],
            supertypes: [],
            subtypes: ["Human", "Wizard"],
            // Synthetic for this test only — proves the second card's keyword
            // signal reaches the query, not a claim about the real card.
            keywords: ["Deathtouch"]
          }
        ]
      };
      const prepared = preparePromptInput(request, {
        gameRulesTopics: topics,
        gameRulesRuleIndex: ruleIndex,
        cardRulingsIndex: new Map([
          ["questing-beast", [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]],
          ["snapcaster-mage", [{ publishedAt: "2011-06-01", comment: "Flashback is granted only for that turn." }]]
        ]),
        cardDetailIndex: cardDetailIndexFrom(request.cards ?? []),
        collectEnrichmentDebug: true
      });

      // Both attached cards feed rulings resolution, in the order submitted.
      expect(prepared.enrichmentDebug?.rulings.cardsConsidered).toEqual([
        { cardId: "questing-beast", name: "Questing Beast" },
        { cardId: "snapcaster-mage", name: "Snapcaster Mage" }
      ]);
      // A rule id retrievable only through the second card's keyword signal
      // (REQ-180) still shows the System 3 query was built from every
      // attached card, not one.
      expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("702.2");
      expect(prepared.promptText).toContain("name: Questing Beast");
      expect(prepared.promptText).toContain("name: Snapcaster Mage");
      expect(prepared.promptText.match(/CARD \(looked up\)/g)).toHaveLength(1);
    });
  });

  // REQ-182 (review loop 1, Critical A1): lookup mode's two preparePromptInput
  // call sites (collectEnrichmentDebug true and false) passed only eight
  // positional arguments to retrieveRulesForQueryWithDebug/retrieveRulesForQuery,
  // so the ninth/eighth parameter (questionRuleIds) always defaulted to `[]`
  // and the cross-reference boost never fired for a lookup-mode question — only
  // the game-mode path (retrieveSupplementalRules(WithDebug), which already
  // passes query.questionRuleIds) got the boost. Uses the real committed rule
  // index/embeddings artifact (not the small synthetic index the other tests in
  // this file use) because the cross-reference relationship under test —
  // 701.8b's own text cites rule 704.5g — only exists in the real corpus. The
  // query embedding is a committed frozen vector (no live embedding call at
  // test time, same convention as the eval harness's frozen-query-embeddings.json).
  describe("preparePromptInput lookup mode — cross-reference boost (REQ-182, review loop 1)", () => {
    const realGameRulesTopics: GameRulesTopic[] = loadGameRulesTopics(
      path.resolve(currentDir, "../../data/gameRulesByTopic.json")
    );
    const realRuleIndex: GameRulesRuleIndexEntry[] = loadGameRulesRuleIndex(
      path.resolve(currentDir, "../../data/gameRulesRuleIndex.json")
    );
    const frozen = JSON.parse(
      readFileSync(path.join(currentDir, "preparation.crossReferenceQueryEmbedding.json"), "utf8")
    ) as { question: string; vector: number[] };

    // `usedSemantic` rides through `enrichmentDebug.supplemental` at runtime
    // (preparation.ts passes the debug object through by reference) but isn't
    // part of the zod-derived `EnrichmentDebug` type, so it's read back via an
    // explicit cast — same pattern as contextEvaluationHarness.test.ts.
    function usedSemanticOf(prepared: ReturnType<typeof preparePromptInput>): boolean {
      const supplementalDebug = prepared.enrichmentDebug?.supplemental as unknown as { usedSemantic?: boolean } | undefined;
      return supplementalDebug?.usedSemantic ?? false;
    }

    const request: LookupAskAiRequest = {
      mode: "lookup",
      question: frozen.question,
      cards: [
        {
          // Questing Beast's real oracle id: its committed Scryfall keywords
          // (Vigilance, Haste, Deathtouch — cardDetailByOracleId.json) are what
          // crowd 701.8b out of the top 5 on cosine/lexical alone; the
          // cross-reference boost (the question cites 704.5g, which 701.8b's
          // own text cites) is what recovers it.
          cardId: "b685757b-521e-4353-a233-97052359723d",
          name: "Questing Beast",
          oracleText: "Vigilance, deathtouch, haste",
          imageUrl: "",
          manaCost: "{2}{G}{G}",
          manaValue: 4,
          typeLine: "Legendary Creature — Beast",
          colors: ["G"],
          supertypes: ["Legendary"],
          subtypes: ["Beast"]
        }
      ]
    };

    it("promotes a rule whose text cites a rule number the lookup-mode question cites (701.8b, cited rule 704.5g)", () => {
      const prepared = preparePromptInput(request, {
        gameRulesTopics: realGameRulesTopics,
        gameRulesRuleIndex: realRuleIndex,
        collectEnrichmentDebug: true,
        queryEmbedding: frozen.vector
      });

      expect(usedSemanticOf(prepared)).toBe(true);
      expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("701.8b");
    });

    it("returns the same selected rules from both the debug and non-debug lookup entry points", () => {
      // retrieveRulesForQuery (the non-debug path, used when collectEnrichmentDebug
      // is false) is the second call site review loop 1 flagged — both must wire
      // questionRuleIds, or the report (retrievalReportInputs.ts, which always
      // goes through the debug path) and a live non-debug request could disagree.
      const withDebug = preparePromptInput(request, {
        gameRulesTopics: realGameRulesTopics,
        gameRulesRuleIndex: realRuleIndex,
        collectEnrichmentDebug: true,
        queryEmbedding: frozen.vector
      });
      const withoutDebug = preparePromptInput(request, {
        gameRulesTopics: realGameRulesTopics,
        gameRulesRuleIndex: realRuleIndex,
        collectEnrichmentDebug: false,
        queryEmbedding: frozen.vector
      });

      expect(withoutDebug.promptText).toBe(withDebug.promptText);
      expect(withoutDebug.promptText).toContain("701.8b");
    });

    it("stays byte-identical on the mock/lexical path (EMBEDDING_PROVIDER=mock): no cross-reference boost, no live vector", () => {
      const first = preparePromptInput(request, {
        gameRulesTopics: realGameRulesTopics,
        gameRulesRuleIndex: realRuleIndex,
        collectEnrichmentDebug: true,
        queryEmbedding: null
      });
      const second = preparePromptInput(request, {
        gameRulesTopics: realGameRulesTopics,
        gameRulesRuleIndex: realRuleIndex,
        collectEnrichmentDebug: true,
        queryEmbedding: null
      });

      // The lexical path never reaches the hybrid branch (usedSemantic is
      // false), so passing questionRuleIds through is a no-op there — this is
      // the byte-identical-under-mock guarantee (REQ-182 acceptance/A4),
      // re-proven for the lookup call sites this fix touched.
      expect(usedSemanticOf(first)).toBe(false);
      expect(first.promptText).toBe(second.promptText);
      expect(first.enrichmentDebug?.supplemental.selected).toEqual(second.enrichmentDebug?.supplemental.selected);
      // The lexical result is a genuinely different ranking (no embedding to
      // rank by) — 701.8b is not among its top 5, proving the two paths are
      // actually independent, not coincidentally identical.
      expect(first.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).not.toContain("701.8b");
    });
  });
});
