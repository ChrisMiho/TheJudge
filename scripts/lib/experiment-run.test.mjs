import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ARM_A_REVISION,
  DEFAULT_ARM,
  CALLS_FILE,
  assertAllPriced,
  assertCheckoutReady,
  assertGameFidelity,
  diffIdentity,
  executeExperiment,
  executeRegrade,
  findGameFidelityProblems,
  loadManifestFile,
  manifestEntryFor,
  recordKey,
  validateManifestCases,
  validateRunId
} from "./experiment-run.mjs";
import { sha256 } from "./gold-cases.mjs";

// Everything here is offline: fake clients, fake prompt builders, a temp folder.

function fixtureCase(id, overrides = {}) {
  return {
    id,
    tier: 1,
    review: { status: "approved", reviewedOn: "2026-10-06" },
    question: `Question ${id}?`,
    cards: [],
    gameState: null,
    difficulty: { cardCount: 0, sectionCount: 1, flags: [], score: 1 },
    source: { pool: "mechanic" },
    expected: { outcome: "works", shortAnswer: "Yes.", answer: `Reference answer ${id}.`, decidingRuleIds: ["100.1"] },
    ...overrides
  };
}

const CASES = [fixtureCase("case-one"), fixtureCase("case-two", { tier: 3 })];

function manifestFor(cases) {
  return { formatVersion: 1, cases: cases.map((caseEntry) => manifestEntryFor(caseEntry)) };
}

async function tempRoot() {
  return mkdtemp(join(tmpdir(), "experiment-run-test-"));
}

function fakeClient() {
  const calls = [];
  return {
    calls,
    responses: {
      create: async (params) => {
        calls.push(params);
        return { output_text: "Per rule 100.1, yes.", usage: { input_tokens: 2000, output_tokens: 300 } };
      }
    }
  };
}

function fakeGit(overrides = {}) {
  return { head: async () => "0123456789abcdef0123456789abcdef01234567", isDirty: async () => false, ...overrides };
}

function fakeDeps(overrides = {}) {
  let clock = 1000;
  return {
    preparePromptInput: (request) => ({
      promptText: `PROMPT for ${request.question}`,
      enrichmentDebug: { supplemental: { usedSemantic: true, selected: [{ ruleId: "100.1" }] } }
    }),
    buildCaseRequest: (caseEntry) => ({ mode: "lookup", question: caseEntry.question }),
    describeRetrieval: (supplemental, expected) => ({
      usedSemantic: true,
      selectedRuleIds: (supplemental?.selected ?? []).map((rule) => rule.ruleId),
      goldRuleInPrompt: (supplemental?.selected ?? []).some((rule) => expected.includes(rule.ruleId))
    }),
    computeDeterministicAssertions: (answerText, decidingRuleIds, knownRuleIds) => {
      const cited = answerText.match(/\d{3}\.\d+[a-z]?/g) ?? [];
      return {
        namesGoldRuleId: decidingRuleIds.some((id) => cited.includes(id)),
        nonEmpty: answerText.length > 0,
        length: answerText.length,
        unknownRuleIds: cited.filter((id) => !knownRuleIds.has(id))
      };
    },
    judgeAnswerAlone: async () => ({
      undetermined: false,
      scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
      rationale: "Agrees.",
      usage: { inputTokens: 1500, outputTokens: 800 }
    }),
    judgeBlindRanking: async ({ answers }) => ({
      undetermined: false,
      ranks: Object.fromEntries(answers.map((answer, index) => [answer.modelId, index + 1])),
      rationale: "Ranked.",
      usage: { inputTokens: 3400, outputTokens: 1000 }
    }),
    computeCallCostUsd: (model, input, output) => (input * 2 + output * 8) / 1_000_000,
    resources: {},
    ruleIds: ["100.1", "613.9"],
    embedQueries: async () => new Map(),
    embeddingProvider: "local",
    embeddingModel: "Xenova/all-MiniLM-L6-v2",
    requireSemantic: true,
    comboCatalogLoaded: true,
    rubricRevision: "test-rubric",
    rateTable: { "gpt-4.1": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 } },
    clientOptions: { timeoutMs: "sdk-default", maxRetries: "sdk-default" },
    productionTimeoutMs: 15000,
    git: fakeGit(),
    fileHashes: async (cases) => ({
      dataFiles: { "gameRulesRuleIndex.json": "a".repeat(64) },
      caseFiles: Object.fromEntries(cases.map((caseEntry) => [caseEntry.id, "b".repeat(64)])),
      rulesIndexSha256: "a".repeat(64)
    }),
    now: () => (clock += 25),
    nowIso: () => "2026-10-07T12:00:00.000Z",
    ...overrides
  };
}

async function experimentParams(overrides = {}) {
  const manifest = manifestFor(CASES);
  return {
    runId: "run-one",
    runsRoot: await tempRoot(),
    client: fakeClient(),
    judgeModel: "gpt-5",
    models: ["gpt-4.1"],
    excerptCaps: [10],
    arms: [{ id: DEFAULT_ARM, revision: ARM_A_REVISION }],
    repeats: 1,
    cases: CASES,
    manifest,
    manifestSha256: sha256(JSON.stringify(manifest)),
    expectCommit: null,
    env: { ASK_AI_PROVIDER: "openai" },
    log: () => {},
    ...overrides
  };
}

async function listTree(root) {
  const out = {};
  async function walk(dir, prefix) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(join(dir, entry.name), rel);
      else out[rel] = await readFile(join(dir, entry.name), "utf8");
    }
  }
  await walk(root, "");
  return out;
}

// A1 ------------------------------------------------------------------------

