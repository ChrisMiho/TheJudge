// Answer-quality judge (REQ-186 layers 2 and 2b).
//
// Layer 2, the lone judge pass: one call per answer, handed the question,
// the rule id and text of every excerpt the answer prompt actually carried
// (labelled as attached), the case's deciding rule ids (labelled separately
// as the rules the reference answer turns on), for a case with a game state
// the state lines the prompt printed, the answer, the case's approved
// reference answer (`expected.answer`, passed here as `workedSolution`: the
// parameter keeps its version-1 name), and the rubric (REQ-187). The inputs
// are built the same way for every model, cap and arm (scripts/lib/judge-inputs.mjs),
// and changing them moved the rubric revision. It scores the four
// axes and writes a one-paragraph rationale, or returns an explicit
// `undetermined` when it cannot decide -- never a guess, never silently
// counted as a pass or a fail. Every call returns the judge's own token use,
// so a run can record what grading cost, not only what answering cost.
//
// Layer 2b, the blind side-by-side rank: when two or more answer models ran,
// for each case at each excerpt cap, once every answer has been scored alone,
// one further judge call sees all answers to that question together -- model
// labels hidden, order shuffled -- with the reference answer and the rubric,
// and ranks them by agreement with the reference. Side-by-side ranking is more
// reliable than lone scores and is what makes the model comparison
// (REQ-188) trustworthy. A single answer has nothing to be ranked against, so
// the run skips the call for a one-model lineup and this function refuses it.
//
// The judge is named by its own setting, ANSWER_QUALITY_JUDGE_MODEL,
// defaults to gpt-5, and is never one of the answer models -- a model
// grading its own answers favours its own phrasing and shares its own
// blind spots.
//
// This module never uses AskAiProvider, never builds an AskAiRequest, and
// touches no product code path: it is eval-only tooling using the
// already-present `openai` dependency, with an injectable client so tests
// never make a network call.

import { RUBRIC_AXIS_IDS, formatRubricForJudge, type AxisScores } from "./rubric.js";

/** The same minimal Responses-API surface `openAiResponsesProvider.ts` already depends on. */
export type JudgeClient = {
  responses: {
    create(params: {
      model: string;
      input: string;
    }): Promise<{
      output_text?: string;
      usage?: { input_tokens?: number; output_tokens?: number; output_tokens_details?: { reasoning_tokens?: number } };
    }>;
  };
};

/**
 * The judge call's own token use (REQ-188: judge usage is recorded, apart from
 * the answer's). `outputTokens` is what the provider bills as output and
 * already includes `reasoningTokens` (REQ-227 counts reasoning as output).
 * Zero when the client reports none or the call failed.
 */
export type JudgeUsage = { inputTokens: number; outputTokens: number; reasoningTokens: number };

const NO_JUDGE_USAGE: JudgeUsage = { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 };

function usageOf(response: {
  usage?: { input_tokens?: number; output_tokens?: number; output_tokens_details?: { reasoning_tokens?: number } };
}): JudgeUsage {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens ?? 0
  };
}

// Deliberately duplicated in scripts/eval-answer-quality.mjs (same value,
// same env var): that plain .mjs script's dry-run path must resolve the
// judge model synchronously under plain `node --test`, with no TypeScript
// loader, so it cannot import this module directly. This copy is what the
// real per-call judge functions below use.
export const DEFAULT_JUDGE_MODEL = "gpt-5";

/**
 * The judge model is selected by its own explicit setting
 * (REQ-186) -- never `OPENAI_MODEL`, never an answer model -- mirroring the
 * explicit-selection seam `ASK_AI_PROVIDER` / `EMBEDDING_PROVIDER` already
 * use. Defaults to `gpt-5` when unset.
 */
export function resolveJudgeModel(env: Record<string, string | undefined> = process.env): string {
  const value = env.ANSWER_QUALITY_JUDGE_MODEL?.trim();
  return value && value.length > 0 ? value : DEFAULT_JUDGE_MODEL;
}

/** True when the configured judge model id also appears in the answer-model lineup (REQ-186's mismatch flag). */
export function judgeMatchesAnswerModel(judgeModel: string, lineupModelIds: readonly string[]): boolean {
  return lineupModelIds.includes(judgeModel);
}

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  // Judge models sometimes wrap JSON in a fenced code block despite
  // instructions not to; strip that before parsing rather than failing.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function isValidAxisScore(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

/** One rule excerpt the answer prompt carried: its rule id and the text printed for it. */
export type JudgeExcerpt = { ruleId: string; text: string };

