import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { mkdtemp, readFile as readFileAsync, writeFile as writeFileAsync } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  BAKE_OFF_LINEUP,
  CONFIRM_FLAG,
  DEFAULT_EXCERPT_CAPS,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_LINEUP,
  assertLiveProviderConfigured,
  assertQueryEmbedded,
  buildCaseRequest,
  buildRunArtifact,
  checkModelAccess,
  computeCallCostUsd,
  describeRetrieval,
  describeExperimentPlan,
  estimateCallCostUsd,
  estimateCost,
  executeEvaluation,
  formatCommittedJson,
  NO_LOCAL_ENV_VARIABLE,
  parseArgs,
  resolveJudgeModel,
  resolveRunEnv,
  run
} from "./eval-answer-quality.mjs"
import { loadGoldCases } from "./lib/gold-cases.mjs"
import { manifestEntryFor } from "./lib/experiment-run.mjs"
import {
  computeHeadline,
  formatHeadline,
  mergeCaseLegScores,
  promptKey,
  referenceAnswerHash,
  selectCases,
  selectionReason
} from "./lib/answer-quality-run.mjs"

// The real loader reads the developer's `.secrets/openai-dev.env`; every test
// injects this stand-in so the suite never sees a real key, and the tests that
// pass `env: {}` really do run keyless.
const noLocalEnv = ({ env }) => ({ env: { ...env }, sources: [] })

// Never depends on the real preparePromptInput TS import: every test injects
// a fixed `measure`, so this file runs under plain `node --test`, no
// TypeScript loader, and makes no network call. It returns, for every case at
// every cap, a prompt hash and a prompt length, as the real measurement does.
const fakeMeasure = async ({ cases, excerptCaps }) => {
  const measured = new Map()
  for (const cap of excerptCaps) {
    for (const caseEntry of cases) {
      measured.set(promptKey(caseEntry.id, cap), { promptHash: `hash-${caseEntry.id}-${cap}`, promptChars: 10000 })
    }
  }
  return measured
}

// Tests that run against the real corpus treat every case as current: staleness
// is the case loader's own comparison, tested in scripts/lib/gold-cases.test.mjs.
const notStale = () => false

function fakeAccessClient(availableModelIds) {
  const calls = []
  return {
    calls,
    models: {
      async list() {
        calls.push("list")
        return { data: availableModelIds.map((id) => ({ id })) }
      }
    }
  }
}

test("parseArgs defaults to the deployed model at the deployed cap and --changed, ignoring OPENAI_MODEL entirely", () => {
  const originalOpenAiModel = process.env.OPENAI_MODEL
  process.env.OPENAI_MODEL = "some-other-model"
  try {
    const parsed = parseArgs([])
    assert.deepEqual(DEFAULT_LINEUP, ["gpt-4.1"])
    assert.deepEqual(DEFAULT_EXCERPT_CAPS, [10])
    assert.deepEqual(parsed.models, ["gpt-4.1"])
    assert.deepEqual(parsed.excerptCaps, [10])
    assert.deepEqual(parsed.mode, { kind: "changed" })
    assert.equal(parsed.confirmed, false)
    assert.ok(!parsed.models.includes("some-other-model"))
  } finally {
    if (originalOpenAiModel === undefined) delete process.env.OPENAI_MODEL
    else process.env.OPENAI_MODEL = originalOpenAiModel
  }
})

test("parseArgs reads repeatable --model and --excerpt-cap flags and the confirm flag", () => {
  const parsed = parseArgs(["--model", "gpt-4.1", "--model", "gpt-5-nano", "--excerpt-cap", "5", CONFIRM_FLAG])
  assert.deepEqual(parsed.models, ["gpt-4.1", "gpt-5-nano"])
  assert.deepEqual(parsed.excerptCaps, [5])
  assert.equal(parsed.confirmed, true)
})

test("resolveJudgeModel defaults to gpt-5 and honors ANSWER_QUALITY_JUDGE_MODEL", () => {
  assert.equal(resolveJudgeModel({}), DEFAULT_JUDGE_MODEL)
  assert.equal(resolveJudgeModel({ ANSWER_QUALITY_JUDGE_MODEL: "gpt-5-custom" }), "gpt-5-custom")
})

test("run with no confirmation flag and no OPENAI_API_KEY prints a plan, makes no network call, and exits without error", async () => {
  const logs = []
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: [],
    env: {},
    log: (line) => logs.push(line),
    measure: fakeMeasure,
    isStale: notStale
  })

  assert.equal(result.ran, false)
  assert.equal(result.accessChecked, false)
  assert.equal(logs.length, 1)
  assert.match(logs[0], /Answer-quality run plan/)
  assert.match(logs[0], /Cases selected: \d+ of \d+/)
  assert.match(logs[0], /Estimated cost: \$/)
})

test("run with --confirm-live-calls and no OPENAI_API_KEY fails with an actionable message, no network call made", async () => {
  const client = fakeAccessClient(DEFAULT_LINEUP)
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: [CONFIRM_FLAG],
        env: {},
        log: () => {},
        measure: fakeMeasure,
        isStale: notStale,
        client
      }),
    /ASK_AI_PROVIDER/
  )
  assert.deepEqual(client.calls, [], "the models-list request must never happen before the provider guard passes")
})

test("run with --confirm-live-calls, ASK_AI_PROVIDER set but no OPENAI_API_KEY still fails actionably", async () => {
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: [CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai" },
        log: () => {},
        measure: fakeMeasure,
        isStale: notStale
      }),
    /OPENAI_API_KEY/
  )
})

test("assertLiveProviderConfigured passes only with ASK_AI_PROVIDER=openai and OPENAI_API_KEY set", () => {
  assert.doesNotThrow(() => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" }))
  assert.throws(() => assertLiveProviderConfigured({}), /ASK_AI_PROVIDER/)
  assert.throws(() => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai" }), /OPENAI_API_KEY/)
})

test("the dry run performs the model-access check (a models-list request, never a completion) when a key is present", async () => {
  const client = fakeAccessClient([...DEFAULT_LINEUP, DEFAULT_JUDGE_MODEL])
  const logs = []
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: [],
    env: { OPENAI_API_KEY: "sk-test" },
    log: (line) => logs.push(line),
    measure: fakeMeasure,
    isStale: notStale,
    client
  })

  assert.equal(result.accessChecked, true)
  assert.deepEqual(client.calls, ["list"])
  assert.match(logs[0], /Model access check passed/)
  assert.ok(!("responses" in client), "the fake client exposes no completion method -- nothing could call one")
})

test("the dry run skips the model-access check entirely when no key is present", async () => {
  const client = fakeAccessClient(DEFAULT_LINEUP)
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: [],
    env: {},
    log: () => {},
    measure: fakeMeasure,
    isStale: notStale,
    client
  })

  assert.equal(result.accessChecked, false)
  assert.deepEqual(client.calls, [], "no key present means no network call at all, not even a models-list one")
})

test("checkModelAccess reports every missing model id from a models-list response", async () => {
  const client = fakeAccessClient(["gpt-4.1-mini"])
  const result = await checkModelAccess({ client, modelIds: ["gpt-4.1-mini", "gpt-5-nano", "gpt-5"] })
  assert.equal(result.available, false)
  assert.deepEqual(result.missing, ["gpt-5-nano", "gpt-5"])
})

