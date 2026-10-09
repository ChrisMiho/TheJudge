// Named experiment runs for the answer-quality instrument (REQ-226, REQ-227).
//
// A routine run (`npm run eval:answer-quality`) grades what players get and
// merges into one committed scores file. An experiment run is the deliberate
// comparison: it answers exactly the cases a manifest lists, may answer each
// case more than once, records everything needed to reproduce it, and writes
// only to its own folder, `output/answer-quality/runs/<run-id>/` (gitignored).
// It never reads or writes the committed `results.json`.
//
// A run measures the checkout it executes from and records that commit. It
// imports no code from another checkout: an older revision is measured by
// running this tooling from that revision's own worktree with the tooling
// commits applied on top. It refuses a checkout with uncommitted changes, and
// a checkout on a commit other than `--expect-commit`, before any call.
//
// This module is plain JavaScript over injected dependencies (the client, the
// prompt builder, the judge, the clock, git, the file hashes), so every path
// runs under `node --test` with fakes: no TypeScript loader, no provider, no
// network. scripts/eval-answer-quality.mjs wires the real ones.

import { appendFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { mechanicPrefixes, ruleSections, sha256 } from "./gold-cases.mjs";
import { hashPrompt, referenceAnswerHash } from "./answer-quality-run.mjs";
import { attachedRuleIdsOf, buildJudgeInputs, extractExcerptRuleIds } from "./judge-inputs.mjs";
import { describeDecidingRules } from "./rule-availability.mjs";

export const EXPERIMENT_RUNS_DIR = "output/answer-quality/runs";
export const IDENTITY_FORMAT_VERSION = 1;
export const MANIFEST_FORMAT_VERSION = 1;
/** Arm A is the production prompt of the checkout, untouched: the only arm a routine run uses (REQ-230). */
export const DEFAULT_ARM = "A";
export const ARM_A_REVISION = "A.1";

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const CHARS_PER_TOKEN_ESTIMATE = 4;

// Model prose never enters the numbers-only summary (REQ-189); the transcripts hold it.
const PROSE_KEYS = ["answer", "answerText", "shortAnswer", "rationale", "promptText", "prompt", "workedSolution"];

export function assertNoProseKeys(value, path = "summary") {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProseKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (PROSE_KEYS.includes(key)) throw new Error(`${path}.${key} is model prose and does not belong in a numbers-only summary`);
    assertNoProseKeys(nested, `${path}.${key}`);
  }
}

export function validateRunId(runId) {
  if (typeof runId !== "string" || !RUN_ID_PATTERN.test(runId)) {
    throw new Error(
      `Run id "${runId ?? ""}" is not usable: use 1 to 80 letters, digits, dots, dashes or underscores, starting with a letter or digit.`
    );
  }
  return runId;
}

export function runFolder(runsRoot, runId) {
  return join(runsRoot, validateRunId(runId));
}

/** One record is keyed by case, model, excerpt cap, arm and repeat index (REQ-226). */
export function recordKey({ caseId, model, excerptCap, arm = DEFAULT_ARM, repeat = 1 }) {
  return `${caseId}|${model}|${excerptCap}|${arm}|${repeat}`;
}

function safeSegment(value) {
  return String(value).replace(/[^a-z0-9.-]/gi, "_");
}