export type LoneJudgeInput = {
  client: JudgeClient;
  judgeModel: string;
  question: string;
  /** The rule excerpts the answer prompt actually carried (an arm's prompt for an arm); labelled as attached. */
  attachedExcerpts: readonly JudgeExcerpt[];
  /** The case's `decidingRuleIds`, labelled separately as the rules the reference answer turns on. */
  decidingRuleIds: readonly string[];
  /** For a case with a game state, the state lines the prompt printed; empty for a lookup. */
  stateLines?: readonly string[];
  answerText: string;
  workedSolution: string;
};

export type LoneJudgeResult =
  | { undetermined: false; scores: AxisScores; rationale: string; usage: JudgeUsage }
  | { undetermined: true; reason: string; usage: JudgeUsage };

/**
 * The exact text the lone judge is sent. A pure function of the case, the
 * prompt's evidence and the answer: it takes no model, cap or arm, so the
 * judge sees the same thing however the answer was produced (REQ-186).
 */
export function buildLoneJudgePrompt(input: Omit<LoneJudgeInput, "client" | "judgeModel">): string {
  return [
    "You are grading one Magic: The Gathering rules answer against an approved reference answer.",
    "The reference answer is authoritative. Your task is agreement with it, not independent adjudication from your own rules knowledge.",
    "You are not told which model produced this answer or what retrieval settings were used -- score only what is written below.",
    "",
    `Question: ${input.question}`,
    ...evidenceLines(input),
    `Reference answer (approved, authoritative): ${input.workedSolution}`,
    `Answer under review: ${input.answerText}`,
    "",
    formatRubricForJudge(),
    "",
    'Respond with ONLY a JSON object, no prose outside it, no code fence, in the exact shape:',
    '{"correctness": 0|1|2, "grounding": 0|1|2, "calibration": 0|1|2, "readability": 0|1|2, "rationale": "one paragraph"}'
  ].join("\n");
}

function parseLoneJudgeResponse(text: string): { scores: AxisScores; rationale: string } | null {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;

  for (const axisId of RUBRIC_AXIS_IDS) {
    if (!isValidAxisScore(record[axisId])) return null;
  }
  if (typeof record.rationale !== "string" || record.rationale.trim().length === 0) return null;

  const scores = Object.fromEntries(RUBRIC_AXIS_IDS.map((axisId) => [axisId, record[axisId]])) as AxisScores;
  return { scores, rationale: record.rationale };
}

/**
 * One call per answer (REQ-186 layer 2). Returns an explicit `undetermined`
 * result on a provider error or a malformed/unparseable response, rather
 * than throwing or guessing -- the caller records `undetermined` and the
 * run continues.
 */
export async function judgeAnswerAlone(input: LoneJudgeInput): Promise<LoneJudgeResult> {
  let responseText: string;
  let usage: JudgeUsage;
  try {
    const response = await input.client.responses.create({
      model: input.judgeModel,
      input: buildLoneJudgePrompt(input)
    });
    responseText = response.output_text ?? "";
    usage = usageOf(response);
  } catch (error) {
    return {
      undetermined: true,
      reason: `judge call failed: ${error instanceof Error ? error.message : String(error)}`,
      usage: NO_JUDGE_USAGE
    };
  }

  const parsed = parseLoneJudgeResponse(responseText);
  if (!parsed) {
    return { undetermined: true, reason: "judge response was not valid scored JSON", usage };
  }
  return { undetermined: false, scores: parsed.scores, rationale: parsed.rationale, usage };
}

export type BlindRankingEntry = { modelId: string; answerText: string };

export type BlindRankingInput = {
  client: JudgeClient;
  judgeModel: string;
  question: string;
  /** The same attached-excerpt, deciding-rule and game-state inputs the lone judge receives (REQ-186): every answer ranked here came from one prompt. */
  attachedExcerpts?: readonly JudgeExcerpt[];
  decidingRuleIds?: readonly string[];
  stateLines?: readonly string[];
  workedSolution: string;
  answers: readonly BlindRankingEntry[];
  /**
   * Overrides the shuffled presentation order (a permutation of indices into
   * `answers`), for deterministic tests. Defaults to a real random shuffle.
   */
  shuffleIndices?: number[];
};

export type BlindRankingResult =
  | { undetermined: false; ranks: Record<string, number>; rationale: string; usage: JudgeUsage }
  | { undetermined: true; reason: string; usage: JudgeUsage };

function defaultShuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = temp;
  }
  return indices;
}

function labelFor(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, ...
}

/** The evidence lines shared by the lone judge and the blind ranking, so both are told the same about the prompt (REQ-186). */
function evidenceLines(input: {
  attachedExcerpts?: readonly JudgeExcerpt[];
  decidingRuleIds?: readonly string[];
  stateLines?: readonly string[];
}): string[] {
  const attached = input.attachedExcerpts ?? [];
  const excerptLines = attached.length > 0 ? attached.map((excerpt) => `  ${excerpt.ruleId}. ${excerpt.text}`) : ["  (none)"];
  const stateLines = input.stateLines ?? [];
  return [
    "Rule excerpts attached to the answer prompt (the rules the answer could draw on):",
    ...excerptLines,
    `Rules the reference answer turns on (deciding rule ids; they may or may not be attached above): ${(input.decidingRuleIds ?? []).join(", ") || "(none)"}`,
    ...(stateLines.length > 0 ? ["Game state the prompt printed:", ...stateLines.map((line) => `  ${line}`)] : [])
  ];
}

