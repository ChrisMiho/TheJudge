// Answer-quality run (REQ-188, REQ-190; NFR-018).
//
// Asks the live provider the selected approved cases of the rules test corpus
// (scripts/lib/gold-cases.mjs, REQ-185) and scores each answer. By default it
// asks only the deployed model, `gpt-6-luna`, at the deployed excerpt cap, `10`,
// and only the cases that need it: `--changed` picks an approved, non-stale
// case whose prompt hash or reference-answer hash differs from its last graded
// record, whose last record carries no hash, or that was never graded. The
// four-model bake-off and other caps are explicit flags (`--bake-off`,
// `--model`, `--excerpt-cap`), as are the other selections (`--tag`, `--tier`,
// `--sample N`, `--all`).
//
// Every answer goes through the production preparePromptInput path
// (apps/backend/src/prompt/preparation.ts) with the same inputs a player's
// request gets -- the committed card-detail and card-rulings indexes, every
// card the case names attached (buildCaseRequest), and the question
// embedded by the configured EMBEDDING_PROVIDER (default `local`, what
// production runs) so System 3 ranks semantically, never silently lexically
// (assertQueryEmbedded / describeRetrieval refuse to record a run whose
// embedder fell back). Each answer is scored alone by the judge
// (apps/backend/src/eval/answer-quality/judge.ts) and, when two or more models
// answered, ranked blind. The judge's own token use is recorded beside the
// answer's. The result merges per case into the committed scores file
// (apps/backend/src/eval/answer-quality/results.json), each record carrying its
// prompt hash and the hash of the reference answer it was judged against; the
// selection, merge and per-tier headline logic is scripts/lib/answer-quality-run.mjs.
//
// Argument parsing, selection, the dry-run plan and cost estimate, the
// confirmation gate, and the pre-flight model-access check are always exercised
// (including under plain `node --test`); the live loop (`executeEvaluation`)
// takes every TypeScript module and the provider as injected dependencies, so
// the unit tests drive it with fakes. `runLiveEvaluation` loads the real ones
// lazily and only ever runs for real when this script is invoked via tsx with
// --confirm-live-calls.
//
// Costs money once confirmed, so it refuses to contact the provider without
// --confirm-live-calls, mirroring scripts/compare-combo-answer-quality.mjs
// (REQ-146). It is never part of any gate:
//   npm run eval:answer-quality                          # dry: prints the plan
//   npm run eval:answer-quality -- --confirm-live-calls  # live
//
// Run via tsx so the backend TypeScript modules resolve.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compareSnapshot, loadGoldCases, loadSnapshotSources } from "./lib/gold-cases.mjs";
import {
  computeHeadline,
  describeSelectionMode,
  formatHeadline,
  hashPrompt,
  mergeCaseLegScores,
  promptKey,
  referenceAnswerHash,
  selectCases
} from "./lib/answer-quality-run.mjs";
import {
  DEFAULT_ARM,
  ARM_A_REVISION,
  EXPERIMENT_RUNS_DIR,
  defaultGit,
  assertAllPriced,
  assertGameFidelity,
  executeExperiment,
  executeRegrade,
  findUnpricedModels,
  loadManifestFile,
  readUsage,
  validateManifestCases
} from "./lib/experiment-run.mjs";
import {
  ARM_IDS,
  ARM_REGISTRY,
  ARM_P_CORRECTION_RELATIVE_PATH,
  ARM_R_RECIPE_RELATIVE_PATH,
  DIAGNOSTIC_MANIFEST_RELATIVE_PATH,
  HELD_OUT_MANIFEST_RELATIVE_PATH,
  buildArmPrompt,
  describeArm,
  validateArmUse
} from "./lib/diagnostic-arms.mjs";
import { attachedRuleIdsOf, buildJudgeInputs } from "./lib/judge-inputs.mjs";
import { describeDecidingRules } from "./lib/rule-availability.mjs";
import { loadLocalOpenAiEnv } from "./lib/local-openai-env.mjs";
import {
  DEFAULT_EMBEDDING_PROVIDER,
  assertQueryEmbedded,
  buildCaseRequest,
  buildEmbedder,
  describeRetrieval,
  embedGoldCaseQueries,
  loadPromptResources,
  resolveEmbeddingProviderMode
} from "./lib/prompt-fidelity.mjs";

// The fidelity helpers are shared with scripts/eval-worked-solutions.mjs
// (scripts/lib/prompt-fidelity.mjs); re-exported so this command's tests
// exercise them through the command that spends money on them.
export { DEFAULT_EMBEDDING_PROVIDER, assertQueryEmbedded, buildCaseRequest, describeRetrieval };

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const CONFIRM_FLAG = "--confirm-live-calls";
export const DEFAULT_OUTPUT_DIR = "output/answer-quality";
export const RESULTS_RELATIVE_PATH = "apps/backend/src/eval/answer-quality/results.json";
/** The deployed model alone (`scripts/aws-deploy.sh` sets OPENAI_MODEL=gpt-6-luna): a routine run grades what players get (REQ-188, REQ-231). */
export const DEFAULT_LINEUP = ["gpt-6-luna"];
/** The four-model bake-off, one flag away (`--bake-off`). */
export const BAKE_OFF_LINEUP = ["gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5-nano"];
/** The deployed excerpt cap alone (REQ-190); `--excerpt-cap 10 --excerpt-cap 15` compares caps. */
export const DEFAULT_EXCERPT_CAPS = [10];
export const DEFAULT_SAMPLE_SEED = 1;
// Deliberately duplicated from apps/backend/src/eval/answer-quality/judge.ts
// (same value, same env var, independently tested there): this plain .mjs
// script's dry-run path must resolve the judge model synchronously under
// plain `node --test`, with no TypeScript loader. The real per-call judge
// functions use judge.ts's own copy.
export const DEFAULT_JUDGE_MODEL = "gpt-6.1-sol";

/** Published list rates, USD per million tokens (re-checked before a live run; REQ-188's note). */
export const MODEL_PRICING_USD_PER_MILLION_TOKENS = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-5-mini": { input: 0.25, output: 2.0 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-5": { input: 1.25, output: 10.0 },
  // A reasoning model: its reasoning tokens are billed as output (REQ-227). Named with `--model gpt-6-luna`; not in `--bake-off`.
  "gpt-6-luna": { input: 0.1, output: 0.5 },
  // Judge candidates (REQ-186: stronger than every contestant, never one of them). Standard tier, short context.
  "gpt-6-sol": { input: 2.0, output: 10.0 },
  "gpt-6.1-sol": { input: 2.0, output: 10.0 },
  "gpt-6-astra": { input: 10.0, output: 50.0 }
};

/**
 * The date each rate above was last checked against the provider's published
 * pricing (REQ-188, REQ-226). The owner re-checks before spending; the dry run
 * prints every rate with this date so a stale one is seen, not assumed.
 */
export const MODEL_RATE_CHECKED_ON = {
  "gpt-4.1-mini": "2026-10-08",
  "gpt-4.1": "2026-10-08",
  "gpt-5-mini": "2026-10-08",
  "gpt-5-nano": "2026-10-08",
  "gpt-5": "2026-10-08",
  "gpt-6-luna": "2026-10-08",
  "gpt-6-sol": "2026-10-08",
  "gpt-6.1-sol": "2026-10-08",
  "gpt-6-astra": "2026-10-08"
};

/** The dry run's rate lines: every rate in the table with the date it was checked. */
export function describeRates() {
  return [
    "  Rates (USD per million tokens, input / output; re-check before spending):",
    ...Object.entries(MODEL_PRICING_USD_PER_MILLION_TOKENS).map(
      ([model, price]) => `    ${model}: $${price.input} / $${price.output} -- check date: ${MODEL_RATE_CHECKED_ON[model] ?? "none recorded"}`
    )
  ];
}

