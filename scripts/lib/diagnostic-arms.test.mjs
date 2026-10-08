import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import {
  ARM_B_HEADINGS,
  ARM_REGISTRY,
  addBundleToParsed,
  armRecordFlags,
  assertCorrectionApproved,
  buildArmPrompt,
  carriedRuleIds,
  decidingRuleBundle,
  describeArm,
  evidenceUnits,
  parseLookupPrompt,
  renderOriginal,
  splitBlocks,
  unitMultiset,
  validateArmUse
} from "./diagnostic-arms.mjs";
import { lineBag, lineBagExtra } from "../diagnostic-arms-check.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// A synthetic lookup prompt in the exact shape promptAssembly.ts prints, small enough to read.
const TOPIC_DISCLAIMER = "Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state.";
const EXCERPT_DISCLAIMER = "Use these additional official rule excerpts as reference. They do not override the user's submitted game state.";
const RULING_DISCLAIMER = "Use these published Oracle rulings as reference for how each card works.";

const TOPIC_BLOCKS = [
  "Cleanup Basics\n514.1. First, discard to hand size.\n514.3. Normally no player receives priority.",
  "Stack and Priority\n117.1. Priority is determined by a system.\nExample: A player casts a spell.\n117.4. If all players pass in succession, the top resolves."
];
const EXCERPT_BLOCKS = [
  "703.4n. 703.4n Immediately after the cleanup step begins, discard.",
  "514.3a. 514.3a If a state-based action is performed, players receive priority.",
  "616.1. 616.1. If two or more replacement effects apply, the affected player chooses.\nExample: Two effects apply.\n\nExample: A second paragraph of the example."
];
const CARD_BLOCKS = ["name: Necropotence\nmanaCost: {B}{B}{B}\noracleText: Skip your draw step.", "name: Silence\nmanaCost: {W}\noracleText: Your opponents can't cast spells this turn."];
const RULING_BLOCKS = [
  "Necropotence\n- 2017-11-17: You can't look at the exiled cards.\n- 2017-11-17: Madness works differently.",
  "Silence\n- 2021-03-19: Silence won't affect spells already on the stack."
];

function makePrompt({ topics = TOPIC_BLOCKS, excerpts = EXCERPT_BLOCKS, cards = CARD_BLOCKS, rulings = RULING_BLOCKS, combo = null } = {}) {
  const sections = ["SYSTEM ROLE PREAMBLE\nYou are TheJudge assistant.\n\nINSTRUCTIONS\n- Explain.\n\nMTG REFERENCE\nTurns proceed in order.\n\nContinuous effects and state-based actions use a layer system."];
  if (topics.length) sections.push(["GAME RULES (reference)", TOPIC_DISCLAIMER, "", topics.join("\n\n")].join("\n"));
  if (excerpts.length) sections.push(["ADDITIONAL RELEVANT RULE EXCERPTS", EXCERPT_DISCLAIMER, "", excerpts.join("\n\n")].join("\n"));
  if (cards.length) sections.push(["CARD (looked up)", cards.join("\n\n")].join("\n"));
  if (rulings.length) sections.push(["OFFICIAL RULINGS (WotC reference)", RULING_DISCLAIMER, "", rulings.join("\n\n")].join("\n"));
  if (combo) sections.push(`COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED\n${combo}`);
  sections.push("QUESTION\nCan I cast it in the cleanup step?");
  return sections.join("\n\n");
}

const RULE_INDEX = [
  { ruleId: "514.1", text: "514.1. First, discard to hand size." },
  { ruleId: "514.2", text: "514.2. Second, damage wears off." },
  { ruleId: "514.3", text: "514.3. Normally no player receives priority." },
  { ruleId: "514.3a", text: "514.3a If a state-based action is performed, players receive priority." },
  { ruleId: "514.3b", text: "514.3b Another exception." },
  { ruleId: "616.1", text: "616.1. If two or more replacement effects apply, the affected player chooses." },
  { ruleId: "616.1e", text: "616.1e Any of the applicable replacement effects may be chosen." },
  { ruleId: "701.21a", text: "701.21a To destroy a permanent." }
];