test("a live run fails naming any lineup or judge model the credentials cannot access, before any completion", async () => {
  const client = fakeAccessClient(["gpt-4.1-mini", "gpt-4.1"]) // missing gpt-5-mini, gpt-5-nano, and the judge
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: [CONFIRM_FLAG, "--bake-off"],
        env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        measure: fakeMeasure,
        isStale: notStale,
        client
      }),
    /gpt-5-mini.*gpt-5-nano.*gpt-5/
  )
})

test("a live run with full model access reports access verified, then hands off to the injected evaluation runner", async () => {
  const client = fakeAccessClient([...DEFAULT_LINEUP, DEFAULT_JUDGE_MODEL])
  const logs = []
  const fakeResults = { runMetadata: {}, legs: [], caseLegScores: [] }
  const runEvaluation = async (params) => {
    assert.equal(params.client, client)
    assert.equal(params.judgeModel, DEFAULT_JUDGE_MODEL)
    assert.deepEqual(params.models, DEFAULT_LINEUP)
    assert.deepEqual(params.excerptCaps, DEFAULT_EXCERPT_CAPS)
    assert.ok(params.resultsPath.endsWith("apps/backend/src/eval/answer-quality/results.json"))
    return fakeResults
  }

  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: [CONFIRM_FLAG],
    env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
    log: (line) => logs.push(line),
    measure: fakeMeasure,
    isStale: notStale,
    client,
    runEvaluation
  })

  assert.equal(result.ran, true)
  assert.equal(result.accessChecked, true)
  assert.equal(result.results, fakeResults)
  assert.deepEqual(client.calls, ["list"])
  assert.match(logs[0], /Model access verified/)
})

test("estimateCost sets no numeric target and scales with lineup size, excerpt caps, and gold-case count", () => {
  const small = estimateCost({
    models: ["gpt-4.1-mini"],
    judgeModel: "gpt-5",
    excerptCaps: [5],
    goldCaseCount: 6,
    avgPromptCharsByCap: { 5: 10000 }
  })
  const large = estimateCost({
    models: DEFAULT_LINEUP,
    judgeModel: "gpt-5",
    excerptCaps: [5, 10],
    goldCaseCount: 18,
    avgPromptCharsByCap: { 5: 10000, 10: 12600 }
  })

  assert.equal(small.answerCalls, 6)
  assert.equal(large.answerCalls, DEFAULT_LINEUP.length * 18 * 2)
  assert.ok(large.totalCostUsd > small.totalCostUsd)
  assert.ok(Number.isFinite(large.totalCostUsd))
})

test("computeCallCostUsd derives cost from real token counts and a known model's price, and is zero for an unrecognized model", () => {
  const cost = computeCallCostUsd("gpt-4.1-mini", 1_000_000, 1_000_000)
  assert.ok(Math.abs(cost - (0.4 + 1.6)) < 1e-9)
  assert.equal(computeCallCostUsd("not-a-real-model", 1000, 1000), 0)
})

test("buildRunArtifact aggregates per-leg headline counts, tier counts, judge-mismatch flag, and totals from raw per-call records", () => {
  const goldCases = [fixtureCase("case-a", { tier: 1 }), fixtureCase("case-b", { tier: 2 })]
  const caseLegScores = [
    {
      caseId: "case-a",
      model: "gpt-4.1-mini",
      excerptCap: 5,
      undetermined: false,
      scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
      inputTokens: 1000,
      outputTokens: 100,
      costUsd: 0.01
    },
    {
      caseId: "case-b",
      model: "gpt-4.1-mini",
      excerptCap: 5,
      undetermined: false,
      scores: { correctness: 1, grounding: 2, calibration: 2, readability: 2 },
      inputTokens: 1000,
      outputTokens: 100,
      costUsd: 0.01
    },
    {
      caseId: "case-a",
      model: "gpt-4.1-mini",
      excerptCap: 10,
      undetermined: true,
      inputTokens: 1200,
      outputTokens: 0,
      costUsd: 0.005
    }
  ]

  const artifact = buildRunArtifact({
    models: ["gpt-4.1-mini"],
    excerptCaps: [5, 10],
    goldCases,
    judgeModel: "gpt-4.1-mini", // deliberately mismatched, to prove the flag
    rubricRevision: "2026-09-07.1",
    askAiProvider: "openai",
    embeddingProvider: "local",
    gitCommit: "abc1234",
    generatedAt: "2026-09-07T00:00:00.000Z",
    caseLegScores
  })

  assert.equal(artifact.runMetadata.goldSetTier1Count, 1)
  assert.equal(artifact.runMetadata.goldSetTier2Count, 1)
  assert.equal(artifact.runMetadata.judgeMatchesAnswerModel, true)
  assert.equal(artifact.runMetadata.totalInputTokens, 3200)
  assert.equal(artifact.runMetadata.totalOutputTokens, 200)
  assert.ok(Math.abs(artifact.runMetadata.totalCostUsd - 0.025) < 1e-9)

  const legAtFive = artifact.legs.find((leg) => leg.excerptCap === 5)
  const legAtTen = artifact.legs.find((leg) => leg.excerptCap === 10)
  assert.equal(legAtFive.fullyCorrectCount, 1) // only case-a scored Correctness 2
  assert.equal(legAtFive.caseCount, 2)
  assert.equal(legAtTen.fullyCorrectCount, 0) // undetermined never counts as correct
  assert.equal(legAtTen.caseCount, 1)

  // The internal costUsd aggregation field never reaches the committed per-case-per-leg schema.
  for (const record of artifact.caseLegScores) {
    assert.equal("costUsd" in record, false)
  }
})

test("resolveRunEnv fills the key from the local env files, and the confirm flag selects openai only when the provider is unset", () => {
  const fromFiles = ({ env }) => ({
    env: { ...env, OPENAI_API_KEY: env.OPENAI_API_KEY ?? "sk-from-file" },
    sources: ["/repo/.secrets/openai-dev.env"]
  })

  // Confirmed, key from the file, provider unset → openai is selected.
  const confirmed = resolveRunEnv({ processEnv: {}, confirmed: true, loadLocalEnv: fromFiles })
  assert.equal(confirmed.OPENAI_API_KEY, "sk-from-file")
  assert.equal(confirmed.ASK_AI_PROVIDER, "openai")
  assert.doesNotThrow(() => assertLiveProviderConfigured(confirmed))

  // Unconfirmed → the provider is left exactly as found (mock-first default untouched).
  const dry = resolveRunEnv({ processEnv: {}, confirmed: false, loadLocalEnv: fromFiles })
  assert.equal(dry.ASK_AI_PROVIDER, undefined)

  // An explicit mock still refuses, even with a key and the flag.
  const mock = resolveRunEnv({ processEnv: { ASK_AI_PROVIDER: "mock" }, confirmed: true, loadLocalEnv: fromFiles })
  assert.equal(mock.ASK_AI_PROVIDER, "mock")
  assert.throws(() => assertLiveProviderConfigured(mock), /ASK_AI_PROVIDER/)

  // The process environment wins over the file.
  const exported = resolveRunEnv({
    processEnv: { OPENAI_API_KEY: "sk-exported" },
    confirmed: true,
    loadLocalEnv: fromFiles
  })
  assert.equal(exported.OPENAI_API_KEY, "sk-exported")

  // No key anywhere → nothing is selected, and the guard still names what is missing.
  const keyless = resolveRunEnv({ processEnv: {}, confirmed: true, loadLocalEnv: noLocalEnv })
  assert.equal(keyless.ASK_AI_PROVIDER, undefined)
  assert.throws(() => assertLiveProviderConfigured(keyless), /ASK_AI_PROVIDER/)
})

