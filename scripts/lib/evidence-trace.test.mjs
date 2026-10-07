import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runTraceCompare } from "../eval-evidence-trace-compare.mjs";
import { parseTraceArgs, runEvidenceTrace } from "../eval-evidence-trace.mjs";
import {
  VECTOR_SOURCES,
  buildTrace,
  checkBaselineParity,
  compareTraces,
  formatTraceComparison,
  readTraceFolder,
  skippedForCuratedTopic,
  summarizeTrace,
  traceCase,
  writeTraceFolder
} from "./evidence-trace.mjs";

// Everything here is offline: a fake prompt builder, fake freeze checks, a temp folder.

const RULE_INDEX = [
  { ruleId: "514.1", sectionTitle: "Cleanup Step", text: "First, discard.", parentRuleIds: [] },
  { ruleId: "514.2", sectionTitle: "Cleanup Step", text: "Second, damage wears off.", parentRuleIds: [] },
  { ruleId: "514.3", sectionTitle: "Cleanup Step", text: "Normally no player receives priority.", parentRuleIds: [] },
  { ruleId: "514.3a", sectionTitle: "Cleanup Step", text: "If a state-based action is performed, players receive priority.", parentRuleIds: ["514.3"] },
  { ruleId: "614.1a", sectionTitle: "Replacement", text: "Instead.", parentRuleIds: [] },
  { ruleId: "701.21a", sectionTitle: "Destroy", text: "To destroy a permanent.", parentRuleIds: [] }
];

const CURATED_TOPICS = [{ id: "cleanup", title: "Cleanup", ruleNumbers: ["514.3"] }];
// The full System 3 ranking of the fake pipeline (curated rules are not scored, so 514.3 is absent from it).
const RANKING = ["701.21a", "514.1", "514.3a", "614.1a", "514.2"];

function fakePrepare(request, options) {
  const cap = options.supplementalRuleCap;
  const selected = RANKING.slice(0, cap).map((ruleId) => ({ ruleId, sectionTitle: "x", score: 1 }));
  return {
    promptText: `PROMPT ${request.question} cap=${cap} excerpts=${selected.map((rule) => rule.ruleId).join(",")} vector=${options.queryEmbedding ? "yes" : "no"}`,
    enrichmentDebug: {
      supplemental: { selected, runnerUp: [], usedSemantic: Boolean(options.queryEmbedding) },
      curatedGameRules: { topicIds: ["cleanup"], topics: CURATED_TOPICS },
      rulings: {}
    }
  };
}

function fixtureCase(id, decidingRuleIds, overrides = {}) {
  return {
    id,
    tier: 3,
    review: { status: "approved" },
    question: `Question ${id}?`,
    cards: [],
    gameState: null,
    expected: { decidingRuleIds },
    ...overrides
  };
}

function baseDeps(overrides = {}) {
  const embedded = [];
  return {
    embedded,
    deps: {
      resources: { gameRulesRuleIndex: RULE_INDEX, cardRulingsIndex: new Map() },
      parseRequest: async (caseEntry) => ({ mode: "lookup", question: caseEntry.question }),
      freezeCheck: () => ({ state: "fresh", vector: [0.1, 0.2] }),
      prepare: fakePrepare,
      embedLocal: async (request) => {
        embedded.push(request.question);
        return [0.3, 0.4];
      },
      productionCap: 2,
      ...overrides
    }
  };
}

// D1 ------------------------------------------------------------------------

test("per-rule output has the rank, selected-in-search, skipped-for-curated-topic and available-to-answer, and tells 514.3 present from 514.3a absent", async () => {
  const { deps } = baseDeps();
  const necro = fixtureCase("necropotence-like", ["514.1", "514.2", "514.3a"]);
  const [entry] = await buildTrace({ cases: [necro], ...deps });
  const byId = Object.fromEntries(entry.rules.map((rule) => [rule.ruleId, rule]));

  // 514.1 ranks 2nd of 5 and is selected at the production cap of 2.
  assert.equal(byId["514.1"].rank, 2);
  assert.equal(byId["514.1"].rankedOf, 5);
  assert.equal(byId["514.1"].selectedInSearch, true);
  assert.equal(byId["514.1"].availableToAnswer, true);
  assert.deepEqual(byId["514.1"].availableVia, { excerpt: true, curatedTopic: false, cardRuling: false });

  // 514.2 ranks 5th: ranked but not selected, so not available.
  assert.equal(byId["514.2"].rank, 5);
  assert.equal(byId["514.2"].selectedInSearch, false);
  assert.equal(byId["514.2"].availableToAnswer, false);

  // 514.3a: its curated parent 514.3 is excluded from scoring along with it, and the topic carries 514.3 only.
  assert.equal(byId["514.3a"].skippedForCuratedTopic, true);
  assert.equal(byId["514.3a"].selectedInSearch, false);
  assert.equal(byId["514.3a"].availableToAnswer, false);
  assert.equal(byId["514.3a"].parent.ruleId, "514.3");
  assert.equal(byId["514.3a"].parent.availableToAnswer, true, "514.3 is present (curated topic)");
  assert.equal(byId["514.3a"].parent.skippedForCuratedTopic, true);

  // A deciding rule with lettered subrules lists them.
  const parentCase = fixtureCase("parent-case", ["514.3"]);
  const [parentEntry] = await buildTrace({ cases: [parentCase], ...deps });
  assert.deepEqual(parentEntry.rules[0].subrules.map((sub) => [sub.ruleId, sub.availableToAnswer]), [["514.3a", false]]);
  assert.equal(parentEntry.rules[0].availableToAnswer, true);
  assert.equal(parentEntry.rules[0].availableVia.curatedTopic, true);
  assert.equal(parentEntry.rules[0].rank, null, "a curated rule is not in the ranking");
});