// Output-token assumptions behind the printed dry-run estimate only (REQ-188's
// M3 estimate methodology). No numeric cost target is set anywhere in this
// file -- the live run records its own actual usage, judge included.
const ASSUMED_ANSWER_OUTPUT_TOKENS = 600;
const ASSUMED_LONE_JUDGE_INPUT_TOKENS = 1500;
const ASSUMED_LONE_JUDGE_OUTPUT_TOKENS = 800;
const ASSUMED_RANKING_JUDGE_INPUT_TOKENS = 3400;
const ASSUMED_RANKING_JUDGE_OUTPUT_TOKENS = 1000;
const CHARS_PER_TOKEN_ESTIMATE = 4;
const MAX_REASON_LINES = 30;

/**
 * Parses CLI args only -- never reads `OPENAI_MODEL` or any other env var for
 * the lineup (REQ-188): the answer-model lineup is a run option, not an
 * environment variable, so a stray environment value can never silently swap
 * a contestant. Exactly one selection mode may be named; `--changed` is the
 * default.
 */
export function parseArgs(argv) {
  const models = [];
  const excerptCaps = [];
  const selectionFlags = [];
  let outputDir;
  let confirmed = false;
  let bakeOff = false;
  let tag;
  let tier;
  let sampleCount;
  let seed = DEFAULT_SAMPLE_SEED;
  // Experiment-mode flags (REQ-226): none of them exists in a routine run.
  const experimentFlags = {};
  const armIds = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === CONFIRM_FLAG) {
      confirmed = true;
    } else if (arg === "--model") {
      const value = argv[++i];
      if (value) models.push(value);
    } else if (arg === "--bake-off") {
      bakeOff = true;
    } else if (arg === "--excerpt-cap") {
      const value = Number(argv[++i]);
      if (Number.isFinite(value)) excerptCaps.push(value);
    } else if (arg === "--output-dir") {
      outputDir = argv[++i];
    } else if (arg === "--changed" || arg === "--all") {
      selectionFlags.push(arg);
    } else if (arg === "--tag") {
      selectionFlags.push(arg);
      tag = argv[++i];
    } else if (arg === "--tier") {
      selectionFlags.push(arg);
      tier = Number(argv[++i]);
    } else if (arg === "--sample") {
      selectionFlags.push(arg);
      sampleCount = Number(argv[++i]);
    } else if (arg === "--seed") {
      seed = Number(argv[++i]);
    } else if (arg === "--run-id") {
      experimentFlags.runId = argv[++i];
    } else if (arg === "--manifest") {
      experimentFlags.manifest = argv[++i];
    } else if (arg === "--repeat") {
      experimentFlags.repeat = Number(argv[++i]);
    } else if (arg === "--expect-commit") {
      experimentFlags.expectCommit = argv[++i];
    } else if (arg === "--regrade-from") {
      experimentFlags.regradeFrom = argv[++i];
    } else if (arg === "--resume") {
      experimentFlags.resume = argv[++i];
    } else if (arg === "--retry-errors") {
      experimentFlags.retryErrors = true;
    } else if (arg === "--max-cost-usd") {
      experimentFlags.maxCostUsd = Number(argv[++i]);
    } else if (arg === "--arm") {
      armIds.push(argv[++i]);
      experimentFlags.arms = armIds;
    }
  }

  if (selectionFlags.length > 1) {
    throw new Error(`Name only one case selection, not ${selectionFlags.join(" and ")} (--changed is the default).`);
  }
  let mode = { kind: "changed" };
  if (selectionFlags[0] === "--all") mode = { kind: "all" };
  if (selectionFlags[0] === "--tag") {
    if (!tag) throw new Error("--tag needs a tag, such as --tag mechanic:702.19.");
    mode = { kind: "tag", tag };
  }
  if (selectionFlags[0] === "--tier") {
    if (![1, 2, 3].includes(tier)) throw new Error("--tier needs 1, 2 or 3.");
    mode = { kind: "tier", tier };
  }
  if (selectionFlags[0] === "--sample") {
    if (!Number.isInteger(sampleCount) || sampleCount < 1) throw new Error("--sample needs a whole number of cases, such as --sample 20.");
    if (!Number.isInteger(seed)) throw new Error("--seed needs a whole number.");
    mode = { kind: "sample", count: sampleCount, seed };
  }

  const experiment = parseExperimentFlags(experimentFlags, selectionFlags);

  const lineup = models.length > 0 ? models : bakeOff ? [...BAKE_OFF_LINEUP] : [...DEFAULT_LINEUP];
  return {
    confirmed,
    models: lineup,
    excerptCaps: excerptCaps.length > 0 ? excerptCaps : [...DEFAULT_EXCERPT_CAPS],
    outputDir: resolve(repoRoot, outputDir ?? DEFAULT_OUTPUT_DIR),
    mode,
    experiment
  };
}

/**
 * Experiment mode (REQ-226) is on exactly when `--run-id` is named; every other
 * experiment flag without it is a mistake, refused by name rather than
 * silently running a routine run that merges into the committed file.
 */