test("a confirmed run with a key from the local env files and no exported provider passes the guard and reaches the access check", async () => {
  const client = fakeAccessClient([...DEFAULT_LINEUP, DEFAULT_JUDGE_MODEL])
  const fromFiles = ({ env }) => ({
    env: { ...env, OPENAI_API_KEY: "sk-from-file" },
    sources: ["/repo/.secrets/openai-dev.env"]
  })
  let handedOff = false
  const result = await run({
    loadLocalEnv: fromFiles,
    argv: [CONFIRM_FLAG],
    env: {},
    log: () => {},
    measure: fakeMeasure,
    isStale: notStale,
    client,
    runEvaluation: async (params) => {
      handedOff = true
      assert.equal(params.env.ASK_AI_PROVIDER, "openai")
      return { runMetadata: {}, legs: [], caseLegScores: [] }
    }
  })
  assert.deepEqual(client.calls, ["list"], "the models-list access check runs once before any completion")
  assert.equal(handedOff, true)
  assert.equal(result.ran, true)
})

test("buildCaseRequest asks a case bare when it names no card and attaches every card it names the way a player's lookup does (REQ-185)", () => {
  const bare = { id: "t1", tier: 1, question: "Does trample need lethal first?", cards: [], gameState: null }
  assert.deepEqual(buildCaseRequest(bare), { mode: "lookup", question: "Does trample need lethal first?" })

  const attached = {
    id: "t2",
    tier: 2,
    question: "Does Panharmonicon double it?",
    cards: [{ oracleId: "76678885-3674-443d-b9a2-2a460cf6aac0", name: "Panharmonicon" }],
    gameState: null
  }
  assert.deepEqual(buildCaseRequest(attached), {
    mode: "lookup",
    question: "Does Panharmonicon double it?",
    // cardId is the oracle id: the key both the rulings index and the card-detail index resolve by.
    cards: [{ cardId: "76678885-3674-443d-b9a2-2a460cf6aac0", name: "Panharmonicon" }]
  })

  // A tier-1 case that names a real card (the Tarmogoyf token question) carries it too: every case attaches every card it names.
  const tarmogoyf = {
    ...bare,
    id: "token",
    cards: [{ oracleId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" }]
  }
  assert.deepEqual(buildCaseRequest(tarmogoyf).cards, [
    { cardId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" }
  ])
})

test("resolveRunEnv defaults EMBEDDING_PROVIDER to local (what production runs) and never overrides an explicit value", () => {
  const defaulted = resolveRunEnv({ processEnv: {}, confirmed: true, loadLocalEnv: noLocalEnv })
  assert.equal(defaulted.EMBEDDING_PROVIDER, "local")

  const dry = resolveRunEnv({ processEnv: {}, confirmed: false, loadLocalEnv: noLocalEnv })
  assert.equal(dry.EMBEDDING_PROVIDER, "local")

  const explicit = resolveRunEnv({
    processEnv: { EMBEDDING_PROVIDER: "mock" },
    confirmed: true,
    loadLocalEnv: noLocalEnv
  })
  assert.equal(explicit.EMBEDDING_PROVIDER, "mock")
})

test("assertQueryEmbedded refuses a run whose real embedder fell back, and accepts null only under mock", () => {
  assert.doesNotThrow(() => assertQueryEmbedded({ mode: "mock", vector: null, caseId: "c" }))
  assert.doesNotThrow(() => assertQueryEmbedded({ mode: "local", vector: [0.1, 0.2], caseId: "c" }))
  assert.throws(
    () => assertQueryEmbedded({ mode: "local", vector: null, caseId: "trample-must-assign-lethal-first" }),
    /EMBEDDING_PROVIDER=local.*trample-must-assign-lethal-first.*warm-embedding-model-cache/s
  )
})

test("formatCommittedJson shapes the scorecard the way the repo's format:check expects (short arrays on one line)", async () => {
  const raw = `${JSON.stringify({ runMetadata: { answerModelLineup: ["gpt-4.1-mini", "gpt-4.1"] }, legs: [] }, null, 2)}\n`
  assert.match(raw, /\[\n\s+"gpt-4\.1-mini",\n/)
  const repoRootForTests = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const formatted = await formatCommittedJson(
    raw,
    resolve(repoRootForTests, "apps/backend/src/eval/answer-quality/results.json")
  )
  assert.match(formatted, /"answerModelLineup": \["gpt-4\.1-mini", "gpt-4\.1"\]/)
  assert.deepEqual(JSON.parse(formatted), JSON.parse(raw))
})

test("describeRetrieval records whether the pass ran semantic and whether a gold rule reached the prompt", () => {
  const supplemental = {
    usedSemantic: true,
    selected: [
      { ruleId: "702.19b", sectionTitle: "Trample", score: 0.9 },
      { ruleId: "510.1a", sectionTitle: "Combat Damage Step", score: 0.5 }
    ]
  }
  assert.deepEqual(describeRetrieval(supplemental, ["702.19b"]), {
    usedSemantic: true,
    selectedRuleIds: ["702.19b", "510.1a"],
    goldRuleInPrompt: true
  })
  assert.deepEqual(describeRetrieval({ usedSemantic: false, selected: [] }, ["510.1c"]), {
    usedSemantic: false,
    selectedRuleIds: [],
    goldRuleInPrompt: false
  })
  // A caller with a real embedder can refuse to label a lexical pass as semantic.
  assert.throws(
    () => describeRetrieval({ usedSemantic: false, selected: [] }, ["510.1c"], { requireSemantic: true, caseId: "x" }),
    /lexical.*x/s
  )
})

test("REGRESSION GUARD: eval:answer-quality is never wired into any gate script (REQ-188)", () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const rootPkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"))
  const backendPkg = JSON.parse(readFileSync(resolve(repoRoot, "apps/backend/package.json"), "utf8"))

  const gateScripts = {
    "package.json quality:check": rootPkg.scripts["quality:check"],
    "package.json test": rootPkg.scripts.test,
    "package.json coverage:check": rootPkg.scripts["coverage:check"],
    "package.json test:scripts": rootPkg.scripts["test:scripts"],
    "apps/backend/package.json test:eval": backendPkg.scripts["test:eval"]
  }

  for (const [scriptName, scriptCommand] of Object.entries(gateScripts)) {
    assert.ok(scriptCommand, `expected ${scriptName} to exist`)
    assert.ok(
      !scriptCommand.includes("eval-answer-quality") && !scriptCommand.includes("eval:answer-quality"),
      `${scriptName} must never invoke the answer-quality run, but reads: ${scriptCommand}`
    )
  }

  // The command itself is registered exactly once, as its own on-demand script.
  assert.equal(rootPkg.scripts["eval:answer-quality"], "tsx scripts/eval-answer-quality.mjs")
})

// ---------------------------------------------------------------------------
// Case selection, per-case merge and the per-tier headline (REQ-186 to REQ-190)
// ---------------------------------------------------------------------------

function fixtureCase(id, overrides = {}) {
  return {
    id,
    tier: 1,
    review: { status: "approved", reviewedOn: "2026-10-06" },
    question: `Question ${id}?`,
    cards: [],
    gameState: null,
    tags: ["mechanic:none", "cr:100"],
    expected: { outcome: "works", shortAnswer: "Yes.", answer: `Reference answer ${id}.`, decidingRuleIds: ["100.1"] },
    ...overrides
  }
}

function fixtureRecord(caseEntry, overrides = {}) {
  return {
    caseId: caseEntry.id,
    model: "gpt-4.1",
    excerptCap: 10,
    tier: caseEntry.tier,
    undetermined: false,
    scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
    namesGoldRuleId: true,
    promptChars: 1000,
    promptHash: `hash-${caseEntry.id}-10`,
    referenceAnswerHash: referenceAnswerHash(caseEntry),
    inputTokens: 100,
    outputTokens: 10,
    latencyMs: 50,
    blindRank: null,
    ...overrides
  }
}

const selectionBase = { models: ["gpt-4.1"], excerptCaps: [10], mode: { kind: "changed" }, isStale: notStale }

test("parseArgs reads each case selection, and refuses two at once", () => {
  assert.deepEqual(parseArgs(["--all"]).mode, { kind: "all" })
  assert.deepEqual(parseArgs(["--tag", "mechanic:702.19"]).mode, { kind: "tag", tag: "mechanic:702.19" })
  assert.deepEqual(parseArgs(["--tier", "3"]).mode, { kind: "tier", tier: 3 })
  assert.deepEqual(parseArgs(["--sample", "20", "--seed", "7"]).mode, { kind: "sample", count: 20, seed: 7 })
  assert.deepEqual(parseArgs(["--sample", "20"]).mode, { kind: "sample", count: 20, seed: 1 })
  assert.throws(() => parseArgs(["--all", "--tier", "1"]), /only one case selection/)
  assert.throws(() => parseArgs(["--tier", "9"]), /--tier needs 1, 2 or 3/)
  assert.throws(() => parseArgs(["--tag"]), /--tag needs a tag/)
})

test("--bake-off names the four-model lineup, and an explicit --model always wins", () => {
  assert.deepEqual(parseArgs(["--bake-off"]).models, BAKE_OFF_LINEUP)
  assert.deepEqual(parseArgs(["--bake-off", "--model", "gpt-5-nano"]).models, ["gpt-5-nano"])
  assert.deepEqual(parseArgs(["--excerpt-cap", "10", "--excerpt-cap", "15"]).excerptCaps, [10, 15])
})

test("--changed picks a case whose reference answer changed although its prompt hash matches, and skips one where both match", () => {
  const unchanged = fixtureCase("unchanged")
  const reworked = fixtureCase("reworked")
  // The record was judged against the answer as it read before the rework.
  const records = [
    fixtureRecord(unchanged),
    fixtureRecord(reworked, {
      referenceAnswerHash: referenceAnswerHash(
        fixtureCase("reworked", { expected: { ...reworked.expected, answer: "The old answer." } })
      )
    })
  ]
  const promptHashes = new Map([
    [promptKey("unchanged", 10), "hash-unchanged-10"],
    [promptKey("reworked", 10), "hash-reworked-10"]
  ])

  const { selected, skipped } = selectCases({ ...selectionBase, cases: [unchanged, reworked], records, promptHashes })

  assert.deepEqual(
    selected.map(({ caseEntry }) => caseEntry.id),
    ["reworked"]
  )
  assert.match(selected[0].reasons[0], /reference answer changed \(gpt-4\.1, cap 10\)/)
  assert.equal(skipped.current, 1)
  assert.equal(selectionReason(unchanged, records[0], "hash-unchanged-10"), null)
})

test("--changed also picks a case whose prompt changed, one never graded, and one whose record carries no hash (a legacy record)", () => {
  const promptChanged = fixtureCase("prompt-changed")
  const neverGraded = fixtureCase("never-graded")
  const legacy = fixtureCase("legacy")
  const half = fixtureCase("half")
  const records = [
    fixtureRecord(promptChanged),
    fixtureRecord(legacy, { promptHash: undefined, referenceAnswerHash: undefined }),
    fixtureRecord(half, { referenceAnswerHash: undefined })
  ]
  const promptHashes = new Map([[promptKey("prompt-changed", 10), "a-different-hash"]])

  const { selected } = selectCases({
    ...selectionBase,
    cases: [promptChanged, neverGraded, legacy, half],
    records,
    promptHashes
  })

  const reasonOf = (id) => selected.find(({ caseEntry }) => caseEntry.id === id)?.reasons[0]
  assert.match(reasonOf("prompt-changed"), /^prompt changed/)
  assert.match(reasonOf("never-graded"), /^never graded/)
  assert.match(reasonOf("legacy"), /^last record has no prompt hash/)
  assert.match(reasonOf("half"), /^last record has no reference-answer hash/)
})

test("a case is graded only when approved and not stale; the other selections draw from those alone", () => {
  const approved = fixtureCase("approved")
  const draft = fixtureCase("draft", { review: { status: "draft", reviewedOn: null } })
  const stale = fixtureCase("stale")
  const tier3 = fixtureCase("tier3", { tier: 3, tags: ["mechanic:702.19"] })
  const isStale = (caseEntry) => caseEntry.id === "stale"
  const base = { ...selectionBase, cases: [approved, draft, stale, tier3], records: [], isStale }

  assert.deepEqual(
    selectCases({ ...base, mode: { kind: "all" } }).selected.map((s) => s.caseEntry.id),
    ["approved", "tier3"]
  )
  assert.deepEqual(
    selectCases({ ...base, mode: { kind: "tier", tier: 3 } }).selected.map((s) => s.caseEntry.id),
    ["tier3"]
  )
  assert.deepEqual(
    selectCases({ ...base, mode: { kind: "tag", tag: "mechanic:702.19" } }).selected.map((s) => s.caseEntry.id),
    ["tier3"]
  )
  const sample = selectCases({ ...base, mode: { kind: "sample", count: 1, seed: 3 } })
  assert.equal(sample.selected.length, 1)
  assert.deepEqual(
    selectCases({ ...base, mode: { kind: "sample", count: 1, seed: 3 } }).selected.map((s) => s.caseEntry.id),
    sample.selected.map((s) => s.caseEntry.id),
    "a seeded sample is the same sample every time"
  )
  assert.deepEqual(selectCases({ ...base, mode: { kind: "all" } }).skipped, { notApproved: 1, stale: 1, current: 0 })
})

test("the headline: a fixture record with no hashes counts as ungraded, and tier 3 is never pooled with the official tiers", () => {
  const official = fixtureCase("official")
  const legacy = fixtureCase("legacy")
  const owner = fixtureCase("owner", { tier: 3 })
  const records = [
    fixtureRecord(official),
    fixtureRecord(legacy, { promptHash: undefined, referenceAnswerHash: undefined }),
    fixtureRecord(owner)
  ]
  const headline = computeHeadline({
    cases: [official, legacy, owner],
    records,
    isStale: notStale,
    model: "gpt-4.1",
    excerptCap: 10
  })

  assert.deepEqual(headline.official, { fullyCorrect: 1, graded: 1, ungraded: 1 })
  assert.deepEqual(headline.tier3, { fullyCorrect: 1, graded: 1, ungraded: 0 })
  assert.equal(headline.stale, 0)
  assert.equal(
    formatHeadline({ model: "gpt-4.1", excerptCap: 10, headline }),
    "gpt-4.1 at cap 10 -- tiers 1-2: 1/1 fully correct (1 ungraded, 0 stale); tier 3: 1/1 fully correct (0 ungraded)"
  )
})

test("the headline (A22): a stale approved case with a Correctness-2 record is left out of the count and a stale count prints", () => {
  const current = fixtureCase("current")
  const stale = fixtureCase("stale")
  const records = [fixtureRecord(current), fixtureRecord(stale)]
  const isStale = (caseEntry) => caseEntry.id === "stale"
  const headline = computeHeadline({ cases: [current, stale], records, isStale, model: "gpt-4.1", excerptCap: 10 })

  assert.deepEqual(headline.official, { fullyCorrect: 1, graded: 1, ungraded: 0 })
  assert.equal(headline.stale, 1)
  assert.match(formatHeadline({ model: "gpt-4.1", excerptCap: 10, headline }), /1 stale/)
  // The stale case's record is kept in the file: it is not counted, not dropped.
  assert.equal(mergeCaseLegScores({ previous: records, fresh: [], cases: [current, stale] }).length, 2)
})

test("the headline (A22): a re-approved case whose answer did not change counts at once from its existing record", () => {
  const reapproved = fixtureCase("reapproved")
  const record = fixtureRecord(reapproved)
  // While stale it was left out; once re-approved (no longer flagged) the same record counts again.
  const whileStale = computeHeadline({
    cases: [reapproved],
    records: [record],
    isStale: () => true,
    model: "gpt-4.1",
    excerptCap: 10
  })
  assert.deepEqual(whileStale.official, { fullyCorrect: 0, graded: 0, ungraded: 0 })
  const afterReapproval = computeHeadline({
    cases: [reapproved],
    records: [record],
    isStale: notStale,
    model: "gpt-4.1",
    excerptCap: 10
  })
  assert.deepEqual(afterReapproval.official, { fullyCorrect: 1, graded: 1, ungraded: 0 })
})

test("the headline (A22): a re-approved case whose answer was reworked is ungraded, is selected despite an identical prompt, and counts from a fresh record", () => {
  const before = fixtureCase("reworked")
  const after = fixtureCase("reworked", { expected: { ...before.expected, answer: "The reworked answer." } })
  const oldRecord = fixtureRecord(before) // judged against the answer as it read before
  const promptHashes = new Map([[promptKey("reworked", 10), "hash-reworked-10"]]) // the prompt is unchanged

  const headline = computeHeadline({
    cases: [after],
    records: [oldRecord],
    isStale: notStale,
    model: "gpt-4.1",
    excerptCap: 10
  })
  assert.deepEqual(headline.official, { fullyCorrect: 0, graded: 0, ungraded: 1 })

  const { selected } = selectCases({ ...selectionBase, cases: [after], records: [oldRecord], promptHashes })
  assert.deepEqual(
    selected.map(({ caseEntry }) => caseEntry.id),
    ["reworked"]
  )
  assert.match(selected[0].reasons[0], /reference answer changed/)

  // A fake re-grade merges a new record judged against the reworked answer; the case now counts from it.
  const regraded = fixtureRecord(after, { scores: { correctness: 1, grounding: 2, calibration: 2, readability: 2 } })
  const merged = mergeCaseLegScores({ previous: [oldRecord], fresh: [regraded], cases: [after] })
  assert.equal(merged.length, 1)
  const counted = computeHeadline({
    cases: [after],
    records: merged,
    isStale: notStale,
    model: "gpt-4.1",
    excerptCap: 10
  })
  assert.deepEqual(counted.official, { fullyCorrect: 0, graded: 1, ungraded: 0 })
})

test("a merge replaces only the cases it graded, drops a case that is no longer approved or left the corpus, and keeps every other record unchanged", () => {
  const kept = fixtureCase("kept")
  const regraded = fixtureCase("regraded")
  const needsEdit = fixtureCase("needs-edit", { review: { status: "needs-edit", reviewedOn: "2026-10-06" } })
  const otherLeg = fixtureRecord(kept, { model: "gpt-5-mini", promptHash: "other-leg" })
  const keptRecord = fixtureRecord(kept)
  const previous = [
    keptRecord,
    otherLeg,
    fixtureRecord(regraded, { scores: { correctness: 0, grounding: 0, calibration: 0, readability: 0 } }),
    fixtureRecord(needsEdit),
    fixtureRecord(fixtureCase("left-the-corpus"))
  ]
  const fresh = [fixtureRecord(regraded)]

  const merged = mergeCaseLegScores({ previous, fresh, cases: [kept, regraded, needsEdit] })

  assert.deepEqual(
    merged.map((record) => `${record.caseId}|${record.model}`),
    ["kept|gpt-4.1", "kept|gpt-5-mini", "regraded|gpt-4.1"]
  )
  assert.equal(
    merged.find((record) => record.caseId === "kept" && record.model === "gpt-4.1"),
    keptRecord,
    "an untouched record is carried over as is"
  )
  assert.equal(
    merged.find((record) => record.caseId === "kept" && record.model === "gpt-5-mini"),
    otherLeg
  )
  assert.equal(
    merged.find((record) => record.caseId === "regraded").scores.correctness,
    2,
    "a graded case's record is replaced"
  )
})

test("the dry run on the real corpus selects every approved case (no recorded hashes yet) and prints a cost estimate, with no network call", async () => {
  const approvedCases = (await loadGoldCases()).filter((caseEntry) => caseEntry.review.status === "approved")
  const approved = approvedCases.length
  const approvedTier12 = approvedCases.filter((caseEntry) => caseEntry.tier <= 2).length
  assert.ok(approved > 0, "the committed corpus has approved cases")
  const logs = []
  const client = fakeAccessClient(DEFAULT_LINEUP)
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: [],
    env: {},
    log: (line) => logs.push(line),
    measure: fakeMeasure,
    isStale: notStale,
    client
  })

  assert.equal(result.ran, false)
  assert.equal(result.selectedCaseIds.length, approved)
  assert.equal(result.accessChecked, false)
  assert.deepEqual(client.calls, [])
  assert.match(logs[0], new RegExp(`Cases selected: ${approved} of \\d+ \\(selection: changed`))
  assert.match(
    logs[0],
    /: never graded \(gpt-4\.1, cap 10\)/,
    "each selected case is listed with the reason it needs grading"
  )
  assert.match(logs[0], /\.\.\. and \d+ more/, "the per-case reason list is capped, not printed in full")
  assert.match(
    logs[0],
    new RegExp(`Calls: ${approved} answer calls, ${approved} lone judge calls,\\s+0 blind-ranking calls`)
  )
  assert.match(logs[0], /Estimated cost: \$\d+\.\d{2}/)
  assert.match(logs[0], new RegExp(`tiers 1-2: 0\\/0 fully correct \\(${approvedTier12} ungraded, 0 stale\\)`))
})

// ---------------------------------------------------------------------------
// The live loop, driven end to end with fakes (no TypeScript loader, no provider)
// ---------------------------------------------------------------------------

function fakeDeps(overrides = {}) {
  const written = { results: null, transcripts: [], rankings: [] }
  const calls = { ranking: 0, assertionsKnownIds: null }
  let clock = 1000
  const deps = {
    preparePromptInput: (request) => ({
      promptText: `PROMPT for ${request.question}`,
      enrichmentDebug: { supplemental: { usedSemantic: true, selected: [{ ruleId: "100.1" }] } }
    }),
    computeDeterministicAssertions: (answerText, decidingRuleIds, knownRuleIds) => {
      calls.assertionsKnownIds = knownRuleIds
      const cited = answerText.match(/\d{3}\.\d+[a-z]?/g) ?? []
      return {
        namesGoldRuleId: decidingRuleIds.some((id) => cited.includes(id)),
        nonEmpty: answerText.length > 0,
        length: answerText.length,
        unknownRuleIds: cited.filter((id) => !knownRuleIds.has(id))
      }
    },
    judgeAnswerAlone: async () => ({
      undetermined: false,
      scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
      rationale: "Agrees.",
      usage: { inputTokens: 1500, outputTokens: 800 }
    }),
    judgeBlindRanking: async ({ answers }) => {
      calls.ranking += 1
      return {
        undetermined: false,
        ranks: Object.fromEntries(answers.map((answer, index) => [answer.modelId, index + 1])),
        rationale: "Ranked.",
        usage: { inputTokens: 3400, outputTokens: 1000 }
      }
    },
    writeTranscript: async (transcript) => written.transcripts.push(transcript),
    writeRankingTranscript: async (transcript) => written.rankings.push(transcript),
    writeResults: async (results) => {
      written.results = results
    },
    resources: {},
    ruleIds: ["100.1", "613.9"],
    embedQueries: async () => new Map(),
    embeddingProvider: "local",
    requireSemantic: true,
    rubricRevision: "test-rubric",
    gitCommit: "abc1234",
    now: () => (clock += 25),
    nowIso: () => "2026-10-06T12:00:00.000Z",
    ...overrides
  }
  return { deps, written, calls }
}

function fakeAnswerClient(answerText) {
  return {
    responses: {
      create: async () => ({ output_text: answerText, usage: { input_tokens: 2000, output_tokens: 300 } })
    }
  }
}

function evaluationParams(overrides = {}) {
  const selected = fixtureCase("graded")
  return {
    client: fakeAnswerClient("Per rule 613.9 and rule 999.9z, the answer is yes."),
    judgeModel: "gpt-5",
    models: ["gpt-4.1"],
    excerptCaps: [10],
    selectedCases: [selected],
    allCases: [selected],
    previousResults: null,
    isStale: notStale,
    mode: { kind: "changed" },
    outputDir: "/tmp/never-written",
    resultsPath: "/tmp/never-written/results.json",
    env: { ASK_AI_PROVIDER: "openai" },
    log: () => {},
    ...overrides
  }
}

test("a graded record carries the prompt hash, the reference-answer hash, a timestamp and the commit, and lists cited rule ids the index lacks", async () => {
  const { deps, written, calls } = fakeDeps()
  const logs = []
  const results = await executeEvaluation(evaluationParams({ log: (line) => logs.push(line) }), deps)

  const [record] = written.results.caseLegScores
  const graded = fixtureCase("graded")
  assert.equal(record.promptHash.length, 64)
  assert.equal(record.referenceAnswerHash, referenceAnswerHash(graded))
  assert.equal(record.gradedAt, "2026-10-06T12:00:00.000Z")
  assert.equal(record.commit, "abc1234")
  assert.equal(record.tier, 1)
  assert.equal(record.judgeModel, "gpt-5")
  assert.equal(record.rubricRevision, "test-rubric")
  assert.equal(record.embeddingProvider, "local")
  assert.deepEqual(record.unknownRuleIds, ["999.9z"])
  assert.deepEqual([...calls.assertionsKnownIds].sort(), ["100.1", "613.9"])
  assert.ok(logs.some((line) => /999\.9z.*not in the committed rule index/.test(line)))
  assert.equal(results, written.results)

  // An answer citing only ids the index holds records an empty list.
  const clean = fakeDeps()
  await executeEvaluation(evaluationParams({ client: fakeAnswerClient("Per rule 613.9, yes.") }), clean.deps)
  assert.deepEqual(clean.written.results.caseLegScores[0].unknownRuleIds, [])
})

test("the judge's token use lands in the per-case record and in the run totals, shown apart from the answer's", async () => {
  const { deps, written } = fakeDeps()
  await executeEvaluation(evaluationParams(), deps)

  const [record] = written.results.caseLegScores
  assert.equal(record.inputTokens, 2000)
  assert.equal(record.outputTokens, 300)
  assert.equal(record.judgeInputTokens, 1500)
  assert.equal(record.judgeOutputTokens, 800)

  const meta = written.results.runMetadata
  assert.equal(meta.totalInputTokens, 2000, "the answer calls' share, apart from the judge's")
  assert.equal(meta.totalOutputTokens, 300)
  assert.equal(meta.judgeInputTokens, 1500)
  assert.equal(meta.judgeOutputTokens, 800)
  const answerCost = computeCallCostUsd("gpt-4.1", 2000, 300)
  const judgeCost = computeCallCostUsd("gpt-5", 1500, 800)
  assert.ok(Math.abs(meta.answerCostUsd - answerCost) < 1e-12)
  assert.ok(Math.abs(meta.judgeCostUsd - judgeCost) < 1e-12)
  assert.ok(Math.abs(meta.totalCostUsd - (answerCost + judgeCost)) < 1e-12)
  assert.ok(meta.judgeCostUsd > 0, "judge cost is never left out of the total")
  for (const field of ["costUsd", "judgeCostUsd"])
    assert.equal(field in record, false, `${field} is internal, never committed`)
})

test("a one-model run skips the blind ranking; a bake-off runs it and adds its judge usage to the totals", async () => {
  const single = fakeDeps()
  await executeEvaluation(evaluationParams(), single.deps)
  assert.equal(single.calls.ranking, 0, "no ranking call for one answer")
  assert.deepEqual(single.written.rankings, [])
  assert.equal(single.written.results.caseLegScores[0].blindRank, null)

  const pair = fakeDeps()
  await executeEvaluation(evaluationParams({ models: ["gpt-4.1-mini", "gpt-4.1"] }), pair.deps)
  assert.equal(pair.calls.ranking, 1)
  assert.equal(pair.written.rankings.length, 1)
  assert.deepEqual(pair.written.results.caseLegScores.map((record) => record.blindRank).sort(), [1, 2])
  // two lone judge calls (1500 + 1500) plus the ranking call (3400)
  assert.equal(pair.written.results.runMetadata.judgeInputTokens, 1500 * 2 + 3400)
})

test("a partial run merges into the previous scores file: the case it graded is replaced, every other case's record is kept", async () => {
  const graded = fixtureCase("graded")
  const other = fixtureCase("other")
  const otherRecord = fixtureRecord(other)
  const stalePrevious = fixtureRecord(graded, { promptHash: "an-older-prompt" })
  const { deps, written } = fakeDeps()

  await executeEvaluation(
    evaluationParams({
      selectedCases: [graded],
      allCases: [graded, other],
      previousResults: { runMetadata: {}, legs: [], caseLegScores: [stalePrevious, otherRecord] }
    }),
    deps
  )

  const records = written.results.caseLegScores
  assert.deepEqual(
    records.map((record) => record.caseId),
    ["graded", "other"]
  )
  assert.notEqual(records[0].promptHash, "an-older-prompt")
  assert.equal(records[1], otherRecord)
  assert.deepEqual(written.results.runMetadata.goldSetCaseIds, ["graded"], "the metadata describes the latest run")
  assert.equal(written.results.runMetadata.selectionMode, "changed")
  const leg = written.results.legs.find((entry) => entry.model === "gpt-4.1" && entry.excerptCap === 10)
  assert.equal(leg.caseCount, 2)
  assert.deepEqual(leg.headline.official, { fullyCorrect: 2, graded: 2, ungraded: 0 })
})

test("the live loop refuses a lexical pass when a real embedder is configured, the way it always has", async () => {
  const { deps } = fakeDeps({
    preparePromptInput: () => ({
      promptText: "p",
      enrichmentDebug: { supplemental: { usedSemantic: false, selected: [] } }
    })
  })
  await assert.rejects(() => executeEvaluation(evaluationParams(), deps), /lexical retrieval/)
})

// ---------------------------------------------------------------------------
// Experiment mode (REQ-226): flags, the manifest refusal, and the committed file left alone
// ---------------------------------------------------------------------------

test("parseArgs leaves experiment mode off for a routine run and turns it on with --run-id", () => {
  assert.equal(parseArgs([]).experiment, null)
  assert.equal(parseArgs(["--model", "gpt-4.1", "--all"]).experiment, null)
  const parsed = parseArgs([
    "--run-id",
    "phase-2-head",
    "--manifest",
    "manifests/diagnostic.json",
    "--repeat",
    "3",
    "--expect-commit",
    "07cc3ab6"
  ])
  assert.equal(parsed.experiment.runId, "phase-2-head")
  assert.equal(parsed.experiment.repeats, 3)
  assert.equal(parsed.experiment.expectCommit, "07cc3ab6")
  assert.equal(parsed.experiment.regradeFrom, null)
  assert.match(parsed.experiment.manifestPath, /manifests\/diagnostic\.json$/)
  assert.equal(parseArgs(["--run-id", "r", "--regrade-from", "earlier"]).experiment.regradeFrom, "earlier")
})

test("parseArgs refuses an experiment flag without --run-id, a missing manifest, a bad repeat, and a selection flag", () => {
  assert.throws(() => parseArgs(["--repeat", "3"]), /--repeat belong to an experiment run: name it with --run-id/)
  assert.throws(() => parseArgs(["--manifest", "m.json"]), /--manifest belong to an experiment run/)
  assert.throws(() => parseArgs(["--run-id", "r"]), /needs --manifest/)
  assert.throws(() => parseArgs(["--run-id", "r", "--manifest", "m.json", "--repeat", "0"]), /--repeat needs a whole number/)
  assert.throws(() => parseArgs(["--run-id", "r", "--manifest", "m.json", "--all"]), /drop --all/)
  assert.throws(() => parseArgs(["--run-id", "r", "--regrade-from", "e", "--manifest", "m.json"]), /drop --manifest/)
  assert.throws(() => parseArgs(["--run-id", "r", "--regrade-from", "e", "--repeat", "2"]), /drop --repeat/)
})

async function experimentFixture({ manifestCases, cases }) {
  const root = await mkdtemp(join(tmpdir(), "aq-experiment-"))
  const manifestPath = join(root, "manifest.json")
  await writeFileAsync(manifestPath, JSON.stringify({ formatVersion: 1, cases: manifestCases }))
  return { root, manifestPath, loadCases: async () => cases }
}

test("an experiment run whose manifest names a missing, unapproved or changed case refuses by name and makes no call", async () => {
  const good = fixtureCase("exp-good")
  const draft = fixtureCase("exp-draft", { review: { status: "draft" } })
  const changed = fixtureCase("exp-changed")
  const cases = [good, draft, fixtureCase("exp-changed", { question: "Reworded since the manifest was written?" })]
  const { manifestPath, loadCases } = await experimentFixture({
    manifestCases: [manifestEntryFor(good), manifestEntryFor(draft), manifestEntryFor(changed), { id: "exp-ghost", questionSha256: "x", answerSha256: "y" }],
    cases
  })
  const client = fakeAccessClient(["gpt-4.1", "gpt-5"])
  let runnerCalled = false
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: ["--run-id", "refused", "--manifest", manifestPath, CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        log: () => {},
        loadCases,
        isStale: notStale,
        client,
        runExperiment: async () => {
          runnerCalled = true
        }
      }),
    (error) =>
      /exp-ghost: missing/.test(error.message) &&
      /exp-draft: unapproved/.test(error.message) &&
      /exp-changed: hash mismatch/.test(error.message)
  )
  assert.deepEqual(client.calls, [], "not even the model-access list request is made")
  assert.equal(runnerCalled, false)
})