export function transcriptRelativePath({ caseId, model, excerptCap, arm = DEFAULT_ARM, repeat = 1 }) {
  return `transcripts/${safeSegment(caseId)}--${safeSegment(model)}--cap${excerptCap}--arm${safeSegment(arm)}--r${repeat}.json`;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** The hashes a manifest pins for one case: its question and its reference answer. */
export function manifestEntryFor(caseEntry) {
  return {
    id: caseEntry.id,
    questionSha256: sha256(caseEntry.question),
    answerSha256: referenceAnswerHash(caseEntry)
  };
}

export async function loadManifestFile(manifestPath, { read = readFile } = {}) {
  let text;
  try {
    text = await read(manifestPath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read the manifest ${manifestPath}: ${error?.message ?? error}`, { cause: error });
  }
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new Error(`The manifest ${manifestPath} is not valid JSON: ${error?.message ?? error}`, { cause: error });
  }
  const problems = [];
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    problems.push("the manifest must be an object with a \"cases\" list");
  } else if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
    problems.push("the manifest needs a non-empty \"cases\" list");
  } else {
    manifest.cases.forEach((entry, index) => {
      if (typeof entry?.id !== "string" || entry.id.length === 0) problems.push(`cases[${index}] has no id`);
      if (typeof entry?.questionSha256 !== "string") problems.push(`cases[${index}] (${entry?.id ?? "?"}) has no questionSha256`);
      if (typeof entry?.answerSha256 !== "string") problems.push(`cases[${index}] (${entry?.id ?? "?"}) has no answerSha256`);
    });
  }
  if (problems.length > 0) throw new Error(`The manifest ${manifestPath} is malformed: ${problems.join("; ")}.`);
  return { manifest, manifestSha256: sha256(text) };
}

/**
 * Checks a manifest against the corpus of the checkout the run executes from.
 * A case that is missing, not approved, stale, or whose question or reference
 * answer no longer hashes to what the manifest pinned refuses the run, named.
 * `checkHashes: false` (a regrade) still refuses a missing, unapproved or
 * stale case but accepts a reworked reference answer, because the regrade
 * records the hash it graded against and the compare report checks equality.
 */
export function validateManifestCases({ manifest, allCases, isStale = () => false, checkHashes = true }) {
  const byId = new Map(allCases.map((caseEntry) => [caseEntry.id, caseEntry]));
  const problems = [];
  const cases = [];
  const seen = new Set();
  for (const entry of manifest.cases) {
    if (seen.has(entry.id)) {
      problems.push(`${entry.id}: listed twice in the manifest`);
      continue;
    }
    seen.add(entry.id);
    const caseEntry = byId.get(entry.id);
    if (!caseEntry) {
      problems.push(`${entry.id}: missing -- no such case in this checkout's corpus`);
      continue;
    }
    if (caseEntry.review.status !== "approved") {
      problems.push(`${entry.id}: unapproved -- its review status is "${caseEntry.review.status}"`);
      continue;
    }
    if (isStale(caseEntry)) {
      problems.push(`${entry.id}: stale -- its rule, oracle or ruling text changed since it was approved`);
      continue;
    }
    if (checkHashes) {
      const current = manifestEntryFor(caseEntry);
      if (current.questionSha256 !== entry.questionSha256) {
        problems.push(`${entry.id}: hash mismatch -- the question differs from the one the manifest pinned`);
        continue;
      }
      if (current.answerSha256 !== entry.answerSha256) {
        problems.push(`${entry.id}: hash mismatch -- the reference answer differs from the one the manifest pinned`);
        continue;
      }
    }
    cases.push(caseEntry);
  }
  if (problems.length > 0) {
    throw new Error(`The manifest refuses this run (${problems.length} case problem${problems.length === 1 ? "" : "s"}):\n  ${problems.join("\n  ")}`);
  }
  return cases;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

/**
 * A run measures the checkout it executes from (REQ-226). It refuses before
 * any call when that checkout has uncommitted changes, and when `--expect-commit`
 * names a commit other than the one it sits on. `git` is `{ head(), isDirty() }`.
 */
export async function assertCheckoutReady({ git, expectCommit }) {
  const head = await git.head();
  if (await git.isDirty()) {
    throw new Error(
      `This checkout (${head.slice(0, 8)}) has uncommitted changes, so a run could not say what it measured. Commit or discard them and run again.`
    );
  }
  if (expectCommit) {
    const wanted = expectCommit.trim().toLowerCase();
    if (wanted.length < 7 || !head.toLowerCase().startsWith(wanted)) {
      throw new Error(
        `--expect-commit ${expectCommit} does not match the commit this checkout executes from (${head}). Run the tooling from the worktree for that revision.`
      );
    }
  }
  return head;
}

export async function defaultGit(cwd) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  return {
    head: async () => (await exec("git", ["rev-parse", "HEAD"], { cwd })).stdout.trim(),
    isDirty: async () => (await exec("git", ["status", "--porcelain"], { cwd })).stdout.trim().length > 0
  };
}

// ---------------------------------------------------------------------------
// Identity record
// ---------------------------------------------------------------------------

/**
 * The identity record (`manifest.json` in the run folder): everything needed
 * to say what this run measured and to refuse a resume that differs. Numbers,
 * hashes and ids only.
 */
export function buildIdentityRecord({
  runId,
  commit,
  manifest,
  manifestSha256,
  fileHashes,
  models,
  excerptCaps,
  arms,
  repeats,
  judgeModel,
  rubricRevision,
  rateTable,
  maxCostUsd = null,
  askAiProvider,
  embeddingProvider,
  embeddingModel,
  comboCatalogLoaded,
  client,
  productionTimeoutMs = null,
  regrade = null,
  startedAt
}) {
  return {
    formatVersion: IDENTITY_FORMAT_VERSION,
    runId,
    commit,
    startedAt,
    manifestSha256,
    caseList: manifest.cases.map((entry) => ({ id: entry.id, questionSha256: entry.questionSha256, answerSha256: entry.answerSha256 })),
    dataFileSha256: fileHashes.dataFiles,
    caseFileSha256: fileHashes.caseFiles,
    rulesIndexSha256: fileHashes.rulesIndexSha256,
    models: { requested: [...models], reported: {} },
    requestOptions: { fields: ["model", "input"] },
    client: { timeoutMs: client?.timeoutMs ?? "sdk-default", maxRetries: client?.maxRetries ?? "sdk-default" },
    // Production's answer timeout at the revision this run executed from: what the compare report holds latency against (REQ-228).
    productionTimeoutMs,
    askAiProvider: askAiProvider ?? "",
    embeddingProvider: embeddingProvider ?? "",
    embeddingModel: embeddingModel ?? "",
    comboCatalogLoaded: Boolean(comboCatalogLoaded),
    excerptCaps: [...excerptCaps],
    arms: arms.map((arm) => ({ id: arm.id, revision: arm.revision })),
    repeats,
    judgeModel,
    rubricRevision,
    rateTable,
    maxCostUsd,
    regrade
  };
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export function requestKindOf(caseEntry) {
  return caseEntry.gameState ? "game" : "lookup";
}

/** The breakdown keys the compare report groups by (REQ-228), carried on each record so a run folder is self-contained. */
export function strataOf(caseEntry) {
  return {
    ruleSections: ruleSections(caseEntry.expected.decidingRuleIds),
    mechanics: mechanicPrefixes(caseEntry.expected.decidingRuleIds),
    difficultyScore: caseEntry.difficulty?.score ?? null,
    sourcePool: caseEntry.source?.pool ?? null,
    requestKind: requestKindOf(caseEntry)
  };
}

function sumOf(records, field) {
  return records.reduce((sum, record) => sum + (record[field] ?? 0), 0);
}

export function buildSummary({
  identity,
  records,
  finishedAt,
  stoppedReason = null,
  notCompleted = [],
  rankingUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 }
}) {
  const ok = records.filter((record) => record.status === "ok");
  const summary = {
    runId: identity.runId,
    commit: identity.commit,
    startedAt: identity.startedAt,
    finishedAt,
    judgeModel: identity.judgeModel,
    rubricRevision: identity.rubricRevision,
    regrade: identity.regrade,
    stoppedReason,
    // Every record key the run did not complete (an error, or a stop at the cap): the cap is a stop, never a silent skip (REQ-227).
    notCompleted,
    counts: {
      records: records.length,
      ok: ok.length,
      errors: records.filter((record) => record.status === "error").length,
      undetermined: ok.filter((record) => record.undetermined).length,
      correctnessTwo: ok.filter((record) => !record.undetermined && record.scores?.correctness === 2).length
    },
    totals: {
      inputTokens: sumOf(records, "inputTokens"),
      outputTokens: sumOf(records, "outputTokens"),
      reasoningTokens: sumOf(records, "reasoningTokens"),
      judgeInputTokens: sumOf(records, "judgeInputTokens"),
      judgeOutputTokens: sumOf(records, "judgeOutputTokens"),
      answerCostUsd: sumOf(records, "costUsd"),
      judgeCostUsd: sumOf(records, "judgeCostUsd"),
      rankingInputTokens: rankingUsage.inputTokens,
      rankingOutputTokens: rankingUsage.outputTokens,
      rankingCostUsd: rankingUsage.costUsd
    },
    records
  };
  assertNoProseKeys(summary);
  return summary;
}

async function writeJson(path, value) {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// The loop (REQ-226, REQ-227)
// ---------------------------------------------------------------------------

export const CALLS_FILE = "calls.jsonl";
const MAX_ERROR_MESSAGE_CHARS = 300;

/**
 * Builds one record's prompt. Arm A is the checkout's own production prompt
 * (`preparePromptInput`, REQ-185); any other arm comes from `deps.buildArmPrompt`
 * (REQ-230, wired in scripts/eval-answer-quality.mjs).
 */
function buildPromptFor({ deps, arm, request, cap, vector, caseEntry }) {
  const prepared = deps.preparePromptInput(request, {
    ...deps.resources,
    supplementalRuleCap: cap,
    queryEmbedding: vector ?? null,
    collectEnrichmentDebug: true
  });
  if (arm.id === DEFAULT_ARM) return { prepared, promptText: prepared.promptText };
  if (!deps.buildArmPrompt) throw new Error(`Arm ${arm.id} has no prompt builder in this run.`);
  const built = deps.buildArmPrompt({ arm, prepared, caseEntry, request, cap });
  return { prepared, promptText: built.promptText, bundleRuleIds: built.bundleRuleIds };
}

/** Reasoning tokens are billed as output tokens: the provider's `output_tokens` already includes them (REQ-227). */
export function readUsage(response) {
  const usage = response?.usage ?? {};
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? 0,
    // The effort the provider reports for a reasoning model; none is ever sent (REQ-188).
    reportedEffort: response?.reasoning?.effort ?? null
  };
}

function classifyProviderError(error) {
  const text = `${error?.name ?? ""} ${error?.code ?? ""} ${error?.message ?? ""}`;
  return /timeout|timed out|ETIMEDOUT/i.test(text) ? "timeout" : "provider";
}

/** The model ids with no entry in the rate table: the cap could not be enforced for them (REQ-227). */
export function findUnpricedModels(modelIds, rateTable) {
  return [...new Set(modelIds)].filter((model) => !rateTable?.[model]);
}

export function assertAllPriced({ models, judgeModel, rateTable }) {
  const unpriced = findUnpricedModels([...models, judgeModel], rateTable);
  if (unpriced.length > 0) {
    throw new Error(
      `A capped live run cannot start: no rate is known for ${unpriced.join(", ")} (unpriced), so the spending cap could not be enforced. Add its rate and the date it was checked to the rate table, then run again.`
    );
  }
}

async function readCalls(folder) {
  const records = new Map();
  const rankings = new Map();
  let text = "";
  try {
    text = await readFile(join(folder, CALLS_FILE), "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  for (const line of text.split("\n")) {
    if (line.trim().length === 0) continue;
    const parsed = JSON.parse(line);
    if (parsed.type === "record") records.set(parsed.record.key, parsed.record);
    else if (parsed.type === "ranking") rankings.set(parsed.groupKey, parsed);
  }
  return { records, rankings };
}

async function appendCall(folder, line) {
  await mkdir(folder, { recursive: true });
  await appendFile(join(folder, CALLS_FILE), `${JSON.stringify(line)}\n`, "utf8");
}

function groupKeyOf({ caseId, excerptCap, arm, repeat }) {
  return `${caseId}|${excerptCap}|${arm}|${repeat}`;
}

/** Compares the identity record on disk with the one this invocation would write; startedAt and the observed model ids may differ. */
export function diffIdentity(onDisk, fresh) {
  const comparable = (identity) => {
    const rest = { ...identity };
    delete rest.startedAt;
    // A resume may carry a new spending cap, which is recorded rather than refused (REQ-227).
    delete rest.maxCostUsd;
    delete rest.capChanges;
    return { ...rest, models: { requested: identity.models?.requested } };
  };
  const a = comparable(onDisk);
  const b = comparable(fresh);
  const fields = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...fields].filter((field) => JSON.stringify(a[field]) !== JSON.stringify(b[field])).sort();
}

function totalSpend(calls) {
  let spent = 0;
  for (const record of calls.records.values()) spent += (record.costUsd ?? 0) + (record.judgeCostUsd ?? 0);
  for (const ranking of calls.rankings.values()) spent += ranking.costUsd ?? 0;
  return spent;
}

function errorMessageOf(error) {
  return String(error?.message ?? error).slice(0, MAX_ERROR_MESSAGE_CHARS);
}

/**
 * Runs one experiment: for every excerpt cap, case, arm and repeat, answers
 * with every model, grades the answer alone, and records the result. Each
 * record is appended to `calls.jsonl` the moment its judge call returns, so a
 * crash keeps every finished call (REQ-227). A provider error or timeout on an
 * answer becomes an `error` record and the run moves on. `resume` continues a
 * run folder whose identity record is unchanged, skipping completed keys;
 * `retryErrors` re-attempts the error records. With `maxCostUsd`, the run adds
 * each call's estimate to what it has spent and stops cleanly before passing
 * the cap. Writes the identity record first, a transcript per record, and a
 * numbers-only `summary.json` last, all inside the run's own folder. Never
 * touches the committed scores file.
 */
export async function executeExperiment(params, deps) {
  const {
    runId,
    runsRoot,
    client,
    judgeModel,
    models,
    excerptCaps,
    arms,
    repeats,
    cases,
    manifest,
    manifestSha256,
    expectCommit,
    resume = false,
    retryErrors = false,
    maxCostUsd = null,
    heldOutIds = new Set(),
    env,
    log
  } = params;
  const folder = runFolder(runsRoot, runId);

  // Refuse before any call, and before the folder exists.
  const commit = await assertCheckoutReady({ git: deps.git, expectCommit });
  if (maxCostUsd !== null) assertAllPriced({ models, judgeModel, rateTable: deps.rateTable });
  const folderExists = await pathExists(folder);
  if (folderExists && !resume) {
    throw new Error(`The run folder ${folder} already exists. Use a new --run-id, or --resume ${runId} to continue it; runs are never overwritten.`);
  }
  if (!folderExists && resume) throw new Error(`Cannot resume "${runId}": there is no run folder ${folder}.`);

  const fileHashes = await deps.fileHashes(cases);
  let identity = buildIdentityRecord({
    runId,
    commit,
    manifest,
    manifestSha256,
    fileHashes,
    models,
    excerptCaps,
    arms,
    repeats,
    judgeModel,
    rubricRevision: deps.rubricRevision,
    rateTable: deps.rateTable,
    maxCostUsd,
    askAiProvider: env?.ASK_AI_PROVIDER ?? "",
    embeddingProvider: deps.embeddingProvider,
    embeddingModel: deps.embeddingModel ?? "",
    comboCatalogLoaded: deps.comboCatalogLoaded ?? false,
    client: deps.clientOptions,
    productionTimeoutMs: deps.productionTimeoutMs ?? null,
    startedAt: deps.nowIso()
  });
  if (resume) {
    const onDisk = JSON.parse(await readFile(join(folder, "manifest.json"), "utf8"));
    const changed = diffIdentity(onDisk, identity);
    if (changed.length > 0) {
      throw new Error(
        `Cannot resume "${runId}": the identity record changed (${changed.join(", ")}). A resumed run must measure exactly what it started with; start a new run id instead.`
      );
    }
    identity = onDisk;
    // A resume continues against the recorded cap unless a new one is given, which is recorded (REQ-227).
    if (maxCostUsd !== null && maxCostUsd !== identity.maxCostUsd) {
      identity.capChanges = [...(identity.capChanges ?? []), { from: identity.maxCostUsd ?? null, to: maxCostUsd, at: deps.nowIso() }];
      identity.maxCostUsd = maxCostUsd;
      await writeJson(join(folder, "manifest.json"), identity);
    }
    if (identity.maxCostUsd !== null && identity.maxCostUsd !== undefined) {
      assertAllPriced({ models, judgeModel, rateTable: deps.rateTable });
    }
  } else {
    await writeJson(join(folder, "manifest.json"), identity);
  }
  const capUsd = identity.maxCostUsd ?? null;

  const knownRuleIds = new Set(deps.ruleIds);
  const queryEmbeddingByCaseId = await deps.embedQueries(cases);
  log?.(`Embedded ${cases.length} case queries with EMBEDDING_PROVIDER=${deps.embeddingProvider}.`);

  const calls = await readCalls(folder);
  const state = { spent: totalSpend(calls), stopped: null };
  const rankingUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  for (const ranking of calls.rankings.values()) {
    rankingUsage.inputTokens += ranking.inputTokens ?? 0;
    rankingUsage.outputTokens += ranking.outputTokens ?? 0;
    rankingUsage.costUsd += ranking.costUsd ?? 0;
  }
  if (resume) log?.(`Resuming ${runId}: ${calls.records.size} record(s) already on disk, $${state.spent.toFixed(4)} already spent.`);

  const passesCap = (estimateUsd, nextCall) => {
    if (capUsd === null || estimateUsd === null) return false;
    if (state.spent + estimateUsd <= capUsd) return false;
    state.stopped = { kind: "cap", maxCostUsd: capUsd, spentUsd: state.spent, estimateUsd, nextCall };
    return true;
  };

  const ordered = [];
  for (const cap of excerptCaps) {
    for (const caseEntry of cases) {
      for (const arm of arms) {
        for (let repeat = 1; repeat <= repeats; repeat++) ordered.push({ cap, caseEntry, arm, repeat });
      }
    }
  }

  for (const { cap, caseEntry, arm, repeat } of ordered) {
    if (state.stopped) break;
    const request = deps.buildCaseRequest(caseEntry);
    const referenceHash = referenceAnswerHash(caseEntry);
    const group = [];
    let groupComplete = true;
    for (const model of models) {
      const key = { caseId: caseEntry.id, model, excerptCap: cap, arm: arm.id, repeat };
      const existing = calls.records.get(recordKey(key));
      if (existing && (existing.status === "ok" || !retryErrors)) {
        if (existing.status === "ok") group.push({ record: existing, ...(await readStoredAnswer(folder, existing)) });
        else groupComplete = false;
        continue;
      }
      const result = await answerAndGrade({
        deps,
        client,
        judgeModel,
        identity,
        caseEntry,
        request,
        referenceHash,
        arm,
        repeat,
        model,
        cap,
        vector: queryEmbeddingByCaseId.get(caseEntry.id) ?? null,
        knownRuleIds,
        folder,
        heldOutIds,
        passesCap,
        log
      });
      if (!result) break; // stopped before the call: the cap
      calls.records.set(result.record.key, result.record);
      state.spent += (result.record.costUsd ?? 0) + (result.record.judgeCostUsd ?? 0);
      await appendCall(folder, { type: "record", record: result.record });
      if (result.record.status === "ok") group.push(result);
      else groupComplete = false;
      if (result.record.reportedModel && identity.models.reported[model] !== result.record.reportedModel) {
        identity.models.reported[model] = result.record.reportedModel;
        await writeJson(join(folder, "manifest.json"), identity);
      }
    }
    if (state.stopped) break;

    // Ranking one answer against itself means nothing: a one-model run makes no ranking call (REQ-186).
    const groupKey = groupKeyOf({ caseId: caseEntry.id, excerptCap: cap, arm: arm.id, repeat });
    if (models.length > 1 && groupComplete && group.length === models.length && !calls.rankings.has(groupKey)) {
      const estimate = deps.estimateCallCostUsd?.({ kind: "ranking", model: judgeModel }) ?? null;
      if (passesCap(estimate, { caseId: caseEntry.id, kind: "ranking" })) break;
      const ranking = await rankGroup({ deps, client, judgeModel, caseEntry, arm, repeat, cap, group, folder, groupKey });
      calls.rankings.set(groupKey, ranking);
      state.spent += ranking.costUsd;
      rankingUsage.inputTokens += ranking.inputTokens;
      rankingUsage.outputTokens += ranking.outputTokens;
      rankingUsage.costUsd += ranking.costUsd;
      await appendCall(folder, ranking);
    }
  }

  const records = [];
  for (const { cap, caseEntry, arm, repeat } of ordered) {
    for (const model of models) {
      const record = calls.records.get(recordKey({ caseId: caseEntry.id, model, excerptCap: cap, arm: arm.id, repeat }));
      if (!record) continue;
      const ranking = calls.rankings.get(groupKeyOf({ caseId: caseEntry.id, excerptCap: cap, arm: arm.id, repeat }));
      records.push(ranking && !ranking.undetermined ? { ...record, blindRank: ranking.ranks[model] ?? null } : record);
    }
  }
  const notCompleted = [];
  for (const { cap, caseEntry, arm, repeat } of ordered) {
    for (const model of models) {
      const key = recordKey({ caseId: caseEntry.id, model, excerptCap: cap, arm: arm.id, repeat });
      if (calls.records.get(key)?.status !== "ok") notCompleted.push(key);
    }
  }
  const stoppedReason = state.stopped
    ? { kind: state.stopped.kind, maxCostUsd: state.stopped.maxCostUsd, spentUsd: state.stopped.spentUsd, nextEstimateUsd: state.stopped.estimateUsd }
    : null;
  const summary = buildSummary({ identity, records, rankingUsage, stoppedReason, notCompleted, finishedAt: deps.nowIso() });
  await writeJson(join(folder, "summary.json"), summary);
  if (state.stopped) {
    log?.(
      `\nStopped before passing the spending cap: $${state.stopped.spentUsd.toFixed(4)} spent of the $${state.stopped.maxCostUsd} cap (the next call is estimated at $${state.stopped.estimateUsd.toFixed(4)}). Every finished call is in ${join(folder, CALLS_FILE)}; resume with --resume ${runId}.`
    );
  } else {
    log?.(`\nWrote the run folder ${folder}/ (manifest.json, calls.jsonl, transcripts/, summary.json).`);
  }
  return { identity, summary, folder };
}

/** A finished record's stored answer and the prompt it answered, so a resumed run can rank it without a second call. */
async function readStoredAnswer(folder, record) {
  try {
    const stored = JSON.parse(await readFile(join(folder, record.transcript), "utf8"));
    return { answerText: stored.answerText ?? "", promptText: stored.promptText ?? "", attachedRuleIds: stored.attachedRuleIds ?? extractExcerptRuleIds(stored.promptText) };
  } catch {
    return { answerText: "", promptText: "", attachedRuleIds: [] };
  }
}

async function answerAndGrade({
  deps,
  client,
  judgeModel,
  identity,
  caseEntry,
  request,
  referenceHash,
  arm,
  repeat,
  model,
  cap,
  vector,
  knownRuleIds,
  folder,
  heldOutIds = new Set(),
  passesCap,
  log
}) {
  const { prepared, promptText, bundleRuleIds = [] } = buildPromptFor({ deps, arm, request, cap, vector, caseEntry });
  const retrieval = deps.describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, {
    requireSemantic: deps.requireSemantic,
    caseId: caseEntry.id
  });

  // The answer and the grade that follows are checked together, so a run never pays for an answer it cannot grade.
  const answerEstimate = deps.estimateCallCostUsd?.({ kind: "answer", model, promptChars: promptText.length }) ?? null;
  const judgeEstimate = deps.estimateCallCostUsd?.({ kind: "judge", model: judgeModel }) ?? null;
  const callEstimate = answerEstimate === null || judgeEstimate === null ? null : answerEstimate + judgeEstimate;
  if (passesCap(callEstimate, { caseId: caseEntry.id, model, excerptCap: cap, arm: arm.id, repeat, kind: "answer" })) return null;

  const key = { caseId: caseEntry.id, model, excerptCap: cap, arm: arm.id, repeat };
  const common = {
    key: recordKey(key),
    ...key,
    armRevision: arm.revision,
    // Every arm but A is a test-only variant, reported apart as a diagnostic control (REQ-230, REQ-228).
    diagnostic: arm.id !== DEFAULT_ARM,
    heldOut: heldOutIds.has(caseEntry.id),
    tier: caseEntry.tier,
    strata: strataOf(caseEntry),
    goldRuleInPrompt: retrieval.goldRuleInPrompt,
    promptChars: promptText.length,
    promptHash: hashPrompt(promptText),
    referenceAnswerHash: referenceHash,
    judgeModel,
    rubricRevision: identity.rubricRevision,
    embeddingProvider: identity.embeddingProvider,
    commit: identity.commit
  };

  const startedAt = deps.now();
  let response;
  try {
    response = await client.responses.create({ model, input: promptText });
  } catch (error) {
    const record = {
      ...common,
      status: "error",
      errorKind: classifyProviderError(error),
      errorMessage: errorMessageOf(error),
      latencyMs: deps.now() - startedAt,
      gradedAt: deps.nowIso(),
      costUsd: 0,
      judgeCostUsd: 0
    };
    log?.(`  ${caseEntry.id} / ${model} / cap ${cap} / arm ${arm.id} / repeat ${repeat}: ${record.errorKind} error -- ${record.errorMessage}`);
    return { record, answerText: "" };
  }
  const latencyMs = deps.now() - startedAt;
  const answerText = response.output_text?.trim() ?? "";
  const usage = readUsage(response);
  const inputTokens = usage.inputTokens ?? Math.round(promptText.length / CHARS_PER_TOKEN_ESTIMATE);
  const outputTokens = usage.outputTokens ?? Math.round(answerText.length / CHARS_PER_TOKEN_ESTIMATE);

  const attachedRuleIds = attachedRuleIdsOf(prepared, bundleRuleIds);
  const grade = await gradeOne({ deps, client, judgeModel, caseEntry, answerText, promptText, attachedRuleIds, knownRuleIds });
  const availability = describeDecidingRules({
    decidingRuleIds: caseEntry.expected.decidingRuleIds,
    prepared: { ...prepared, promptText },
    request,
    cardRulingsIndex: deps.resources?.cardRulingsIndex,
    extraRuleIds: bundleRuleIds
  });
  const costUsd = deps.computeCallCostUsd(model, inputTokens, outputTokens);
  const judgeCostUsd = deps.computeCallCostUsd(judgeModel, grade.judgeResult.usage.inputTokens, grade.judgeResult.usage.outputTokens);

  const transcript = transcriptRelativePath(key);
  const record = {
    ...common,
    allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
    status: "ok",
    undetermined: grade.judgeResult.undetermined,
    scores: grade.judgeResult.undetermined ? undefined : grade.judgeResult.scores,
    namesGoldRuleId: grade.assertions.namesGoldRuleId,
    unknownRuleIds: grade.assertions.unknownRuleIds ?? [],
    inputTokens,
    outputTokens,
    reasoningTokens: usage.reasoningTokens,
    judgeReasoningTokens: grade.judgeResult.usage.reasoningTokens ?? 0,
    reportedModel: response.model ?? null,
    reportedEffort: usage.reportedEffort,
    judgeInputTokens: grade.judgeResult.usage.inputTokens,
    judgeOutputTokens: grade.judgeResult.usage.outputTokens,
    latencyMs,
    gradedAt: deps.nowIso(),
    // An unknown price is unpriced, never $0 (REQ-227): the cost is null and the flag is set.
    costUsd,
    judgeCostUsd,
    unpriced: costUsd === null || judgeCostUsd === null,
    transcript
  };

  await writeJson(join(folder, transcript), {
    caseId: caseEntry.id,
    model,
    excerptCap: cap,
    arm: arm.id,
    armRevision: arm.revision,
    repeat,
    question: caseEntry.question,
    promptText,
    attachedRuleIds,
    // What a regrade needs to carry forward without a second answer call.
    telemetry: {
      goldRuleInPrompt: record.goldRuleInPrompt,
      allDecidingRulesInPrompt: record.allDecidingRulesInPrompt,
      inputTokens,
      outputTokens,
      reasoningTokens: usage.reasoningTokens,
      reportedEffort: usage.reportedEffort,
      latencyMs
    },
    answerText,
    workedSolution: caseEntry.expected.answer,
    assertions: grade.assertions,
    scores: record.scores,
    undetermined: record.undetermined,
    rationale: grade.judgeResult.undetermined ? undefined : grade.judgeResult.rationale
  });
  log?.(`  ${caseEntry.id} / ${model} / cap ${cap} / arm ${arm.id} / repeat ${repeat}: answered (${latencyMs}ms)`);
  return { record, answerText, promptText, attachedRuleIds };
}