test("a manifest with a missing, unapproved, stale, or hash-mismatched case refuses the run and names that case", () => {
  const base = manifestFor(CASES);
  const withExtra = (entry) => ({ cases: [...base.cases, entry] });

  assert.throws(
    () => validateManifestCases({ manifest: withExtra({ id: "ghost-case", questionSha256: "x", answerSha256: "y" }), allCases: CASES }),
    /ghost-case: missing/
  );

  const drafts = [...CASES, fixtureCase("draft-case", { review: { status: "draft" } })];
  assert.throws(
    () => validateManifestCases({ manifest: { cases: [...base.cases, manifestEntryFor(drafts[2])] }, allCases: drafts }),
    /draft-case: unapproved/
  );

  assert.throws(
    () => validateManifestCases({ manifest: base, allCases: CASES, isStale: (caseEntry) => caseEntry.id === "case-two" }),
    /case-two: stale/
  );

  const reworded = [fixtureCase("case-one", { question: "A different question?" }), CASES[1]];
  assert.throws(() => validateManifestCases({ manifest: base, allCases: reworded }), /case-one: hash mismatch -- the question differs/);

  const reanswered = [CASES[0], fixtureCase("case-two", { tier: 3, expected: { ...CASES[1].expected, answer: "Reworked." } })];
  assert.throws(
    () => validateManifestCases({ manifest: base, allCases: reanswered }),
    /case-two: hash mismatch -- the reference answer differs/
  );

  // Every problem is listed in one refusal, not one at a time.
  const several = { cases: [...base.cases, { id: "ghost-a", questionSha256: "x", answerSha256: "y" }, { id: "ghost-b", questionSha256: "x", answerSha256: "y" }] };
  assert.throws(() => validateManifestCases({ manifest: several, allCases: CASES }), (error) => /ghost-a/.test(error.message) && /ghost-b/.test(error.message));

  assert.deepEqual(validateManifestCases({ manifest: base, allCases: CASES }).map((c) => c.id), ["case-one", "case-two"]);
});

test("a refused manifest makes no call: the live loop is never reached", async () => {
  // The refusal happens in validateManifestCases, which the command runs before building any client.
  const client = fakeClient();
  assert.throws(() => validateManifestCases({ manifest: { cases: [{ id: "ghost", questionSha256: "x", answerSha256: "y" }] }, allCases: CASES }));
  assert.equal(client.calls.length, 0);
});

test("loadManifestFile refuses a malformed manifest and hashes the file it read", async () => {
  const root = await tempRoot();
  const good = join(root, "good.json");
  const text = JSON.stringify(manifestFor(CASES));
  await writeFile(good, text);
  const loaded = await loadManifestFile(good);
  assert.equal(loaded.manifestSha256, sha256(text));
  assert.equal(loaded.manifest.cases.length, 2);

  const bad = join(root, "bad.json");
  await writeFile(bad, JSON.stringify({ cases: [{ id: "x" }] }));
  await assert.rejects(() => loadManifestFile(bad), /malformed.*no questionSha256/);
  await assert.rejects(() => loadManifestFile(join(root, "absent.json")), /Cannot read the manifest/);
});

// A2 ------------------------------------------------------------------------

test("--repeat 3 produces three independent records per case keyed by case, model, cap, arm and repeat index", async () => {
  const params = await experimentParams({ repeats: 3 });
  const { summary } = await executeExperiment(params, fakeDeps());

  assert.equal(summary.records.length, CASES.length * 3);
  assert.equal(params.client.calls.length, CASES.length * 3, "each repeat is its own answer call");
  const keys = summary.records.map((record) => record.key);
  assert.equal(new Set(keys).size, keys.length, "every key is unique");
  assert.ok(keys.includes(recordKey({ caseId: "case-one", model: "gpt-4.1", excerptCap: 10, arm: "A", repeat: 3 })));
  for (const record of summary.records) {
    assert.deepEqual(
      Object.keys({ caseId: record.caseId, model: record.model, excerptCap: record.excerptCap, arm: record.arm, repeat: record.repeat }),
      ["caseId", "model", "excerptCap", "arm", "repeat"]
    );
    assert.equal(record.key, `${record.caseId}|${record.model}|${record.excerptCap}|${record.arm}|${record.repeat}`);
  }
  const transcripts = await readdir(join(params.runsRoot, "run-one", "transcripts"));
  assert.equal(transcripts.length, CASES.length * 3, "a transcript per record");
});

// A3 ------------------------------------------------------------------------

test("the identity record carries every field the design lists, including the commit the run executes from", async () => {
  const params = await experimentParams();
  await executeExperiment(params, fakeDeps());
  const identity = JSON.parse(await readFile(join(params.runsRoot, "run-one", "manifest.json"), "utf8"));

  assert.equal(identity.runId, "run-one");
  assert.equal(identity.commit, "0123456789abcdef0123456789abcdef01234567");
  assert.equal(identity.manifestSha256, params.manifestSha256);
  assert.deepEqual(Object.keys(identity.dataFileSha256), ["gameRulesRuleIndex.json"]);
  assert.deepEqual(Object.keys(identity.caseFileSha256).sort(), ["case-one", "case-two"]);
  assert.equal(identity.rulesIndexSha256, "a".repeat(64));
  assert.deepEqual(identity.models, { requested: ["gpt-4.1"], reported: {} });
  assert.deepEqual(identity.requestOptions, { fields: ["model", "input"] });
  assert.deepEqual(identity.client, { timeoutMs: "sdk-default", maxRetries: "sdk-default" });
  assert.equal(identity.askAiProvider, "openai");
  assert.equal(identity.embeddingProvider, "local");
  assert.equal(identity.embeddingModel, "Xenova/all-MiniLM-L6-v2");
  assert.equal(identity.comboCatalogLoaded, true);
  assert.deepEqual(identity.excerptCaps, [10]);
  assert.deepEqual(identity.arms, [{ id: "A", revision: ARM_A_REVISION }]);
  assert.equal(identity.repeats, 1);
  assert.equal(identity.judgeModel, "gpt-5");
  assert.equal(identity.rubricRevision, "test-rubric");
  assert.deepEqual(identity.rateTable, { "gpt-4.1": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 } });
  assert.equal(identity.maxCostUsd, null);
  assert.equal(identity.productionTimeoutMs, 15000);
  assert.equal(identity.regrade, null);
  assert.equal(identity.startedAt, "2026-10-07T12:00:00.000Z");
  assert.deepEqual(identity.caseList.map((entry) => entry.id), ["case-one", "case-two"]);
});

test("the numbers-only summary holds no model prose, and a transcript holds it", async () => {
  const params = await experimentParams();
  await executeExperiment(params, fakeDeps());
  const summaryText = await readFile(join(params.runsRoot, "run-one", "summary.json"), "utf8");
  assert.ok(!summaryText.includes("Per rule 100.1, yes."));
  assert.ok(!summaryText.includes("Agrees."));
  const transcript = JSON.parse(await readFile(join(params.runsRoot, "run-one", "transcripts", (await readdir(join(params.runsRoot, "run-one", "transcripts")))[0]), "utf8"));
  assert.equal(transcript.answerText, "Per rule 100.1, yes.");
});