test("an experiment dry run prints the plan, reads and writes no committed scores file, and makes no network call", async () => {
  const a = fixtureCase("exp-a")
  const b = fixtureCase("exp-b")
  const { manifestPath, loadCases } = await experimentFixture({ manifestCases: [manifestEntryFor(a), manifestEntryFor(b)], cases: [a, b] })
  const logs = []
  const client = fakeAccessClient(["gpt-4.1", "gpt-5"])
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: ["--run-id", "dry", "--manifest", manifestPath, "--repeat", "3"],
    env: {},
    log: (line) => logs.push(line),
    loadCases,
    isStale: notStale,
    measure: fakeMeasure,
    client,
    readResults: async () => {
      throw new Error("an experiment run must never read the committed scores file")
    }
  })
  assert.equal(result.ran, false)
  assert.equal(result.experiment, true)
  assert.deepEqual(client.calls, [])
  assert.match(logs[0], /Run id: dry/)
  assert.match(logs[0], /the committed apps\/backend\/src\/eval\/answer-quality\/results\.json is never read or written/)
  assert.match(logs[0], /Cases: 2 from the manifest, each answered 3 times/)
  assert.match(logs[0], /6 answer calls, 6 lone judge calls/)
})

test("a confirmed experiment run hands the validated cases to the experiment runner and leaves results.json byte-identical", async () => {
  const a = fixtureCase("exp-a")
  const { manifestPath, loadCases } = await experimentFixture({ manifestCases: [manifestEntryFor(a)], cases: [a] })
  const repoRootForTest = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const committed = resolve(repoRootForTest, "apps/backend/src/eval/answer-quality/results.json")
  const before = await readFileAsync(committed, "utf8")
  let received
  const client = fakeAccessClient(["gpt-4.1", "gpt-5"])
  const result = await run({
    loadLocalEnv: noLocalEnv,
    argv: ["--run-id", "live", "--manifest", manifestPath, "--repeat", "2", "--expect-commit", "abcdef1", "--max-cost-usd", "5", CONFIRM_FLAG],
    env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
    log: () => {},
    loadCases,
    isStale: notStale,
    client,
    readResults: async () => {
      throw new Error("an experiment run must never read the committed scores file")
    },
    runExperiment: async (params) => {
      received = params
      return { summary: "fake" }
    }
  })
  assert.equal(result.ran, true)
  assert.equal(received.runId, "live")
  assert.equal(received.repeats, 2)
  assert.equal(received.expectCommit, "abcdef1")
  assert.deepEqual(received.cases.map((c) => c.id), ["exp-a"])
  assert.equal(received.manifestSha256.length, 64)
  assert.match(received.runsRoot, /output\/answer-quality\/runs$/)
  assert.deepEqual(client.calls, ["list"], "only the models-list access check; no completion")
  assert.equal(await readFileAsync(committed, "utf8"), before, "the committed scores file is byte-identical")
})

