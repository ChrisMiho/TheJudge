import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { runCompare } from "../eval-answer-compare.mjs";
import { compareRunSides, formatComparison, readRunFolder, resolveGroup, selectSide, DIAGNOSTIC_HEADING } from "./answer-compare.mjs";
import { executeExperiment, manifestEntryFor } from "./experiment-run.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Real run folders, produced by the real experiment loop with fakes: offline, no provider.

function fixtureCase(id, { tier = 1, sections = ["614"], pool = "mechanic", answer, difficulty = 2 } = {}) {
  return {
    id,
    tier,
    review: { status: "approved" },
    question: `Question ${id}?`,
    cards: [],
    gameState: null,
    difficulty: { score: difficulty },
    source: { pool },
    expected: { outcome: "works", shortAnswer: "Yes.", answer: answer ?? `Reference ${id}.`, decidingRuleIds: sections.map((s) => `${s}.1`) }
  };
}

const CASES = [
  fixtureCase("r2r", { sections: ["614"] }),
  fixtureCase("w2r", { sections: ["614"] }),
  fixtureCase("r2w", { sections: ["702"], pool: "tester", difficulty: 3 }),
  fixtureCase("w2w", { sections: ["702"] }),
  fixtureCase("tier3-r2w", { tier: 3, sections: ["514"], pool: "tester", difficulty: 5 }),
  fixtureCase("tier3-r2r", { tier: 3, sections: ["514"] })
];

async function makeRun({
  runId,
  cases = CASES,
  judgeModel = "gpt-5",
  rubricRevision = "rubric-1",
  right = new Set(),
  repeats = 1,
  rightByRepeat = null,
  promptSuffix = "",
  arms = [{ id: "A", revision: "A.1" }],
  latencies = [100],
  failCaseIds = new Set(),
  timeoutMs,
  commit = "0123456789abcdef0123456789abcdef01234567",
  runsRoot
}) {
  const manifest = { cases: cases.map(manifestEntryFor) };
  let calls = 0;
  let clock = 0;
  const deps = {
    preparePromptInput: (request) => ({ promptText: `PROMPT ${request.question}${promptSuffix}`, enrichmentDebug: { supplemental: { usedSemantic: true, selected: [] } } }),
    buildCaseRequest: (caseEntry) => ({ mode: "lookup", question: caseEntry.question }),
    describeRetrieval: () => ({ usedSemantic: true, selectedRuleIds: [], goldRuleInPrompt: false }),
    computeDeterministicAssertions: () => ({ namesGoldRuleId: false, nonEmpty: true, length: 5, unknownRuleIds: [] }),
    judgeAnswerAlone: async (input) => {
      const caseId = input.question.replace(/^Question |\?$/g, "");
      const repeat = judgeCounts.get(caseId) ?? 0;
      judgeCounts.set(caseId, repeat + 1);
      const isRight = rightByRepeat ? rightByRepeat(caseId, repeat) : right.has(caseId);
      return {
        undetermined: false,
        scores: { correctness: isRight ? 2 : 1, grounding: 2, calibration: 2, readability: 2 },
        rationale: "r",
        usage: { inputTokens: 100, outputTokens: 50, reasoningTokens: 20 }
      };
    },
    judgeBlindRanking: async () => ({ undetermined: true, reason: "n/a", usage: { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 } }),
    computeCallCostUsd: (model, input, output) => (input * 2 + output * 8) / 1_000_000,
    resources: {},
    ruleIds: [],
    embedQueries: async () => new Map(),
    embeddingProvider: "local",
    rubricRevision,
    rateTable: {},
    clientOptions: { timeoutMs: "sdk-default", maxRetries: "sdk-default" },
    git: { head: async () => commit, isDirty: async () => false },
    fileHashes: async (list) => ({ dataFiles: {}, caseFiles: Object.fromEntries(list.map((c) => [c.id, "b".repeat(64)])), rulesIndexSha256: "a".repeat(64) }),
    buildArmPrompt: ({ arm, prepared }) => ({ promptText: `${prepared.promptText}\n[arm ${arm.id}]`, bundleRuleIds: [] }),
    now: () => {
      calls += 1;
      if (calls % 2 === 1) return clock;
      clock += latencies[(Math.floor(calls / 2) - 1) % latencies.length];
      return clock;
    },
    nowIso: () => "2026-10-07T12:00:00.000Z"
  };
  const judgeCounts = new Map();
  const client = {
    responses: {
      create: async (call) => {
        const caseId = call.input.split("\n")[0].replace(/^PROMPT Question |\?.*$/g, "");
        if (failCaseIds.has(caseId)) throw Object.assign(new Error("Request timed out."), { name: "APIConnectionTimeoutError" });
        return { output_text: "An answer.", usage: { input_tokens: 1000, output_tokens: 300, output_tokens_details: { reasoning_tokens: 100 } } };
      }
    }
  };
  const result = await executeExperiment(
    { runId, runsRoot, client, judgeModel, models: ["gpt-4.1"], excerptCaps: [10], arms, repeats, cases, manifest, manifestSha256: "m".repeat(64), env: {}, log: () => {} },
    deps
  );
  if (timeoutMs !== undefined) {
    const { writeFile } = await import("node:fs/promises");
    const identity = JSON.parse(await readFile(join(result.folder, "manifest.json"), "utf8"));
    identity.productionTimeoutMs = timeoutMs;
    await writeFile(join(result.folder, "manifest.json"), JSON.stringify(identity));
  }
  return result.folder;
}

