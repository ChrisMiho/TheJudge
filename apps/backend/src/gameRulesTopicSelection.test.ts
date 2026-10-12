import { describe, expect, it } from "vitest";
import type { GameRulesTopic } from "./gameRules.js";
import {
  ALWAYS_ON_TOPIC_IDS,
  REPLACEMENT_INTERACTION_TOPIC_ID,
  selectCardWordingTopicIds,
  selectGameRulesTopics
} from "./gameRulesTopicSelection.js";
import type {
  PromptContext,
  PromptContextStackItem,
  PromptContextZoneItem,
  TurnPhase,
  CombatStep
} from "./types/index.js";

const ALL_TOPIC_IDS = [
  "abilities-delayed-triggers",
  "abilities-trigger-basics",
  "abilities-zone-change-triggers",
  "combat-damage-assignment",
  "combat-declare-attackers",
  "combat-declare-blockers",
  "combat-phase-structure",
  "copying-spells-abilities",
  "damage-basics",
  "damage-lifelink-deathtouch",
  "damage-marked-lethal",
  "effects-resolution-targets",
  "effects-source-impossible",
  "layers-order",
  "layers-power-toughness",
  "layers-timestamps-dependencies",
  "replacement-effects-basics",
  "replacement-effects-interaction",
  "replacement-etb-effects",
  "spell-casting-choices",
  "spell-casting-costs",
  "stack-and-priority",
  "targets-basics",
  "zones-basics"
];

const ALL_TOPICS: GameRulesTopic[] = ALL_TOPIC_IDS.map((id) => ({
  id,
  title: id,
  ruleNumbers: ["100.1"],
  excerpt: `excerpt for ${id}`
}));

function makeStackItem(oracleText = ""): PromptContextStackItem {
  return {
    cardId: "c1",
    name: "Some Spell",
    oracleText,
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "",
    colors: [],
    supertypes: [],
    subtypes: [],
    caster: "Player 1",
    targets: [],
    manaSpent: 0,
    stackIndex: 0,
    stackRole: "top"
  };
}

function makeZoneItem(oracleText = ""): PromptContextZoneItem {
  return {
    cardId: "c2",
    name: "Some Permanent",
    oracleText,
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "",
    colors: [],
    supertypes: [],
    subtypes: [],
    targets: []
  };
}

function makeContext(overrides: {
  turnPhase?: TurnPhase;
  combatStep?: CombatStep;
  stack?: boolean;
  battlefield?: boolean;
  /** Oracle text of each stack card, in order (a non-empty list also populates the stack). */
  stackTexts?: string[];
  /** Oracle text of each battlefield card, in order (a non-empty list also populates the battlefield). */
  battlefieldTexts?: string[];
  /** The player's question (default "q"). */
  question?: string;
}): PromptContext {
  const { turnPhase = "main_1", combatStep, stack = false, battlefield = false } = overrides;
  const stackItems = overrides.stackTexts?.map((text) => makeStackItem(text)) ?? (stack ? [makeStackItem()] : []);
  const battlefieldItems =
    overrides.battlefieldTexts?.map((text) => makeZoneItem(text)) ?? (battlefield ? [makeZoneItem()] : []);
  return {
    finalQuestion: overrides.question ?? "q",
    gameContext: {
      playerCount: 2,
      players: [],
      turnPhase,
      ...(combatStep !== undefined ? { combatStep } : {}),
      selectedZones: []
    },
    populatedZones: battlefieldItems.length > 0 ? [{ zoneId: "battlefield", items: battlefieldItems }] : [],
    orderedStack: stackItems
  };
}

function selectedIds(context: PromptContext): string[] {
  return selectGameRulesTopics(context, ALL_TOPICS).map((t) => t.id);
}