export function buildRankingPrompt(params: {
  question: string;
  attachedExcerpts?: readonly JudgeExcerpt[];
  decidingRuleIds?: readonly string[];
  stateLines?: readonly string[];
  workedSolution: string;
  labeledAnswers: Array<{ label: string; answerText: string }>;
}): string {
  return [
    "You are ranking multiple Magic: The Gathering rules answers to the SAME question against an approved reference answer.",
    "You are not told which model produced any answer, or in what order they were originally generated -- the labels below are arbitrary and shuffled.",
    "",
    `Question: ${params.question}`,
    ...evidenceLines(params),
    `Reference answer (approved, authoritative): ${params.workedSolution}`,
    "",
    formatRubricForJudge(),
    "",
    "Answers to rank, by agreement with the reference (best to worst):",
    ...params.labeledAnswers.map(({ label, answerText }) => `Answer ${label}: ${answerText}`),
    "",
    'Respond with ONLY a JSON object, no prose outside it, no code fence, in the exact shape:',
    `{"ranks": {${params.labeledAnswers.map(({ label }) => `"${label}": <integer rank, 1 = best>`).join(", ")}}, "rationale": "one paragraph explaining the ranking"}`
  ].join("\n");
}

function parseRankingResponse(
  text: string,
  expectedLabels: readonly string[]
): { ranks: Record<string, number>; rationale: string } | null {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const ranks = record.ranks;
  if (!ranks || typeof ranks !== "object") return null;

  const ranksRecord = ranks as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const label of expectedLabels) {
    const value = ranksRecord[label];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return null;
    result[label] = value;
  }
  if (typeof record.rationale !== "string" || record.rationale.trim().length === 0) return null;
  return { ranks: result, rationale: record.rationale };
}

/**
 * The blind side-by-side rank (REQ-186 layer 2b): for one case at one
 * excerpt cap, once every answer has been scored alone, this sees all
 * answers together with model labels hidden and order shuffled per case, and
 * ranks them by agreement with the reference. The harness -- never the
 * judge -- knows which shuffled label maps to which real model id, so the
 * mapping back is always recoverable. It needs two or more answers: a one-model
 * run has nothing to rank, so the run never calls it, and a direct call with
 * fewer than two answers returns `undetermined` without a provider call.
 */
export async function judgeBlindRanking(input: BlindRankingInput): Promise<BlindRankingResult> {
  if (input.answers.length < 2) {
    return { undetermined: true, reason: "ranking needs two or more answers", usage: NO_JUDGE_USAGE };
  }
  const order = input.shuffleIndices ?? defaultShuffleIndices(input.answers.length);
  if (order.length !== input.answers.length) {
    return {
      undetermined: true,
      reason: "shuffleIndices length must match the number of answers",
      usage: NO_JUDGE_USAGE
    };
  }

  const labelToModelId = new Map<string, string>();
  const labeledAnswers = order.map((originalIndex, position) => {
    const label = labelFor(position);
    const entry = input.answers[originalIndex]!;
    labelToModelId.set(label, entry.modelId);
    return { label, answerText: entry.answerText };
  });
  const labels = labeledAnswers.map(({ label }) => label);

  let responseText: string;
  let usage: JudgeUsage;
  try {
    const response = await input.client.responses.create({
      model: input.judgeModel,
      input: buildRankingPrompt({
        question: input.question,
        attachedExcerpts: input.attachedExcerpts,
        decidingRuleIds: input.decidingRuleIds,
        stateLines: input.stateLines,
        workedSolution: input.workedSolution,
        labeledAnswers
      })
    });
    responseText = response.output_text ?? "";
    usage = usageOf(response);
  } catch (error) {
    return {
      undetermined: true,
      reason: `judge ranking call failed: ${error instanceof Error ? error.message : String(error)}`,
      usage: NO_JUDGE_USAGE
    };
  }

  const parsedResponse = parseRankingResponse(responseText, labels);
  if (!parsedResponse) {
    return { undetermined: true, reason: "judge ranking response was not valid ranked JSON", usage };
  }

  const ranks: Record<string, number> = {};
  for (const [label, rank] of Object.entries(parsedResponse.ranks)) {
    const modelId = labelToModelId.get(label);
    if (modelId) ranks[modelId] = rank;
  }
  return { undetermined: false, ranks, rationale: parsedResponse.rationale, usage };
}