async function compareFolders(folderA, folderB, selectors = {}) {
  const [a, b] = await Promise.all([readRunFolder(folderA), readRunFolder(folderB)]);
  return compareRunSides(selectSide(a, selectors), selectSide(b, selectors));
}

// F1 ------------------------------------------------------------------------

test("the report refuses on a judge model, rubric revision or reference-hash mismatch and prints each reason", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const base = await makeRun({ runId: "base", right: new Set(["r2r"]), runsRoot });
  const otherJudge = await makeRun({ runId: "other-judge", right: new Set(["r2r"]), judgeModel: "gpt-5-other", runsRoot });
  const otherRubric = await makeRun({ runId: "other-rubric", right: new Set(["r2r"]), rubricRevision: "rubric-2", runsRoot });
  const reworked = CASES.map((c) => (c.id === "w2r" ? fixtureCase("w2r", { sections: ["614"], answer: "A reworked reference answer." }) : c));
  const otherReference = await makeRun({ runId: "other-reference", cases: reworked, right: new Set(["r2r"]), runsRoot });

  const judgeRefusal = await compareFolders(base, otherJudge);
  assert.equal(judgeRefusal.refused, true);
  assert.match(judgeRefusal.reasons.join("\n"), /judge models differ \(gpt-5 and gpt-5-other\)/);

  const rubricRefusal = await compareFolders(base, otherRubric);
  assert.match(rubricRefusal.reasons.join("\n"), /rubric revisions differ \(rubric-1 and rubric-2\)/);

  const referenceRefusal = await compareFolders(base, otherReference);
  assert.match(referenceRefusal.reasons.join("\n"), /1 case were judged against different reference answers .*: w2r/);

  const all = await compareFolders(otherJudge, await makeRun({ runId: "everything", cases: reworked, judgeModel: "gpt-5-third", rubricRevision: "rubric-3", runsRoot }));
  assert.equal(all.reasons.length, 3, "every reason is printed, not only the first");
  const text = formatComparison(all);
  assert.match(text, /cannot be compared; nothing was reported/);
  assert.match(text, /judge models differ/);
  assert.match(text, /rubric revisions differ/);
  assert.match(text, /different reference answers/);
  assert.doesNotMatch(text, /right->right/);
});

// F2, F3, F5 ----------------------------------------------------------------

async function pairedRuns() {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const before = await makeRun({ runId: "before", right: new Set(["r2r", "r2w", "tier3-r2w", "tier3-r2r"]), runsRoot });
  // After: w2r now right, r2w and tier3-r2w now wrong; r2r and tier3-r2r still right; w2w still wrong.
  // Prompts differ for every case (the refresh changed the prompt), except we rebuild one run with the same prompt below.
  const after = await makeRun({ runId: "after", right: new Set(["r2r", "w2r", "tier3-r2r"]), promptSuffix: " [refreshed]", runsRoot });
  const afterSamePrompt = await makeRun({ runId: "after-same", right: new Set(["r2r", "w2r", "tier3-r2r"]), runsRoot });
  return { runsRoot, before, after, afterSamePrompt };
}

