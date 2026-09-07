// Answer-quality baseline run (REQ-188, REQ-190; NFR-018).
//
// Bake-off: every gold case (scripts/lib/gold-cases.mjs, REQ-185) answered
// once per model in the answer-model lineup and once per excerpt cap,
// through the production preparePromptInput path
// (apps/backend/src/prompt/preparation.ts) with the same inputs a player's
// lookup gets -- the committed card-detail and card-rulings indexes, a
// tier-2 case's cited card attached (buildCaseRequest), and the question
// embedded by the configured EMBEDDING_PROVIDER (default `local`, what
// production runs) so System 3 ranks semantically, never silently lexically
// (assertQueryEmbedded / describeRetrieval refuse to record a run whose
// embedder fell back) -- scored alone by the judge
// (apps/backend/src/eval/answer-quality/judge.ts) and, once every model has
// answered a case at a cap, ranked blind, then written to the committed
// artifact (apps/backend/src/eval/answer-quality/artifact.ts). Argument
// parsing, the dry-run plan and cost estimate, the confirmation gate, and
// the pre-flight model-access check are always exercised (including under
// plain `node --test`); the full live loop (`runLiveEvaluation`) is wired
// here but, like `measurePromptChars`, isolates every TypeScript-module
// import inside its own function body, evaluated lazily -- so it only ever
// runs for real when this script is actually invoked via tsx with
// --confirm-live-calls, never when this file is merely imported or its
// other exports are unit-tested.
//
// Costs money once confirmed, so it refuses to contact the provider without
// --confirm-live-calls, mirroring scripts/compare-combo-answer-quality.mjs
// (REQ-146):
//   npm run eval:answer-quality                          # dry: prints the plan
//   npm run eval:answer-quality -- --confirm-live-calls  # live
//
// Run via tsx so the backend TypeScript modules resolve. The TS imports that
// measure real prompt sizes (measurePromptChars) and that run the live loop
// (runLiveEvaluation) are deliberately behind injectable options / lazy
// dynamic imports, so `node --test` can exercise every other code path --
// argument parsing, the plan, the confirmation guard, the model-access check,
// the artifact-shape aggregation (buildRunArtifact) -- without a TypeScript
// loader and without ever making a network call.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadGoldCases } from "./lib/gold-cases.mjs";
import { loadLocalOpenAiEnv } from "./lib/local-openai-env.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const CONFIRM_FLAG = "--confirm-live-calls";
export const DEFAULT_OUTPUT_DIR = "output/answer-quality";
export const DEFAULT_LINEUP = ["gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5-nano"];
export const DEFAULT_EXCERPT_CAPS = [5, 10];
/** What the deployed app runs (REQ-184); an explicit `EMBEDDING_PROVIDER` always wins. */
export const DEFAULT_EMBEDDING_PROVIDER = "local";
// Deliberately duplicated from apps/backend/src/eval/answer-quality/judge.ts
// (same value, same env var, independently tested there): this plain .mjs
// script's dry-run path must resolve the judge model synchronously under
// plain `node --test`, with no TypeScript loader -- the same constraint
// documented on `measurePromptChars` below. The real per-call judge
// functions use judge.ts's own copy.
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
export function resolveRunEnv({ processEnv, confirmed, loadLocalEnv = loadLocalOpenAiEnv }) {
  const { env, sources } = loadLocalEnv({ repoRoot, env: processEnv });
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
 * The request a gold case is asked as (REQ-185). A tier-2 case tests whether
 * the model honours the ruling the prompt attaches for its card, so it is
 * asked the way a player's lookup asks it: with the cited card attached, by
 * oracle id -- the key both the card-detail index (oracle text, type line)
 * and the card-rulings index resolve by -- so the prompt carries that card's
 * oracle text and every published ruling. A tier-1 case is the bare question.
 */
export function buildCaseRequest(caseEntry) {
  const request = { mode: "lookup", question: caseEntry.question };
  if (caseEntry.tier === 2) {
    request.cards = [{ cardId: caseEntry.source.oracleId, name: caseEntry.source.cardName }];
  }
  return request;
}

/**
 * A real embedder returns `null` on failure and production quietly falls
 * back to lexical retrieval; an instrument must not. Refuses to continue a
 * run whose artifact would be labelled with a provider that never ran.
 */
export function assertQueryEmbedded({ mode, vector, caseId }) {
  if (mode === "mock" || Array.isArray(vector)) return;
  throw new Error(
    `EMBEDDING_PROVIDER=${mode} returned no embedding for gold case ${caseId}, so System 3 would silently run lexical retrieval under a "${mode}" label. Refusing to record that. For local, warm the model cache first: node scripts/warm-embedding-model-cache.mjs (apps/backend/data/models/ is gitignored, so a fresh worktree has none).`
  );
}

/**
 * What System 3 actually did for one prepared prompt, from the production
 * enrichment debug block: whether the pass ran semantic (REQ-182) or fell
 * back to lexical, which rule excerpts reached the prompt, and whether any
 * of the case's expected rule ids was among them. `requireSemantic` turns
 * an unexpected lexical pass into a refusal (the embedder ran, but the
 * committed embeddings artifact did not match the rule index, say).
 */
export function describeRetrieval(supplemental, expectedRuleIds, { requireSemantic = false, caseId = "" } = {}) {
  const selectedRuleIds = (supplemental?.selected ?? []).map((rule) => rule.ruleId);
  const usedSemantic = Boolean(supplemental?.usedSemantic);
  if (requireSemantic && !usedSemantic) {
    throw new Error(
      `System 3 ran lexical retrieval for gold case ${caseId} although the question was embedded -- the committed rule embeddings artifact is missing, malformed, or does not match gameRulesRuleIndex.json. Refusing to record a semantic-labelled run.`
    );
  }
  return {
    usedSemantic,
    selectedRuleIds,
    goldRuleInPrompt: expectedRuleIds.some((ruleId) => selectedRuleIds.includes(ruleId))
  };
}

/**
 * The production prompt inputs (`createConfiguredApp.ts` loads the same
 * four files): curated topics, the flat rule index, and -- what the first
 * two runs lacked -- the card-detail and card-rulings indexes an attached
 * card resolves through. TypeScript imports, so lazy (the `measurePromptChars`
 * pattern) and only ever evaluated under tsx.
 */
async function loadPromptResources() {
  const { loadGameRulesTopics } = await import("../apps/backend/src/gameRules.ts");
  const { loadGameRulesRuleIndex } = await import("../apps/backend/src/gameRulesRetrieval.ts");
  const { loadCardRulingsIndex } = await import("../apps/backend/src/cardRulings.ts");
  const { loadCardDetailIndex } = await import("../apps/backend/src/cardDetail.ts");
  const { join } = await import("node:path");
  const dataDir = join(repoRoot, "apps/backend/data");
  return {
    gameRulesTopics: loadGameRulesTopics(join(dataDir, "gameRulesByTopic.json")),
    gameRulesRuleIndex: loadGameRulesRuleIndex(join(dataDir, "gameRulesRuleIndex.json")),
    cardRulingsIndex: loadCardRulingsIndex(join(dataDir, "cardRulingsByOracleId.json")),
    cardDetailIndex: loadCardDetailIndex(join(dataDir, "cardDetailByOracleId.json"))
  };
}

/**
 * The query embedder the run uses, selected exactly as the server selects
 * it (`createEmbeddingProvider`): `local` is the bundled MiniLM model, in
 * process, no network; `openai` is the hosted embedder; `mock` embeds
 * nothing and leaves System 3 lexical.
 */
async function buildEmbedder(env) {
  const mode = env.EMBEDDING_PROVIDER;
  if (mode === "mock") return { mode, embed: async () => null };
  const { createEmbeddingProvider } = await import("../apps/backend/src/providers/createEmbeddingProvider.ts");
  const provider = createEmbeddingProvider({ embeddingProvider: mode, openAiApiKey: env.OPENAI_API_KEY });
  return { mode, embed: (text) => provider.embed(text) };
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
  const resources = await loadPromptResources();

  const result = {};
  for (const cap of excerptCaps) {
    let total = 0;
    for (const caseEntry of goldCases) {
      const prepared = preparePromptInput(buildCaseRequest(caseEntry), { ...resources, supplementalRuleCap: cap });
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

/** The actual dollar cost of one call, from its real token counts (falls back to $0 for an unrecognized model id, never a guess). */
export function computeCallCostUsd(model, inputTokens, outputTokens) {
  const price = MODEL_PRICING_USD_PER_MILLION_TOKENS[model];
  if (!price) return 0;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

/**
 * Pure aggregation: turns already-computed per-call records into the
 * committed `AnswerQualityResults` shape (REQ-189) -- per-leg headline
 * counts and run totals. Takes plain data (never a TS type, never touches a
 * file or the network), so it is fully unit-testable under plain `node`,
 * independent of the live loop that produces its input.
 */
export function buildRunArtifact({
  models,
  excerptCaps,
  goldCases,
  judgeModel,
  rubricRevision,
  askAiProvider,
  embeddingProvider,
  gitCommit,
  generatedAt,
  caseLegScores
}) {
  const legs = [];
  for (const model of models) {
    for (const cap of excerptCaps) {
      const legScores = caseLegScores.filter((record) => record.model === model && record.excerptCap === cap);
      const fullyCorrectCount = legScores.filter(
        (record) => !record.undetermined && record.scores?.correctness === 2
      ).length;
      legs.push({ model, excerptCap: cap, fullyCorrectCount, caseCount: legScores.length });
    }
  }

  const totalInputTokens = caseLegScores.reduce((sum, record) => sum + (record.inputTokens ?? 0), 0);
  const totalOutputTokens = caseLegScores.reduce((sum, record) => sum + (record.outputTokens ?? 0), 0);
  const totalCostUsd = caseLegScores.reduce((sum, record) => sum + (record.costUsd ?? 0), 0);

  return {
    runMetadata: {
      goldSetCaseIds: goldCases.map((caseEntry) => caseEntry.id),
      goldSetTier1Count: goldCases.filter((caseEntry) => caseEntry.tier === 1).length,
      goldSetTier2Count: goldCases.filter((caseEntry) => caseEntry.tier === 2).length,
      answerModelLineup: models,
      judgeModel,
      judgeMatchesAnswerModel: models.includes(judgeModel),
      rubricRevision,
      askAiProvider,
      embeddingProvider,
      gitCommit,
      generatedAt,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd
    },
    legs,
    // costUsd is this function's own internal aggregation field, not part of
    // the committed per-case-per-leg schema (REQ-189) -- stripped here.
    caseLegScores: caseLegScores.map((record) => {
      const stripped = { ...record };
      delete stripped.costUsd;
      return stripped;
    })
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
 * The full live evaluation loop (REQ-188, REQ-190, REQ-186, REQ-189): for
 * every excerpt cap, for every gold case, for every model in the lineup --
 * answer through the production `preparePromptInput` path, run the
 * deterministic assertions and the lone judge pass, and write that leg's
 * transcript; once every model has answered, run the blind side-by-side
 * ranking pass and write its transcript; finally assemble and write the
 * committed scorecard.
 *
 * Every TypeScript-module import is lazy and scoped to this function body
 * (the `measurePromptChars` pattern), so importing this file, or unit-
 * testing its sibling exports, never touches a TypeScript loader. This
 * function itself is exercised for real only by an owner-confirmed
 * `--confirm-live-calls` run (Slice E's E9), never by any automated test.
 */
export async function runLiveEvaluation({ client, judgeModel, models, excerptCaps, goldCases, outputDir, resultsPath, env, log }) {
  const { preparePromptInput, buildRetrievalQueryText } = await import("../apps/backend/src/prompt/preparation.ts");
  const { computeDeterministicAssertions } = await import("../apps/backend/src/eval/answer-quality/assertions.ts");
  const { judgeAnswerAlone, judgeBlindRanking } = await import("../apps/backend/src/eval/answer-quality/judge.ts");
  const { RUBRIC_REVISION } = await import("../apps/backend/src/eval/answer-quality/rubric.ts");
  const { writeResultsFile, writeTranscript, writeRankingTranscript } = await import(
    "../apps/backend/src/eval/answer-quality/artifact.ts"
  );
  const resources = await loadPromptResources();
  const embedder = await buildEmbedder(env);

  // One embedding per gold case, exactly as the route handler embeds the
  // retrieval query text (question plus each attached card's compact
  // signal) before `preparePromptInput`; shared by every cap and model, so
  // every leg of a case ranks from the identical vector.
  const queryEmbeddingByCaseId = new Map();
  for (const caseEntry of goldCases) {
    const request = buildCaseRequest(caseEntry);
    const vector = await embedder.embed(
      buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex })
    );
    assertQueryEmbedded({ mode: embedder.mode, vector, caseId: caseEntry.id });
    queryEmbeddingByCaseId.set(caseEntry.id, vector);
  }
  log?.(`Embedded ${goldCases.length} gold-case queries with EMBEDDING_PROVIDER=${embedder.mode}.`);

  const caseLegScores = [];

  for (const cap of excerptCaps) {
    for (const caseEntry of goldCases) {
      const perModelRecord = new Map();
      const answersForRanking = [];
      const request = buildCaseRequest(caseEntry);

      for (const model of models) {
        const prepared = preparePromptInput(request, {
          ...resources,
          supplementalRuleCap: cap,
          queryEmbedding: queryEmbeddingByCaseId.get(caseEntry.id) ?? null,
          collectEnrichmentDebug: true
        });
        const retrieval = describeRetrieval(
          prepared.enrichmentDebug?.supplemental,
          caseEntry.expectedSupplementalRuleIds,
          {
            requireSemantic: embedder.mode !== "mock",
            caseId: caseEntry.id
          }
        );

        const startedAt = Date.now();
        const response = await client.responses.create({ model, input: prepared.promptText });
        const latencyMs = Date.now() - startedAt;
        const answerText = response.output_text?.trim() ?? "";

        // Real usage from the API when the client reports it; a character
        // estimate (consistent with the dry-run plan's methodology) when it
        // does not, so an injected fake test client never needs to fabricate it.
        const inputTokens = response.usage?.input_tokens ?? Math.round(prepared.promptText.length / CHARS_PER_TOKEN_ESTIMATE);
        const outputTokens = response.usage?.output_tokens ?? Math.round(answerText.length / CHARS_PER_TOKEN_ESTIMATE);

        const assertions = computeDeterministicAssertions(answerText, caseEntry.expectedSupplementalRuleIds);
        const judgeResult = await judgeAnswerAlone({
          client,
          judgeModel,
          question: caseEntry.question,
          ruleIds: caseEntry.expectedSupplementalRuleIds,
          answerText,
          workedSolution: caseEntry.workedSolution
        });

        const record = {
          caseId: caseEntry.id,
          model,
          excerptCap: cap,
          undetermined: judgeResult.undetermined,
          scores: judgeResult.undetermined ? undefined : judgeResult.scores,
          namesGoldRuleId: assertions.namesGoldRuleId,
          goldRuleInPrompt: retrieval.goldRuleInPrompt,
          promptChars: prepared.promptText.length,
          inputTokens,
          outputTokens,
          latencyMs,
          blindRank: null,
          costUsd: computeCallCostUsd(model, inputTokens, outputTokens)
        };
        perModelRecord.set(model, record);
        answersForRanking.push({ modelId: model, answerText });

        await writeTranscript(
          {
            caseId: caseEntry.id,
            model,
            excerptCap: cap,
            question: caseEntry.question,
            cards: request.cards ?? [],
            retrieval,
            promptText: prepared.promptText,
            answerText,
            workedSolution: caseEntry.workedSolution,
            assertions,
            scores: judgeResult.undetermined ? undefined : judgeResult.scores,
            undetermined: judgeResult.undetermined,
            rationale: judgeResult.undetermined ? undefined : judgeResult.rationale
          },
          outputDir
        );

        log?.(`  ${caseEntry.id} / ${model} / cap ${cap}: answered (${latencyMs}ms)`);
      }

      const rankingResult = await judgeBlindRanking({
        client,
        judgeModel,
        question: caseEntry.question,
        workedSolution: caseEntry.workedSolution,
        answers: answersForRanking
      });
      if (!rankingResult.undetermined) {
        for (const [modelId, rank] of Object.entries(rankingResult.ranks)) {
          const record = perModelRecord.get(modelId);
          if (record) record.blindRank = rank;
        }
      }
      await writeRankingTranscript(
        {
          caseId: caseEntry.id,
          excerptCap: cap,
          ranks: rankingResult.undetermined ? {} : rankingResult.ranks,
          undetermined: rankingResult.undetermined,
          reason: rankingResult.undetermined ? rankingResult.reason : undefined
        },
        outputDir
      );

      for (const record of perModelRecord.values()) caseLegScores.push(record);
    }
  }

  const results = buildRunArtifact({
    models,
    excerptCaps,
    goldCases,
    judgeModel,
    rubricRevision: RUBRIC_REVISION,
    askAiProvider: env.ASK_AI_PROVIDER ?? "",
    embeddingProvider: embedder.mode,
    gitCommit: await resolveGitCommit(repoRoot),
    generatedAt: new Date().toISOString(),
    caseLegScores
  });

  await writeResultsFile(results, resultsPath);
  log?.(`\nWrote ${resultsPath} and transcripts to ${outputDir}/`);
  return results;
}

export function describePlan({ models, excerptCaps, outputDir, goldCaseCount, estimate, embeddingProvider }) {
  return [
    "Answer-quality baseline plan (no provider request has been made):",
    "",
    `  Gold cases: ${goldCaseCount} (tier-2 cases are asked with their cited card attached, as a player's lookup is)`,
    `  Answer-model lineup: ${models.join(", ")}`,
    `  Judge model: ${estimate.judgeModel}`,
    `  Excerpt caps: ${excerptCaps.join(", ")}`,
    `  Embedding provider: ${embeddingProvider ?? DEFAULT_EMBEDDING_PROVIDER} (the live run embeds each question with it; the estimate below is lexical)`,
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
    env: processEnv = process.env,
    log = console.log,
    loadCases = loadGoldCases,
    measureChars = measurePromptChars,
    buildClient = defaultBuildClient,
    client: injectedClient,
    runEvaluation = runLiveEvaluation,
    loadLocalEnv = loadLocalOpenAiEnv
  } = options;

  const parsed = parseArgs(argv);
  const env = resolveRunEnv({ processEnv, confirmed: parsed.confirmed, loadLocalEnv });
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
    log(
      describePlan({
        ...parsed,
        goldCaseCount: goldCases.length,
        estimate,
        embeddingProvider: env.EMBEDDING_PROVIDER
      }) + accessNote
    );
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

  log(
    `Model access verified for the full lineup and the judge model. Running the live evaluation over ${goldCases.length} gold cases...`
  );
  const results = await runEvaluation({
    client,
    judgeModel,
    models: parsed.models,
    excerptCaps: parsed.excerptCaps,
    goldCases,
    outputDir: parsed.outputDir,
    resultsPath: resolve(repoRoot, "apps/backend/src/eval/answer-quality/results.json"),
    env,
    log
  });
  return { ran: true, goldCaseCount: goldCases.length, accessChecked: true, results };
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
