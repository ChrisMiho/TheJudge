// Answer-quality run artifact (REQ-189).
//
// Splits a run's output the way the repo already splits this kind of thing:
// a small committed, numbers-and-metadata-only scores file
// (results.json, shaped after apps/backend/src/eval/benchmark/results.json),
// and full prose transcripts in a gitignored folder (output/answer-quality/,
// alongside output/prompt-preview/, output/retrieval-relevance-report.txt,
// and output/combo-answer-quality/). Nothing here is ever asserted
// byte-for-byte against a stored answer; the committed file is a record, not
// a test. The writer replaces the committed file on each recorded run; it
// never appends -- run-to-run history is the file's git history.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AxisScores } from "./rubric.js";

export type RunMetadata = {
  goldSetCaseIds: string[];
  goldSetTier1Count: number;
  goldSetTier2Count: number;
  answerModelLineup: string[];
  judgeModel: string;
  judgeMatchesAnswerModel: boolean;
  rubricRevision: string;
  askAiProvider: string;
  embeddingProvider: string;
  gitCommit: string;
  /** UTC ISO-8601 timestamp. */
  generatedAt: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
};

/** One leg is one answer model at one excerpt cap (REQ-189). */
export type LegSummary = {
  model: string;
  excerptCap: number;
  /** Count of this leg's gold cases scoring Correctness 2 -- the only headline figure (REQ-187). */
  fullyCorrectCount: number;
  caseCount: number;
};

export type CaseLegScore = {
  caseId: string;
  model: string;
  excerptCap: number;
  undetermined: boolean;
  /** Present only when `undetermined` is false. */
  scores?: AxisScores;
  namesGoldRuleId: boolean;
  promptChars: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  /** This leg's model's rank among every model's answer to this case at this cap (1 = best), from the blind ranking pass. Null when undetermined. */
  blindRank: number | null;
};

export type AnswerQualityResults = {
  runMetadata: RunMetadata;
  legs: LegSummary[];
  caseLegScores: CaseLegScore[];
};

const NO_PROSE_FIELDS = ["answer", "answerText", "rationale", "promptText", "prompt", "workedSolution"] as const;

/**
 * The committed file carries no model prose (REQ-189): no answer text, no
 * judge rationale, no prompt text. Recursively checks every object key in
 * the given value against the disallowed field names.
 */
export function assertNoProse(value: unknown, path = "results"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProse(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((NO_PROSE_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`${path}.${key} is disallowed model prose in the committed artifact (REQ-189)`);
    }
    assertNoProse(nested, `${path}.${key}`);
  }
}

/** Writes the committed scores file, replacing it (never appending). Throws if the record contains prose. */
export async function writeResultsFile(results: AnswerQualityResults, resultsPath: string): Promise<void> {
  assertNoProse(results);
  await mkdir(dirname(resultsPath), { recursive: true });
  await writeFile(resultsPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
}

export async function readResultsFile(resultsPath: string): Promise<AnswerQualityResults> {
  const raw = await readFile(resultsPath, "utf8");
  return JSON.parse(raw) as AnswerQualityResults;
}

/** Every field REQ-189 requires the committed artifact to carry. */
export function validateResultsShape(results: AnswerQualityResults): string[] {
  const problems: string[] = [];
  const metadataFields: Array<keyof RunMetadata> = [
    "goldSetCaseIds",
    "goldSetTier1Count",
    "goldSetTier2Count",
    "answerModelLineup",
    "judgeModel",
    "judgeMatchesAnswerModel",
    "rubricRevision",
    "askAiProvider",
    "embeddingProvider",
    "gitCommit",
    "generatedAt",
    "totalInputTokens",
    "totalOutputTokens",
    "totalCostUsd"
  ];
  for (const field of metadataFields) {
    if (results.runMetadata[field] === undefined) problems.push(`runMetadata.${field} is missing`);
  }
  if (!Array.isArray(results.legs)) problems.push("legs must be an array");
  if (!Array.isArray(results.caseLegScores)) problems.push("caseLegScores must be an array");
  return problems;
}

export type FullTranscript = {
  caseId: string;
  model: string;
  excerptCap: number;
  question: string;
  promptText: string;
  answerText: string;
  workedSolution: string;
  assertions: { namesGoldRuleId: boolean; nonEmpty: boolean; length: number };
  scores?: AxisScores;
  undetermined: boolean;
  rationale?: string;
};

export type RankingTranscript = {
  caseId: string;
  excerptCap: number;
  ranks: Record<string, number>;
  undetermined: boolean;
  reason?: string;
};

function transcriptFileName(caseId: string, model: string, excerptCap: number): string {
  const safeModel = model.replace(/[^a-z0-9.-]/gi, "_");
  return `${caseId}--${safeModel}--cap${excerptCap}.json`;
}

function rankingFileName(caseId: string, excerptCap: number): string {
  return `${caseId}--cap${excerptCap}--ranking.json`;
}

/** Writes one case-per-leg transcript (prompt, answer, reference, assertions, axis scores, rationale) to the gitignored output directory. */
export async function writeTranscript(transcript: FullTranscript, outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const filePath = join(outputDir, transcriptFileName(transcript.caseId, transcript.model, transcript.excerptCap));
  await writeFile(filePath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  return filePath;
}

/** Writes one case-per-cap blind-ranking transcript (rationale, per-model ranks) to the gitignored output directory. */
export async function writeRankingTranscript(transcript: RankingTranscript, outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const filePath = join(outputDir, rankingFileName(transcript.caseId, transcript.excerptCap));
  await writeFile(filePath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  return filePath;
}

export type ComparisonResult =
  | { comparable: false; reason: string }
  | { comparable: true; kind: "identical-lineup" }
  | { comparable: true; kind: "model-comparison"; sharedModels: string[]; onlyInA: string[]; onlyInB: string[] };

/**
 * Two runs differing only in answer-model lineup are a deliberate **model
 * comparison** (never incomparable) -- a bake-off is this instrument's first
 * intended use. A difference in gold set, judge model, rubric revision, or
 * `EMBEDDING_PROVIDER` makes them **incomparable** instead of presenting a
 * misleading delta.
 */
export function compareRuns(a: RunMetadata, b: RunMetadata): ComparisonResult {
  const sameGoldSet =
    a.goldSetCaseIds.length === b.goldSetCaseIds.length &&
    [...a.goldSetCaseIds].sort().every((id, index) => id === [...b.goldSetCaseIds].sort()[index]);
  if (!sameGoldSet) return { comparable: false, reason: "gold sets differ" };
  if (a.judgeModel !== b.judgeModel) return { comparable: false, reason: "judge models differ" };
  if (a.rubricRevision !== b.rubricRevision) return { comparable: false, reason: "rubric revisions differ" };
  if (a.embeddingProvider !== b.embeddingProvider) return { comparable: false, reason: "EMBEDDING_PROVIDER differs" };

  const aModels = new Set(a.answerModelLineup);
  const bModels = new Set(b.answerModelLineup);
  const sharedModels = a.answerModelLineup.filter((model) => bModels.has(model));
  const onlyInA = a.answerModelLineup.filter((model) => !bModels.has(model));
  const onlyInB = b.answerModelLineup.filter((model) => !aModels.has(model));

  if (onlyInA.length === 0 && onlyInB.length === 0) {
    return { comparable: true, kind: "identical-lineup" };
  }
  return { comparable: true, kind: "model-comparison", sharedModels, onlyInA, onlyInB };
}