test("fixture runs show all five transition counts with denominators, and every right-to-wrong case with its transcript paths", async () => {
  const { before, after } = await pairedRuns();
  const result = await compareFolders(before, after);
  assert.equal(result.refused, false);
  assert.deepEqual(result.overall, { rightToRight: 2, wrongToRight: 1, rightToWrong: 2, wrongToWrong: 1, missing: 0 });
  assert.deepEqual(result.denominators, { cases: 6, bothGraded: 6 });
  assert.deepEqual(result.rightToWrong.map((item) => item.caseId), ["r2w", "tier3-r2w"]);
  for (const item of result.rightToWrong) {
    assert.equal(item.transcripts.a.length, 1);
    assert.equal(item.transcripts.b.length, 1);
    assert.ok(item.transcripts.a[0].startsWith(before) && item.transcripts.a[0].endsWith(".json"));
    assert.ok(item.transcripts.b[0].startsWith(after));
    assert.match(await readFile(item.transcripts.a[0], "utf8"), /answerText/);
  }
  const text = formatComparison(result, { labelA: "before", labelB: "after" });
  assert.match(text, /Overall: right->right 2, wrong->right 1, right->wrong 2, wrong->wrong 1, missing 0 \(of 6\)/);
  assert.match(text, /r2w \(tier 1, cap 10\)/);
  assert.match(text, /before: .*transcripts\/r2w--/);
  assert.match(text, /after: .*transcripts\/r2w--/);
});

test("tiers 1-2 and tier 3 are never pooled, and breakdowns by rules section, mechanic, difficulty, source pool and request kind appear", async () => {
  const { before, after } = await pairedRuns();
  const result = await compareFolders(before, after);
  assert.deepEqual(result.byTierGroup["tiers 1-2"], { rightToRight: 1, wrongToRight: 1, rightToWrong: 1, wrongToWrong: 1, missing: 0 });
  assert.deepEqual(result.byTierGroup["tier 3"], { rightToRight: 1, wrongToRight: 0, rightToWrong: 1, wrongToWrong: 0, missing: 0 });

  const lowTier = result.breakdowns["tiers 1-2"];
  assert.deepEqual(Object.keys(lowTier).sort(), ["difficulty", "mechanic", "requestKind", "ruleSection", "sourcePool"]);
  assert.deepEqual(lowTier.ruleSection["614"], { rightToRight: 1, wrongToRight: 1, rightToWrong: 0, wrongToWrong: 0, missing: 0 });
  assert.deepEqual(lowTier.ruleSection["702"], { rightToRight: 0, wrongToRight: 0, rightToWrong: 1, wrongToWrong: 1, missing: 0 });
  assert.deepEqual(lowTier.sourcePool.tester, { rightToRight: 0, wrongToRight: 0, rightToWrong: 1, wrongToWrong: 0, missing: 0 });
  assert.deepEqual(lowTier.requestKind.lookup, { rightToRight: 1, wrongToRight: 1, rightToWrong: 1, wrongToWrong: 1, missing: 0 });
  assert.deepEqual(Object.keys(lowTier.difficulty).sort(), ["2", "3"]);
  assert.ok(lowTier.mechanic.none, "a case with no 701/702 mechanic prefix groups under none");
  // Tier 3 sections never appear in the tiers 1-2 table, and the reverse.
  assert.equal(lowTier.ruleSection["514"], undefined);
  assert.deepEqual(Object.keys(result.breakdowns["tier 3"].ruleSection), ["514"]);

  const text = formatComparison(result);
  assert.match(text, /Breakdown within tiers 1-2 \(never pooled with the other tier group\)/);
  assert.match(text, /Breakdown within tier 3/);
  for (const heading of ["by rules section", "by mechanic", "by difficulty score", "by source pool", "by request kind"]) assert.match(text, new RegExp(heading));
});

