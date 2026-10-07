import assert from "node:assert/strict";
import test from "node:test";

import { attachedExcerptsFor, attachedRuleIdsOf, buildJudgeInputs, extractExcerptRuleIds, extractGameStateLines } from "./judge-inputs.mjs";

const RULE_INDEX = [
  { ruleId: "614.1a", text: "Effects that use the word instead are replacement effects." },
  { ruleId: "616.1", text: "If two or more replacement effects would apply, the affected player chooses." }
];

test("the attached excerpts are the id and text of each rule the prompt carried, from the committed index", () => {
  assert.deepEqual(attachedExcerptsFor({ ruleIds: ["616.1", "614.1a", "999.9"], ruleIndex: RULE_INDEX }), [
    { ruleId: "616.1", text: RULE_INDEX[1].text },
    { ruleId: "614.1a", text: RULE_INDEX[0].text }
  ]);
  assert.deepEqual(attachedExcerptsFor({ ruleIds: ["614.1a"], ruleIndex: undefined }), []);
});

test("a lookup case yields excerpts and deciding ids and no state lines", () => {
  const caseEntry = { gameState: null, expected: { decidingRuleIds: ["614.1a", "616.1e"] } };
  const inputs = buildJudgeInputs({ caseEntry, promptText: "turnPhase: cleanup\n", attachedRuleIds: ["614.1a"], ruleIndex: RULE_INDEX });
  assert.deepEqual(inputs, {
    attachedExcerpts: [{ ruleId: "614.1a", text: RULE_INDEX[0].text }],
    decidingRuleIds: ["614.1a", "616.1e"],
    stateLines: []
  });
});

test("a case with a game state yields the state lines the prompt printed", () => {
  const promptText = [
    "Some preamble.",
    "turnPhase: cleanup",
    "playerCount: 2",
    "Player 1: lifeTotal=20",
    "activePlayer: Player 1",
    "ZONE: STACK (BOTTOM TO TOP)",
    "Stack item 1 (Spell)",
    "card: Academy Manufactor",
    "caster: Player 1",
    "contextNotes: Player 2 controls it",
    "An unrelated sentence."
  ].join("\n");
  const caseEntry = { gameState: { turnPhase: "cleanup" }, expected: { decidingRuleIds: ["514.3a"] } };
  const inputs = buildJudgeInputs({ caseEntry, promptText, attachedRuleIds: [], ruleIndex: RULE_INDEX });
  assert.deepEqual(inputs.stateLines, [
    "turnPhase: cleanup",
    "playerCount: 2",
    "Player 1: lifeTotal=20",
    "activePlayer: Player 1",
    "ZONE: STACK (BOTTOM TO TOP)",
    "Stack item 1 (Spell)",
    "card: Academy Manufactor",
    "caster: Player 1",
    "contextNotes: Player 2 controls it"
  ]);
  assert.deepEqual(extractGameStateLines(""), []);
});

test("the inputs depend only on the case and the prompt, so every model, cap and arm gets the same ones", () => {
  const caseEntry = { gameState: null, expected: { decidingRuleIds: ["614.1a"] } };
  const args = { caseEntry, promptText: "P", attachedRuleIds: ["614.1a"], ruleIndex: RULE_INDEX };
  assert.deepEqual(buildJudgeInputs(args), buildJudgeInputs({ ...args }));
  assert.deepEqual(buildJudgeInputs(args), buildJudgeInputs({ ...args, model: "gpt-5", excerptCap: 15, arm: "D" }));
});

test("attachedRuleIdsOf lists the System 3 selections plus any rules an arm added, once each", () => {
  const prepared = { enrichmentDebug: { supplemental: { selected: [{ ruleId: "1.1" }, { ruleId: "2.2" }] } } };
  assert.deepEqual(attachedRuleIdsOf(prepared), ["1.1", "2.2"]);
  assert.deepEqual(attachedRuleIdsOf(prepared, ["2.2", "3.3"]), ["1.1", "2.2", "3.3"]);
  assert.deepEqual(attachedRuleIdsOf(null), []);
});

test("a stored prompt's excerpt ids are recovered for a regrade of an older transcript", () => {
  const promptText = "Head\n\nADDITIONAL RELEVANT RULE EXCERPTS\nDisclaimer.\n\n614.1a. Effects that use the word instead.\n\n616.1. If two or more.\n";
  assert.deepEqual(extractExcerptRuleIds(promptText), ["614.1a", "616.1"]);
  assert.deepEqual(extractExcerptRuleIds("no excerpts here"), []);
});