/**
 * The blind side-by-side rank (REQ-186 layer 2b) for one case at one cap, arm
 * and repeat, once every model has answered. Writes a ranking transcript and
 * returns the `calls.jsonl` line; its judge usage is counted apart.
 */
async function rankGroup({ deps, client, judgeModel, caseEntry, arm, repeat, cap, group, folder, groupKey }) {
  const result = await deps.judgeBlindRanking({
    client,
    judgeModel,
    question: caseEntry.question,
    // The same attached-excerpt, deciding-rule and game-state inputs the lone judge got (REQ-186): the models share one prompt.
    ...buildJudgeInputs({ caseEntry, promptText: group[0].promptText, attachedRuleIds: group[0].attachedRuleIds, ruleIndex: deps.resources?.gameRulesRuleIndex }),
    workedSolution: caseEntry.expected.answer,
    answers: group.map(({ record, answerText }) => ({ modelId: record.model, answerText }))
  });
  await writeJson(
    join(folder, `transcripts/${safeSegment(caseEntry.id)}--cap${cap}--arm${safeSegment(arm.id)}--r${repeat}--ranking.json`),
    {
      caseId: caseEntry.id,
      excerptCap: cap,
      arm: arm.id,
      repeat,
      ranks: result.undetermined ? {} : result.ranks,
      undetermined: result.undetermined,
      reason: result.undetermined ? result.reason : undefined
    }
  );
  return {
    type: "ranking",
    groupKey,
    undetermined: result.undetermined,
    ranks: result.undetermined ? {} : result.ranks,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    costUsd: deps.computeCallCostUsd(judgeModel, result.usage.inputTokens, result.usage.outputTokens)
  };
}

