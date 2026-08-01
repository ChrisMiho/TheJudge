import { describe, expect, it } from "vitest";
import type { GameRulesTopic } from "../gameRules.js";
import type { GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import type { LookupAskAiRequest } from "../types/index.js";
import { ALWAYS_ON_TOPIC_IDS } from "../gameRulesTopicSelection.js";
import { preparePromptInput } from "./preparation.js";

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
      card: {
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
    };
    const prepared = preparePromptInput(request, {
      gameRulesTopics: topics,
      gameRulesRuleIndex: ruleIndex,
      cardRulingsIndex: new Map([
        ["questing-beast", [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]]
      ]),
      collectEnrichmentDebug: true
    });

    expect(prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId)).toContain("702.2");
    expect(prepared.enrichmentDebug?.rulings.cardsConsidered).toEqual([
      { cardId: "questing-beast", name: "Questing Beast" }
    ]);
    expect(prepared.promptText).toContain("CARD (looked up)");
    expect(prepared.promptText).toContain("OFFICIAL RULINGS (WotC reference)");
  });
});
