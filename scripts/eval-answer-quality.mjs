// Answer-quality baseline run (REQ-188, REQ-190; NFR-018).
//
// Bake-off: every gold case (scripts/lib/gold-cases.mjs, REQ-185) answered
// once per model in the answer-model lineup and once per excerpt cap,
// through the production preparePromptInput path
// (apps/backend/src/prompt/preparation.ts), then scored by the judge and
// written to the committed artifact. This slice (B) scaffolds the command:
// argument parsing, the dry-run plan and cost estimate, the confirmation
// gate, and the pre-flight model-access check. The full per-model,
// per-cap, per-case answer/score/rank loop is wired end to end in Slice E.
//
// Costs money once confirmed, so it refuses to contact the provider without
// --confirm-live-calls, mirroring scripts/compare-combo-answer-quality.mjs
// (REQ-146):
//   npm run eval:answer-quality                          # dry: prints the plan
//   npm run eval:answer-quality -- --confirm-live-calls  # live
//
// Run via tsx so the backend TypeScript modules resolve. The TS import that
// measures real prompt sizes (measurePromptChars) is deliberately behind an
// injectable option, so `node --test` can exercise every other code path --
// argument parsing, the plan, the confirmation guard, the model-access check
// -- without a TypeScript loader and without ever making a network call.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadGoldCases } from "./lib/gold-cases.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const CONFIRM_FLAG = "--confirm-live-calls";
export const DEFAULT_OUTPUT_DIR = "output/answer-quality";
export const DEFAULT_LINEUP = ["gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5-nano"];
export const DEFAULT_EXCERPT_CAPS = [5, 10];
export const DEFAULT_JUDGE_MODEL = "gpt-5";

/** Published list rates, USD per million tokens (re-checked before a live run; REQ-188's note). */
export const MODEL_PRICING_USD_PER_MILLION_TOKENS = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-5-mini": { input: 0.25, output: 2.0 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-5": { input: 1.25, output: 10.0 }
};

// Output-token assumptions behind the printed dry-run estimate only (REQ-188's
// M3 estimate methodology). No numeric cost target is set anywhere in this
// file -- the first live run records its own actual usage as the baseline.
const ASSUMED_ANSWER_OUTPUT_TOKENS = 600;
const ASSUMED_LONE_JUDGE_INPUT_TOKENS = 1500;
const ASSUMED_LONE_JUDGE_OUTPUT_TOKENS = 800;
const ASSUMED_RANKING_JUDGE_INPUT_TOKENS = 3400;
const ASSUMED_RANKING_JUDGE_OUTPUT_TOKENS = 1000;
const CHARS_PER_TOKEN_ESTIMATE = 4;

/**
 * Parses CLI args only -- never reads `OPENAI_MODEL` or any other env var for
 * the lineup (REQ-188): the answer-model lineup is a run option, not an
 * environment variable, so a stray environment value can never silently swap
 * a contestant.
 */