test("cases with an identical prompt hash on both sides form the unchanged-input stratum, labelled sampling noise", async () => {
  const { before, after, afterSamePrompt } = await pairedRuns();
  const changed = await compareFolders(before, after);
  assert.equal(changed.unchangedInput.cases, 0);
  assert.equal(changed.changedInput.cases, 6);

  const same = await compareFolders(before, afterSamePrompt);
  assert.equal(same.unchangedInput.cases, 6, "same prompt on both sides: every case is in the stratum");
  assert.equal(same.unchangedInput.label, "sampling noise");
  assert.deepEqual(same.unchangedInput.counts, same.overall);
  assert.ok(same.rightToWrong.every((item) => item.promptHashEqual));
  const text = formatComparison(same);
  assert.match(text, /Unchanged-input stratum \(identical prompt hash on both sides; differences here are sampling noise, not an effect\): 6 cases/);
  assert.match(text, /prompt unchanged/);
});

// F4 ------------------------------------------------------------------------

test("repeats resolve by majority and disagreeing repeats are listed unstable", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const three = [fixtureCase("steady-right"), fixtureCase("steady-wrong"), fixtureCase("mostly-right"), fixtureCase("mostly-wrong")];
  // repeat index is the case's own grading count: 0, 1, 2.
  const pattern = {
    "steady-right": [true, true, true],
    "steady-wrong": [false, false, false],
    "mostly-right": [true, false, true],
    "mostly-wrong": [false, true, false]
  };
  const runA = await makeRun({ runId: "rep-a", cases: three, repeats: 3, rightByRepeat: (id, i) => pattern[id][i], runsRoot });
  const runB = await makeRun({ runId: "rep-b", cases: three, repeats: 3, rightByRepeat: () => true, runsRoot });
  const result = await compareFolders(runA, runB);

  assert.deepEqual(result.overall, { rightToRight: 2, wrongToRight: 2, rightToWrong: 0, wrongToWrong: 0, missing: 0 }, "mostly-right is right, mostly-wrong is wrong, by majority");
  assert.deepEqual(result.unstable.map((item) => [item.caseId, item.side, item.right, item.wrong]), [
    ["mostly-right", "a", 2, 1],
    ["mostly-wrong", "a", 1, 2]
  ]);
  const text = formatComparison(result);
  assert.match(text, /Unstable cases \(repeats disagree\):/);
  assert.match(text, /mostly-right \(cap 10, .*\): 2 right, 1 wrong/);

  // A tie has no majority: it is not counted as a transition and is reported missing.
  const group = resolveGroup([
    { status: "ok", scores: { correctness: 2 } },
    { status: "ok", scores: { correctness: 1 } }
  ]);
  assert.equal(group.result, "tied");
  assert.equal(group.unstable, true);
});

test("an answer error or timeout is counted missing, not as a wrong answer", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const a = await makeRun({ runId: "err-a", right: new Set(["r2r"]), runsRoot });
  const b = await makeRun({ runId: "err-b", right: new Set(["r2r"]), failCaseIds: new Set(["r2r"]), runsRoot });
  const result = await compareFolders(a, b);
  assert.equal(result.overall.missing, 1);
  assert.equal(result.overall.rightToWrong, 0);
  assert.equal(result.sides.b.errors, 1);
  assert.equal(result.sides.b.timeouts, 1);
});

// F6 ------------------------------------------------------------------------

