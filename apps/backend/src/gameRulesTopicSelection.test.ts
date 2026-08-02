import { describe, expect, it } from "vitest";
import type { GameRulesTopic } from "./gameRules.js";
import { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } from "./gameRulesTopicSelection.js";
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

function makeStackItem(): PromptContextStackItem {
  return {
    cardId: "c1",
    name: "Some Spell",
    oracleText: "",
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

function makeZoneItem(): PromptContextZoneItem {
  return {
    cardId: "c2",
    name: "Some Permanent",
    oracleText: "",
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
}): PromptContext {
  const { turnPhase = "main_1", combatStep, stack = false, battlefield = false } = overrides;
  return {
    finalQuestion: "q",
    gameContext: {
      playerCount: 2,
      players: [],
      turnPhase,
      ...(combatStep !== undefined ? { combatStep } : {}),
      selectedZones: []
    },
    populatedZones: battlefield ? [{ zoneId: "battlefield", items: [makeZoneItem()] }] : [],
    orderedStack: stack ? [makeStackItem()] : []
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

    it("adds all five stack conditional topics when the stack is non-empty", () => {
      const ids = selectedIds(makeContext({ stack: true }));
      for (const id of [
        "spell-casting-choices",
        "spell-casting-costs",
        "effects-resolution-targets",
        "copying-spells-abilities",
        "effects-source-impossible"
      ]) {
        expect(ids).toContain(id);
      }
    });

    it("adds all six battlefield conditional topics when the battlefield is populated", () => {
      const ids = selectedIds(makeContext({ battlefield: true }));
      for (const id of [
        "replacement-effects-basics",
        "replacement-etb-effects",
        "layers-order",
        "layers-power-toughness",
        "layers-timestamps-dependencies",
        "abilities-zone-change-triggers"
      ]) {
        expect(ids).toContain(id);
      }
    });

    it("unions stack and battlefield bucket sets with the core topics", () => {
      const ids = selectedIds(makeContext({ stack: true, battlefield: true }));
      expect(ids).toContain("spell-casting-choices");
      expect(ids).toContain("layers-order");
      for (const id of ALWAYS_ON_TOPIC_IDS) expect(ids).toContain(id);
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
  });
});