// A4 ------------------------------------------------------------------------

test("a dirty checkout and a commit different from --expect-commit each refuse the run before any call", async () => {
  const dirty = await experimentParams();
  await assert.rejects(
    () => executeExperiment(dirty, fakeDeps({ git: fakeGit({ isDirty: async () => true }) })),
    /uncommitted changes/
  );
  assert.equal(dirty.client.calls.length, 0);
  await assert.rejects(() => stat(join(dirty.runsRoot, "run-one")), { code: "ENOENT" }, "no run folder is created");

  const wrongCommit = await experimentParams({ expectCommit: "deadbeef" });
  await assert.rejects(() => executeExperiment(wrongCommit, fakeDeps()), /--expect-commit deadbeef does not match.*0123456789abcdef/);
  assert.equal(wrongCommit.client.calls.length, 0);

  const rightCommit = await experimentParams({ expectCommit: "0123456" });
  await executeExperiment(rightCommit, fakeDeps());
  assert.equal(rightCommit.client.calls.length, CASES.length);

  await assert.rejects(() => assertCheckoutReady({ git: fakeGit(), expectCommit: "abc" }), /does not match/, "a too-short prefix never matches");
});

test("a run never overwrites an existing run folder", async () => {
  const params = await experimentParams();
  await executeExperiment(params, fakeDeps());
  await assert.rejects(() => executeExperiment({ ...params, client: fakeClient() }, fakeDeps()), /already exists/);
});

test("run ids that could escape the runs folder are refused", () => {
  for (const bad of ["", "../escape", "a/b", ".hidden", "x".repeat(81)]) assert.throws(() => validateRunId(bad), /not usable/);
  assert.equal(validateRunId("phase-2.base_1"), "phase-2.base_1");
});

// A5 (the routine-run half lives in scripts/eval-answer-quality.test.mjs) ----------

test("an experiment run writes only under its own run folder", async () => {
  const params = await experimentParams();
  const sibling = join(params.runsRoot, "sentinel.json");
  await writeFile(sibling, "unchanged");
  await executeExperiment(params, fakeDeps());
  const tree = await listTree(params.runsRoot);
  for (const path of Object.keys(tree)) {
    assert.ok(path === "sentinel.json" || path.startsWith("run-one/"), `unexpected write outside the run folder: ${path}`);
  }
  assert.equal(tree["sentinel.json"], "unchanged");
});

// Two models: a blind ranking per group -------------------------------------

test("two models add one blind-ranking call per case, arm and repeat, and set the blind rank", async () => {
  let rankings = 0;
  const params = await experimentParams({ models: ["gpt-4.1", "gpt-5-mini"], repeats: 2 });
  const { summary } = await executeExperiment(
    params,
    fakeDeps({
      judgeBlindRanking: async ({ answers }) => {
        rankings += 1;
        return { undetermined: false, ranks: Object.fromEntries(answers.map((a, i) => [a.modelId, i + 1])), rationale: "r", usage: { inputTokens: 10, outputTokens: 5 } };
      }
    })
  );
  assert.equal(rankings, CASES.length * 2);
  assert.equal(summary.records.length, CASES.length * 2 * 2);
  assert.ok(summary.records.every((record) => typeof record.blindRank === "number"));
  assert.equal(summary.totals.rankingInputTokens, 10 * rankings);
});

// A6 ------------------------------------------------------------------------

test("a regrade run makes zero answer calls, never writes into the source run folder, and records the source run and manifest hash", async () => {
  const source = await experimentParams({ runId: "source-run", repeats: 2 });
  await executeExperiment(source, fakeDeps());
  const sourceFolder = join(source.runsRoot, "source-run");
  const before = await listTree(sourceFolder);
  const sourceManifestText = before["manifest.json"];

  const answerClient = fakeClient();
  const judged = [];
  const result = await executeRegrade(
    {
      runId: "regrade-run",
      runsRoot: source.runsRoot,
      client: answerClient,
      judgeModel: "gpt-5",
      regradeFrom: "source-run",
      cases: CASES,
      expectCommit: null,
      env: {},
      log: () => {}
    },
    fakeDeps({
      judgeAnswerAlone: async (input) => {
        judged.push(input.answerText);
        return {
          undetermined: false,
          scores: { correctness: 1, grounding: 2, calibration: 2, readability: 2 },
          rationale: "Regraded.",
          usage: { inputTokens: 100, outputTokens: 50 }
        };
      },
      rubricRevision: "new-rubric"
    })
  );

  assert.equal(answerClient.calls.length, 0, "a regrade makes no answer call");
  assert.equal(judged.length, CASES.length * 2, "every stored answer is graded again");
  assert.ok(judged.every((text) => text === "Per rule 100.1, yes."), "the stored answer text is what gets graded");
  assert.deepEqual(await listTree(sourceFolder), before, "the source run folder is byte-identical afterwards");

  assert.deepEqual(result.identity.regrade, { sourceRunId: "source-run", sourceManifestSha256: sha256(sourceManifestText) });
  assert.equal(result.identity.rubricRevision, "new-rubric");
  assert.ok(result.summary.records.every((record) => record.scores.correctness === 1 && record.regradedFrom === "source-run"));
  const regradeTree = await listTree(join(source.runsRoot, "regrade-run"));
  assert.ok(Object.keys(regradeTree).every((path) => path === "manifest.json" || path === "summary.json" || path.startsWith("transcripts/")));

  await assert.rejects(
    () => executeRegrade({ runId: "source-run", runsRoot: source.runsRoot, client: fakeClient(), judgeModel: "gpt-5", regradeFrom: "source-run", cases: CASES, log: () => {} }, fakeDeps()),
    /needs its own run id/
  );
  await assert.rejects(
    () => executeRegrade({ runId: "r2", runsRoot: source.runsRoot, client: fakeClient(), judgeModel: "gpt-5", regradeFrom: "no-such-run", cases: CASES, log: () => {} }, fakeDeps()),
    /no manifest\.json/
  );
});