test("per side: latency mean, p50 and p95, answers slower than the revision's timeout, errors, tokens with reasoning, and answer and judge cost apart", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3"), fixtureCase("c4")];
  const a = await makeRun({ runId: "lat-a", cases, latencies: [100, 200, 300, 400], runsRoot, timeoutMs: 15000 });
  const b = await makeRun({ runId: "lat-b", cases, latencies: [1000, 2000, 16000, 20000], right: new Set(["c1"]), failCaseIds: new Set(["c4"]), runsRoot, timeoutMs: 15000 });
  const result = await compareFolders(a, b);

  assert.deepEqual(result.sides.a.latencyMs, { mean: 250, p50: 200, p95: 400 });
  assert.equal(result.sides.a.slowerThanTimeout, 0);
  assert.equal(result.sides.a.timeoutMs, 15000);
  assert.equal(result.sides.a.timeoutIsAssumed, false);

  assert.equal(result.sides.b.slowerThanTimeout, 1, "only the 16000 ms answer that was graded exceeds 15000 ms (the failed call has no latency)");
  assert.equal(result.sides.b.errors, 1);
  assert.equal(result.sides.b.timeouts, 1);
  assert.deepEqual(result.sides.b.tokens, { input: 3000, output: 900, reasoning: 300, judgeInput: 300, judgeOutput: 150, judgeReasoning: 60 });
  assert.ok(result.sides.b.answerCostUsd > 0 && result.sides.b.judgeCostUsd > 0);
  assert.notEqual(result.sides.b.answerCostUsd, result.sides.b.judgeCostUsd, "answer and judge cost are separate numbers");

  const text = formatComparison(result, { labelA: "a", labelB: "b" });
  assert.match(text, /latency: mean 250 ms, p50 200 ms, p95 400 ms; 0 answers slower than the 15000 ms per-attempt timeout/);
  assert.match(text, /errors 1 \(of which timeouts 1\)/);
  assert.match(text, /reasoning 300 inside out/);
  assert.match(text, /cost: answers \$[\d.]+; judge \$[\d.]+/);

  // A run that names no timeout is read against the assumed production value, and says so.
  const unnamed = await makeRun({ runId: "lat-c", cases, runsRoot });
  const unnamedResult = await compareFolders(unnamed, unnamed);
  assert.equal(unnamedResult.sides.a.timeoutIsAssumed, true);
  assert.match(formatComparison(unnamedResult), /assumed: this run's identity record names none/);
});

// F7 ------------------------------------------------------------------------

test("diagnostic-arm results print under the diagnostic-control heading, and no output names a winner", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const arms = [
    { id: "A", revision: "A.1" },
    { id: "C", revision: "C.1" }
  ];
  const run = await makeRun({ runId: "arms", arms, right: new Set(["r2r"]), runsRoot });
  const armsResult = await compareFolders(run, run, { arm: undefined });
  assert.equal(armsResult.diagnostic, false, "arm A on both sides is a product comparison");
  assert.doesNotMatch(formatComparison(armsResult), new RegExp(DIAGNOSTIC_HEADING));

  const [loaded] = await Promise.all([readRunFolder(run)]);
  const diag = compareRunSides(selectSide(loaded, { arm: "A" }), selectSide(loaded, { arm: "C" }));
  assert.equal(diag.diagnostic, true);
  const text = formatComparison(diag, { labelA: "arm A", labelB: "arm C" });
  assert.ok(text.startsWith(`=== ${DIAGNOSTIC_HEADING} ===`));
  assert.match(text, /never "how good is the product\?"/);
  assert.equal(diag.sides.b.armRevision, "C.1");

  for (const output of [text, formatComparison(armsResult), formatComparison({ refused: true, reasons: ["x"] })]) {
    assert.doesNotMatch(output, /\bwinner\b|\bwins\b|\bbetter\b|\bworse\b|\bbest\b|\bimproved\b|\bregressed\b/i, "the report states counts and lists, never a verdict");
  }

  await assert.rejects(async () => selectSide(loaded, { arm: "Z" }), /no records for arm Z/);
});

test("a run that answered with several models needs a model selector", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const folder = await makeRun({ runId: "single", runsRoot });
  const loaded = await readRunFolder(folder);
  loaded.summary.records.push({ ...loaded.summary.records[0], model: "gpt-5-mini", key: "x" });
  assert.throws(() => selectSide(loaded, {}), /answered with several models .* pick one with --model/);
  assert.equal(selectSide(loaded, { model: "gpt-5-mini" }).records.length, 1);
});

// F8 ------------------------------------------------------------------------

test("eval:answer-quality:compare exists in package.json and runs offline on two fixture run folders", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["eval:answer-quality:compare"], "node scripts/eval-answer-compare.mjs");

  const { before, after, runsRoot } = await pairedRuns();
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = async () => {
    fetched += 1;
    throw new Error("no network call is allowed");
  };
  const logs = [];
  try {
    const outputRoot = await mkdtemp(join(tmpdir(), "compare-out-"));
    const result = await runCompare({ argv: ["before", "after"], log: (line) => logs.push(line), runsRoot, outputRoot, cwd: "/" });
    assert.equal(result.refused, false);
    const byPath = await runCompare({ argv: [before, after], log: () => {}, runsRoot: "/nowhere", outputRoot, cwd: "/" });
    assert.equal(byPath.overall.rightToWrong, 2);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);
  assert.match(logs.join("\n"), /Paired comparison of two experiment runs/);

  // The real command, as a process: run ids resolve under the runs folder only when no path separator is used.
  const { stdout } = await execFileAsync(process.execPath, ["scripts/eval-answer-compare.mjs", before, after], { cwd: repoRoot });
  assert.match(stdout, /right->right 2, wrong->right 1, right->wrong 2, wrong->wrong 1, missing 0 \(of 6\)/);

  // Asked for nothing, it says how to use it and exits cleanly.
  const bare = await execFileAsync(process.execPath, ["scripts/eval-answer-compare.mjs"], { cwd: repoRoot });
  assert.match(bare.stdout, /Compare two experiment runs \(offline\)/);
  assert.ok(runsRoot);
});

