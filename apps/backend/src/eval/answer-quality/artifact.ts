// Answer-quality run artifact (REQ-189).
//
// Splits a run's output the way the repo already splits this kind of thing:
// a small committed, numbers-and-metadata-only scores file
// (results.json, shaped after apps/backend/src/eval/benchmark/results.json),
// and full prose transcripts in a gitignored folder (output/answer-quality/,
// alongside output/prompt-preview/, output/retrieval-relevance-report.txt,
// and output/combo-answer-quality/). Nothing here is ever asserted
// byte-for-byte against a stored answer; the committed file is a record, not
// a test. `writeResultsFile` writes whatever it is handed; the run command
// (scripts/eval-answer-quality.mjs) hands it the previous file's records merged
// per case with the cases it just graded, so a partial run never erases a case
// it did not grade. Run-to-run history is the file's git history.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AxisScores } from "./rubric.js";

export type RunMetadata = {
  /** The cases the latest run selected and graded (a partial run names only those). */
  goldSetCaseIds: string[];
  goldSetTier1Count: number;
  goldSetTier2Count: number;
  /** Tier 3 is the owner's own bucket, counted apart from the official tiers (REQ-185). Absent in a record written before tier 3 existed. */
  goldSetTier3Count?: number;
  /** How the latest run chose its cases: `changed`, `all`, `tag:<tag>`, `tier:<n>` or `sample:<n>@<seed>` (REQ-188). */
  selectionMode?: string;
  answerModelLineup: string[];
  judgeModel: string;
  judgeMatchesAnswerModel: boolean;
  rubricRevision: string;
  askAiProvider: string;
  embeddingProvider: string;
  gitCommit: string;
  /** UTC ISO-8601 timestamp. */
  generatedAt: string;
  /** Answer-call token use and cost: the answer models' share of the run (REQ-188). */
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Answer calls plus judge calls. Records written before judge usage was recorded carry the answer calls alone. */
  totalCostUsd: number;
  /** Judge token use (lone judge and blind ranking), shown apart from the answer calls. Absent in an older record. */
  judgeInputTokens?: number;
  judgeOutputTokens?: number;
  answerCostUsd?: number;
  judgeCostUsd?: number;
  /** Whether the evaluation prompt loader loaded the Commander Spellbook combo catalog, as production does by default (REQ-188). */
  comboCatalogLoaded?: boolean;
  /** The answer client's timeout and retry count: the SDK defaults, recorded as such (REQ-188). */
  answerClientTimeoutMs?: number | string;
  answerClientMaxRetries?: number | string;
  /** Reasoning tokens inside the output totals (REQ-227 counts them as output). */
  totalReasoningTokens?: number;
  judgeReasoningTokens?: number;
  /** Models with no rate in the run's rate table; their cost is not in the totals, never counted as $0 (REQ-227). */
  unpricedModels?: string[];
};

/** The count REQ-187's headline reports for one group of tiers at one leg. */
export type HeadlineCounts = {
  /** Approved, non-stale cases whose latest record was judged against the current reference answer and scored Correctness 2. */
  fullyCorrect: number;
  /** Approved, non-stale cases with such a record. */
  graded: number;
  /** Approved, non-stale cases with no such record: never graded, last graded against another reference answer, or a record without hashes. */
  ungraded: number;
};

/** One leg is one answer model at one excerpt cap (REQ-189). */
export type LegSummary = {
  model: string;
  excerptCap: number;
  /** Count of this leg's recorded cases scoring Correctness 2. */
  fullyCorrectCount: number;
  caseCount: number;
  /** REQ-187's headline: tiers 1 and 2 together, tier 3 apart, and the stale count. Absent in a record written before the per-tier headline. */
  headline?: { official: HeadlineCounts; tier3: HeadlineCounts; stale: number };
};