describe("Backend - Game Rules", () => {
  describe("selectGameRulesTopics", () => {
    it("returns exactly the four always-on topics for main_1 with empty zones", () => {
      const ids = selectedIds(makeContext({ turnPhase: "main_1" }));
      expect(ids).toEqual([...ALWAYS_ON_TOPIC_IDS].sort((a, b) => a.localeCompare(b)));
    });

    it("produces stable id-ascending output order", () => {
      const ids = selectedIds(makeContext({ stack: true, battlefield: true }));
      expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
    });

    it("REQ-242: a populated stack or battlefield alone selects none of the eleven formerly zone-gated topics", () => {
      const ids = selectedIds(makeContext({ stack: true, battlefield: true }));
      expect(ids).toEqual([...ALWAYS_ON_TOPIC_IDS].sort((a, b) => a.localeCompare(b)));
    });

    it("REQ-242: words of a topic's title select it (question words, stemmed)", () => {
      const cases: Array<[string, string[]]> = [
        ["Can I cast it in response?", ["spell-casting-choices", "spell-casting-costs"]],
        ["What are the costs?", ["spell-casting-costs"]],
        ["The spell is resolving, and a target became illegal.", ["effects-resolution-targets"]],
        ["Does the copy keep the choices?", ["copying-spells-abilities", "spell-casting-choices"]],
        ["Is it an impossible action when the source is gone?", ["effects-source-impossible"]],
        ["Is this a replacement effect?", ["replacement-effects-basics", "replacement-etb-effects"]],
        ["Which layer applies first among continuous effects?", ["layers-order", "layers-power-toughness", "layers-timestamps-dependencies"]],
        ["What is its power and toughness now?", ["layers-power-toughness"]],
        ["How do timestamps and dependency work?", ["layers-timestamps-dependencies"]],
        ["The creature enters tapped.", ["replacement-etb-effects"]],
        ["It changed zone twice.", ["abilities-zone-change-triggers"]]
      ];
      for (const [question, expected] of cases) {
        const ids = selectedIds(makeContext({ question }));
        for (const id of expected) expect(ids, `${question} -> ${id}`).toContain(id);
      }
    });

    it("REQ-242: a question that names none of them adds none of them", () => {
      const ids = selectedIds(makeContext({ question: "Does the Goblin die?", stack: true, battlefield: true }));
      expect(ids).toEqual([...ALWAYS_ON_TOPIC_IDS].sort((a, b) => a.localeCompare(b)));
    });

    it("REQ-242: a card's concept terms select a topic (a card that grants a copy brings the copying topic)", () => {
      const ids = selectedIds(makeContext({ stackTexts: ["Copy target instant or sorcery spell. You may choose new targets for the copy."] }));
      expect(ids).toContain("copying-spells-abilities");
      const layer = selectedIds(makeContext({ battlefieldTexts: ["Creatures you control get +1/+1."] }));
      expect(layer).toContain("layers-power-toughness");
    });

    it("REQ-242: the delayed-trigger phase trigger and the combat topics are unchanged", () => {
      expect(selectedIds(makeContext({ turnPhase: "upkeep" }))).toContain("abilities-delayed-triggers");
      expect(selectedIds(makeContext({ turnPhase: "combat", combatStep: "declare_blockers" }))).toContain("combat-declare-blockers");
    });

    it("adds combat-phase-structure and combat-declare-attackers for combat + declare_attackers", () => {
      const ids = selectedIds(makeContext({ turnPhase: "combat", combatStep: "declare_attackers" }));
      expect(ids).toContain("combat-phase-structure");
      expect(ids).toContain("combat-declare-attackers");
      expect(ids).not.toContain("combat-declare-blockers");
      expect(ids).not.toContain("damage-basics");
    });

    it("adds combat-phase-structure and combat-declare-blockers for combat + declare_blockers", () => {
      const ids = selectedIds(makeContext({ turnPhase: "combat", combatStep: "declare_blockers" }));
      expect(ids).toContain("combat-phase-structure");
      expect(ids).toContain("combat-declare-blockers");
      expect(ids).not.toContain("combat-declare-attackers");
    });

    it("adds combat-phase-structure plus all damage topics for combat + combat_damage", () => {
      const ids = selectedIds(makeContext({ turnPhase: "combat", combatStep: "combat_damage" }));
      for (const id of [
        "combat-phase-structure",
        "combat-damage-assignment",
        "damage-basics",
        "damage-marked-lethal",
        "damage-lifelink-deathtouch"
      ]) {
        expect(ids).toContain(id);
      }
      expect(ids).not.toContain("combat-declare-attackers");
    });

    it("adds the full combat+damage set when combatStep is unrecognized", () => {
      const expectedCombat = [
        "combat-phase-structure",
        "combat-declare-attackers",
        "combat-declare-blockers",
        "combat-damage-assignment",
        "damage-basics",
        "damage-marked-lethal",
        "damage-lifelink-deathtouch"
      ];

      const absentStep = selectedIds(makeContext({ turnPhase: "combat" }));
      for (const id of expectedCombat) expect(absentStep).toContain(id);

      const otherStep = selectedIds(
        makeContext({ turnPhase: "combat", combatStep: "beginning_of_combat" })
      );
      for (const id of expectedCombat) expect(otherStep).toContain(id);
    });

    it("adds abilities-delayed-triggers for upkeep/draw/end_step/cleanup phases", () => {
      for (const phase of ["upkeep", "draw", "end_step", "cleanup"] as const) {
        expect(selectedIds(makeContext({ turnPhase: phase }))).toContain("abilities-delayed-triggers");
      }
    });

    it("does not add abilities-delayed-triggers outside those phases", () => {
      expect(selectedIds(makeContext({ turnPhase: "main_1" }))).not.toContain(
        "abilities-delayed-triggers"
      );
    });

    it("ignores selected ids missing from the provided topic list", () => {
      const partial = ALL_TOPICS.filter((t) => t.id !== "zones-basics");
      const ids = selectGameRulesTopics(makeContext({ turnPhase: "main_1" }), partial).map((t) => t.id);
      expect(ids).not.toContain("zones-basics");
      expect(ids).toContain("stack-and-priority");
    });

    it("adds the replacement-interaction topic when two cards carry the wording (REQ-220)", () => {
      const ids = selectedIds(
        makeContext({
          stackTexts: ["If you would create one or more tokens, you create those tokens plus a Treasure instead."],
          battlefieldTexts: ["If damage would be dealt to a permanent, prevent that damage."]
        })
      );
      expect(ids).toContain(REPLACEMENT_INTERACTION_TOPIC_ID);
      expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
    });

    it("does not add the topic for one marked card (REQ-220)", () => {
      expect(selectedIds(makeContext({ stackTexts: ["Exile it instead."], battlefieldTexts: ["Draw a card."] }))).not.toContain(
        REPLACEMENT_INTERACTION_TOPIC_ID
      );
    });

    it("leaves existing fixtures with empty oracle text unchanged (REQ-220)", () => {
      expect(selectedIds(makeContext({ stack: true, battlefield: true }))).not.toContain(REPLACEMENT_INTERACTION_TOPIC_ID);
    });
  });

  describe("selectCardWordingTopicIds (REQ-220)", () => {
    const topic = [REPLACEMENT_INTERACTION_TOPIC_ID];

    it("fires on two cards that carry the whole word instead, prevent, prevents, or prevented", () => {
      expect(selectCardWordingTopicIds([{ oracleText: "Exile it instead." }, { oracleText: "Prevent all damage." }])).toEqual(topic);
      expect(selectCardWordingTopicIds([{ oracleText: "It prevents that." }, { oracleText: "It was prevented." }])).toEqual(topic);
    });

    it("does not fire on a single marked card or on none", () => {
      expect(selectCardWordingTopicIds([{ oracleText: "Exile it instead." }, { oracleText: "Draw a card." }])).toEqual([]);
      expect(selectCardWordingTopicIds([{ oracleText: "Exile it instead." }])).toEqual([]);
      expect(selectCardWordingTopicIds([])).toEqual([]);
    });

    it("does not count prevention or preventing", () => {
      expect(
        selectCardWordingTopicIds([
          { oracleText: "Damage prevention effects stop this." },
          { oracleText: "Preventing damage this way is fine." }
        ])
      ).toEqual([]);
    });

    it("ignores letter case", () => {
      expect(selectCardWordingTopicIds([{ oracleText: "INSTEAD, draw." }, { oracleText: "Prevent Damage." }])).toEqual(topic);
    });

    it("counts two copies of one card as two", () => {
      const card = { oracleText: "Create a token instead." };
      expect(selectCardWordingTopicIds([card, card])).toEqual(topic);
    });

    it("reads a card in a game zone and a card on the stack", () => {
      const zoneOnly = makeContext({ battlefieldTexts: ["Do this instead.", "Prevent it."] });
      expect(selectGameRulesTopics(zoneOnly, ALL_TOPICS).map((t) => t.id)).toContain(REPLACEMENT_INTERACTION_TOPIC_ID);
      const stackOnly = makeContext({ stackTexts: ["Do this instead.", "Prevent it."] });
      expect(selectGameRulesTopics(stackOnly, ALL_TOPICS).map((t) => t.id)).toContain(REPLACEMENT_INTERACTION_TOPIC_ID);
    });
  });
});

describe("Backend - Game Rules - the question that triggers curated topics (REQ-242, REQ-246)", () => {
  it("reads the context's own question when no rule-selection question is passed", () => {
    expect(selectGameRulesTopics(makeContext({ question: "How does copying a spell work?" }), ALL_TOPICS).map((t) => t.id)).toContain(
      "copying-spells-abilities"
    );
    expect(selectGameRulesTopics(makeContext({ question: "q" }), ALL_TOPICS).map((t) => t.id)).not.toContain("copying-spells-abilities");
  });

  it("reads the passed rule-selection question instead of the context's follow-up text", () => {
    const followUpContext = makeContext({ question: "I don't think that's right. Can you check it again?" });
    const withOpening = selectGameRulesTopics(followUpContext, ALL_TOPICS, "How does copying a spell work?").map((t) => t.id);
    const withOwn = selectGameRulesTopics(followUpContext, ALL_TOPICS).map((t) => t.id);
    expect(withOpening).toContain("copying-spells-abilities");
    expect(withOwn).not.toContain("copying-spells-abilities");
    // Only the question-word topics move; the always-on core is unchanged.
    expect(withOpening.filter((id) => id !== "copying-spells-abilities")).toEqual(withOwn);
  });
});