const A_HEADINGS = ["GAME RULES (reference)", "ADDITIONAL RELEVANT RULE EXCERPTS", "CARD (looked up)", "OFFICIAL RULINGS (WotC reference)"];
const ARM_B_HEADING_LIST = Object.values(ARM_B_HEADINGS);

// Parsing ------------------------------------------------------------------

test("parse then render reproduces the production lookup prompt exactly, with and without a combo section", () => {
  for (const prompt of [makePrompt(), makePrompt({ combo: "A combo section.\n\n1. Some combo" }), makePrompt({ excerpts: [] }), makePrompt({ cards: [], rulings: [] })]) {
    assert.equal(renderOriginal(parseLookupPrompt(prompt)), prompt);
  }
});

test("blocks keep their blank-line paragraphs: an Example paragraph stays with its rule", () => {
  const parsed = parseLookupPrompt(makePrompt());
  assert.equal(parsed.excerpts.blocks.length, 3);
  assert.ok(parsed.excerpts.blocks[2].includes("A second paragraph of the example."));
  assert.equal(parsed.topics.blocks.length, 2);
  assert.ok(parsed.topics.blocks[1].includes("Example: A player casts a spell."));
  assert.equal(parsed.cards.blocks.length, 2);
  assert.equal(parsed.rulings.blocks.length, 2);
  assert.deepEqual(splitBlocks("excerpts", ""), []);
});

test("an In-Depth prompt or an unrecognised shape is refused, not guessed at", () => {
  assert.throws(() => parseLookupPrompt("ZONE: STACK\n..."), /lookup prompt/);
  assert.throws(() => parseLookupPrompt(`${makePrompt()}\n\nSCOPE\nx`), /lookup prompts/);
  assert.throws(() => parseLookupPrompt("SYSTEM ROLE PREAMBLE\nNo question section here."), /no QUESTION/);
  assert.throws(() => buildArmPrompt({ arm: "B", promptText: "garbage", ruleIndex: [] }), /lookup prompt/);
});

test("evidence units are the topic blocks, excerpt blocks, card blocks and one per ruling line", () => {
  const units = evidenceUnits(parseLookupPrompt(makePrompt()));
  const kinds = units.map((unit) => unit.kind);
  assert.equal(kinds.filter((k) => k === "topic").length, 2);
  assert.equal(kinds.filter((k) => k === "excerpt").length, 3);
  assert.equal(kinds.filter((k) => k === "card").length, 2);
  assert.equal(kinds.filter((k) => k === "ruling").length, 3);
  assert.ok(units.some((unit) => unit.kind === "ruling" && unit.text === "Silence\n- 2021-03-19: Silence won't affect spells already on the stack."));
});

// Arm B --------------------------------------------------------------------