test("a card ruling that quotes a deciding rule makes it available to the answer", () => {
  const caseEntry = fixtureCase("ruling-case", ["701.21a", "614.1a"], { cards: [{ oracleId: "card-1", name: "Some Card" }] });
  const request = { mode: "lookup", question: "Q?", cards: [{ cardId: "card-1", name: "Some Card" }] };
  const cardRulingsIndex = new Map([["card-1", [{ publishedAt: "2020-01-01", comment: "Per rule 614.1a this is replaced." }]]]);
  const production = { ...fakePrepare(request, { supplementalRuleCap: 1 }) };
  production.promptText += "\n- 2020-01-01: Per rule 614.1a this is replaced.\n";
  const full = fakePrepare(request, { supplementalRuleCap: 99 });
  const entry = traceCase({
    caseEntry,
    request,
    full,
    production,
    ruleEntryById: new Map(RULE_INDEX.map((rule) => [rule.ruleId, rule])),
    cardRulingsIndex,
    vectorSource: VECTOR_SOURCES.frozen
  });
  const ruling = entry.rules.find((rule) => rule.ruleId === "614.1a");
  assert.deepEqual(ruling.availableVia, { excerpt: false, curatedTopic: false, cardRuling: true });
  assert.equal(ruling.availableToAnswer, true);
  assert.equal(ruling.selectedInSearch, false);
  assert.equal(entry.coverage.completeProcedure, true);
});

test("skippedForCuratedTopic covers a curated rule and the lettered subrules of a curated parent", () => {
  const entries = new Map(RULE_INDEX.map((rule) => [rule.ruleId, rule]));
  const curated = new Set(["514.3"]);
  assert.equal(skippedForCuratedTopic("514.3", curated, entries), true);
  assert.equal(skippedForCuratedTopic("514.3a", curated, entries), true);
  assert.equal(skippedForCuratedTopic("514.1", curated, entries), false);
});

// D2 ------------------------------------------------------------------------

test("case level: per-rule coverage, complete-procedure coverage and goldRuleInPrompt are reported side by side", async () => {
  const { deps } = baseDeps();
  const partial = fixtureCase("partial", ["701.21a", "514.2"]);
  const full = fixtureCase("full", ["701.21a", "514.1"]);
  const none = fixtureCase("none", ["614.1a", "514.3a"]);
  const traced = await buildTrace({ cases: [partial, full, none], ...deps });
  const coverage = Object.fromEntries(traced.map((entry) => [entry.caseId, entry.coverage]));

  assert.deepEqual(coverage.partial, { availableRules: 1, decidingRules: 2, completeProcedure: false, goldRuleInPrompt: true });
  assert.deepEqual(coverage.full, { availableRules: 2, decidingRules: 2, completeProcedure: true, goldRuleInPrompt: true });
  assert.deepEqual(coverage.none, { availableRules: 0, decidingRules: 2, completeProcedure: false, goldRuleInPrompt: false });
  assert.deepEqual(summarizeTrace(traced), {
    cases: 3,
    everyDecidingRuleSelected: 1,
    goldRuleInPrompt: 2,
    completeProcedure: 1,
    awaitingRefreeze: 0
  });
  assert.ok(traced.every((entry) => entry.promptHash.length === 64));
});