export type CaseLegScore = {
  caseId: string;
  model: string;
  excerptCap: number;
  /** The case's tier when it was graded. Absent in a record written before tier 3. */
  tier?: 1 | 2 | 3;
  undetermined: boolean;
  /** Present only when `undetermined` is false. */
  scores?: AxisScores;
  namesGoldRuleId: boolean;
  /** Cited Comprehensive Rules ids the committed rule index lacks (worded "not in the committed rule index", never "made up": the index can lag the newest rules). */
  unknownRuleIds?: string[];
  /** Whether one of the case's deciding rule ids was among the System 3 excerpts the prompt carried (from the enrichment debug block). */
  goldRuleInPrompt?: boolean;
  /** Whether every deciding rule's text appears anywhere in the final prompt -- curated topic, supplemental excerpt, or card ruling (REQ-229's check). */
  allDecidingRulesInPrompt?: boolean;
  promptChars: number;
  /** SHA-256 of the assembled prompt text. A record without it is selected again by `--changed` and counts as ungraded. */
  promptHash?: string;
  /** SHA-256 of the case's `expected.answer` it was judged against. A record without it counts as ungraded. */
  referenceAnswerHash?: string;
  inputTokens: number;
  outputTokens: number;
  /** The lone judge call's token use, shown apart from the answer call's. */
  judgeInputTokens?: number;
  judgeOutputTokens?: number;
  /** Reasoning tokens inside `outputTokens` / `judgeOutputTokens` (the provider bills them as output). */
  reasoningTokens?: number;
  judgeReasoningTokens?: number;
  /** The reasoning effort the provider reported for the answer, when it reported one (no effort parameter is ever sent). */
  reportedEffort?: string | null;
  /** True when the answer or judge model has no rate: the cost is unknown, never $0 (REQ-227). */
  unpriced?: boolean;
  latencyMs: number;
  /** This leg's model's rank among every model's answer to this case at this cap (1 = best), from the blind ranking pass. Null when undetermined or when only one model answered. */
  blindRank: number | null;
  /** What the record was judged under, so a later record is comparable per case. */
  judgeModel?: string;
  rubricRevision?: string;
  embeddingProvider?: string;
  /** UTC ISO-8601 timestamp and short git commit of the run that wrote this record. */
  gradedAt?: string;
  commit?: string;
};

export type AnswerQualityResults = {
  runMetadata: RunMetadata;
  legs: LegSummary[];
  caseLegScores: CaseLegScore[];
};

// `workedSolution` stays on the list on purpose (REQ-189): the version-1 name of
// a case's reference answer must never leak into the committed file, and
// `shortAnswer` is the version-2 one-line reviewer summary, which is prose too.
const NO_PROSE_FIELDS = [
  "answer",
  "answerText",
  "shortAnswer",
  "rationale",
  "promptText",
  "prompt",
  "workedSolution"
] as const;

/**
 * The committed file carries no model prose (REQ-189): no answer text, no
 * judge rationale, no prompt text, no case summary. Recursively checks every
 * object key in the given value against the disallowed field names.
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

/** Writes the file it is handed (the caller merges per case first), replacing the old one. Throws if the record contains prose. */
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
  /** The cards attached to the request (every card the case names, by oracle id); empty for a bare question. */
  cards?: Array<{ cardId: string; name: string }>;
  /** What System 3 did for this prompt: semantic or lexical, which excerpts it attached, whether a gold rule was among them. */
  retrieval?: { usedSemantic: boolean; selectedRuleIds: string[]; goldRuleInPrompt: boolean; allDecidingRulesInPrompt?: boolean };
  promptText: string;
  answerText: string;
  /** The transcript key for the case's reference answer (`expected.answer`); gitignored, never in the committed file. */
  workedSolution: string;
  assertions: { namesGoldRuleId: boolean; nonEmpty: boolean; length: number; unknownRuleIds?: string[] };
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
  rationale?: string;
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

export type RecordComparison =
  | { comparable: false; reason: string }
  | { comparable: true; kind: "same-model" }
  | { comparable: true; kind: "model-comparison"; models: [string, string] };

/**
 * REQ-189: records are compared per case, because a partial run grades only
 * some cases. Two records of the same case are **incomparable** when they were
 * judged against different reference answers or under a different judge model,
 * rubric revision, or `EMBEDDING_PROVIDER`; records that differ only in answer
 * model are a deliberate **model comparison**. A field a record never carried
 * (every record written before the per-case fields) compares as unknown, so it
 * is never claimed comparable to a record that carries it.
 */
export function compareRecords(a: CaseLegScore, b: CaseLegScore): RecordComparison {
  if (a.referenceAnswerHash !== b.referenceAnswerHash) {
    return { comparable: false, reason: "reference answers differ" };
  }
  if (a.judgeModel !== b.judgeModel) return { comparable: false, reason: "judge models differ" };
  if (a.rubricRevision !== b.rubricRevision) return { comparable: false, reason: "rubric revisions differ" };
  if (a.embeddingProvider !== b.embeddingProvider) return { comparable: false, reason: "EMBEDDING_PROVIDER differs" };
  if (a.model !== b.model) return { comparable: true, kind: "model-comparison", models: [a.model, b.model] };
  return { comparable: true, kind: "same-model" };
}
