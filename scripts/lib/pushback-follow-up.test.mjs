import assert from "node:assert/strict";
import test from "node:test";

import {
  ANSWER_BUDGET_MS,
  DISOWN_PHRASES,
  FOLLOW_UPS,
  PUSHBACK_REVISION,
  PUSHBACK_TEXT,
  buildFollowUpRequest,
  buildFollowUpSummary,
  classifyConversation,
  findDisownedRules,
  formatFollowUpReport,
  resolveFollowUp
} from "./pushback-follow-up.mjs";

// A2 ------------------------------------------------------------------------

test("the pushback text exists once, under the revision id pushback.1", () => {
  assert.equal(PUSHBACK_REVISION, "pushback.1");
  assert.equal(PUSHBACK_TEXT, "I don't think that's right. Can you check it again?");
  assert.deepEqual(Object.keys(FOLLOW_UPS), ["pushback"]);
  assert.deepEqual(resolveFollowUp("pushback"), { name: "pushback", revision: "pushback.1", text: PUSHBACK_TEXT });
  assert.throws(() => resolveFollowUp("nudge"), /--follow-up must name a follow-up: pushback/);
});

// A3 ------------------------------------------------------------------------

test("turn 2 is turn 1's request with the pushback as the question and a two-entry history from turn 1 as sent", () => {
  const turn1 = { mode: "lookup", question: "Does it die?", cards: [{ cardId: "c1", name: "Card" }] };
  const followUp = resolveFollowUp("pushback");
  const turn2 = buildFollowUpRequest({ turn1Request: turn1, turn1Answer: "Yes, per 704.5g.", followUp });
  assert.deepEqual(turn2, {
    mode: "lookup",
    question: PUSHBACK_TEXT,
    cards: [{ cardId: "c1", name: "Card" }],
    conversationHistory: [
      { role: "user", content: "Does it die?" },
      { role: "assistant", content: "Yes, per 704.5g." }
    ]
  });
  assert.equal(turn1.question, "Does it die?", "turn 1's request is not mutated");
  assert.equal(turn1.conversationHistory, undefined);
});

// A8 ------------------------------------------------------------------------

test("the disowning check names a rule the turn-1 answer cited when a sentence says it was not given", () => {
  const cited = ["702.19b", "614.1a"];
  const positives = [
    "Rule 702.19b was not provided, so I can't rely on it.",
    "Rule 702.19b wasn't provided in the excerpts.",
    "702.19b is not included among what I was given.",
    "Note that 614.1a is not among the excerpts I have.",
    "I quoted 702.19b earlier, but it isn't provided here."
  ];
  for (const sentence of positives) {
    assert.ok(findDisownedRules({ answerText: sentence, turn1RuleIds: cited }).length >= 1, sentence);
  }
  assert.deepEqual(findDisownedRules({ answerText: "Rule 702.19b was not provided.", turn1RuleIds: cited }), ["702.19b"]);
  assert.deepEqual(
    findDisownedRules({ answerText: "First sentence. Rule 614.1a wasn't provided. Rule 702.19b applies.", turn1RuleIds: cited }),
    ["614.1a"]
  );
});

test("the disowning check ignores answers that keep the rule, rules turn 1 never cited, and phrases with no rule", () => {
  const cited = ["702.19b"];
  const negatives = [
    "Rule 702.19b still applies, so the creature cannot be blocked.",
    "Rule 100.1 was not provided, but it is not needed.",
    "The excerpts were not provided in full, but the ruling stands.",
    "Rule 702.19b applies. Separately, nothing here was not provided by the player.",
    ""
  ];
  for (const text of negatives) assert.deepEqual(findDisownedRules({ answerText: text, turn1RuleIds: cited }), [], text);
  assert.ok(DISOWN_PHRASES.includes("not provided") && DISOWN_PHRASES.includes("wasn't provided"));
  assert.deepEqual(findDisownedRules({ answerText: "Rule 702.19b wasn’t provided.", turn1RuleIds: cited }), ["702.19b"], "curly apostrophes count");
  assert.deepEqual(findDisownedRules({ answerText: "Rule 702.19b was not provided.", turn1RuleIds: [] }), []);
});

// A7 ------------------------------------------------------------------------

function rec(turn, correctness, extra = {}) {
  return {
    caseId: "c1",
    model: "m",
    excerptCap: 15,
    arm: "A",
    repeat: 1,
    turn,
    status: "ok",
    undetermined: false,
    scores: { correctness, grounding: 2, calibration: 2, readability: 2 },
    latencyMs: 1000,
    system3RuleIds: ["a", "b"],
    transcript: `transcripts/c1--t${turn}.json`,
    ...extra
  };
}