test("a refusal exits non-zero and names the reasons", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const a = await makeRun({ runId: "ra", runsRoot });
  const b = await makeRun({ runId: "rb", judgeModel: "gpt-5-other", runsRoot });
  await assert.rejects(execFileAsync(process.execPath, ["scripts/eval-answer-compare.mjs", a, b], { cwd: repoRoot }), (error) => error.code === 1 && /judge models differ/.test(error.stdout));
});

test("a cap selector picks one excerpt cap, and the unstable list shows each repeat's Correctness", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const cases = [fixtureCase("mixed")];
  const a = await makeRun({ runId: "cap-a", cases, repeats: 3, rightByRepeat: (id, i) => [true, false, true][i], runsRoot });
  const b = await makeRun({ runId: "cap-b", cases, repeats: 3, rightByRepeat: () => true, runsRoot });
  const [runA, runB] = await Promise.all([readRunFolder(a), readRunFolder(b)]);
  const result = compareRunSides(selectSide(runA, { cap: 10 }), selectSide(runB, { cap: 10 }));
  assert.deepEqual(result.unstable[0].scores, [2, 1, 2]);
  assert.match(formatComparison(result), /Correctness per repeat: 2, 1, 2/);
  assert.throws(() => selectSide(runA, { cap: 5 }), /no records for arm A at excerpt cap 5/);
});

test("the command writes a numbers-and-ids-only compare JSON and the report as Markdown under the output folder", async () => {
  const { before, after } = await pairedRuns();
  const outputRoot = await mkdtemp(join(tmpdir(), "compare-out-"));
  const result = await runCompare({ argv: [before, after, "--cap", "10"], log: () => {}, outputRoot, cwd: "/" });
  const json = JSON.parse(await readFile(join(outputRoot, "compare-before-after.json"), "utf8"));
  assert.deepEqual(json.overall, result.overall);
  assert.ok(!JSON.stringify(json).includes("An answer."), "no model prose in the compare JSON");
  const markdown = await readFile(join(outputRoot, "compare-before-after.md"), "utf8");
  assert.match(markdown, /Paired comparison of two experiment runs/);
  // A refusal writes nothing.
  const refusedOut = await mkdtemp(join(tmpdir(), "compare-out-"));
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const other = await makeRun({ runId: "other-judge", judgeModel: "gpt-5-other", runsRoot });
  process.exitCode = 0;
  const refused = await runCompare({ argv: [before, other], log: () => {}, outputRoot: refusedOut, cwd: "/" });
  process.exitCode = 0;
  assert.equal(refused.refused, true);
  assert.deepEqual(await (await import("node:fs/promises")).readdir(refusedOut), []);
});

test("two answer models on the same prompts are not called sampling noise", async () => {
  const runsRoot = await mkdtemp(join(tmpdir(), "compare-test-"));
  const folder = await makeRun({ runId: "two-models", right: new Set(["r2r"]), runsRoot });
  const loaded = await readRunFolder(folder);
  const luna = { ...loaded, summary: { ...loaded.summary, records: loaded.summary.records.map((record) => ({ ...record, model: "gpt-6-luna" })) } };
  const result = compareRunSides(selectSide(loaded, {}), selectSide(luna, {}));
  assert.equal(result.unchangedInput.label, "same prompt, different answer models");
  assert.match(formatComparison(result), /Identical-prompt stratum \(the same prompt on both sides, answered by different models/);
  assert.doesNotMatch(formatComparison(result), /differences here are sampling noise/);
});