function parseExperimentFlags(flags, selectionFlags) {
  const named = Object.keys(flags);
  if (named.length === 0) return null;
  const flagName = (key) => `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  // `--resume <run-id>` names the run it continues, so it stands in for --run-id.
  if (flags.resume !== undefined) {
    if (!flags.resume) throw new Error("--resume needs the run id to continue.");
    if (flags.runId && flags.runId !== flags.resume) {
      throw new Error(`--resume ${flags.resume} and --run-id ${flags.runId} name different runs.`);
    }
    flags.runId = flags.resume;
    if (flags.regradeFrom) throw new Error("--resume continues an answer run; a regrade run is cheap to start again under a new --run-id.");
  }
  if (flags.retryErrors && flags.resume === undefined) {
    throw new Error("--retry-errors re-attempts the error records of a run you resume: add --resume <run-id>.");
  }
  for (const armId of flags.arms ?? []) {
    if (!ARM_IDS.includes(armId)) throw new Error(`--arm ${armId ?? ""} is not an arm: the arms are ${ARM_IDS.join(", ")}.`);
  }
  if (flags.arms && flags.regradeFrom) throw new Error("A regrade run keeps the arms of the run it regrades; drop --arm.");
  if (flags.maxCostUsd !== undefined && !(Number.isFinite(flags.maxCostUsd) && flags.maxCostUsd > 0)) {
    throw new Error("--max-cost-usd needs a positive dollar amount, such as --max-cost-usd 25.");
  }
  if (!flags.runId) {
    throw new Error(`${named.map(flagName).join(", ")} belong to an experiment run: name it with --run-id <id>.`);
  }
  if (selectionFlags.length > 0) {
    throw new Error(`An experiment run answers the cases its manifest lists; drop ${selectionFlags.join(" and ")}.`);
  }
  if (flags.regradeFrom !== undefined && !flags.regradeFrom) throw new Error("--regrade-from needs the run id to regrade.");
  if (flags.regradeFrom && flags.manifest) {
    throw new Error("A regrade run takes its cases from the run it regrades; drop --manifest.");
  }
  if (!flags.regradeFrom && !flags.manifest) {
    throw new Error("An experiment run needs --manifest <file> listing its cases (ids with the SHA-256 of each question and reference answer).");
  }
  if (flags.repeat !== undefined && (!Number.isInteger(flags.repeat) || flags.repeat < 1)) {
    throw new Error("--repeat needs a whole number of at least 1.");
  }
  if (flags.regradeFrom && flags.repeat !== undefined) {
    throw new Error("A regrade run grades each stored answer once; drop --repeat.");
  }
  return {
    runId: flags.runId,
    manifestPath: flags.manifest ? resolve(repoRoot, flags.manifest) : null,
    repeats: flags.repeat ?? 1,
    expectCommit: flags.expectCommit ?? null,
    regradeFrom: flags.regradeFrom ?? null,
    armIds: [...new Set(flags.arms ?? [DEFAULT_ARM])],
    resume: flags.resume !== undefined,
    retryErrors: flags.retryErrors === true,
    maxCostUsd: flags.maxCostUsd ?? null
  };
}

/** Judge model is its own explicit setting (REQ-186), defaulting to gpt-5 -- never OPENAI_MODEL, never an answer model. */
export function resolveJudgeModel(env = process.env) {
  const value = env.ANSWER_QUALITY_JUDGE_MODEL?.trim();
  return value && value.length > 0 ? value : DEFAULT_JUDGE_MODEL;
}

/**
 * Fails with an actionable message rather than a stack trace from deep
 * inside a provider factory, mirroring
 * scripts/compare-combo-answer-quality.mjs's identical guard (REQ-146). The
 * lineup is named by --model, not OPENAI_MODEL -- that variable is never
 * read here.
 */
export function assertLiveProviderConfigured(env) {
  const provider = env.ASK_AI_PROVIDER?.trim().toLowerCase();
  if (provider !== "openai") {
    throw new Error(
      `A live answer-quality run needs a live provider, but ASK_AI_PROVIDER is ${
        provider ? `"${provider}"` : "unset"
      }. Set ASK_AI_PROVIDER=openai (with OPENAI_API_KEY) and re-run. The answer-model lineup comes from --model / the default lineup, never from OPENAI_MODEL.`
    );
  }

  if (!env.OPENAI_API_KEY?.trim()) {
    throw new Error("ASK_AI_PROVIDER=openai also requires OPENAI_API_KEY. Set it and re-run.");
  }
}

/**
 * The environment a run sees: the process environment, filled in from the
 * local env files the way `npm run openai:verify-credentials` already does
 * (`scripts/lib/local-openai-env.mjs`; the process environment always wins),
 * so the owner runs the command with nothing exported by hand.
 *
 * `--confirm-live-calls` is the explicit consent to a live provider, so when
 * that flag is present, a key is available, and `ASK_AI_PROVIDER` is unset,
 * the run selects `openai`. It never overrides a value that is set: an
 * explicit `ASK_AI_PROVIDER=mock` still refuses, through the same guard, and
 * the mock-first default for everything that is not this command is untouched
 * (an unconfirmed run leaves `ASK_AI_PROVIDER` exactly as it found it).
 */
export const NO_LOCAL_ENV_VARIABLE = "ANSWER_QUALITY_NO_LOCAL_ENV";

/**
 * Setting `ANSWER_QUALITY_NO_LOCAL_ENV=1` skips the local env files entirely,
 * so a run sees only the process environment: no key can be filled in from a
 * file, and an offline dry run can promise it builds no client. Anything that
 * must stay free of a provider -- a verification, a build session -- sets it.
 */
export function resolveRunEnv({ processEnv, confirmed, loadLocalEnv = loadLocalOpenAiEnv }) {
  const skipLocalFiles = ["1", "true", "yes"].includes(String(processEnv?.[NO_LOCAL_ENV_VARIABLE] ?? "").trim().toLowerCase());
  const { env, sources } = skipLocalFiles ? { env: { ...processEnv }, sources: [] } : loadLocalEnv({ repoRoot, env: processEnv });
  const hasKey = Boolean(env.OPENAI_API_KEY?.trim());
  const providerUnset = !env.ASK_AI_PROVIDER || env.ASK_AI_PROVIDER.trim() === "";
  const resolved = { ...env };
  if (confirmed && hasKey && providerUnset) resolved.ASK_AI_PROVIDER = "openai";
  // The deployed app embeds every question with the bundled local model
  // (REQ-184), so that is this run's default too: the instrument measures
  // the retrieval players get, unless the owner explicitly asks otherwise.
  if (!resolved.EMBEDDING_PROVIDER || resolved.EMBEDDING_PROVIDER.trim() === "")
    resolved.EMBEDDING_PROVIDER = DEFAULT_EMBEDDING_PROVIDER;
  Object.defineProperty(resolved, "__localEnvSources", { value: sources, enumerable: false });
  return resolved;
}

/**
 * The committed scorecard must pass `npm run format:check` (prettier over
 * `**\/*.json`, repo config), which collapses short arrays onto one line
 * where `JSON.stringify` expands them. Formatting here, with the repo's own
 * resolved config, means a recorded run never leaves the gate red.
 */
export async function formatCommittedJson(text, filePath) {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  return prettier.format(text, { ...config, filepath: filePath });
}

/**
 * Verifies access to every given model id via a models-list request --
 * never a completion. Returns the missing ids rather than throwing, so a
 * caller composes its own actionable message for the dry-run vs. live paths.
 */
export async function checkModelAccess({ client, modelIds }) {
  const page = await client.models.list();
  const available = new Set((page?.data ?? []).map((model) => model.id));
  const missing = modelIds.filter((id) => !available.has(id));
  return { missing, available: missing.length === 0 };
}

/**
 * What the evaluation's answer client is built with: the key and nothing else.
 * No timeout and no retry count, so the SDK defaults apply (REQ-188); runtime
 * suitability against production's 15 s per attempt is read from the recorded
 * latency, not forced by the client. Exported so a test can pin it.
 */
export function openAiClientOptions(env) {
  return { apiKey: env.OPENAI_API_KEY };
}

async function defaultBuildClient(env) {
  const { default: OpenAI } = await import("openai");
  return new OpenAI(openAiClientOptions(env));
}

/**
 * Measures, for every case at every excerpt cap, the assembled prompt the run
 * would send: its SHA-256 (the prompt hash `--changed` compares) and its
 * character count (the dry-run cost estimate). It goes through the production
 * `preparePromptInput` path with the question embedded by the same in-process
 * local embedder the live run uses, so the hash matches the live run's -- no
 * network call. A real hosted embedder is never contacted from here: any
 * provider other than `local` is measured lexically. Behind this exported hook
 * so `node --test` can inject fixed values and exercise every other code path
 * without a TypeScript loader.
 *
 * Returns a Map from `promptKey(caseId, cap)` to `{ promptHash, promptChars }`.
 */
export async function measurePrompts({ cases, excerptCaps, env }) {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const resources = await loadPromptResources();
  const mode = resolveEmbeddingProviderMode(env);
  const embedder = mode === "local" ? await buildEmbedder(env) : { mode: "mock", embed: async () => null };
  const vectors = await embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });

  const measured = new Map();
  for (const cap of excerptCaps) {
    for (const caseEntry of cases) {
      const prepared = preparePromptInput(buildCaseRequest(caseEntry), {
        ...resources,
        supplementalRuleCap: cap,
        queryEmbedding: vectors.get(caseEntry.id) ?? null
      });
      measured.set(promptKey(caseEntry.id, cap), {
        promptHash: hashPrompt(prepared.promptText),
        promptChars: prepared.promptText.length
      });
    }
  }
  return measured;
}

/** Mean prompt characters per excerpt cap over the selected cases, for the cost estimate. */
export function averagePromptChars(selectedCases, excerptCaps, measured) {
  const result = {};
  for (const cap of excerptCaps) {
    const values = selectedCases
      .map((caseEntry) => measured.get(promptKey(caseEntry.id, cap))?.promptChars)
      .filter((value) => typeof value === "number");
    result[cap] = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }
  return result;
}