test("a routine run still merges into the committed scores file exactly as before (REQ-189)", async () => {
  const { deps, written } = fakeDeps()
  await executeEvaluation(evaluationParams(), deps)
  assert.equal(written.results.caseLegScores.length, 1)
  assert.ok(written.results.runMetadata.selectionMode)
})

test("ANSWER_QUALITY_NO_LOCAL_ENV keeps every local env file out of a run, so a dry run builds no client", () => {
  const loaded = []
  const loadLocalEnv = () => {
    loaded.push("read")
    return { env: { OPENAI_API_KEY: "sk-from-a-file" }, sources: ["a-file"] }
  }
  const guarded = resolveRunEnv({ processEnv: { [NO_LOCAL_ENV_VARIABLE]: "1" }, confirmed: false, loadLocalEnv })
  assert.deepEqual(loaded, [], "no local env file is read")
  assert.equal(guarded.OPENAI_API_KEY, undefined)
  const unguarded = resolveRunEnv({ processEnv: {}, confirmed: false, loadLocalEnv })
  assert.equal(unguarded.OPENAI_API_KEY, "sk-from-a-file")
})

test("describeExperimentPlan names the arms and revisions, the calls and the folder", () => {
  const text = describeExperimentPlan({
    experiment: { runId: "plan", repeats: 1, regradeFrom: null },
    models: ["gpt-4.1"],
    excerptCaps: [10],
    arms: [{ id: "A", revision: "A.1" }],
    estimate: { answerCalls: 2, loneJudgeCalls: 2, rankingCalls: 0, totalCalls: 4, totalCostUsd: 0.05 },
    caseCount: 2,
    folder: "/runs/plan",
    judgeModel: "gpt-5"
  })
  assert.match(text, /Arms: A \(A\.1\)/)
  assert.match(text, /4 total, sequential/)
  assert.match(text, /\/runs\/plan\//)
})

// ---------------------------------------------------------------------------
// Slice B (REQ-227): flags, the cap requirement, unpriced models
// ---------------------------------------------------------------------------

test("parseArgs reads --resume, --retry-errors and --max-cost-usd, and refuses the unusable combinations", () => {
  const parsed = parseArgs(["--resume", "phase-2", "--manifest", "m.json", "--retry-errors", "--max-cost-usd", "12.5"])
  assert.equal(parsed.experiment.runId, "phase-2")
  assert.equal(parsed.experiment.resume, true)
  assert.equal(parsed.experiment.retryErrors, true)
  assert.equal(parsed.experiment.maxCostUsd, 12.5)
  assert.equal(parseArgs(["--run-id", "x", "--manifest", "m.json"]).experiment.maxCostUsd, null)
  assert.throws(() => parseArgs(["--run-id", "x", "--manifest", "m.json", "--retry-errors"]), /add --resume/)
  assert.throws(() => parseArgs(["--run-id", "x", "--manifest", "m.json", "--max-cost-usd", "0"]), /positive dollar amount/)
  assert.throws(() => parseArgs(["--run-id", "a", "--resume", "b", "--manifest", "m.json"]), /name different runs/)
  assert.throws(() => parseArgs(["--max-cost-usd", "5"]), /belong to an experiment run/)
})

test("--confirm-live-calls in experiment mode without --max-cost-usd refuses before any client or call exists", async () => {
  const a = fixtureCase("cap-a")
  const { manifestPath, loadCases } = await experimentFixture({ manifestCases: [manifestEntryFor(a)], cases: [a] })
  let clientBuilt = false
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: ["--run-id", "uncapped", "--manifest", manifestPath, CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        log: () => {},
        loadCases,
        isStale: notStale,
        buildClient: async () => {
          clientBuilt = true
          return fakeAccessClient(["gpt-4.1", "gpt-5"])
        },
        runExperiment: async () => {
          throw new Error("must not run")
        }
      }),
    /also needs --max-cost-usd/
  )
  assert.equal(clientBuilt, false)
})