test("a case awaiting a re-freeze, or with no frozen vector, is embedded locally and labelled", async () => {
  const { deps, embedded } = baseDeps({
    freezeCheck: (caseId) => (caseId === "stale" ? { state: "awaiting-refreeze" } : caseId === "new" ? { state: "missing" } : { state: "fresh", vector: [1] })
  });
  const traced = await buildTrace({
    cases: [fixtureCase("fresh", ["514.1"]), fixtureCase("stale", ["514.1"]), fixtureCase("new", ["514.1"])],
    ...deps
  });
  assert.deepEqual(traced.map((entry) => entry.vectorSource), [VECTOR_SOURCES.frozen, VECTOR_SOURCES.embeddedLocally, VECTOR_SOURCES.noFrozenVector]);
  assert.deepEqual(embedded, ["Question stale?", "Question new?"], "only the cases without a fresh vector reach the local embedder");
  assert.equal(summarizeTrace(traced).awaitingRefreeze, 2);

  const lexical = await buildTrace({ cases: [fixtureCase("stale", ["514.1"])], ...baseDeps({ freezeCheck: () => ({ state: "awaiting-refreeze" }), embedLocal: async () => null }).deps });
  assert.equal(lexical[0].vectorSource, VECTOR_SOURCES.lexical);
});

test("the trace holds its hit and miss against the rules gate baseline and lists each divergence by case id", async () => {
  const { deps } = baseDeps();
  const traced = await buildTrace({
    cases: [fixtureCase("agrees", ["701.21a", "514.2"]), fixtureCase("diverges", ["701.21a"]), fixtureCase("unbaselined", ["701.21a"])],
    ...deps
  });
  const baseline = {
    cases: {
      agrees: { hit: ["701.21a"], miss: ["514.2"] },
      diverges: { hit: [], miss: ["701.21a"] }
    }
  };
  const parity = checkBaselineParity({ traced, baseline });
  assert.deepEqual({ checked: parity.checked, agree: parity.agree, skipped: parity.skipped }, { checked: 2, agree: 1, skipped: 1 });
  assert.deepEqual(parity.divergences, [
    { caseId: "diverges", trace: { hit: ["701.21a"], miss: [] }, baseline: { hit: [], miss: ["701.21a"] } }
  ]);
});

// D3 ------------------------------------------------------------------------

function fakeGit(overrides = {}) {
  return { head: async () => "0123456789abcdef0123456789abcdef01234567", isDirty: async () => false, ...overrides };
}

async function traceRunDeps(overrides = {}) {
  const outputRoot = await mkdtemp(join(tmpdir(), "evidence-trace-test-"));
  const { deps } = baseDeps();
  return {
    outputRoot,
    run: (extra = {}) =>
      runEvidenceTrace({
        argv: [],
        git: fakeGit(),
        outputRoot,
        loadCases: async () => [fixtureCase("one", ["701.21a"]), fixtureCase("two", ["514.2"]), fixtureCase("draft", ["514.1"], { review: { status: "draft" } })],
        loadResources: async () => deps.resources,
        loadTs: async () => ({
          parseRequest: deps.parseRequest,
          freezeCheck: deps.freezeCheck,
          prepare: deps.prepare,
          embedLocal: deps.embedLocal,
          baseline: { cases: { one: { hit: ["701.21a"], miss: [] }, two: { hit: ["514.2"], miss: [] } } }
        }),
        log: () => {},
        ...overrides,
        ...extra
      })
  };
}

test("the trace refuses a dirty checkout and records its commit in trace.json", async () => {
  const { run, outputRoot } = await traceRunDeps();
  await assert.rejects(() => run({ git: fakeGit({ isDirty: async () => true }) }), /uncommitted changes/);
  await assert.rejects(() => run({ argv: ["--expect-commit", "deadbeef"] }), /--expect-commit deadbeef does not match/);

  const { folder, trace } = await run();
  assert.equal(folder, join(outputRoot, "01234567"));
  assert.equal(trace.commit, "0123456789abcdef0123456789abcdef01234567");
  const onDisk = JSON.parse(await readFile(join(folder, "trace.json"), "utf8"));
  assert.equal(onDisk.commit, "0123456789abcdef0123456789abcdef01234567");
  assert.equal(onDisk.kind, "evidence-trace");
  assert.equal(onDisk.productionCap, 10);
  assert.equal(onDisk.ruleIndexSize, RULE_INDEX.length);
  assert.deepEqual(onDisk.cases.map((entry) => entry.caseId), ["one", "two"], "approved cases only: the draft is not traced");
  assert.equal(onDisk.baselineParity.agree, 2);

  const named = await run({ argv: ["--out", "head"] });
  assert.equal(named.folder, join(outputRoot, "head"));
  assert.throws(() => parseTraceArgs(["--out", "../escape"]), /not usable/);
});

// D4 ------------------------------------------------------------------------

async function writeFixtureTrace(name, commit, cases) {
  const outputRoot = await mkdtemp(join(tmpdir(), "evidence-trace-compare-"));
  const { deps } = baseDeps();
  const traced = await buildTrace({ cases, ...deps });
  const { folder } = await writeTraceFolder({ outputRoot, name, commit, productionCap: 10, ruleIndexSize: RULE_INDEX.length, traced, parity: null });
  return { folder, traced };
}