test("arms other than A build their prompt through the arm builder and are marked diagnostic", async () => {
  const arms = [
    { id: "A", revision: "A.1" },
    { id: "C", revision: "C.1" }
  ];
  const params = await experimentParams({ arms });
  const { summary } = await executeExperiment(
    params,
    fakeDeps({ buildArmPrompt: ({ arm, prepared }) => ({ promptText: `${prepared.promptText}\n[arm ${arm.id}]`, bundleRuleIds: [] }) })
  );
  const armC = summary.records.filter((record) => record.arm === "C");
  assert.equal(armC.length, CASES.length);
  assert.ok(armC.every((record) => record.diagnostic === true && record.armRevision === "C.1"));
  assert.ok(summary.records.filter((record) => record.arm === "A").every((record) => record.diagnostic === false));
  assert.ok(params.client.calls.some((call) => call.input.includes("[arm C]")));
});

// ---------------------------------------------------------------------------
// Slice B: save as you go, resume, the spending cap, unpriced models (REQ-227)
// ---------------------------------------------------------------------------

async function readCallLines(params, runId = "run-one") {
  try {
    const text = await readFile(join(params.runsRoot, runId, CALLS_FILE), "utf8");
    return text.split("\n").filter((line) => line.trim().length > 0).map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

test("each record is on disk in calls.jsonl before the next call starts, and a crash leaves every finished record", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3"), fixtureCase("c4")];
  const params = await experimentParams({ cases, manifest: manifestFor(cases) });
  const seenOnDisk = [];
  params.client.responses.create = async (call) => {
    seenOnDisk.push((await readCallLines(params)).length);
    params.client.calls.push(call);
    return { output_text: "Per rule 100.1, yes.", usage: { input_tokens: 10, output_tokens: 5 } };
  };
  await executeExperiment(params, fakeDeps());
  assert.deepEqual(seenOnDisk, [0, 1, 2, 3], "at the start of call N, the N-1 finished records are already on disk");

  // A crash in the middle (a code fault, not a provider error) keeps what finished.
  const crashing = await experimentParams({ runId: "crash", cases, manifest: manifestFor(cases) });
  let prepared = 0;
  await assert.rejects(
    () =>
      executeExperiment(
        crashing,
        fakeDeps({
          preparePromptInput: (request) => {
            prepared += 1;
            if (prepared === 3) throw new Error("boom: a fault outside the provider");
            return { promptText: `PROMPT for ${request.question}`, enrichmentDebug: { supplemental: { usedSemantic: true, selected: [] } } };
          }
        })
      ),
    /boom/
  );
  const lines = await readCallLines(crashing, "crash");
  assert.equal(lines.length, 2);
  assert.ok(lines.every((line) => line.type === "record" && line.record.status === "ok"));
});

test("a provider error and a timeout become error records and the run continues", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const params = await experimentParams({ cases, manifest: manifestFor(cases) });
  let n = 0;
  params.client.responses.create = async (call) => {
    n += 1;
    params.client.calls.push(call);
    if (n === 1) throw Object.assign(new Error("Request timed out."), { name: "APIConnectionTimeoutError" });
    if (n === 2) throw new Error("500 server error");
    return { output_text: "Per rule 100.1, yes.", usage: { input_tokens: 10, output_tokens: 5 } };
  };
  const { summary } = await executeExperiment(params, fakeDeps());
  assert.deepEqual(summary.records.map((record) => [record.caseId, record.status, record.errorKind]), [
    ["c1", "error", "timeout"],
    ["c2", "error", "provider"],
    ["c3", "ok", undefined]
  ]);
  assert.equal(summary.counts.errors, 2);
  assert.equal(summary.counts.ok, 1);
  assert.equal(summary.records[0].costUsd, 0);
  assert.equal((await readCallLines(params)).length, 3, "the error records are on disk too");
});

test("--resume skips completed keys and refuses when any identity field changed", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const params = await experimentParams({ cases, manifest: manifestFor(cases) });
  let prepared = 0;
  await assert.rejects(
    () =>
      executeExperiment(
        params,
        fakeDeps({
          preparePromptInput: (request) => {
            prepared += 1;
            if (prepared === 3) throw new Error("interrupted");
            return { promptText: `PROMPT for ${request.question}`, enrichmentDebug: { supplemental: { usedSemantic: true, selected: [] } } };
          }
        })
      ),
    /interrupted/
  );
  assert.equal((await readCallLines(params)).length, 2);

  // A changed identity field refuses, naming the field.
  for (const [field, change] of [
    ["judgeModel", { judgeModel: "gpt-5-other" }],
    ["models", { models: ["gpt-4.1", "gpt-5-mini"] }],
    ["repeats", { repeats: 2 }],
    ["excerptCaps", { excerptCaps: [10, 15] }]
  ]) {
    const refused = { ...params, ...change, client: fakeClient(), resume: true };
    await assert.rejects(() => executeExperiment(refused, fakeDeps()), new RegExp(`identity record changed \\(.*${field}`));
    assert.equal(refused.client.calls.length, 0, `a changed ${field} makes no call`);
  }
  await assert.rejects(
    () => executeExperiment({ ...params, client: fakeClient(), resume: true }, fakeDeps({ rubricRevision: "other-rubric" })),
    /rubricRevision/
  );
  await assert.rejects(
    () => executeExperiment({ ...params, client: fakeClient(), resume: true }, fakeDeps({ git: fakeGit({ head: async () => "f".repeat(40) }) })),
    /commit/
  );
  await assert.rejects(() => executeExperiment({ ...params, runId: "never-started", resume: true }, fakeDeps()), /no run folder/);

  // The unchanged identity resumes and answers only what is missing.
  const resumed = { ...params, client: fakeClient(), resume: true };
  const { summary } = await executeExperiment(resumed, fakeDeps());
  assert.equal(resumed.client.calls.length, 1, "only the one case that never finished is answered");
  assert.deepEqual(summary.records.map((record) => record.caseId), ["c1", "c2", "c3"]);
  assert.equal((await readCallLines(params)).length, 3);

  // A second resume of a finished run makes no call at all.
  const again = { ...params, client: fakeClient(), resume: true };
  await executeExperiment(again, fakeDeps());
  assert.equal(again.client.calls.length, 0);

  // Starting the same run id without --resume is still refused.
  await assert.rejects(() => executeExperiment({ ...params, client: fakeClient() }, fakeDeps()), /already exists.*--resume run-one/);
});