/** A character-count cost estimate (REQ-188's M3 methodology). Never a target -- the live run records its own actual usage. */
export function estimateCost({ models, judgeModel, excerptCaps, goldCaseCount, avgPromptCharsByCap }) {
  const legCount = models.length * excerptCaps.length;
  const answerCalls = goldCaseCount * legCount;
  const loneJudgeCalls = answerCalls;
  // A single answer has nothing to be ranked against: a one-model run makes no ranking call (REQ-186).
  const rankingCalls = models.length > 1 ? goldCaseCount * excerptCaps.length : 0;

  // A model with no rate is reported as unpriced, never counted as $0 (REQ-227).
  const unpricedModels = findUnpricedModels([...models, judgeModel], MODEL_PRICING_USD_PER_MILLION_TOKENS);

  let answersCostUsd = 0;
  for (const model of models) {
    const price = MODEL_PRICING_USD_PER_MILLION_TOKENS[model];
    if (!price) continue; // an unrecognized model id's cost is omitted, never guessed
    for (const cap of excerptCaps) {
      const avgChars = avgPromptCharsByCap[cap] ?? 0;
      const inputTokens = avgChars / CHARS_PER_TOKEN_ESTIMATE;
      const perCallCost = (inputTokens * price.input + ASSUMED_ANSWER_OUTPUT_TOKENS * price.output) / 1_000_000;
      answersCostUsd += perCallCost * goldCaseCount;
    }
  }

  const judgePrice = MODEL_PRICING_USD_PER_MILLION_TOKENS[judgeModel];
  let judgeCostUsd = 0;
  if (judgePrice) {
    judgeCostUsd +=
      (loneJudgeCalls * (ASSUMED_LONE_JUDGE_INPUT_TOKENS * judgePrice.input + ASSUMED_LONE_JUDGE_OUTPUT_TOKENS * judgePrice.output)) /
      1_000_000;
    judgeCostUsd +=
      (rankingCalls *
        (ASSUMED_RANKING_JUDGE_INPUT_TOKENS * judgePrice.input + ASSUMED_RANKING_JUDGE_OUTPUT_TOKENS * judgePrice.output)) /
      1_000_000;
  }

  return {
    judgeModel,
    answerCalls,
    loneJudgeCalls,
    rankingCalls,
    totalCalls: answerCalls + loneJudgeCalls + rankingCalls,
    totalCostUsd: answersCostUsd + judgeCostUsd,
    unpricedModels
  };
}

/**
 * One call's estimated dollar cost by the dry run's method (REQ-227): `answer`
 * from the prompt's character count, `judge` and `ranking` from the assumed
 * judge token counts. Null for a model with no rate -- the cap could not be
 * enforced for it, so a capped live run refuses to start instead.
 */
export function estimateCallCostUsd({ kind, model, promptChars = 0 }) {
  const price = MODEL_PRICING_USD_PER_MILLION_TOKENS[model];
  if (!price) return null;
  const tokens =
    kind === "answer"
      ? { input: promptChars / CHARS_PER_TOKEN_ESTIMATE, output: ASSUMED_ANSWER_OUTPUT_TOKENS }
      : kind === "judge"
        ? { input: ASSUMED_LONE_JUDGE_INPUT_TOKENS, output: ASSUMED_LONE_JUDGE_OUTPUT_TOKENS }
        : { input: ASSUMED_RANKING_JUDGE_INPUT_TOKENS, output: ASSUMED_RANKING_JUDGE_OUTPUT_TOKENS };
  return (tokens.input * price.input + tokens.output * price.output) / 1_000_000;
}

/** The plan line for models with no rate, or no line when every model is priced. */
export function describeUnpriced(estimate) {
  if (!estimate.unpricedModels?.length) return [];
  return [
    `  Unpriced (no rate in the table): ${estimate.unpricedModels.join(", ")} -- their cost is not in the estimate, and a live capped run refuses to start until a rate is added.`
  ];
}

/**
 * The actual dollar cost of one call, from its real token counts. `outputTokens`
 * is the provider's output count, which already includes reasoning tokens, so
 * they are costed as output (REQ-227). A model with no rate is unpriced: the
 * cost is `null`, never $0.
 */
export function computeCallCostUsd(model, inputTokens, outputTokens) {
  const price = MODEL_PRICING_USD_PER_MILLION_TOKENS[model];
  if (!price) return null;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

/** The rate table an experiment run records in its identity record (REQ-226): every known rate, USD per million tokens. */
export function buildRateTable() {
  return Object.fromEntries(
    Object.entries(MODEL_PRICING_USD_PER_MILLION_TOKENS).map(([model, price]) => [
      model,
      { inputUsdPerMillion: price.input, outputUsdPerMillion: price.output, checkedOn: MODEL_RATE_CHECKED_ON[model] ?? null }
    ])
  );
}

function sumOf(records, field) {
  return records.reduce((sum, record) => sum + (record[field] ?? 0), 0);
}

/**
 * Pure aggregation: merges a run's fresh per-call records into the previous
 * committed records (REQ-189: per case, never erasing a case the run did not
 * grade) and turns the result into the committed `AnswerQualityResults` shape
 * -- run metadata for the latest run, per-leg counts and the REQ-187 headline
 * over every merged record. Takes plain data (never a TS type, never touches a
 * file or the network), so it is fully unit-testable under plain `node`.
 *
 * `costUsd` and `judgeCostUsd` on a fresh record are this function's internal
 * aggregation fields (answer-call and judge-call dollars), not part of the
 * committed per-case schema -- stripped here; the totals carry them.
 */
export function buildRunArtifact({
  models,
  excerptCaps,
  goldCases,
  allCases,
  previousResults,
  isStale = () => false,
  selectionMode = "changed",
  judgeModel,
  rubricRevision,
  askAiProvider,
  embeddingProvider,
  gitCommit,
  generatedAt,
  caseLegScores,
  rankingJudgeUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  comboCatalogLoaded,
  unpricedModels = []
}) {
  const corpus = allCases ?? goldCases;
  const merged = mergeCaseLegScores({
    previous: previousResults?.caseLegScores ?? [],
    fresh: caseLegScores.map((record) => {
      const stripped = { ...record };
      delete stripped.costUsd;
      delete stripped.judgeCostUsd;
      return stripped;
    }),
    cases: corpus
  });

  const legKeys = new Map();
  for (const record of merged) legKeys.set(`${record.model}|${record.excerptCap}`, { model: record.model, excerptCap: record.excerptCap });
  for (const model of models) for (const cap of excerptCaps) legKeys.set(`${model}|${cap}`, { model, excerptCap: cap });
  const legs = [...legKeys.values()]
    .sort((a, b) => a.model.localeCompare(b.model) || a.excerptCap - b.excerptCap)
    .map(({ model, excerptCap }) => {
      const legRecords = merged.filter((record) => record.model === model && record.excerptCap === excerptCap);
      return {
        model,
        excerptCap,
        fullyCorrectCount: legRecords.filter((record) => !record.undetermined && record.scores?.correctness === 2).length,
        caseCount: legRecords.length,
        headline: computeHeadline({ cases: corpus, records: merged, isStale, model, excerptCap })
      };
    });

  const answerCostUsd = sumOf(caseLegScores, "costUsd");
  const judgeLoneCostUsd = sumOf(caseLegScores, "judgeCostUsd");
  const judgeCostUsd = judgeLoneCostUsd + (rankingJudgeUsage.costUsd ?? 0);

  return {
    runMetadata: {
      goldSetCaseIds: goldCases.map((caseEntry) => caseEntry.id),
      goldSetTier1Count: goldCases.filter((caseEntry) => caseEntry.tier === 1).length,
      goldSetTier2Count: goldCases.filter((caseEntry) => caseEntry.tier === 2).length,
      goldSetTier3Count: goldCases.filter((caseEntry) => caseEntry.tier === 3).length,
      selectionMode,
      answerModelLineup: models,
      judgeModel,
      judgeMatchesAnswerModel: models.includes(judgeModel),
      rubricRevision,
      askAiProvider,
      embeddingProvider,
      gitCommit,
      generatedAt,
      totalInputTokens: sumOf(caseLegScores, "inputTokens"),
      totalOutputTokens: sumOf(caseLegScores, "outputTokens"),
      totalCostUsd: answerCostUsd + judgeCostUsd,
      judgeInputTokens: sumOf(caseLegScores, "judgeInputTokens") + (rankingJudgeUsage.inputTokens ?? 0),
      judgeOutputTokens: sumOf(caseLegScores, "judgeOutputTokens") + (rankingJudgeUsage.outputTokens ?? 0),
      answerCostUsd,
      judgeCostUsd,
      comboCatalogLoaded,
      answerClientTimeoutMs: "sdk-default",
      answerClientMaxRetries: "sdk-default",
      totalReasoningTokens: sumOf(caseLegScores, "reasoningTokens"),
      judgeReasoningTokens: sumOf(caseLegScores, "judgeReasoningTokens"),
      unpricedModels
    },
    legs,
    caseLegScores: merged
  };
}

async function resolveGitCommit(repoRootPath) {
  try {
    const { execFileSync } = await import("node:child_process");
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repoRootPath }).toString().trim();
  } catch {
    return "unknown";
  }
}

