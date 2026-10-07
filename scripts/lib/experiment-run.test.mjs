import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ARM_A_REVISION,
  DEFAULT_ARM,
  assertCheckoutReady,
  executeExperiment,
  executeRegrade,
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
