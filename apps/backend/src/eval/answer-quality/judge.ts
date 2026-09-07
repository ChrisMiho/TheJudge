// Answer-quality judge (REQ-186 layers 2 and 2b).
//
// Layer 2, the lone judge pass: one call per answer, handed the question,
// the attached rule ids, the answer, the case's published `workedSolution`
// as the reference answer, and the rubric (REQ-187). It scores the four
// axes and writes a one-paragraph rationale, or returns an explicit
// `undetermined` when it cannot decide -- never a guess, never silently
// counted as a pass or a fail.
//
// Layer 2b, the blind side-by-side rank: for each gold case at each
// excerpt cap, once every answer has been scored alone, one further judge
// call sees all answers to that question together -- model labels hidden,
// order shuffled -- with the reference answer and the rubric, and ranks
// them by agreement with the reference. Side-by-side ranking is more
// reliable than lone scores and is what makes the model comparison
// (REQ-188) trustworthy.
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
    create(params: { model: string; input: string }): Promise<{ output_text?: string }>;
  };
};

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

export type LoneJudgeInput = {
  client: JudgeClient;
  judgeModel: string;
  question: string;
  ruleIds: readonly string[];
  answerText: string;
  workedSolution: string;
};

export type LoneJudgeResult =
  | { undetermined: false; scores: AxisScores; rationale: string }
  | { undetermined: true; reason: string };

function buildLoneJudgePrompt(input: Omit<LoneJudgeInput, "client" | "judgeModel">): string {
  return [
    "You are grading one Magic: The Gathering rules answer against a published official reference answer.",
    "The reference answer is authoritative. Your task is agreement with it, not independent adjudication from your own rules knowledge.",
    "You are not told which model produced this answer or what retrieval settings were used -- score only what is written below.",
    "",
    `Question: ${input.question}`,
    `Rule ids attached to the prompt: ${input.ruleIds.join(", ") || "(none)"}`,
    `Reference answer (published, authoritative): ${input.workedSolution}`,
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
  try {
    const response = await input.client.responses.create({
      model: input.judgeModel,
      input: buildLoneJudgePrompt(input)
    });
    responseText = response.output_text ?? "";
  } catch (error) {
    return { undetermined: true, reason: `judge call failed: ${error instanceof Error ? error.message : String(error)}` };
  }

  const parsed = parseLoneJudgeResponse(responseText);
  if (!parsed) {
    return { undetermined: true, reason: "judge response was not valid scored JSON" };
  }
  return { undetermined: false, scores: parsed.scores, rationale: parsed.rationale };
}

export type BlindRankingEntry = { modelId: string; answerText: string };

export type BlindRankingInput = {
  client: JudgeClient;
  judgeModel: string;
  question: string;
  workedSolution: string;
  answers: readonly BlindRankingEntry[];
  /**
   * Overrides the shuffled presentation order (a permutation of indices into
   * `answers`), for deterministic tests. Defaults to a real random shuffle.
   */
  shuffleIndices?: number[];
};

export type BlindRankingResult =
  | { undetermined: false; ranks: Record<string, number>; rationale?: string }
  | { undetermined: true; reason: string };

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

function buildRankingPrompt(params: {
  question: string;
  workedSolution: string;
  labeledAnswers: Array<{ label: string; answerText: string }>;
}): string {
  return [
    "You are ranking multiple Magic: The Gathering rules answers to the SAME question against a published official reference answer.",
    "You are not told which model produced any answer, or in what order they were originally generated -- the labels below are arbitrary and shuffled.",
    "",
    `Question: ${params.question}`,
    `Reference answer (published, authoritative): ${params.workedSolution}`,
    "",
    "Answers to rank, by agreement with the reference (best to worst):",
    ...params.labeledAnswers.map(({ label, answerText }) => `Answer ${label}: ${answerText}`),
    "",
    'Respond with ONLY a JSON object, no prose outside it, no code fence, in the exact shape:',
    `{"ranks": {${params.labeledAnswers.map(({ label }) => `"${label}": <integer rank, 1 = best>`).join(", ")}}}`
  ].join("\n");
}

function parseRankingResponse(text: string, expectedLabels: readonly string[]): Record<string, number> | null {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;
  const ranks = (parsed as Record<string, unknown>).ranks;
  if (!ranks || typeof ranks !== "object") return null;

  const ranksRecord = ranks as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const label of expectedLabels) {
    const value = ranksRecord[label];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return null;
    result[label] = value;
  }
  return result;
}

/**
 * The blind side-by-side rank (REQ-186 layer 2b): for one gold case at one
 * excerpt cap, once every answer has been scored alone, this sees all
 * answers together with model labels hidden and order shuffled per case, and
 * ranks them by agreement with the reference. The harness -- never the
 * judge -- knows which shuffled label maps to which real model id, so the
 * mapping back is always recoverable.
 */
export async function judgeBlindRanking(input: BlindRankingInput): Promise<BlindRankingResult> {
  const order = input.shuffleIndices ?? defaultShuffleIndices(input.answers.length);
  if (order.length !== input.answers.length) {
    return { undetermined: true, reason: "shuffleIndices length must match the number of answers" };
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
  try {
    const response = await input.client.responses.create({
      model: input.judgeModel,
      input: buildRankingPrompt({ question: input.question, workedSolution: input.workedSolution, labeledAnswers })
    });
    responseText = response.output_text ?? "";
  } catch (error) {
    return {
      undetermined: true,
      reason: `judge ranking call failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  const parsedRanks = parseRankingResponse(responseText, labels);
  if (!parsedRanks) {
    return { undetermined: true, reason: "judge ranking response was not valid ranked JSON" };
  }

  const ranks: Record<string, number> = {};
  for (const [label, rank] of Object.entries(parsedRanks)) {
    const modelId = labelToModelId.get(label);
    if (modelId) ranks[modelId] = rank;
  }
  return { undetermined: false, ranks };
}