/**
 * The live evaluation loop (REQ-188, REQ-190, REQ-186, REQ-189): for every
 * excerpt cap, for every selected case, for every model in the lineup --
 * answer through the production `preparePromptInput` path, run the
 * deterministic assertions (including the cited-rule-id check against the
 * committed rule index) and the lone judge pass, and write that leg's
 * transcript; when two or more models answered, run the blind side-by-side
 * ranking pass and write its transcript (a one-model run skips it); finally
 * merge the fresh records into the committed scorecard per case and write it.
 *
 * Everything the loop touches that is TypeScript or live -- the prompt
 * builder, the assertions, the judge, the artifact writers, the embedder, the
 * clock -- arrives in `deps`, so a test drives the whole loop with fakes and
 * never needs a loader or a provider. `runLiveEvaluation` below builds the real
 * `deps`; only an owner-confirmed `--confirm-live-calls` run ever uses them.
 */
export async function executeEvaluation(
  { client, judgeModel, models, excerptCaps, selectedCases, allCases, previousResults, isStale, mode, outputDir, resultsPath, env, log },
  deps
) {
  const knownRuleIds = new Set(deps.ruleIds);
  const queryEmbeddingByCaseId = await deps.embedQueries(selectedCases);
  log?.(`Embedded ${selectedCases.length} case queries with EMBEDDING_PROVIDER=${deps.embeddingProvider}.`);

  const caseLegScores = [];
  const rankingJudgeUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  for (const cap of excerptCaps) {
    for (const caseEntry of selectedCases) {
      const perModelRecord = new Map();
      const answersForRanking = [];
      const request = buildCaseRequest(caseEntry);
      const referenceHash = referenceAnswerHash(caseEntry);
      let rankingInputs = {};

      for (const model of models) {
        const prepared = deps.preparePromptInput(request, {
          ...deps.resources,
          supplementalRuleCap: cap,
          queryEmbedding: queryEmbeddingByCaseId.get(caseEntry.id) ?? null,
          collectEnrichmentDebug: true
        });
        const retrieval = describeRetrieval(prepared.enrichmentDebug?.supplemental, caseEntry.expected.decidingRuleIds, {
          requireSemantic: deps.requireSemantic,
          caseId: caseEntry.id
        });

        const startedAt = deps.now();
        // Model and input only: no timeout, retry or reasoning-effort override (REQ-188).
        const response = await client.responses.create({ model, input: prepared.promptText });
        const latencyMs = deps.now() - startedAt;
        const answerText = response.output_text?.trim() ?? "";

        // Real usage from the API when the client reports it; a character
        // estimate (consistent with the dry-run plan's methodology) when it
        // does not, so an injected fake test client never needs to fabricate it.
        const usage = readUsage(response);
        const inputTokens = usage.inputTokens ?? Math.round(prepared.promptText.length / CHARS_PER_TOKEN_ESTIMATE);
        const outputTokens = usage.outputTokens ?? Math.round(answerText.length / CHARS_PER_TOKEN_ESTIMATE);

        const assertions = deps.computeDeterministicAssertions(answerText, caseEntry.expected.decidingRuleIds, knownRuleIds);
        // What the answer prompt actually carried, and the deciding rules apart (REQ-186).
        const judgeInputs = buildJudgeInputs({
          caseEntry,
          promptText: prepared.promptText,
          attachedRuleIds: attachedRuleIdsOf(prepared),
          ruleIndex: deps.resources?.gameRulesRuleIndex
        });
        rankingInputs = judgeInputs;
        const judgeResult = await deps.judgeAnswerAlone({
          client,
          judgeModel,
          question: caseEntry.question,
          ...judgeInputs,
          answerText,
          workedSolution: caseEntry.expected.answer
        });
        const availability = describeDecidingRules({
          decidingRuleIds: caseEntry.expected.decidingRuleIds,
          prepared,
          request,
          cardRulingsIndex: deps.resources?.cardRulingsIndex
        });
        const answerCostUsd = computeCallCostUsd(model, inputTokens, outputTokens);
        const judgeCallCostUsd = computeCallCostUsd(judgeModel, judgeResult.usage.inputTokens, judgeResult.usage.outputTokens);

        const record = {
          caseId: caseEntry.id,
          model,
          excerptCap: cap,
          tier: caseEntry.tier,
          undetermined: judgeResult.undetermined,
          scores: judgeResult.undetermined ? undefined : judgeResult.scores,
          namesGoldRuleId: assertions.namesGoldRuleId,
          unknownRuleIds: assertions.unknownRuleIds ?? [],
          goldRuleInPrompt: retrieval.goldRuleInPrompt,
          allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt,
          promptChars: prepared.promptText.length,
          promptHash: hashPrompt(prepared.promptText),
          referenceAnswerHash: referenceHash,
          inputTokens,
          outputTokens,
          judgeInputTokens: judgeResult.usage.inputTokens,
          judgeOutputTokens: judgeResult.usage.outputTokens,
          reasoningTokens: usage.reasoningTokens,
          judgeReasoningTokens: judgeResult.usage.reasoningTokens ?? 0,
          reportedEffort: usage.reportedEffort,
          unpriced: answerCostUsd === null || judgeCallCostUsd === null,
          latencyMs,
          blindRank: null,
          judgeModel,
          rubricRevision: deps.rubricRevision,
          embeddingProvider: deps.embeddingProvider,
          gradedAt: deps.nowIso(),
          commit: deps.gitCommit,
          costUsd: answerCostUsd ?? 0,
          judgeCostUsd: judgeCallCostUsd ?? 0
        };
        perModelRecord.set(model, record);
        answersForRanking.push({ modelId: model, answerText });

        await deps.writeTranscript(
          {
            caseId: caseEntry.id,
            model,
            excerptCap: cap,
            question: caseEntry.question,
            cards: request.cards ?? [],
            retrieval: { ...retrieval, allDecidingRulesInPrompt: availability.allDecidingRulesInPrompt },
            promptText: prepared.promptText,
            answerText,
            workedSolution: caseEntry.expected.answer,
            assertions,
            scores: judgeResult.undetermined ? undefined : judgeResult.scores,
            undetermined: judgeResult.undetermined,
            rationale: judgeResult.undetermined ? undefined : judgeResult.rationale
          },
          outputDir
        );

        log?.(`  ${caseEntry.id} / ${model} / cap ${cap}: answered (${latencyMs}ms)`);
        if (record.unknownRuleIds.length > 0) {
          // Worded "not in the committed rule index", never "made up": the index lags the newest Comprehensive Rules (REQ-186).
          log?.(`    cites rule id(s) ${record.unknownRuleIds.join(", ")} -- not in the committed rule index`);
        }
      }

      // Ranking one answer against itself means nothing: a one-model run makes no ranking call (REQ-186).
      if (models.length > 1) {
        const rankingResult = await deps.judgeBlindRanking({
          client,
          judgeModel,
          question: caseEntry.question,
          // The same attached-excerpt, deciding-rule and game-state inputs the lone judge got (REQ-186): the models share one prompt.
          ...rankingInputs,
          workedSolution: caseEntry.expected.answer,
          answers: answersForRanking
        });
        rankingJudgeUsage.inputTokens += rankingResult.usage.inputTokens;
        rankingJudgeUsage.outputTokens += rankingResult.usage.outputTokens;
        rankingJudgeUsage.costUsd += computeCallCostUsd(judgeModel, rankingResult.usage.inputTokens, rankingResult.usage.outputTokens) ?? 0;
        if (!rankingResult.undetermined) {
          for (const [modelId, rank] of Object.entries(rankingResult.ranks)) {
            const record = perModelRecord.get(modelId);
            if (record) record.blindRank = rank;
          }
        }
        await deps.writeRankingTranscript(
          {
            caseId: caseEntry.id,
            excerptCap: cap,
            ranks: rankingResult.undetermined ? {} : rankingResult.ranks,
            undetermined: rankingResult.undetermined,
            reason: rankingResult.undetermined ? rankingResult.reason : undefined,
            rationale: rankingResult.undetermined ? undefined : rankingResult.rationale
          },
          outputDir
        );
      }

      for (const record of perModelRecord.values()) caseLegScores.push(record);
    }
  }

  const results = buildRunArtifact({
    models,
    excerptCaps,
    goldCases: selectedCases,
    allCases,
    previousResults,
    isStale,
    selectionMode: describeSelectionMode(mode),
    judgeModel,
    rubricRevision: deps.rubricRevision,
    askAiProvider: env.ASK_AI_PROVIDER ?? "",
    embeddingProvider: deps.embeddingProvider,
    gitCommit: deps.gitCommit,
    generatedAt: deps.nowIso(),
    caseLegScores,
    rankingJudgeUsage,
    comboCatalogLoaded: deps.comboCatalogLoaded ?? Boolean(deps.resources?.comboCatalog),
    unpricedModels: findUnpricedModels([...models, judgeModel], MODEL_PRICING_USD_PER_MILLION_TOKENS)
  });

  await deps.writeResults(results, resultsPath);
  log?.(`\nWrote ${resultsPath} and transcripts to ${outputDir}/`);
  for (const leg of results.legs) {
    if (models.includes(leg.model) && excerptCaps.includes(leg.excerptCap)) {
      log?.(formatHeadline({ model: leg.model, excerptCap: leg.excerptCap, headline: leg.headline }));
    }
  }
  return results;
}