export function parseArgs(argv) {
  const models = [];
  const excerptCaps = [];
  let outputDir;
  let confirmed = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === CONFIRM_FLAG) {
      confirmed = true;
    } else if (arg === "--model") {
      const value = argv[++i];
      if (value) models.push(value);
    } else if (arg === "--excerpt-cap") {
      const value = Number(argv[++i]);
      if (Number.isFinite(value)) excerptCaps.push(value);
    } else if (arg === "--output-dir") {
      outputDir = argv[++i];
    }
  }

  return {
    confirmed,
    models: models.length > 0 ? models : [...DEFAULT_LINEUP],
    excerptCaps: excerptCaps.length > 0 ? excerptCaps : [...DEFAULT_EXCERPT_CAPS],
    outputDir: resolve(repoRoot, outputDir ?? DEFAULT_OUTPUT_DIR)
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

async function defaultBuildClient(env) {
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

/**
 * Measures the real, current mean assembled-prompt character count per
 * excerpt cap over the current gold set, through the production
 * `preparePromptInput` path (lexical only -- no query embedding, so no
 * network call). Used only for the printed dry-run cost estimate. Behind
 * this exported hook so `node --test` can inject a fixed value and exercise
 * every other code path without a TypeScript loader.
 */
export async function measurePromptChars(goldCases, excerptCaps) {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { loadGameRulesTopics } = await import("../apps/backend/src/gameRules.ts");
  const { loadGameRulesRuleIndex } = await import("../apps/backend/src/gameRulesRetrieval.ts");
  const { join } = await import("node:path");

  const gameRulesTopics = loadGameRulesTopics(join(repoRoot, "apps/backend/data/gameRulesByTopic.json"));
  const gameRulesRuleIndex = loadGameRulesRuleIndex(join(repoRoot, "apps/backend/data/gameRulesRuleIndex.json"));

  const result = {};
  for (const cap of excerptCaps) {
    let total = 0;
    for (const caseEntry of goldCases) {
      const prepared = preparePromptInput(
        { mode: "lookup", question: caseEntry.question },
        { gameRulesTopics, gameRulesRuleIndex, supplementalRuleCap: cap }
      );
      total += prepared.promptText.length;
    }
    result[cap] = goldCases.length > 0 ? total / goldCases.length : 0;
  }
  return result;
}

/** A character-count cost estimate (REQ-188's M3 methodology). Never a target -- the live run records its own actual usage. */
export function estimateCost({ models, judgeModel, excerptCaps, goldCaseCount, avgPromptCharsByCap }) {
  const legCount = models.length * excerptCaps.length;
  const answerCalls = goldCaseCount * legCount;
  const loneJudgeCalls = answerCalls;
  const rankingCalls = goldCaseCount * excerptCaps.length;

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
    totalCostUsd: answersCostUsd + judgeCostUsd
  };
}

export function describePlan({ models, excerptCaps, outputDir, goldCaseCount, estimate }) {
  return [
    "Answer-quality baseline plan (no provider request has been made):",
    "",
    `  Gold cases: ${goldCaseCount}`,
    `  Answer-model lineup: ${models.join(", ")}`,
    `  Judge model: ${estimate.judgeModel}`,
    `  Excerpt caps: ${excerptCaps.join(", ")}`,
    `  Output: ${outputDir}/ (transcripts, gitignored) plus the committed`,
    "    apps/backend/src/eval/answer-quality/results.json",
    "",
    `  Calls: ${estimate.answerCalls} answer calls, ${estimate.loneJudgeCalls} lone judge calls,`,
    `  ${estimate.rankingCalls} blind-ranking calls (${estimate.totalCalls} total, sequential).`,
    `  Estimated cost: $${estimate.totalCostUsd.toFixed(2)} (character-count estimate, ~${CHARS_PER_TOKEN_ESTIMATE} chars/token;`,
    "  no numeric target is set -- the live run records its own actual cost as the baseline).",
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
    env = process.env,
    log = console.log,
    loadCases = loadGoldCases,
    measureChars = measurePromptChars,
    buildClient = defaultBuildClient,
    client: injectedClient
  } = options;

  const parsed = parseArgs(argv);
  const judgeModel = resolveJudgeModel(env);
  const goldCases = await loadCases();
  const hasKey = Boolean(env.OPENAI_API_KEY?.trim());

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
    const avgPromptCharsByCap = await measureChars(goldCases, parsed.excerptCaps);
    const estimate = estimateCost({
      models: parsed.models,
      judgeModel,
      excerptCaps: parsed.excerptCaps,
      goldCaseCount: goldCases.length,
      avgPromptCharsByCap
    });
    log(describePlan({ ...parsed, goldCaseCount: goldCases.length, estimate }) + accessNote);
    return { ran: false, goldCaseCount: goldCases.length, accessChecked: hasKey };
  }

  assertLiveProviderConfigured(env);

  const client = injectedClient ?? (await buildClient(env));
  const { missing } = await checkModelAccess({ client, modelIds: [...parsed.models, judgeModel] });
  if (missing.length > 0) {
    throw new Error(
      `The configured OpenAI credentials do not have access to: ${missing.join(", ")}. Fix access and re-run.`
    );
  }

  // Slice E wires the full per-model, per-cap, per-case answer/score/rank
  // loop and the artifact writer here.
  log("Model access verified for the full lineup and the judge model. The live evaluation loop is wired in Slice E.");
  return { ran: false, goldCaseCount: goldCases.length, accessChecked: true };
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