test("the compare command reports both commits, prompt-hash equality, coverage differences and one-sided cases", async () => {
  const a = await writeFixtureTrace("a", "3e973ced0000000000000000000000000000aaaa", [
    fixtureCase("same", ["701.21a"]),
    fixtureCase("improves", ["514.2"]),
    fixtureCase("regresses", ["701.21a"]),
    fixtureCase("only-a", ["514.1"])
  ]);

  // The second revision ranks differently: "improves" gains 514.2, "regresses" loses 701.21a, and "only-b" is new.
  const b = await writeFixtureTrace("b", "07cc3ab60000000000000000000000000000bbbb", [
    fixtureCase("same", ["701.21a"]),
    fixtureCase("improves", ["514.2"]),
    fixtureCase("regresses", ["701.21a"]),
    fixtureCase("only-b", ["514.1"])
  ]);
  const traceB = await readTraceFolder(b.folder);
  const byId = Object.fromEntries(traceB.cases.map((entry) => [entry.caseId, entry]));
  byId.improves.rules[0].availableToAnswer = true;
  byId.improves.coverage.completeProcedure = true;
  byId.improves.promptHash = "f".repeat(64);
  byId.regresses.rules[0].availableToAnswer = false;
  byId.regresses.coverage.completeProcedure = false;
  byId.regresses.coverage.goldRuleInPrompt = false;
  byId.regresses.promptHash = "e".repeat(64);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(b.folder, "trace.json"), `${JSON.stringify(traceB, null, 2)}\n`);

  const logs = [];
  const result = await runTraceCompare({ argv: [a.folder, b.folder], log: (line) => logs.push(line), cwd: "/" });

  assert.deepEqual(result.commits, { a: "3e973ced0000000000000000000000000000aaaa", b: "07cc3ab60000000000000000000000000000bbbb" });
  assert.equal(result.sharedCases, 3);
  assert.equal(result.promptHashEqual, 1);
  assert.equal(result.promptHashDifferent, 2);
  assert.deepEqual(result.onlyInA, ["only-a"]);
  assert.deepEqual(result.onlyInB, ["only-b"]);
  assert.deepEqual(result.coverageChanged.map((entry) => [entry.caseId, entry.gained, entry.lost]), [
    ["improves", ["514.2"], []],
    ["regresses", [], ["701.21a"]]
  ]);
  const text = logs.join("\n");
  assert.match(text, /commit 3e973ced0000000000000000000000000000aaaa/);
  assert.match(text, /commit 07cc3ab60000000000000000000000000000bbbb/);
  assert.match(text, /Prompt hash equal \(unchanged-input stratum\): 1; different: 2/);
  assert.match(text, /improves: gained 514\.2; complete procedure false -> true/);
  assert.match(text, /regresses: lost 701\.21a; complete procedure true -> false; goldRuleInPrompt true -> false/);
  assert.match(text, /Only in .*: only-a/);
  assert.doesNotMatch(text, /winner:|better|worse/i, "the comparison never names a winner");

  assert.equal(formatTraceComparison(compareTraces(await readTraceFolder(a.folder), await readTraceFolder(a.folder))).includes("Cases whose coverage differs: 0"), true);
  await assert.rejects(() => runTraceCompare({ argv: [a.folder], log: () => {} }), /exactly two trace folders/);
  await assert.rejects(() => runTraceCompare({ argv: [a.folder, "/no/such/folder"], log: () => {}, cwd: "/" }), /Cannot read a trace/);
});

// D6 ------------------------------------------------------------------------

test("eval:evidence-trace and eval:evidence-trace:compare exist in package.json, and a trace and a comparison make no network call", async () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["eval:evidence-trace"], "tsx scripts/eval-evidence-trace.mjs");
  assert.equal(pkg.scripts["eval:evidence-trace:compare"], "node scripts/eval-evidence-trace-compare.mjs");

  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = async () => {
    fetched += 1;
    throw new Error("no network call is allowed");
  };
  try {
    const { run } = await traceRunDeps();
    const { folder } = await run();
    await runTraceCompare({ argv: [folder, folder], log: () => {}, cwd: "/" });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);

  // Neither script nor the library reaches for the network or a provider.
  for (const file of ["scripts/eval-evidence-trace.mjs", "scripts/eval-evidence-trace-compare.mjs", "scripts/lib/evidence-trace.mjs"]) {
    const source = await readFile(join(repoRoot, file), "utf8");
    assert.doesNotMatch(source, /\bfetch\(|https?:\/\/|from "openai"|import\("openai"\)|responses\.create/, `${file} makes no network or provider call`);
  }
});