/**
 * Loads the real TypeScript modules, the production prompt resources and the
 * configured embedder, then runs `executeEvaluation`. Every TypeScript import
 * is lazy and scoped to this function body, so importing this file, or
 * unit-testing its sibling exports, never touches a TypeScript loader. Only an
 * owner-confirmed `--confirm-live-calls` run calls it.
 */
export async function runLiveEvaluation(params) {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { computeDeterministicAssertions } = await import("../apps/backend/src/eval/answer-quality/assertions.ts");
  const { judgeAnswerAlone, judgeBlindRanking } = await import("../apps/backend/src/eval/answer-quality/judge.ts");
  const { RUBRIC_REVISION } = await import("../apps/backend/src/eval/answer-quality/rubric.ts");
  const { writeResultsFile, writeTranscript, writeRankingTranscript } = await import(
    "../apps/backend/src/eval/answer-quality/artifact.ts"
  );
  const resources = await loadPromptResources();
  const embedder = await buildEmbedder(params.env);

  return executeEvaluation(params, {
    preparePromptInput,
    computeDeterministicAssertions,
    judgeAnswerAlone,
    judgeBlindRanking,
    writeTranscript,
    writeRankingTranscript,
    writeResults: async (results, resultsPath) => {
      await writeResultsFile(results, resultsPath);
      const { writeFile } = await import("node:fs/promises");
      await writeFile(resultsPath, await formatCommittedJson(await readFile(resultsPath, "utf8"), resultsPath), "utf8");
    },
    resources,
    ruleIds: resources.gameRulesRuleIndex.map((entry) => entry.ruleId),
    // One embedding per case, exactly as the route handler embeds the retrieval
    // query text before `preparePromptInput`; shared by every cap and model, so
    // every leg of a case ranks from the identical vector.
    embedQueries: (cases) =>
      embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex }),
    embeddingProvider: embedder.mode,
    requireSemantic: embedder.mode !== "mock",
    rubricRevision: RUBRIC_REVISION,
    gitCommit: await resolveGitCommit(repoRoot),
    now: () => Date.now(),
    nowIso: () => new Date().toISOString()
  });
}

/**
 * The committed case sets the arms are fenced by (REQ-230): the diagnostic and held-out manifests'
 * ids, plus arm P's owner-approved correction and arm R's owner-approved recipe when their files
 * exist. Read from this checkout.
 */
export async function defaultLoadArmSets() {
  const readJson = async (relativePath) => JSON.parse(await readFile(resolve(repoRoot, relativePath), "utf8"));
  const diagnostic = await readJson(DIAGNOSTIC_MANIFEST_RELATIVE_PATH);
  const heldOut = await readJson(HELD_OUT_MANIFEST_RELATIVE_PATH);
  const correction = await readJson(ARM_P_CORRECTION_RELATIVE_PATH).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  const recipe = await readJson(ARM_R_RECIPE_RELATIVE_PATH).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  return {
    diagnosticIds: new Set(diagnostic.cases.map((entry) => entry.id)),
    heldOutIds: new Set(heldOut.cases.map((entry) => entry.id)),
    correction,
    recipe
  };
}

/**
 * The run-start fidelity check for In-Depth cases (REQ-230): the prompt from the raw case request must equal
 * the prompt from the request `askAiRequestSchema` parses, or the run refuses, naming the case. Loads the
 * backend only when a selected case has a `gameState`.
 */