test("arm B holds exactly arm A's evidence units, regrouped, reordered and headed: nothing added, removed or reworded", () => {
  const a = makePrompt();
  const b = buildArmPrompt({ arm: "B", promptText: a, ruleIndex: RULE_INDEX }).promptText;
  assert.notEqual(b, a);

  // Same lines, line for line, apart from the headings (ordering and blank lines aside).
  assert.deepEqual(lineBag(b, ARM_B_HEADING_LIST), lineBag(a, A_HEADINGS));
  for (const heading of ARM_B_HEADING_LIST) assert.ok(b.includes(`\n${heading}\n`), `${heading} heads a group`);
  for (const heading of A_HEADINGS) assert.ok(!b.includes(`\n${heading}\n`), `${heading} was replaced by a new heading`);

  // Each unit appears verbatim, once.
  const unitsA = evidenceUnits(parseLookupPrompt(a));
  for (const unit of unitsA) {
    const needle = unit.kind === "ruling" ? unit.text.slice(unit.text.indexOf("\n") + 1) : unit.text;
    assert.ok(b.includes(needle), `unit kept: ${needle.slice(0, 40)}`);
  }

  // Reordered: a rule sits beside its lettered exception, ascending; each card is followed by its own rulings.
  assert.ok(b.indexOf("514.3a. 514.3a") < b.indexOf("616.1. 616.1."));
  assert.ok(b.indexOf("514.3a. 514.3a") < b.indexOf("703.4n. 703.4n"));
  assert.ok(b.indexOf("name: Necropotence") < b.indexOf("Necropotence\n- 2017-11-17") && b.indexOf("Necropotence\n- 2017-11-17") < b.indexOf("name: Silence"));
  assert.ok(b.indexOf("Silence\n- 2021-03-19") > b.indexOf("name: Silence"));
  // The preamble and the question are untouched, the question last.
  assert.ok(b.startsWith(a.slice(0, a.indexOf("\n\nGAME RULES"))));
  assert.ok(b.endsWith("QUESTION\nCan I cast it in the cleanup step?"));
});

test("arm B keeps a combo section where it was, before the question", () => {
  const a = makePrompt({ combo: "Combo text." });
  const b = buildArmPrompt({ arm: "B", promptText: a, ruleIndex: RULE_INDEX }).promptText;
  assert.ok(b.indexOf("COMMANDER SPELLBOOK COMBO CONTEXT") > b.indexOf(ARM_B_HEADINGS.topics));
  assert.ok(b.indexOf("COMMANDER SPELLBOOK COMBO CONTEXT") < b.indexOf("\nQUESTION\n"));
  assert.deepEqual(lineBag(b, ARM_B_HEADING_LIST), lineBag(a, A_HEADINGS));
});

// Arm C --------------------------------------------------------------------

test("the deciding-rule bundle is each deciding rule, its parent and its lettered subrules, de-duplicated, from the committed index", () => {
  assert.deepEqual(decidingRuleBundle({ decidingRuleIds: ["514.3a"], ruleIndex: RULE_INDEX }), ["514.3", "514.3a"]);
  assert.deepEqual(decidingRuleBundle({ decidingRuleIds: ["514.3"], ruleIndex: RULE_INDEX }), ["514.3", "514.3a", "514.3b"]);
  assert.deepEqual(decidingRuleBundle({ decidingRuleIds: ["616.1e", "616.1"], ruleIndex: RULE_INDEX }), ["616.1", "616.1e"]);
  assert.deepEqual(decidingRuleBundle({ decidingRuleIds: ["999.9z"], ruleIndex: RULE_INDEX }), [], "a rule the index lacks is not invented");
});

test("arm C is arm A plus only the bundle rules A does not already carry, in A's excerpt format", () => {
  const a = makePrompt();
  const parsedA = parseLookupPrompt(a);
  assert.deepEqual([...carriedRuleIds(parsedA)].sort(), ["117.1", "117.4", "514.1", "514.3", "514.3a", "616.1", "703.4n"]);

  const c = buildArmPrompt({ arm: "C", promptText: a, ruleIndex: RULE_INDEX, decidingRuleIds: ["514.3", "616.1e"] });
  // 514.3 and 514.3a (curated / excerpt) and 616.1 (excerpt) are carried; the new ones are 514.3b and 616.1e.
  assert.deepEqual(c.bundleRuleIds, ["514.3b", "616.1e"]);
  const unitsA = unitMultiset(evidenceUnits(parsedA));
  const unitsC = unitMultiset(evidenceUnits(parseLookupPrompt(c.promptText)));
  const added = unitsC.filter((unit) => !unitsA.includes(unit));
  assert.deepEqual(added, ["excerpt\u0000514.3b. 514.3b Another exception.", "excerpt\u0000616.1e. 616.1e Any of the applicable replacement effects may be chosen."]);
  assert.equal(unitsC.length, unitsA.length + 2);
  assert.deepEqual(lineBagExtra(lineBag(c.promptText, []), lineBag(a, [])), ["514.3b. 514.3b Another exception.", "616.1e. 616.1e Any of the applicable replacement effects may be chosen."].sort());

  // Nothing missing from the bundle: C is A, byte for byte.
  const same = buildArmPrompt({ arm: "C", promptText: a, ruleIndex: RULE_INDEX, decidingRuleIds: ["514.1"] });
  assert.equal(same.promptText, a);
  assert.deepEqual(same.bundleRuleIds, []);
});

