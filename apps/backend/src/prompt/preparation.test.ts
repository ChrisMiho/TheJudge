import { describe, expect, it } from "vitest";
import type { GameRulesTopic } from "../gameRules.js";
import type { GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import type { CardDetailEntry } from "../cardDetail.js";
import type { LookupAskAiRequest } from "../types/index.js";
import { ALWAYS_ON_TOPIC_IDS } from "../gameRulesTopicSelection.js";
import { preparePromptInput } from "./preparation.js";
import type { CardDetailIndex } from "./context.js";

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
      subtypes: card.subtypes ?? []
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

    it("scores supplemental rules from attached-card oracle text and includes its rulings", () => {
      const request: LookupAskAiRequest = {
        mode: "lookup",
        question: "What does this ability do?",
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
            subtypes: ["Human", "Wizard"]
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
      // A rule id retrievable only through the second card's oracle text still
      // shows the System 3 query was built from every attached card, not one.
      expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("702.2");
      expect(prepared.promptText).toContain("name: Questing Beast");
      expect(prepared.promptText).toContain("name: Snapcaster Mage");
      expect(prepared.promptText.match(/CARD \(looked up\)/g)).toHaveLength(1);
    });
  });
});