export async function defaultCheckGameFidelity({ cases, excerptCaps }) {
  if (!cases.some((caseEntry) => caseEntry.gameState)) return;
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { askAiRequestSchema } = await import("../apps/backend/src/validation/askAiRequest.ts");
  const resources = await loadPromptResources();
  assertGameFidelity({
    cases,
    buildRequest: buildCaseRequest,
    parseRequest: (raw) => {
      const result = askAiRequestSchema.safeParse(raw);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    prepare: preparePromptInput,
    resources,
    excerptCaps
  });
}

/** `DEFAULT_OPENAI_TIMEOUT_MS` from the config source of the checkout this runs from; null when it cannot be read. */
export async function readProductionTimeoutMs(configPath = resolve(repoRoot, "apps/backend/src/config/index.ts")) {
  try {
    const match = /const DEFAULT_OPENAI_TIMEOUT_MS = (\d+)/.exec(await readFile(configPath, "utf8"));
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * The real dependencies of an experiment run (REQ-226): the same TypeScript
 * modules and production prompt resources the routine loop loads, plus the
 * checkout's git state and the SHA-256 of every data file and case file read.
 * Lazy, like `runLiveEvaluation`; only an owner-confirmed run calls it.
 */
export async function runLiveExperiment(params) {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { computeDeterministicAssertions } = await import("../apps/backend/src/eval/answer-quality/assertions.ts");
  const { judgeAnswerAlone, judgeBlindRanking } = await import("../apps/backend/src/eval/answer-quality/judge.ts");
  const { RUBRIC_REVISION } = await import("../apps/backend/src/eval/answer-quality/rubric.ts");
  const resources = await loadPromptResources();
  const embedder = await buildEmbedder(params.env);
  const { createHash } = await import("node:crypto");
  const { readdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { CASES_DIR, DATA_DIR } = await import("./lib/gold-cases.mjs");

  const hashFile = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
  const deps = {
    preparePromptInput,
    computeDeterministicAssertions,
    judgeAnswerAlone,
    judgeBlindRanking,
    buildCaseRequest,
    describeRetrieval,
    computeCallCostUsd,
    estimateCallCostUsd,
    // An arm is built from the prompt this checkout prepared and its committed rule index. The case's
    // reference answer is not an input: only the deciding rule ids are (REQ-230).
    buildArmPrompt: ({ arm, prepared, caseEntry }) =>
      buildArmPrompt({
        arm: arm.id,
        promptText: prepared.promptText,
        ruleIndex: resources.gameRulesRuleIndex,
        decidingRuleIds: caseEntry.expected.decidingRuleIds,
        correction: params.correction,
        recipe: params.recipe
      }),
    resources,
    ruleIds: resources.gameRulesRuleIndex.map((entry) => entry.ruleId),
    embedQueries: (cases) => embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex }),
    embeddingProvider: embedder.mode,
    embeddingModel: embedder.mode === "local" ? "Xenova/all-MiniLM-L6-v2" : "",
    requireSemantic: embedder.mode !== "mock",
    comboCatalogLoaded: Boolean(resources.comboCatalog),
    rubricRevision: RUBRIC_REVISION,
    rateTable: buildRateTable(),
    clientOptions: { timeoutMs: "sdk-default", maxRetries: "sdk-default" },
    // Production's answer timeout at this checkout's revision, read from its own config source (REQ-228 holds latency against it).
    productionTimeoutMs: await readProductionTimeoutMs(),
    git: await defaultGit(repoRoot),
    fileHashes: async (cases) => {
      const dataFiles = {};
      for (const entry of (await readdir(DATA_DIR, { withFileTypes: true })).filter((e) => e.isFile()).sort((a, b) => a.name.localeCompare(b.name))) {
        dataFiles[entry.name] = await hashFile(join(DATA_DIR, entry.name));
      }
      const caseFiles = {};
      for (const caseEntry of cases) caseFiles[caseEntry.id] = await hashFile(join(CASES_DIR, `${caseEntry.id}.case.json`));
      return { dataFiles, caseFiles, rulesIndexSha256: dataFiles["gameRulesRuleIndex.json"] ?? "" };
    },
    now: () => Date.now(),
    nowIso: () => new Date().toISOString()
  };
  return params.regradeFrom ? executeRegrade(params, deps) : executeExperiment(params, deps);
}

export function describeExperimentPlan({ experiment, models, excerptCaps, arms, estimate, caseCount, folder, judgeModel }) {
  return [
    "Experiment run plan (no provider request has been made):",
    "",
    `  Run id: ${experiment.runId}  ->  ${folder}/ (the committed ${RESULTS_RELATIVE_PATH} is never read or written)`,
    experiment.regradeFrom
      ? `  Regrade: re-grades the stored answers of run ${experiment.regradeFrom}; makes no answer call.`
      : `  Cases: ${caseCount} from the manifest, each answered ${experiment.repeats} time${experiment.repeats === 1 ? "" : "s"}.`,
    `  Answer-model lineup: ${models.join(", ")}`,
    `  Judge model: ${judgeModel}`,
    `  Excerpt caps: ${excerptCaps.join(", ")}`,
    `  Arms: ${arms.map((arm) => `${arm.id} (${arm.revision})`).join(", ")}`,
    `  Calls: ${estimate.answerCalls} answer calls, ${estimate.loneJudgeCalls} lone judge calls,`,
    `  ${estimate.rankingCalls} blind-ranking calls (${estimate.totalCalls} total, sequential).`,
    `  Estimated cost: $${estimate.totalCostUsd.toFixed(2)} (character-count estimate; the live run records its own actual cost).`,
    ...describeUnpriced(estimate),
    ...describeRates(),
    experiment.maxCostUsd !== null && experiment.maxCostUsd !== undefined
      ? `  Spending cap: $${experiment.maxCostUsd} (the run stops cleanly before passing it).`
      : `  Spending cap: none given -- a live experiment run needs --max-cost-usd.`,
    "",
    `Re-run with ${CONFIRM_FLAG} to make the live provider calls.`
  ].join("\n");
}

/**
 * Experiment mode (REQ-226): validates the manifest against this checkout's
 * corpus, prints the plan when unconfirmed, and otherwise hands the run to
 * `runExperiment`. It never reads or writes the committed scores file.
 */
async function runExperimentCommand({
  parsed,
  env,
  judgeModel,
  allCases,
  isStale,
  measure,
  buildClient,
  injectedClient,
  runExperiment,
  loadArmSets = defaultLoadArmSets,
  armRegistry = ARM_REGISTRY,
  checkFidelity = defaultCheckGameFidelity,
  log
}) {
  const { experiment } = parsed;
  const runsRoot = resolve(repoRoot, EXPERIMENT_RUNS_DIR);
  const arms = experiment.regradeFrom
    ? [{ id: DEFAULT_ARM, revision: ARM_A_REVISION }]
    : experiment.armIds.map((armId) => {
        const { id, revision } = describeArm(armId, armRegistry);
        return { id, revision };
      });

  let manifest = null;
  let manifestSha256 = null;
  let cases;
  if (experiment.regradeFrom) {
    cases = allCases.filter((caseEntry) => caseEntry.review.status === "approved" && !isStale(caseEntry));
  } else {
    ({ manifest, manifestSha256 } = await loadManifestFile(experiment.manifestPath));
    cases = validateManifestCases({ manifest, allCases, isStale });
  }

  // Test-only arms run only where REQ-230 lets them: C and D on the diagnostic manifest, B, P and R also on a
  // held-out case once frozen, and a live run only with frozen arms.
  const armSets = await loadArmSets();
  if (!experiment.regradeFrom) {
    validateArmUse({
      armIds: experiment.armIds,
      caseIds: cases.map((caseEntry) => caseEntry.id),
      diagnosticIds: armSets.diagnosticIds,
      heldOutIds: armSets.heldOutIds,
      live: parsed.confirmed,
      registry: armRegistry,
      correction: armSets.correction,
      recipe: armSets.recipe
    });
    // Before any provider call, and in a dry run too: an In-Depth case must be asked exactly as the live app would ask it.
    await checkFidelity({ cases, excerptCaps: parsed.excerptCaps });
  }

  const folder = resolve(runsRoot, experiment.runId);
  if (!parsed.confirmed) {
    const measured = cases.length > 0 && !experiment.regradeFrom ? await measure({ cases, excerptCaps: parsed.excerptCaps, env }) : new Map();
    const estimate = estimateCost({
      models: parsed.models,
      judgeModel,
      excerptCaps: parsed.excerptCaps,
      goldCaseCount: experiment.regradeFrom ? 0 : cases.length * experiment.repeats * arms.length,
      avgPromptCharsByCap: averagePromptChars(cases, parsed.excerptCaps, measured)
    });
    log(
      describeExperimentPlan({
        experiment,
        models: parsed.models,
        excerptCaps: parsed.excerptCaps,
        arms,
        estimate,
        caseCount: cases.length,
        folder,
        judgeModel
      })
    );
    return { ran: false, experiment: true, caseIds: cases.map((c) => c.id), accessChecked: false, estimate };
  }

  // A live experiment run spends only under a cap it can enforce (REQ-227): refuse before any client exists.
  // A resume continues against the cap its run recorded unless a new one is given.
  if (experiment.maxCostUsd === null && !experiment.resume) {
    throw new Error(`${CONFIRM_FLAG} in an experiment run also needs --max-cost-usd <dollars>: the run stops cleanly before it would pass that cap.`);
  }
  assertAllPriced({
    models: experiment.regradeFrom ? [] : parsed.models,
    judgeModel,
    rateTable: MODEL_PRICING_USD_PER_MILLION_TOKENS
  });
  assertLiveProviderConfigured(env);
  const client = injectedClient ?? (await buildClient(env));
  const modelIds = experiment.regradeFrom ? [judgeModel] : [...parsed.models, judgeModel];
  const { missing } = await checkModelAccess({ client, modelIds });
  if (missing.length > 0) {
    throw new Error(`The configured OpenAI credentials do not have access to: ${missing.join(", ")}. Fix access and re-run.`);
  }
  log(`Model access verified. Running experiment ${experiment.runId} over ${cases.length} cases...`);
  const result = await runExperiment({
    runId: experiment.runId,
    runsRoot,
    client,
    judgeModel,
    models: parsed.models,
    excerptCaps: parsed.excerptCaps,
    arms,
    repeats: experiment.repeats,
    cases,
    manifest,
    manifestSha256,
    expectCommit: experiment.expectCommit,
    regradeFrom: experiment.regradeFrom,
    resume: experiment.resume,
    retryErrors: experiment.retryErrors,
    maxCostUsd: experiment.maxCostUsd,
    heldOutIds: armSets.heldOutIds,
    correction: armSets.correction,
    recipe: armSets.recipe,
    env,
    log
  });
  return { ran: true, experiment: true, caseIds: cases.map((c) => c.id), accessChecked: true, result };
}

/** The prior committed scores file, or null when none exists yet. */
async function defaultReadResults(resultsPath) {
  try {
    return JSON.parse(await readFile(resultsPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function describePlan({
  models,
  excerptCaps,
  outputDir,
  estimate,
  embeddingProvider,
  mode,
  corpusCount,
  selectedCount,
  skipped,
  reasonLines = [],
  headlineLines = []
}) {
  const shownReasons = reasonLines.slice(0, MAX_REASON_LINES);
  const hiddenReasons = reasonLines.length - shownReasons.length;
  return [
    "Answer-quality run plan (no provider request has been made):",
    "",
    `  Cases selected: ${selectedCount} of ${corpusCount} (selection: ${describeSelectionMode(mode)}; only approved, non-stale cases are ever graded;`,
    `  skipped: ${skipped.notApproved} not approved, ${skipped.stale} stale, ${skipped.current} already current)`,
    ...shownReasons.map((line) => `    ${line}`),
    ...(hiddenReasons > 0 ? [`    ... and ${hiddenReasons} more`] : []),
    `  Each case is asked with every card it names attached, as a player's lookup is.`,
    `  Answer-model lineup: ${models.join(", ")}`,
    `  Judge model: ${estimate.judgeModel}`,
    `  Excerpt caps: ${excerptCaps.join(", ")}`,
    `  Embedding provider: ${embeddingProvider ?? DEFAULT_EMBEDDING_PROVIDER} (the live run embeds each question with it; the plan hashes prompts with the in-process local embedder, no network)`,
    `  Output: ${outputDir}/ (transcripts, gitignored) plus the committed`,
    `    ${RESULTS_RELATIVE_PATH}, merged per case`,
    "",
    `  Calls: ${estimate.answerCalls} answer calls, ${estimate.loneJudgeCalls} lone judge calls,`,
    `  ${estimate.rankingCalls} blind-ranking calls (${estimate.totalCalls} total, sequential).`,
    `  Estimated cost: $${estimate.totalCostUsd.toFixed(2)} (character-count estimate, ~${CHARS_PER_TOKEN_ESTIMATE} chars/token, answers and judge;`,
    "  no numeric target is set -- the live run records its own actual cost, judge included).",
    ...describeUnpriced(estimate),
    ...describeRates(),
    "",
    "  Headline as recorded now (approved, non-stale cases judged against their current reference answer):",
    ...headlineLines.map((line) => `    ${line}`),
    "",
    `Re-run with ${CONFIRM_FLAG} to make the ${estimate.totalCalls} live provider calls.`
  ].join("\n");
}

/**
 * Runs the command. Confirmed and unconfirmed paths share the same
 * model-access check (REQ-188): the dry run performs it when a key is
 * present and skips it -- and makes no network call at all -- when none is.
 */
export async function run(options = {}) {
  const {
    argv = process.argv.slice(2),
    env: processEnv = process.env,
    log = console.log,
    loadCases = loadGoldCases,
    measure = measurePrompts,
    buildClient = defaultBuildClient,
    client: injectedClient,
    runEvaluation = runLiveEvaluation,
    runExperiment = runLiveExperiment,
    loadArmSets,
    armRegistry,
    checkFidelity,
    loadLocalEnv = loadLocalOpenAiEnv,
    readResults = defaultReadResults,
    loadSources = loadSnapshotSources,
    isStale: injectedIsStale
  } = options;

  const parsed = parseArgs(argv);
  const env = resolveRunEnv({ processEnv, confirmed: parsed.confirmed, loadLocalEnv });
  const judgeModel = resolveJudgeModel(env);
  const resultsPath = resolve(repoRoot, RESULTS_RELATIVE_PATH);
  const allCases = await loadCases();
  const hasKey = Boolean(env.OPENAI_API_KEY?.trim());

  // Stale cases (REQ-225) are neither selected nor counted: one comparison, owned by the case loader.
  let isStale = injectedIsStale;
  if (!isStale) {
    const sources = await loadSources();
    isStale = (caseEntry) => compareSnapshot(caseEntry, sources).stale;
  }
  if (parsed.experiment) {
    // An experiment run never reads or writes the committed scores file (REQ-226).
    return runExperimentCommand({
      parsed,
      env,
      judgeModel,
      allCases,
      isStale,
      measure,
      buildClient,
      injectedClient,
      runExperiment,
      loadArmSets,
      armRegistry,
      checkFidelity,
      log
    });
  }
  const previousResults = await readResults(resultsPath);
  const records = previousResults?.caseLegScores ?? [];

  const candidates = allCases.filter((caseEntry) => caseEntry.review.status === "approved" && !isStale(caseEntry));
  let measured = new Map();
  if (parsed.mode.kind === "changed") {
    measured = await measure({ cases: candidates, excerptCaps: parsed.excerptCaps, env });
  }
  const promptHashes = new Map([...measured].map(([key, value]) => [key, value.promptHash]));
  const selection = selectCases({
    cases: allCases,
    records,
    models: parsed.models,
    excerptCaps: parsed.excerptCaps,
    mode: parsed.mode,
    promptHashes,
    isStale
  });
  const selectedCases = selection.selected.map(({ caseEntry }) => caseEntry);
  if (parsed.mode.kind !== "changed" && selectedCases.length > 0) {
    measured = await measure({ cases: selectedCases, excerptCaps: parsed.excerptCaps, env });
  }

  const estimate = estimateCost({
    models: parsed.models,
    judgeModel,
    excerptCaps: parsed.excerptCaps,
    goldCaseCount: selectedCases.length,
    avgPromptCharsByCap: averagePromptChars(selectedCases, parsed.excerptCaps, measured)
  });
  const headlineLines = parsed.models.flatMap((model) =>
    parsed.excerptCaps.map((excerptCap) =>
      formatHeadline({
        model,
        excerptCap,
        headline: computeHeadline({ cases: allCases, records, isStale, model, excerptCap })
      })
    )
  );
  const reasonLines = selection.selected.map(({ caseEntry, reasons }) => `${caseEntry.id}: ${reasons.join("; ")}`);

  if (!parsed.confirmed) {
    let accessNote = "";
    if (hasKey) {
      const client = injectedClient ?? (await buildClient(env));
      const { missing } = await checkModelAccess({ client, modelIds: [...parsed.models, judgeModel] });
      accessNote =
        missing.length > 0
          ? `\n\nWarning: the configured key currently lacks access to: ${missing.join(", ")}.`
          : "\n\nModel access check passed for the full lineup and the judge model.";
    }
    log(
      describePlan({
        ...parsed,
        estimate,
        embeddingProvider: env.EMBEDDING_PROVIDER,
        corpusCount: allCases.length,
        selectedCount: selectedCases.length,
        skipped: selection.skipped,
        reasonLines,
        headlineLines
      }) + accessNote
    );
    return { ran: false, goldCaseCount: allCases.length, selectedCaseIds: selectedCases.map((c) => c.id), accessChecked: hasKey, estimate };
  }

  assertLiveProviderConfigured(env);

  const client = injectedClient ?? (await buildClient(env));
  const { missing } = await checkModelAccess({ client, modelIds: [...parsed.models, judgeModel] });
  if (missing.length > 0) {
    throw new Error(
      `The configured OpenAI credentials do not have access to: ${missing.join(", ")}. Fix access and re-run.`
    );
  }

  log(
    `Model access verified for the full lineup and the judge model. Running the live evaluation over ${selectedCases.length} of ${allCases.length} cases (selection: ${describeSelectionMode(parsed.mode)})...`
  );
  const results = await runEvaluation({
    client,
    judgeModel,
    models: parsed.models,
    excerptCaps: parsed.excerptCaps,
    selectedCases,
    allCases,
    previousResults,
    isStale,
    mode: parsed.mode,
    outputDir: parsed.outputDir,
    resultsPath,
    env,
    log
  });
  return { ran: true, goldCaseCount: allCases.length, selectedCaseIds: selectedCases.map((c) => c.id), accessChecked: true, results };
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
