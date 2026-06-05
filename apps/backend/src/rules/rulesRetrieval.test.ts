import { describe, expect, it } from "vitest";
import { retrieveRelevantRules } from "./rulesRetrieval.js";
import type { RuleMetadataItem } from "./types.js";
import type { PromptContext } from "../types/index.js";

const rules: RuleMetadataItem[] = [
  {
    ruleId: "117.3b",
    sectionId: "117",
    sectionTitle: "Timing and Priority",
    parentRuleIds: ["117", "117.3"],
    text: "The active player receives priority after a spell or ability resolves.",
    searchText: "117.3b timing and priority active player receives priority after a spell or ability resolves",
    crossRefs: []
  },
  {
    ruleId: "608.2",
    sectionId: "608",
    sectionTitle: "Resolving Spells and Abilities",
    parentRuleIds: ["608"],
    text: "If the spell or ability specifies targets, it checks whether the targets are still legal.",
    searchText:
      "608.2 resolving spells and abilities spell ability specifies targets checks whether targets are still legal",
    crossRefs: []
  },
  {
    ruleId: "613.1",
    sectionId: "613",
    sectionTitle: "Interaction of Continuous Effects",
    parentRuleIds: ["613"],
    text: "The values of an object's characteristics are determined by starting with the actual object.",
    searchText:
      "613.1 interaction of continuous effects values object's characteristics determined starting actual object layers",
    crossRefs: []
  }
];

const baseContext: PromptContext = {
  finalQuestion: "Can a player respond with Counterspell before the top spell resolves?",
  gameContext: {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ],
    turnPhase: "stack_resolving",
    selectedZones: ["stack"]
  },
  populatedZones: [],
  orderedStack: [
    {
      cardId: "counterspell",
      name: "Counterspell",
      oracleText: "Counter target spell.",
      imageUrl: "",
      manaCost: "{U}{U}",
      manaValue: 2,
      typeLine: "Instant",
      colors: ["U"],
      supertypes: [],
      subtypes: [],
      caster: "Player 2",
      targets: [],
      manaSpent: 2,
      stackIndex: 0,
      stackRole: "top"
    }
  ]
};

describe("retrieveRelevantRules", () => {
  it("returns an empty list when no metadata is available", () => {
    expect(retrieveRelevantRules(baseContext, [])).toEqual([]);
  });

  it("retrieves priority and resolution rules from question and stack context", () => {
    const retrieved = retrieveRelevantRules(baseContext, rules);

    expect(retrieved.map((rule) => rule.ruleId)).toEqual(["117.3b", "608.2"]);
    expect(retrieved[0]?.score).toBeGreaterThan(0);
  });

  it("strongly prefers exact rule id references in the question", () => {
    const retrieved = retrieveRelevantRules(
      {
        ...baseContext,
        finalQuestion: "Does rule 613.1 apply to this layer question?"
      },
      rules
    );

    expect(retrieved[0]?.ruleId).toBe("613.1");
  });
});