test("diffIdentity ignores the start time and the observed model ids and nothing else", () => {
  const base = { runId: "r", commit: "c", startedAt: "t1", models: { requested: ["m"], reported: {} }, repeats: 1 };
  assert.deepEqual(diffIdentity(base, { ...base, startedAt: "t2", models: { requested: ["m"], reported: { m: "m-2026" } } }), []);
  assert.deepEqual(diffIdentity(base, { ...base, repeats: 2 }), ["repeats"]);
  assert.deepEqual(diffIdentity(base, { ...base, models: { requested: ["x"], reported: {} } }), ["models"]);
});

test("--retry-errors re-attempts only the error records", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const params = await experimentParams({ cases, manifest: manifestFor(cases) });
  let n = 0;
  params.client.responses.create = async (call) => {
    n += 1;
    params.client.calls.push(call);
    if (n === 2) throw new Error("503 try later");
    return { output_text: "Per rule 100.1, yes.", usage: { input_tokens: 10, output_tokens: 5 } };
  };
  await executeExperiment(params, fakeDeps());
  assert.equal((await readCallLines(params)).filter((line) => line.record.status === "error").length, 1);

  // Plain resume leaves the error alone.
  const plain = { ...params, client: fakeClient(), resume: true };
  await executeExperiment(plain, fakeDeps());
  assert.equal(plain.client.calls.length, 0);

  // --retry-errors answers exactly the one failed case and the later record supersedes the error.
  const retry = { ...params, client: fakeClient(), resume: true, retryErrors: true };
  const { summary } = await executeExperiment(retry, fakeDeps());
  assert.equal(retry.client.calls.length, 1);
  assert.equal(retry.client.calls[0].input, "PROMPT for Question c2?");
  assert.deepEqual(summary.records.map((record) => [record.caseId, record.status]), [["c1", "ok"], ["c2", "ok"], ["c3", "ok"]]);
});

test("the run stops cleanly before a call whose estimate would pass the cap, and the summary names the cap and the spend", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const logs = [];
  // Each answer costs (2000*2 + 300*8)/1e6 = 0.0064 and each grade (1500*2 + 800*8)/1e6 = 0.0094; estimates below are the dry-run method's.
  const params = await experimentParams({ cases, manifest: manifestFor(cases), maxCostUsd: 0.05, log: (line) => logs.push(line) });
  const deps = fakeDeps({
    estimateCallCostUsd: ({ kind }) => (kind === "answer" ? 0.02 : 0.01),
    computeCallCostUsd: (model) => (model === "gpt-5" ? 0.01 : 0.02),
    rateTable: { "gpt-4.1": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 }, "gpt-5": { inputUsdPerMillion: 1.25, outputUsdPerMillion: 10 } }
  });
  const { summary } = await executeExperiment(params, deps);

  // Call 1 spends 0.03 (estimate 0.03 <= 0.05), call 2 would end at 0.06: stopped before it.
  assert.equal(params.client.calls.length, 1);
  assert.equal(summary.records.length, 1);
  assert.equal(summary.stoppedReason.kind, "cap");
  assert.equal(summary.stoppedReason.maxCostUsd, 0.05);
  assert.ok(Math.abs(summary.stoppedReason.spentUsd - 0.03) < 1e-9);
  assert.ok(logs.some((line) => /Stopped before passing the spending cap: \$0\.0300 spent of the \$0\.05 cap/.test(line)));

  // A resume with the same cap cannot spend past it either; the stop is repeatable, not a crash.
  const again = { ...params, client: fakeClient(), resume: true };
  const second = await executeExperiment(again, deps);
  assert.equal(again.client.calls.length, 0);
  assert.equal(second.summary.stoppedReason.kind, "cap");
});

test("a capped run with no cap trouble finishes and records no stop", async () => {
  const params = await experimentParams({ maxCostUsd: 100 });
  const { summary } = await executeExperiment(
    params,
    fakeDeps({
      estimateCallCostUsd: () => 0.01,
      rateTable: { "gpt-4.1": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 }, "gpt-5": { inputUsdPerMillion: 1.25, outputUsdPerMillion: 10 } }
    })
  );
  assert.equal(summary.stoppedReason, null);
  assert.equal(summary.records.length, CASES.length);
});

test("reasoning tokens are costed as output tokens and recorded apart", async () => {
  const params = await experimentParams({ models: ["gpt-6-luna"] });
  params.client.responses.create = async (call) => {
    params.client.calls.push(call);
    return {
      output_text: "Per rule 100.1, yes.",
      model: "gpt-6-luna-2026-09-30",
      usage: { input_tokens: 1000, output_tokens: 1700, output_tokens_details: { reasoning_tokens: 1500 } }
    };
  };
  const rates = { "gpt-6-luna": { input: 0.1, output: 0.5 } };
  const { summary, identity } = await executeExperiment(
    params,
    fakeDeps({ computeCallCostUsd: (model, input, output) => ((rates[model]?.input ?? 0) * input + (rates[model]?.output ?? 0) * output) / 1_000_000 })
  );
  const [record] = summary.records;
  assert.equal(record.outputTokens, 1700, "the provider's output tokens include the reasoning tokens");
  assert.equal(record.reasoningTokens, 1500);
  assert.ok(Math.abs(record.costUsd - (0.1 * 1000 + 0.5 * 1700) / 1_000_000) < 1e-12, "all 1700 output tokens, reasoning included, are costed at the output rate");
  assert.equal(record.reportedModel, "gpt-6-luna-2026-09-30");
  assert.equal(summary.totals.reasoningTokens, 1500 * CASES.length);
  const onDisk = JSON.parse(await readFile(join(params.runsRoot, "run-one", "manifest.json"), "utf8"));
  assert.deepEqual(onDisk.models.reported, { "gpt-6-luna": "gpt-6-luna-2026-09-30" });
  assert.deepEqual(identity.models.reported, onDisk.models.reported);
});

