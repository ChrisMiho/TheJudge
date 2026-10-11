// Converts frozen raw suite questions into local draft cases (REQ-232).
// Used with permission, local only.
//
// Reads only `raw/` under the suite folder and committed repo data (passed in
// as `cardNames` and `sources`); makes no network call. Deterministic: the same
// inputs give the same bytes. Writes `cases/rulesguru-<id>.case.json` in the
// format version 2 shape (REQ-185) with `tier` "external", and a counts-and-
// reasons report. A case that cannot be used in a run is still written, with
// `suite.excluded` naming why, and is never selected.
//
// The raw API fields this reads: `id`, `level`, `complexity`, `tags`,
// `includedCards` (each with a `name`), `questionSimple`, `answerSimple` and
// `citedRules` (a map of rule id to text). A missing field throws, naming the
// file, so an API shape change breaks convert and never the frozen data.

import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { computeSnapshot } from "./gold-cases.mjs";
import { mapCitedRules, ruleIdsOf } from "./rulesguru-rules.mjs";

export const SUITE_NAME = "rulesguru";
export const SUITE_PUBLISHER = "RulesGuru";
export const SUITE_LICENSE = "used with permission, local only";
export const EXCLUSION_REASONS = [
  "unresolved-card",
  "ambiguous-card",
  "no-cited-rule",
  "unknown-rule",
  "duplicate-question",
  "duplicate-answer"
];

/**
 * The shared loader's answer-source key (`scripts/lib/gold-cases.mjs`): the
 * sorted card oracle ids plus the answer text. Two selectable cases with the
 * same key make the loader refuse the whole suite, so the later one is excluded.
 */
function answerKeyOf(caseEntry) {
  const cardKey = caseEntry.cards
    .map((card) => card.oracleId)
    .sort()
    .join(",");
  return `${cardKey}|${caseEntry.expected.answer}`;
}

function normalizeQuestion(text) {
  return String(text).replace(/\s+/g, " ").trim().toLowerCase();
}

/** First sentence of an answer; the whole answer when it has no sentence end. */
export function firstSentence(text) {
  const trimmed = String(text).trim();
  const match = /^[\s\S]+?[.!?](?=\s|$)/.exec(trimmed);
  return match ? match[0] : trimmed;
}

function normalizeLevel(level) {
  const text = String(level).trim().toLowerCase();
  if (/corner/.test(text) || text === "4") return "corner";
  return /^\d+$/.test(text) ? Number(text) : text;
}

function fail(fileName, problem) {
  throw new Error(`Cannot convert ${fileName}: ${problem}`);
}

/** Validates the raw fields convert reads; throws on a missing one. */
export function readRawQuestion(raw, fileName) {
  if (raw === null || typeof raw !== "object") fail(fileName, "the file is not a JSON object");
  if (!/^\d+$/.test(String(raw.id ?? ""))) fail(fileName, 'missing field "id"');
  for (const field of ["questionSimple", "answerSimple", "complexity"]) {
    if (typeof raw[field] !== "string" || raw[field].trim() === "") fail(fileName, `missing field "${field}"`);
  }
  if (raw.level === undefined || raw.level === null || String(raw.level).trim() === "") fail(fileName, 'missing field "level"');
  if (!Array.isArray(raw.tags)) fail(fileName, 'missing field "tags"');
  if (!Array.isArray(raw.includedCards)) fail(fileName, 'missing field "includedCards"');
  if (raw.citedRules === null || typeof raw.citedRules !== "object" || Array.isArray(raw.citedRules)) {
    fail(fileName, 'missing field "citedRules"');
  }
  const tags = raw.tags.map((tag) => (typeof tag === "string" ? tag : tag?.name));
  if (!tags.every((tag) => typeof tag === "string" && tag !== "")) fail(fileName, 'field "tags" holds an entry with no name');
  const cardNames = raw.includedCards.map((card) => card?.name);
  if (!cardNames.every((name) => typeof name === "string" && name.trim() !== "")) fail(fileName, 'field "includedCards" holds a card with no name');
  return {
    id: Number(raw.id),
    level: normalizeLevel(raw.level),
    complexity: raw.complexity.trim().toLowerCase(),
    tags,
    cardNames,
    question: raw.questionSimple.trim(),
    answer: raw.answerSimple.trim(),
    citedRuleIds: Object.keys(raw.citedRules)
  };
}

/**
 * Builds one case object from a read question. `duplicateOf` is the lower id
 * with the same normalized question text, or null.
 */