test("a model with no rate prints as unpriced in the dry run, and a live capped run refuses to start", async () => {
  const a = fixtureCase("unpriced-a")
  const { manifestPath, loadCases } = await experimentFixture({ manifestCases: [manifestEntryFor(a)], cases: [a] })

  // Dry run: unpriced, never $0 -- routine plan and experiment plan alike.
  const routineLogs = []
  await run({
    loadLocalEnv: noLocalEnv,
    argv: ["--model", "gpt-6-luna"],
    env: {},
    log: (line) => routineLogs.push(line),
    loadCases,
    measure: fakeMeasure,
    isStale: notStale
  })
  assert.match(routineLogs[0], /Unpriced \(no rate in the table\): gpt-6-luna/)

  const experimentLogs = []
  await run({
    loadLocalEnv: noLocalEnv,
    argv: ["--run-id", "luna", "--manifest", manifestPath, "--model", "gpt-6-luna", "--max-cost-usd", "5"],
    env: {},
    log: (line) => experimentLogs.push(line),
    loadCases,
    isStale: notStale,
    measure: fakeMeasure
  })
  assert.match(experimentLogs[0], /Unpriced \(no rate in the table\): gpt-6-luna/)
  assert.match(experimentLogs[0], /Spending cap: \$5/)

  // Live capped run: refused before a client is built.
  let clientBuilt = false
  await assert.rejects(
    () =>
      run({
        loadLocalEnv: noLocalEnv,
        argv: ["--run-id", "luna-live", "--manifest", manifestPath, "--model", "gpt-6-luna", "--max-cost-usd", "5", CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        log: () => {},
        loadCases,
        isStale: notStale,
        buildClient: async () => {
          clientBuilt = true
          return fakeAccessClient([])
        }
      }),
    /no rate is known for gpt-6-luna \(unpriced\)/
  )
  assert.equal(clientBuilt, false)
})

test("estimateCallCostUsd follows the dry-run method and is null for a model with no rate", () => {
  assert.equal(estimateCallCostUsd({ kind: "answer", model: "mystery" }), null)
  const answer = estimateCallCostUsd({ kind: "answer", model: "gpt-4.1", promptChars: 40000 })
  assert.ok(Math.abs(answer - (10000 * 2 + 600 * 8) / 1_000_000) < 1e-12)
  const judge = estimateCallCostUsd({ kind: "judge", model: "gpt-5" })
  assert.ok(Math.abs(judge - (1500 * 1.25 + 800 * 10) / 1_000_000) < 1e-12)
  assert.ok(estimateCallCostUsd({ kind: "ranking", model: "gpt-5" }) > judge)
})