test("a capped live run refuses to start while any answer or judge model is unpriced", async () => {
  assert.throws(
    () => assertAllPriced({ models: ["gpt-4.1", "gpt-6-luna"], judgeModel: "gpt-5", rateTable: { "gpt-4.1": {}, "gpt-5": {} } }),
    /no rate is known for gpt-6-luna \(unpriced\)/
  );
  assert.throws(() => assertAllPriced({ models: ["gpt-4.1"], judgeModel: "mystery-judge", rateTable: { "gpt-4.1": {} } }), /mystery-judge/);
  assert.doesNotThrow(() => assertAllPriced({ models: ["gpt-4.1"], judgeModel: "gpt-5", rateTable: { "gpt-4.1": {}, "gpt-5": {} } }));

  const params = await experimentParams({ models: ["gpt-6-luna"], maxCostUsd: 5 });
  await assert.rejects(() => executeExperiment(params, fakeDeps()), /unpriced/);
  assert.equal(params.client.calls.length, 0);
  await assert.rejects(() => stat(join(params.runsRoot, "run-one")), { code: "ENOENT" });
});

// ---------------------------------------------------------------------------
// Slice C: the record fields and the judge's inputs in an experiment run (REQ-186, REQ-189)
// ---------------------------------------------------------------------------

test("an experiment record carries allDecidingRulesInPrompt beside goldRuleInPrompt, the reported effort and an unpriced flag, and the judge gets the prompt's excerpts", async () => {
  const caseEntry = fixtureCase("fields", { expected: { outcome: "works", shortAnswer: "Yes.", answer: "Reference.", decidingRuleIds: ["100.1", "200.2"] } });
  const params = await experimentParams({ cases: [caseEntry], manifest: manifestFor([caseEntry]), models: ["gpt-7-mystery"] });
  params.client.responses.create = async (call) => {
    params.client.calls.push(call);
    return { output_text: "Per rule 100.1, yes.", reasoning: { effort: "medium" }, usage: { input_tokens: 100, output_tokens: 90, output_tokens_details: { reasoning_tokens: 60 } } };
  };
  const judgeInputs = [];
  const { summary } = await executeExperiment(
    params,
    fakeDeps({
      resources: { gameRulesRuleIndex: [{ ruleId: "100.1", text: "Rule one hundred point one." }] },
      computeCallCostUsd: (model) => (model === "gpt-5" ? 0.01 : null),
      judgeAnswerAlone: async (input) => {
        judgeInputs.push(input);
        return { undetermined: false, scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 }, rationale: "ok", usage: { inputTokens: 5, outputTokens: 6, reasoningTokens: 2 } };
      }
    })
  );
  const [record] = summary.records;
  assert.equal(record.goldRuleInPrompt, true);
  assert.equal(record.allDecidingRulesInPrompt, false);
  assert.equal(record.reasoningTokens, 60);
  assert.equal(record.judgeReasoningTokens, 2);
  assert.equal(record.reportedEffort, "medium");
  assert.equal(record.unpriced, true);
  assert.equal(record.costUsd, null, "unpriced is null, not zero");
  assert.deepEqual(judgeInputs[0].attachedExcerpts, [{ ruleId: "100.1", text: "Rule one hundred point one." }]);
  assert.deepEqual(judgeInputs[0].decidingRuleIds, ["100.1", "200.2"]);
  assert.equal("ruleIds" in judgeInputs[0], false, "the old single rule-id label is gone");
});

test("a regrade re-grades with the excerpts the stored prompt carried and carries the answer-call telemetry forward", async () => {
  const source = await experimentParams({ runId: "src-fields" });
  await executeExperiment(source, fakeDeps({ resources: { gameRulesRuleIndex: [{ ruleId: "100.1", text: "Rule text." }] } }));
  const seen = [];
  const { summary } = await executeRegrade(
    { runId: "regrade-fields", runsRoot: source.runsRoot, client: fakeClient(), judgeModel: "gpt-5", regradeFrom: "src-fields", cases: CASES, log: () => {} },
    fakeDeps({
      resources: { gameRulesRuleIndex: [{ ruleId: "100.1", text: "Rule text." }] },
      judgeAnswerAlone: async (input) => {
        seen.push(input.attachedExcerpts);
        return { undetermined: false, scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 }, rationale: "ok", usage: { inputTokens: 1, outputTokens: 1, reasoningTokens: 0 } };
      }
    })
  );
  assert.ok(seen.every((excerpts) => excerpts.length === 1 && excerpts[0].ruleId === "100.1"));
  assert.ok(summary.records.every((record) => record.goldRuleInPrompt === true && record.inputTokens === 2000 && record.outputTokens === 300));
});

test("a record marks a held-out case with heldOut, and an arm's records with diagnostic and the arm's revision id", async () => {
  const arms = [
    { id: "A", revision: "A.1" },
    { id: "B", revision: "B.1" }
  ];
  const params = await experimentParams({ arms, heldOutIds: new Set(["case-two"]) });
  const { summary } = await executeExperiment(params, fakeDeps({ buildArmPrompt: ({ prepared }) => ({ promptText: `${prepared.promptText}\n[B]`, bundleRuleIds: [] }) }));
  const flags = summary.records.map((record) => [record.caseId, record.arm, record.armRevision, record.diagnostic, record.heldOut]);
  assert.deepEqual(flags, [
    ["case-one", "A", "A.1", false, false],
    ["case-one", "B", "B.1", true, false],
    ["case-two", "A", "A.1", false, true],
    ["case-two", "B", "B.1", true, true]
  ]);
});

// ---------------------------------------------------------------------------
// Slice G alignment with the finalized proposal (REQ-226, REQ-227, REQ-186)
// ---------------------------------------------------------------------------

const PRICED_RATES = { "gpt-4.1": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 }, "gpt-5": { inputUsdPerMillion: 1.25, outputUsdPerMillion: 10 } };