export function buildCase(question, { cardNames, indexIds, snapshotSources, duplicateOf }) {
  const cards = [];
  let unresolved = false;
  let ambiguous = false;
  for (const name of question.cardNames) {
    const found = cardNames.lookup(name);
    if (found.status === "resolved") {
      if (!cards.some((card) => card.oracleId === found.oracleId)) cards.push({ oracleId: found.oracleId, name: found.name });
    } else if (found.status === "ambiguous") {
      ambiguous = true;
    } else {
      unresolved = true;
    }
  }
  const { groups, unknown } = mapCitedRules(question.citedRuleIds, indexIds);

  let excluded = null;
  if (unresolved) excluded = "unresolved-card";
  else if (ambiguous) excluded = "ambiguous-card";
  else if (question.citedRuleIds.length === 0) excluded = "no-cited-rule";
  else if (unknown.length > 0) excluded = "unknown-rule";
  else if (duplicateOf !== null) excluded = "duplicate-question";

  const decidingRuleIds = [...new Set(groups.flat())];
  const caseEntry = {
    id: `rulesguru-${question.id}`,
    formatVersion: 2,
    tier: "external",
    review: { status: "draft", reviewedOn: null },
    cards,
    gameState: null,
    question: question.question,
    expected: {
      outcome: null,
      shortAnswer: firstSentence(question.answer),
      answer: question.answer,
      decidingRuleIds
    },
    suite: {
      name: SUITE_NAME,
      questionId: question.id,
      level: question.level,
      complexity: question.complexity,
      tags: question.tags,
      citedRuleIds: question.citedRuleIds,
      ruleGroups: groups,
      excluded
    },
    source: { authority: "external-unapproved", publisher: SUITE_PUBLISHER, license: SUITE_LICENSE, questionId: question.id },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    whyHard: `external practice question, level ${question.level}, ${question.complexity}`
  };
  caseEntry.snapshot = computeSnapshot(caseEntry, snapshotSources);
  return caseEntry;
}

async function writeWhole(path, text) {
  const temp = `${path}.tmp-${process.pid}`;
  await writeFile(temp, text, "utf8");
  await rename(temp, path);
}

/**
 * Converts every `raw/<id>.json` under `suiteDir` into `cases/` and writes
 * `convert-report.txt`. `sources` is the snapshot sources (with `ruleIndex`);
 * `cardNames` is a buildCardNameIndex() result. Returns the counts.
 */
export async function convertSuite({ suiteDir, cardNames, sources }) {
  const rawDir = join(suiteDir, "raw");
  const casesDir = join(suiteDir, "cases");
  const fileNames = (await readdir(rawDir)).filter((name) => /^\d+\.json$/.test(name)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const indexIds = ruleIdsOf(sources.ruleIndex);
  await mkdir(casesDir, { recursive: true });

  const seenQuestions = new Map();
  const seenAnswers = new Set();
  const counts = { raw: fileNames.length, converted: 0, selectable: 0, excluded: Object.fromEntries(EXCLUSION_REASONS.map((reason) => [reason, 0])) };
  const excludedList = [];
  for (const fileName of fileNames) {
    const question = readRawQuestion(JSON.parse(await readFile(join(rawDir, fileName), "utf8")), fileName);
    const key = normalizeQuestion(question.question);
    const duplicateOf = seenQuestions.has(key) ? seenQuestions.get(key) : null;
    if (duplicateOf === null) seenQuestions.set(key, question.id);

    const caseEntry = buildCase(question, { cardNames, indexIds, snapshotSources: sources, duplicateOf });
    if (caseEntry.suite.excluded === null) {
      const answerKey = answerKeyOf(caseEntry);
      if (seenAnswers.has(answerKey)) caseEntry.suite.excluded = "duplicate-answer";
      else seenAnswers.add(answerKey);
    }
    await writeWhole(join(casesDir, `${caseEntry.id}.case.json`), `${JSON.stringify(caseEntry, null, 2)}\n`);
    counts.converted += 1;
    if (caseEntry.suite.excluded) {
      counts.excluded[caseEntry.suite.excluded] += 1;
      excludedList.push(`${question.id} ${caseEntry.suite.excluded}`);
    } else {
      counts.selectable += 1;
    }
  }

  const report = [
    "Local practice-suite convert report (not committed)",
    `raw questions: ${counts.raw}`,
    `cases written: ${counts.converted}`,
    `selectable: ${counts.selectable}`,
    ...EXCLUSION_REASONS.map((reason) => `excluded ${reason}: ${counts.excluded[reason]}`),
    "",
    "excluded question ids:",
    ...excludedList,
    ""
  ].join("\n");
  await writeWhole(join(suiteDir, "convert-report.txt"), report);
  return counts;
}