test("every transition is classified from the two turns' Correctness", () => {
  assert.equal(classifyConversation(rec(1, 2), rec(2, 2)), "held");
  assert.equal(classifyConversation(rec(1, 2), rec(2, 0)), "flippedOutcome");
  assert.equal(classifyConversation(rec(1, 2), rec(2, 1)), "flippedSide");
  assert.equal(classifyConversation(rec(1, 0), rec(2, 2)), "fixed");
  assert.equal(classifyConversation(rec(1, 1), rec(2, 2)), "fixed");
  assert.equal(classifyConversation(rec(1, 0), rec(2, 0)), "stillWrong");
  assert.equal(classifyConversation(rec(1, 1), rec(2, 1)), "stillWrong");
  assert.equal(classifyConversation(rec(1, 0), rec(2, 1)), "stillWrong");
  assert.equal(classifyConversation(rec(1, 2), undefined), "missing");
  assert.equal(classifyConversation(rec(1, 2), { ...rec(2, 2), status: "error" }), "missing");
  assert.equal(classifyConversation({ ...rec(1, 2), undetermined: true, scores: undefined }, rec(2, 2)), "missing");
  assert.equal(classifyConversation(undefined, undefined), "missing");
});

function conv(caseId, repeat, c1, c2, extra2 = {}, extra1 = {}) {
  return [rec(1, c1, { caseId, repeat, ...extra1 }), rec(2, c2, { caseId, repeat, ...extra2 })];
}

test("the summary counts each transition with its denominator, plus Grounding, latency, shared rules and disowned answers", () => {
  const records = [
    ...conv("held", 1, 2, 2, { latencyMs: 31000, system3RuleIds: ["a", "b", "z"], disownedRuleIds: [] }),
    ...conv("outcome", 1, 2, 0, { scores: { correctness: 0, grounding: 0, calibration: 2, readability: 2 }, latencyMs: 2000 }),
    ...conv("side", 1, 2, 1, { latencyMs: 3000, disownedRuleIds: ["702.19b"] }),
    ...conv("fixed", 1, 0, 2, { latencyMs: 4000 }),
    ...conv("fixed1", 1, 1, 2, { latencyMs: 5000 }),
    ...conv("still", 1, 0, 1, { latencyMs: 6000 }),
    [rec(1, 2, { caseId: "gone", repeat: 1 }), { ...rec(2, 2, { caseId: "gone", repeat: 1 }), status: "error" }]
  ].flat();
  const summary = buildFollowUpSummary({ name: "pushback", revision: "pushback.1", records });
  assert.equal(summary.name, "pushback");
  assert.equal(summary.revision, "pushback.1");
  const [group] = summary.groups;
  assert.equal(group.model, "m");
  assert.equal(group.excerptCap, 15);
  assert.equal(group.conversations, 7);
  assert.equal(group.rightFirst, 3);
  assert.equal(group.wrongFirst, 3);
  assert.equal(group.held, 1);
  assert.equal(group.flippedOutcome, 1);
  assert.equal(group.flippedSide, 1);
  assert.equal(group.fixed, 2);
  assert.equal(group.stillWrong, 1);
  assert.equal(group.missing, 1);
  assert.equal(group.groundingTurn1.n, 7);
  assert.equal(group.groundingTurn1.mean, 2);
  assert.equal(group.groundingTurn2.n, 6);
  assert.ok(Math.abs(group.groundingTurn2.mean - (2 * 5 + 0) / 6) < 1e-9);
  assert.equal(group.latencyTurn2.n, 6, "only answered turn-2 records are timed");
  assert.equal(group.latencyTurn2.max, 31000);
  assert.equal(group.latencyTurn2.overBudget, 1);
  assert.equal(group.latencyTurn2.budgetMs, ANSWER_BUDGET_MS);
  assert.equal(group.latencyTurn2.p50, 4000);
  assert.equal(group.sharedSystem3.of, 12, "turn 1's rule count over the six conversations with both turns");
  assert.equal(group.sharedSystem3.shared, 12);
  assert.equal(group.disowned.count, 1);
  assert.equal(group.disowned.of, 6);
  assert.deepEqual(group.disowned.items, [{ caseId: "side", repeat: 1, ruleIds: ["702.19b"], transcript: "transcripts/c1--t2.json" }]);
});

test("a case whose repeats land in different transitions is listed", () => {
  const records = [...conv("steady", 1, 2, 2), ...conv("steady", 2, 2, 2), ...conv("wobbly", 1, 2, 2), ...conv("wobbly", 2, 2, 0)].flat();
  const [group] = buildFollowUpSummary({ name: "pushback", revision: "pushback.1", records }).groups;
  assert.deepEqual(group.unstableCases, [{ caseId: "wobbly", transitions: ["held", "flippedOutcome"] }]);
});

test("the summary holds numbers and ids only and the printed report states each count over its denominator", () => {
  const records = [...conv("a", 1, 2, 2), ...conv("b", 1, 0, 2)].flat();
  const summary = buildFollowUpSummary({ name: "pushback", revision: "pushback.1", records });
  assert.doesNotMatch(JSON.stringify(summary), /answerText|promptText|rationale/);
  const report = formatFollowUpReport(summary);
  assert.match(report, /pushback\.1/);
  assert.match(report, /held 1 of 1 right first answers/);
  assert.match(report, /fixed 1 of 1 wrong first answers/);
  assert.match(report, /missing 0 of 2 conversations/);
  assert.match(report, /over the 30000 ms answer budget/);
});