test("a resume continues against the recorded cap unless a new one is given, which is recorded", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const deps = fakeDeps({ estimateCallCostUsd: ({ kind }) => (kind === "answer" ? 0.02 : 0.01), computeCallCostUsd: (model) => (model === "gpt-5" ? 0.01 : 0.02), rateTable: PRICED_RATES });
  const params = await experimentParams({ cases, manifest: manifestFor(cases), maxCostUsd: 0.05 });
  const first = await executeExperiment(params, deps);
  assert.equal(first.summary.stoppedReason.maxCostUsd, 0.05);
  assert.equal(params.client.calls.length, 1);

  // Resuming with no cap given continues against the recorded 0.05: no further call fits, so it stops again.
  const sameCap = { ...params, client: fakeClient(), resume: true, maxCostUsd: null };
  const again = await executeExperiment(sameCap, deps);
  assert.equal(sameCap.client.calls.length, 0);
  assert.equal(again.summary.stoppedReason.maxCostUsd, 0.05);

  // A new cap is recorded and lets the run finish; the identity record keeps the history.
  const higher = { ...params, client: fakeClient(), resume: true, maxCostUsd: 1 };
  const finished = await executeExperiment(higher, deps);
  assert.equal(higher.client.calls.length, 2, "the two cases that never ran are answered");
  assert.equal(finished.summary.stoppedReason, null);
  const onDisk = JSON.parse(await readFile(join(params.runsRoot, "run-one", "manifest.json"), "utf8"));
  assert.equal(onDisk.maxCostUsd, 1);
  assert.deepEqual(onDisk.capChanges.map((change) => [change.from, change.to]), [[0.05, 1]]);
  assert.deepEqual(finished.summary.notCompleted, []);
});

test("the summary lists every record key not completed, on a stop and on an error", async () => {
  const cases = [fixtureCase("c1"), fixtureCase("c2"), fixtureCase("c3")];
  const deps = fakeDeps({ estimateCallCostUsd: ({ kind }) => (kind === "answer" ? 0.02 : 0.01), computeCallCostUsd: (model) => (model === "gpt-5" ? 0.01 : 0.02), rateTable: PRICED_RATES });
  const stopped = await executeExperiment(await experimentParams({ cases, manifest: manifestFor(cases), maxCostUsd: 0.05 }), deps);
  assert.deepEqual(stopped.summary.notCompleted, ["c2|gpt-4.1|10|A|1", "c3|gpt-4.1|10|A|1"]);
  assert.ok(Array.isArray(stopped.summary.notCompleted));

  const errored = await experimentParams({ cases, manifest: manifestFor(cases) });
  let n = 0;
  errored.client.responses.create = async (call) => {
    n += 1;
    errored.client.calls.push(call);
    if (n === 2) throw new Error("500");
    return { output_text: "Per rule 100.1, yes.", usage: { input_tokens: 1, output_tokens: 1 } };
  };
  const { summary } = await executeExperiment(errored, fakeDeps());
  assert.deepEqual(summary.notCompleted, ["c2|gpt-4.1|10|A|1"]);
});

test("a regrade refuses a stored answer that lacks its answer text or the prompt it answered", async () => {
  const source = await experimentParams({ runId: "src-bad" });
  await executeExperiment(source, fakeDeps());
  const folder = join(source.runsRoot, "src-bad", "transcripts");
  const names = await readdir(folder);
  const target = join(folder, names[0]);
  const stored = JSON.parse(await readFile(target, "utf8"));
  delete stored.promptText;
  await writeFile(target, JSON.stringify(stored));
  await assert.rejects(
    () => executeRegrade({ runId: "regrade-bad", runsRoot: source.runsRoot, client: fakeClient(), judgeModel: "gpt-5", regradeFrom: "src-bad", cases: CASES, log: () => {} }, fakeDeps()),
    /1 stored answer\(s\) lack the answer text or the prompt hash source/
  );
  await assert.rejects(() => stat(join(source.runsRoot, "regrade-bad")), { code: "ENOENT" });
});

test("the blind ranking is handed the same attached-excerpt, deciding-rule and game-state inputs as the lone judge", async () => {
  const caseEntry = fixtureCase("rank-inputs", { expected: { outcome: "works", shortAnswer: "Yes.", answer: "Reference.", decidingRuleIds: ["100.1", "200.2"] } });
  const params = await experimentParams({ cases: [caseEntry], manifest: manifestFor([caseEntry]), models: ["gpt-4.1", "gpt-5-mini"] });
  const lone = [];
  const ranking = [];
  await executeExperiment(
    params,
    fakeDeps({
      preparePromptInput: (request) => ({ promptText: `PROMPT ${request.question}`, enrichmentDebug: { supplemental: { usedSemantic: true, selected: [{ ruleId: "100.1" }] } } }),
      resources: { gameRulesRuleIndex: [{ ruleId: "100.1", text: "Rule text." }] },
      judgeAnswerAlone: async (input) => {
        lone.push({ attachedExcerpts: input.attachedExcerpts, decidingRuleIds: input.decidingRuleIds, stateLines: input.stateLines });
        return { undetermined: false, scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 }, rationale: "ok", usage: { inputTokens: 1, outputTokens: 1, reasoningTokens: 0 } };
      },
      judgeBlindRanking: async (input) => {
        ranking.push({ attachedExcerpts: input.attachedExcerpts, decidingRuleIds: input.decidingRuleIds, stateLines: input.stateLines });
        return { undetermined: true, reason: "n/a", usage: { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 } };
      }
    })
  );
  assert.equal(ranking.length, 1);
  assert.deepEqual(ranking[0], lone[0]);
  assert.deepEqual(ranking[0].attachedExcerpts, [{ ruleId: "100.1", text: "Rule text." }]);
  assert.deepEqual(ranking[0].decidingRuleIds, ["100.1", "200.2"]);
});

// Game-case request fidelity (REQ-230) ---------------------------------------

const GAME_STATE = { zones: { battlefield: [{ cardId: "oracle-1", owner: "player1" }] } };
const buildRequestFor = (caseEntry) =>
  caseEntry.gameState
    ? { mode: "game", question: caseEntry.question, gameContext: caseEntry.gameState }
    : { mode: "lookup", question: caseEntry.question };
// A prompt that prints the whole request, so any field the parse adds or changes shows in the prompt.
const preparePrinting = (request) => ({ promptText: `PROMPT ${JSON.stringify(request)}` });

test("a game case whose raw and parsed requests give the same prompt passes the fidelity check", () => {
  const caseEntry = fixtureCase("game-ok", { gameState: GAME_STATE });
  const args = { cases: [caseEntry], buildRequest: buildRequestFor, parseRequest: (raw) => structuredClone(raw), prepare: preparePrinting, resources: {}, excerptCaps: [5, 10] };
  assert.deepEqual(findGameFidelityProblems(args), []);
  assert.doesNotThrow(() => assertGameFidelity(args));
});

