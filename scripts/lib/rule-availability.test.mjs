import assert from "node:assert/strict";
import test from "node:test";

import {
  attachedCardIds,
  availabilityInputsFrom,
  describeDecidingRules,
  letteredSubrules,
  mentionsRule,
  parentRuleId,
  ruleAvailability,
  rulingCommentsInPrompt
} from "./rule-availability.mjs";

test("mentionsRule matches a rule exactly: 514.3 is not a mention of 514.3a", () => {
  assert.equal(mentionsRule("See rule 514.3a for the exception.", "514.3a"), true);
  assert.equal(mentionsRule("See rule 514.3a for the exception.", "514.3"), false);
  assert.equal(mentionsRule("Rule 514.3, then 514.3a.", "514.3"), true);
  assert.equal(mentionsRule("Rule 514.30 is something else.", "514.3"), false);
  assert.equal(mentionsRule("see 616.1f.", "616.1f"), true);
});

test("parent and lettered subrules come from the rule id and the committed index", () => {
  assert.equal(parentRuleId("514.3a"), "514.3");
  assert.equal(parentRuleId("514.3"), null);
  assert.equal(parentRuleId("702.19b"), "702.19");
  assert.deepEqual(letteredSubrules("514.3", ["514.1", "514.3", "514.3a", "514.3b", "514.30", "514.4"]), ["514.3a", "514.3b"]);
  assert.deepEqual(letteredSubrules("514.3a", ["514.3", "514.3a"]), [], "a lettered rule has no lettered subrules");
});

test("attached card ids come from a lookup's cards and an In-Depth request's zone cards", () => {
  assert.deepEqual(attachedCardIds({ cards: [{ cardId: "a" }, { cardId: "b" }] }), ["a", "b"]);
  assert.deepEqual(attachedCardIds({ gameContext: { zones: { stack: [{ cardId: "c" }], battlefield: [{ cardId: "c" }, { cardId: "d" }] } } }), ["c", "d"]);
  assert.deepEqual(attachedCardIds({}), []);
});

test("a ruling counts only when its printed line reached the prompt", () => {
  const cardRulingsIndex = new Map([
    ["card-1", [{ publishedAt: "2020-01-01", comment: "Rule 514.3a lets this happen." }, { publishedAt: "2021-01-01", comment: "Unprinted ruling about 999.9." }]]
  ]);
  const comments = rulingCommentsInPrompt({
    request: { cards: [{ cardId: "card-1" }] },
    promptText: "RULINGS\n- 2020-01-01: Rule 514.3a lets this   happen.\n",
    cardRulingsIndex
  });
  assert.deepEqual(comments, ["Rule 514.3a lets this happen."]);
});

test("per rule: selected excerpt, curated topic and ruling quote each make a rule available; 514.3 present and 514.3a absent is told apart", () => {
  const inputs = {
    selectedRuleIds: new Set(["514.3", "616.1"]),
    curatedRuleIds: new Set(["608.2d"]),
    rulingComments: ["As rule 701.21a says, destroy means move to the graveyard."]
  };
  assert.equal(ruleAvailability("514.3", inputs).availableToAnswer, true);
  assert.deepEqual(ruleAvailability("514.3a", inputs), {
    ruleId: "514.3a",
    selectedInSearch: false,
    curatedTopic: false,
    rulingQuote: false,
    availableToAnswer: false
  });
  assert.equal(ruleAvailability("608.2d", inputs).curatedTopic, true);
  assert.equal(ruleAvailability("701.21a", inputs).rulingQuote, true);
  assert.equal(ruleAvailability("701.21", inputs).rulingQuote, false);
});

test("describeDecidingRules reports allDecidingRulesInPrompt and goldRuleInPrompt's meaning apart", () => {
  const prepared = {
    promptText: "PROMPT",
    enrichmentDebug: {
      supplemental: { selected: [{ ruleId: "514.1" }] },
      curatedGameRules: { topics: [{ id: "t", title: "T", ruleNumbers: ["514.2"] }] }
    }
  };
  const partial = describeDecidingRules({ decidingRuleIds: ["514.1", "514.2", "514.3a"], prepared, request: {}, cardRulingsIndex: new Map() });
  assert.equal(partial.anyDecidingRuleSelected, true);
  assert.equal(partial.allDecidingRulesInPrompt, false);
  assert.deepEqual(partial.rules.map((rule) => [rule.ruleId, rule.availableToAnswer]), [["514.1", true], ["514.2", true], ["514.3a", false]]);

  const complete = describeDecidingRules({ decidingRuleIds: ["514.1", "514.2"], prepared, request: {}, cardRulingsIndex: new Map() });
  assert.equal(complete.allDecidingRulesInPrompt, true);

  // A diagnostic arm's added bundle rules count as attached excerpts.
  const withBundle = describeDecidingRules({ decidingRuleIds: ["514.1", "514.3a"], prepared, request: {}, cardRulingsIndex: new Map(), extraRuleIds: ["514.3a"] });
  assert.equal(withBundle.allDecidingRulesInPrompt, true);
  assert.deepEqual([...availabilityInputsFrom({ prepared, request: {}, extraRuleIds: ["x"] }).selectedRuleIds].sort(), ["514.1", "x"]);

  // No deciding rules is never "all available".
  assert.equal(describeDecidingRules({ decidingRuleIds: [], prepared, request: {}, cardRulingsIndex: new Map() }).allDecidingRulesInPrompt, false);
});