async function gradeOne({ deps, client, judgeModel, caseEntry, answerText, promptText, attachedRuleIds, knownRuleIds }) {
  const assertions = deps.computeDeterministicAssertions(answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
  const judgeResult = await deps.judgeAnswerAlone({
    client,
    judgeModel,
    question: caseEntry.question,
    // Built the same way for every model, cap and arm (scripts/lib/judge-inputs.mjs, REQ-186).
    ...buildJudgeInputs({ caseEntry, promptText, attachedRuleIds, ruleIndex: deps.resources?.gameRulesRuleIndex }),
    answerText,
    workedSolution: caseEntry.expected.answer
  });
  return { assertions, judgeResult };
}

// ---------------------------------------------------------------------------
// Regrade
// ---------------------------------------------------------------------------

/** Reads an earlier run folder, read-only: its identity record and every stored transcript. */
export async function readSourceRun(runsRoot, sourceRunId) {
  const folder = runFolder(runsRoot, sourceRunId);
  let manifestText;
  try {
    manifestText = await readFile(join(folder, "manifest.json"), "utf8");
  } catch {
    throw new Error(`Cannot regrade from "${sourceRunId}": no manifest.json in ${folder}.`);
  }
  const identity = JSON.parse(manifestText);
  let names;
  try {
    names = (await readdir(join(folder, "transcripts"))).filter((name) => name.endsWith(".json")).sort();
  } catch {
    names = [];
  }
  const transcripts = [];
  for (const name of names) {
    transcripts.push(JSON.parse(await readFile(join(folder, "transcripts", name), "utf8")));
  }
  return { identity, manifestSha256: sha256(manifestText), transcripts };
}

/**
 * A regrade run (REQ-226): makes no answer call. It takes each stored answer
 * from an earlier run's transcripts, grades it under the current judge model
 * and rubric revision, and writes only its own run folder. Its identity record
 * names the source run and the source manifest's hash.
 */
export async function executeRegrade(params, deps) {
  const { runId, runsRoot, client, judgeModel, regradeFrom, cases, expectCommit, maxCostUsd = null, env, log } = params;
  const folder = runFolder(runsRoot, runId);
  if (runId === regradeFrom) throw new Error("A regrade run needs its own run id, different from the run it regrades.");

  const commit = await assertCheckoutReady({ git: deps.git, expectCommit });
  if (maxCostUsd !== null) assertAllPriced({ models: [], judgeModel, rateTable: deps.rateTable });
  if (await pathExists(folder)) {
    throw new Error(`The run folder ${folder} already exists. Use a new --run-id; runs are never overwritten.`);
  }
  const source = await (deps.readSourceRun ?? readSourceRun)(runsRoot, regradeFrom);
  if (source.transcripts.length === 0) throw new Error(`Cannot regrade from "${regradeFrom}": it stored no answer transcripts.`);

  const unusable = source.transcripts.filter(
    (stored) => typeof stored.answerText !== "string" || typeof stored.promptText !== "string" || stored.promptText.length === 0
  );
  if (unusable.length > 0) {
    throw new Error(
      `Cannot regrade from "${regradeFrom}": ${unusable.length} stored answer(s) lack the answer text or the prompt hash source (${unusable
        .slice(0, 5)
        .map((stored) => `${stored.caseId}/${stored.model}`)
        .join(", ")}).`
    );
  }
  const byId = new Map(cases.map((caseEntry) => [caseEntry.id, caseEntry]));
  const fileHashes = await deps.fileHashes(cases);
  const sourceManifest = { cases: source.identity.caseList };
  const identity = buildIdentityRecord({
    runId,
    commit,
    manifest: sourceManifest,
    manifestSha256: source.identity.manifestSha256,
    fileHashes,
    models: source.identity.models.requested,
    excerptCaps: source.identity.excerptCaps,
    arms: source.identity.arms,
    repeats: source.identity.repeats,
    judgeModel,
    rubricRevision: deps.rubricRevision,
    rateTable: deps.rateTable,
    maxCostUsd,
    askAiProvider: env?.ASK_AI_PROVIDER ?? "",
    embeddingProvider: source.identity.embeddingProvider,
    embeddingModel: source.identity.embeddingModel,
    comboCatalogLoaded: source.identity.comboCatalogLoaded,
    client: deps.clientOptions,
    productionTimeoutMs: deps.productionTimeoutMs ?? source.identity.productionTimeoutMs ?? null,
    regrade: { sourceRunId: regradeFrom, sourceManifestSha256: source.manifestSha256 },
    startedAt: deps.nowIso()
  });
  await writeJson(join(folder, "manifest.json"), identity);

  const knownRuleIds = new Set(deps.ruleIds);
  const records = [];
  let spent = 0;
  let stopped = null;
  for (const stored of source.transcripts) {
    const estimate = deps.estimateCallCostUsd?.({ kind: "judge", model: judgeModel }) ?? null;
    if (maxCostUsd !== null && estimate !== null && spent + estimate > maxCostUsd) {
      stopped = { kind: "cap", maxCostUsd, spentUsd: spent, nextEstimateUsd: estimate };
      log?.(`\nStopped before passing the spending cap: $${spent.toFixed(4)} spent of the $${maxCostUsd} cap.`);
      break;
    }
    const caseEntry = byId.get(stored.caseId);
    if (!caseEntry) throw new Error(`Cannot regrade ${stored.caseId}: it is not an approved case in this checkout's corpus.`);
    const arm = { id: stored.arm ?? DEFAULT_ARM, revision: stored.armRevision ?? ARM_A_REVISION };
    const grade = await gradeOne({
      deps,
      client,
      judgeModel,
      caseEntry,
      answerText: stored.answerText,
      promptText: stored.promptText,
      attachedRuleIds: stored.attachedRuleIds ?? extractExcerptRuleIds(stored.promptText),
      knownRuleIds
    });
    const key = { caseId: stored.caseId, model: stored.model, excerptCap: stored.excerptCap, arm: arm.id, repeat: stored.repeat ?? 1 };
    const transcript = transcriptRelativePath(key);
    const telemetry = stored.telemetry ?? {};
    const record = {
      key: recordKey(key),
      ...key,
      armRevision: arm.revision,
      diagnostic: arm.id !== DEFAULT_ARM,
      status: "ok",
      tier: caseEntry.tier,
      strata: strataOf(caseEntry),
      undetermined: grade.judgeResult.undetermined,
      scores: grade.judgeResult.undetermined ? undefined : grade.judgeResult.scores,
      namesGoldRuleId: grade.assertions.namesGoldRuleId,
      unknownRuleIds: grade.assertions.unknownRuleIds ?? [],
      goldRuleInPrompt: telemetry.goldRuleInPrompt,
      allDecidingRulesInPrompt: telemetry.allDecidingRulesInPrompt,
      promptChars: stored.promptText.length,
      promptHash: hashPrompt(stored.promptText),
      referenceAnswerHash: referenceAnswerHash(caseEntry),
      inputTokens: telemetry.inputTokens ?? 0,
      outputTokens: telemetry.outputTokens ?? 0,
      reasoningTokens: telemetry.reasoningTokens ?? 0,
      reportedEffort: telemetry.reportedEffort ?? null,
      judgeInputTokens: grade.judgeResult.usage.inputTokens,
      judgeOutputTokens: grade.judgeResult.usage.outputTokens,
      latencyMs: telemetry.latencyMs ?? null,
      judgeModel,
      rubricRevision: identity.rubricRevision,
      embeddingProvider: identity.embeddingProvider,
      gradedAt: deps.nowIso(),
      commit: identity.commit,
      costUsd: 0,
      judgeCostUsd: deps.computeCallCostUsd(judgeModel, grade.judgeResult.usage.inputTokens, grade.judgeResult.usage.outputTokens),
      judgeReasoningTokens: grade.judgeResult.usage.reasoningTokens ?? 0,
      regradedFrom: regradeFrom,
      transcript
    };
    await writeJson(join(folder, transcript), {
      ...stored,
      referenceAnswerHash: record.referenceAnswerHash,
      workedSolution: caseEntry.expected.answer,
      assertions: grade.assertions,
      scores: record.scores,
      undetermined: record.undetermined,
      rationale: grade.judgeResult.undetermined ? undefined : grade.judgeResult.rationale,
      regradedFrom: regradeFrom
    });
    records.push(record);
    spent += record.judgeCostUsd ?? 0;
    log?.(`  ${stored.caseId} / ${stored.model}: regraded`);
  }

  const summary = buildSummary({ identity, records, stoppedReason: stopped, finishedAt: deps.nowIso() });
  await writeJson(join(folder, "summary.json"), summary);
  log?.(`\nWrote the regrade run folder ${folder}/ (the source run ${regradeFrom} was only read).`);
  return { identity, summary, folder };
}