test("arm C builds the excerpts section when the prompt had none", () => {
  const a = makePrompt({ excerpts: [] });
  const c = buildArmPrompt({ arm: "C", promptText: a, ruleIndex: RULE_INDEX, decidingRuleIds: ["701.21a"] });
  assert.ok(c.promptText.includes("ADDITIONAL RELEVANT RULE EXCERPTS\nUse these additional official rule excerpts as reference."));
  assert.ok(c.promptText.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS") > c.promptText.indexOf("GAME RULES (reference)"));
  assert.ok(c.promptText.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS") < c.promptText.indexOf("CARD (looked up)"));
  assert.ok(c.promptText.includes("701.21a. 701.21a To destroy a permanent."));
});

// Arm D --------------------------------------------------------------------

test("arm D holds arm C's evidence units in arm B's presentation", () => {
  const a = makePrompt();
  const args = { promptText: a, ruleIndex: RULE_INDEX, decidingRuleIds: ["514.3", "616.1e"] };
  const c = buildArmPrompt({ arm: "C", ...args });
  const d = buildArmPrompt({ arm: "D", ...args });
  assert.deepEqual(d.bundleRuleIds, c.bundleRuleIds);
  assert.deepEqual(lineBag(d.promptText, ARM_B_HEADING_LIST), lineBag(c.promptText, A_HEADINGS));
  const parsedCwith = addBundleToParsed(parseLookupPrompt(a), args).parsed;
  assert.deepEqual(unitMultiset(evidenceUnits(parseLookupPrompt(c.promptText))), unitMultiset(evidenceUnits(parsedCwith)));
  // B's order: the new 514.3b follows 514.3a; 616.1e follows 616.1.
  assert.ok(d.promptText.indexOf("514.3a. 514.3a") < d.promptText.indexOf("514.3b. 514.3b"));
  assert.ok(d.promptText.indexOf("616.1. 616.1.") < d.promptText.indexOf("616.1e. 616.1e"));
});

// No arm sees the reference answer -----------------------------------------

test("no arm takes a case or its reference answer: only the deciding rule ids reach it, and nothing of the case is added", () => {
  const reference = { answer: "THE SECRET REFERENCE ANSWER", shortAnswer: "SECRET SHORT", outcome: "SECRET-OUTCOME" };
  // The builder's only case-derived input is the deciding rule ids; a poisoned `expected` object is never reachable.
  const poisoned = { decidingRuleIds: ["514.3"] };
  Object.defineProperty(poisoned, "expected", {
    get() {
      throw new Error("an arm reached for the case's expected answer");
    }
  });
  const a = makePrompt();
  const correction = { replaces: "Continuous effects and state-based actions use a layer system.", correction: "Continuous effects use layers.", approvedOn: "2026-10-08" };
  for (const arm of ["A", "B", "C", "D", "P"]) {
    const built = buildArmPrompt({ arm, promptText: a, ruleIndex: RULE_INDEX, decidingRuleIds: poisoned.decidingRuleIds, correction });
    for (const secret of Object.values(reference)) assert.ok(!built.promptText.includes(secret), `arm ${arm} adds no reference text`);
  }
});

// Arm P --------------------------------------------------------------------

test("arm P is refused until its correction file exists and carries the owner's approval date", () => {
  const a = makePrompt();
  assert.throws(() => buildArmPrompt({ arm: "P", promptText: a, ruleIndex: RULE_INDEX }), /does not exist yet/);
  assert.throws(() => assertCorrectionApproved({ replaces: "x", correction: "y" }), /no owner approval date/);
  assert.throws(() => assertCorrectionApproved({ replaces: "x", correction: "y", approvedOn: "soon" }), /no owner approval date/);
  assert.throws(() => assertCorrectionApproved({ replaces: "", correction: "y", approvedOn: "2026-10-08" }), /no "replaces" text/);

  const correction = { replaces: "Continuous effects and state-based actions use a layer system.", correction: "Continuous effects use a layer system; state-based actions do not.", approvedOn: "2026-10-08" };
  const p = buildArmPrompt({ arm: "P", promptText: a, ruleIndex: RULE_INDEX, correction });
  assert.ok(p.promptText.includes(correction.correction));
  assert.ok(!p.promptText.includes(correction.replaces));
  assert.equal(p.promptText.length - a.length, correction.correction.length - correction.replaces.length);
  assert.throws(() => buildArmPrompt({ arm: "P", promptText: a, ruleIndex: RULE_INDEX, correction: { ...correction, replaces: "A sentence that is not there." } }), /exactly once/);
});

// Where an arm may run -----------------------------------------------------

test("arms C, D and P are refused on a case outside the diagnostic manifest, naming it; diagnostic records are marked", () => {
  const diagnosticIds = new Set(["diag-1", "diag-2"]);
  const heldOutIds = new Set(["held-1"]);
  const approved = { replaces: "x", correction: "y", approvedOn: "2026-10-08" };
  for (const armId of ["C", "D"]) {
    assert.throws(() => validateArmUse({ armIds: [armId], caseIds: ["diag-1", "other-1"], diagnosticIds, heldOutIds }), /other-1: arm [CD] reads deciding-rule labels/);
    assert.throws(() => validateArmUse({ armIds: [armId], caseIds: ["held-1"], diagnosticIds, heldOutIds }), /held-1: arm [CD]/);
    assert.doesNotThrow(() => validateArmUse({ armIds: [armId], caseIds: ["diag-1", "diag-2"], diagnosticIds, heldOutIds }));
  }
  assert.throws(() => validateArmUse({ armIds: ["P"], caseIds: ["diag-1"], diagnosticIds, heldOutIds }), /does not exist yet/);
  assert.throws(() => validateArmUse({ armIds: ["P"], caseIds: ["other-1"], diagnosticIds, heldOutIds, correction: approved }), /other-1: arm P runs only on/);
  assert.doesNotThrow(() => validateArmUse({ armIds: ["A"], caseIds: ["diag-1", "held-1", "other-1"], diagnosticIds, heldOutIds }), "arm A runs on any case");

  assert.deepEqual(armRecordFlags({ armId: "C", caseId: "diag-1", heldOutIds }), { diagnostic: true, heldOut: false });
  assert.deepEqual(armRecordFlags({ armId: "A", caseId: "held-1", heldOutIds }), { diagnostic: false, heldOut: true });
});

test("the held-out manifest runs arm A; B and P run on a held-out case only under a frozen revision, with heldOut set", () => {
  const diagnosticIds = new Set(["diag-1"]);
  const heldOutIds = new Set(["held-1"]);
  const approved = { replaces: "x", correction: "y", approvedOn: "2026-10-08" };
  assert.doesNotThrow(() => validateArmUse({ armIds: ["A"], caseIds: ["held-1"], diagnosticIds, heldOutIds }));
  // B.1 is frozen in the registry (slice G); the refusal is what an unfrozen B would get.
  assert.equal(describeArm("B").frozen, true);
  assert.equal(describeArm("D").frozen, true);
  const unfrozenB = { ...ARM_REGISTRY, B: { ...ARM_REGISTRY.B, frozen: false } };
  assert.equal(describeArm("D", unfrozenB).frozen, false, "D is no firmer than B");
  assert.throws(() => validateArmUse({ armIds: ["B"], caseIds: ["held-1"], diagnosticIds, heldOutIds, registry: unfrozenB }), /held-1: arm B \(B\.1\) may run on a held-out case only under a frozen revision id/);
  assert.doesNotThrow(() => validateArmUse({ armIds: ["B"], caseIds: ["held-1"], diagnosticIds, heldOutIds }));
  // P is frozen by the owner's approval of its correction text, and is refused without it.
  assert.doesNotThrow(() => validateArmUse({ armIds: ["P"], caseIds: ["held-1"], diagnosticIds, heldOutIds, correction: approved }));
  assert.throws(() => validateArmUse({ armIds: ["P"], caseIds: ["held-1"], diagnosticIds, heldOutIds }), /does not exist yet/);
  // Once frozen under its revision id, B may.
  const frozenB = { ...ARM_REGISTRY, B: { ...ARM_REGISTRY.B, frozen: true } };
  assert.doesNotThrow(() => validateArmUse({ armIds: ["B"], caseIds: ["held-1", "diag-1"], diagnosticIds, heldOutIds, registry: frozenB }));
  assert.equal(describeArm("D", frozenB).frozen, true, "D is as frozen as B");
  assert.deepEqual(armRecordFlags({ armId: "B", caseId: "held-1", heldOutIds }), { diagnostic: true, heldOut: true });
  // C and D never run on held-out, frozen or not.
  assert.throws(() => validateArmUse({ armIds: ["C"], caseIds: ["held-1"], diagnosticIds, heldOutIds, registry: frozenB }), /held-1: arm C/);
});

test("a live run needs every non-A arm frozen under its revision id; a dry run does not", () => {
  const diagnosticIds = new Set(["diag-1"]);
  const unfrozenB = { ...ARM_REGISTRY, B: { ...ARM_REGISTRY.B, frozen: false } };
  assert.doesNotThrow(() => validateArmUse({ armIds: ["B"], caseIds: ["diag-1"], diagnosticIds, heldOutIds: new Set(), live: false, registry: unfrozenB }));
  assert.throws(() => validateArmUse({ armIds: ["B"], caseIds: ["diag-1"], diagnosticIds, heldOutIds: new Set(), live: true, registry: unfrozenB }), /arm B \(B\.1\) is not frozen under its revision id yet/);
  assert.throws(() => validateArmUse({ armIds: ["D"], caseIds: ["diag-1"], diagnosticIds, heldOutIds: new Set(), live: true, registry: unfrozenB }), /arm D/);
  assert.doesNotThrow(() => validateArmUse({ armIds: ["B", "D"], caseIds: ["diag-1"], diagnosticIds, heldOutIds: new Set(), live: true }), "frozen B.1 and D.1 may run live");
  assert.doesNotThrow(() => validateArmUse({ armIds: ["A", "C"], caseIds: ["diag-1"], diagnosticIds, heldOutIds: new Set(), live: true }));
  assert.throws(() => describeArm("Z"), /Unknown arm "Z"/);
});

test("every arm carries a revision id", () => {
  for (const arm of Object.values(ARM_REGISTRY)) assert.match(arm.revision, /^[A-Z]\.\d+$/);
  assert.deepEqual(Object.values(ARM_REGISTRY).map((arm) => arm.id), ["A", "B", "C", "D", "P"]);
});

// Every diagnostic case, against the real prompts ---------------------------

test("for every case in the committed diagnostic manifest: B's evidence units equal A's, C adds only bundle rules, D equals C, and no arm adds the reference answer", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "scripts/diagnostic-arms-check.mjs"], {
    cwd: repoRoot,
    env: { ...process.env, ANSWER_QUALITY_NO_LOCAL_ENV: "1" },
    maxBuffer: 16 * 1024 * 1024
  });
  const result = JSON.parse(stdout.trim().split("\n").pop());
  assert.ok(result.cases >= 40, `checked ${result.cases} diagnostic cases`);
  assert.deepEqual(result.problems, []);
});