test("a game case whose parsed request would give a different prompt makes the run refuse, naming the case", () => {
  const same = fixtureCase("game-same", { gameState: GAME_STATE });
  const differs = fixtureCase("game-differs", { gameState: GAME_STATE });
  // The parse fills a default the raw request lacks (as the route's schema does for a zone card's targets).
  const parseRequest = (raw) => (raw.question.includes("game-differs") ? { ...raw, gameContext: { ...raw.gameContext, filled: [] } } : structuredClone(raw));
  const args = { cases: [same, differs], buildRequest: buildRequestFor, parseRequest, prepare: preparePrinting, resources: {}, excerptCaps: [10] };
  const problems = findGameFidelityProblems(args);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^game-differs: the prompt from the raw case request differs from the prompt from the request the route's schema parses/);
  assert.throws(() => assertGameFidelity(args), (error) => /refuses to start/.test(error.message) && /game-differs/.test(error.message) && !/game-same/.test(error.message));
});

test("the fidelity check names a case the route's schema rejects or whose question the schema changes, and skips lookup cases", () => {
  const rejected = fixtureCase("game-rejected", { gameState: GAME_STATE });
  const reworded = fixtureCase("game-reworded", { gameState: GAME_STATE });
  const lookup = fixtureCase("lookup-untouched");
  const parseRequest = (raw) => {
    if (raw.question.includes("game-rejected")) throw new Error("zones.battlefield[0].owner is invalid");
    if (raw.question.includes("game-reworded")) return { ...raw, question: raw.question.trim().toUpperCase() };
    throw new Error("a lookup case is never parsed by the check");
  };
  const problems = findGameFidelityProblems({ cases: [rejected, reworded, lookup], buildRequest: buildRequestFor, parseRequest, prepare: preparePrinting, resources: {}, excerptCaps: [10] });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /game-rejected: the Ask AI route's schema rejects the request this case builds \(zones\.battlefield\[0\]\.owner is invalid\)/);
  assert.match(problems[1], /game-reworded: the route's schema changes the question text/);
  assert.deepEqual(findGameFidelityProblems({ cases: [lookup], buildRequest: buildRequestFor, parseRequest, prepare: preparePrinting, resources: {} }), []);
});

// Local practice suite (REQ-232): invented cases, a fake client, a temporary folder -------------------

function suiteFixtureCase(id, { level = 1, complexity = "simple", excluded = null } = {}) {
  return fixtureCase(id, {
    tier: "external",
    review: { status: "draft", reviewedOn: null },
    source: { authority: "external-unapproved" },
    suite: { name: "rulesguru", questionId: 1, level, complexity, tags: [], citedRuleIds: ["100.1"], ruleGroups: [["100.1"]], excluded }
  });
}

test("suite validation passes a present, non-excluded, non-stale case and refuses an excluded, stale or hash-mismatched one", () => {
  const good = suiteFixtureCase("suite-good");
  const excluded = suiteFixtureCase("suite-excluded", { excluded: "unresolved-card" });
  const all = [good, excluded];
  const manifest = manifestFor(all);
  assert.throws(() => validateManifestCases({ manifest, allCases: all, suite: true }), /suite-excluded: excluded -- unresolved-card/);
  assert.throws(() => validateManifestCases({ manifest, allCases: all }), /suite-good: unapproved/, "without the suite hook the approved check applies");
  assert.deepEqual(validateManifestCases({ manifest: manifestFor([good]), allCases: all, suite: true }).map((c) => c.id), ["suite-good"]);
  assert.throws(
    () => validateManifestCases({ manifest: manifestFor([good]), allCases: all, suite: true, isStale: () => true }),
    /suite-good: stale/
  );
  const reworded = [{ ...good, question: "A different question?" }, excluded];
  assert.throws(() => validateManifestCases({ manifest: manifestFor([good]), allCases: reworded, suite: true }), /hash mismatch -- the question differs/);
});

test("a suite run with a fake client writes only under its temporary run folder, labels agreement, splits by level and complexity, and resumes", async () => {
  const cases = [suiteFixtureCase("suite-a", { level: 0 }), suiteFixtureCase("suite-b", { level: "corner", complexity: "complicated" })];
  const manifest = { formatVersion: 1, suite: { name: "rulesguru" }, cases: cases.map((c) => manifestEntryFor(c)) };
  const params = await experimentParams({
    cases,
    manifest,
    suite: { name: "rulesguru" },
    extraFiles: { "suite-manifest.json": manifest },
    maxCostUsd: null
  });
  const client = params.client;
  const { summary, folder } = await executeExperiment(params, fakeDeps());
  assert.equal(client.calls.length, 2);

  const tree = await listTree(params.runsRoot);
  assert.ok(Object.keys(tree).every((name) => name.startsWith("run-one/")), "everything is under runs/<id>/");
  assert.ok(tree["run-one/suite-manifest.json"], "the filter manifest is saved in the run folder");
  assert.ok(tree["run-one/summary.json"] && tree["run-one/manifest.json"] && tree["run-one/calls.jsonl"]);

  assert.match(summary.suite.label, /agrees with RulesGuru/);
  assert.deepEqual(summary.suite.byLevel, { 0: { graded: 1, agreesWithRulesGuru: 1 }, corner: { graded: 1, agreesWithRulesGuru: 1 } });
  assert.deepEqual(summary.suite.byComplexity, {
    complicated: { graded: 1, agreesWithRulesGuru: 1 },
    simple: { graded: 1, agreesWithRulesGuru: 1 }
  });
  assert.deepEqual(summary.records.map((r) => [r.strata.level, r.strata.complexity]), [["0", "simple"], ["corner", "complicated"]]);

  // Resume reuses the checkpoint: no new answer call.
  const second = { ...params, client: fakeClient(), resume: true, extraFiles: {} };
  await executeExperiment(second, fakeDeps());
  assert.equal(second.client.calls.length, 0);
  assert.equal(folder, join(params.runsRoot, "run-one"));
});

test("a corpus run is unchanged: no suite block in its identity or summary, no level in its strata", async () => {
  const params = await experimentParams();
  const { identity, summary } = await executeExperiment(params, fakeDeps());
  assert.equal(Object.hasOwn(identity, "suite"), false);
  assert.equal(Object.hasOwn(summary, "suite"), false);
  assert.equal(Object.hasOwn(summary.records[0].strata, "level"), false);
});
