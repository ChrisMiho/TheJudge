// Shared gold-case loader and validator (REQ-185).
//
// Both the retrieval check (scripts/eval-worked-solutions.mjs) and the
// answer-quality run (scripts/eval-answer-quality.mjs) read gold cases
// through this one module, so the two never diverge into separate readers of
// the same committed files.
//
// A gold case is valid only when it carries: a non-empty `question`, a
// non-empty `workedSolution` (its published, citable reference answer), a
// `tier` of `1` or `2`, a `source` block naming publisher and licensing plus
// the citation its tier requires (a rule id for tier 1; card name, oracle id,
// and ruling date for tier 2), and at least one `expectedSupplementalRuleIds`
// entry. A malformed case fails loudly -- loadGoldCases() throws, naming
// every problem -- rather than silently scoring as a retrieval miss.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CASES_DIR = join(repoRoot, "apps/backend/src/eval/worked-solutions");

/**
 * The six worked-solution cases already committed before this package;
 * REQ-185 requires the gold set to hold at least these, each tier 1.
 */
export const REQUIRED_SIX_CASE_IDS = [
  "delayed-trigger-created-too-late",
  "illegal-target-partial-resolution",
  "last-known-information-simultaneous-sba",
  "layers-timestamp-order",
  "replacement-effect-single-application",
  "state-based-actions-mid-resolution"
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates one gold case object against the four-field test. Returns an
 * explicit `{ valid, errors }` result -- never a silent pass -- so a caller
 * can fail loudly rather than treat a malformed case as a retrieval miss.
 */
export function validateGoldCase(caseEntry) {
  const errors = [];
  const id = typeof caseEntry?.id === "string" && caseEntry.id.length > 0 ? caseEntry.id : "<missing id>";

  if (!isNonEmptyString(caseEntry?.id)) {
    errors.push(`${id}: missing non-empty "id"`);
  }
  if (!isNonEmptyString(caseEntry?.question)) {
    errors.push(`${id}: missing non-empty "question"`);
  }
  if (!isNonEmptyString(caseEntry?.workedSolution)) {
    errors.push(`${id}: missing non-empty "workedSolution"`);
  }
  if (caseEntry?.tier !== 1 && caseEntry?.tier !== 2) {
    errors.push(`${id}: "tier" must be 1 or 2, got ${JSON.stringify(caseEntry?.tier)}`);
  }
  if (!Array.isArray(caseEntry?.expectedSupplementalRuleIds) || caseEntry.expectedSupplementalRuleIds.length === 0) {
    errors.push(`${id}: needs at least one "expectedSupplementalRuleIds" entry`);
  }
  if (!isNonEmptyString(caseEntry?.whyHard)) {
    errors.push(`${id}: missing non-empty "whyHard"`);
  }

  const source = caseEntry?.source;
  if (!source || typeof source !== "object") {
    errors.push(`${id}: missing "source" block`);
  } else {
    if (!isNonEmptyString(source.publisher)) {
      errors.push(`${id}: source.publisher must be non-empty`);
    }
    if (!isNonEmptyString(source.license)) {
      errors.push(`${id}: source.license must be non-empty`);
    }
    if (caseEntry?.tier === 1) {
      if (!isNonEmptyString(source.ruleId)) {
        errors.push(`${id}: tier 1 source needs a non-empty "ruleId" citation`);
      }
    } else if (caseEntry?.tier === 2) {
      if (!isNonEmptyString(source.cardName)) {
        errors.push(`${id}: tier 2 source needs a non-empty "cardName" citation`);
      }
      if (!isNonEmptyString(source.oracleId)) {
        errors.push(`${id}: tier 2 source needs a non-empty "oracleId" citation`);
      }
      if (!isNonEmptyString(source.rulingDate)) {
        errors.push(`${id}: tier 2 source needs a non-empty "rulingDate" citation`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Reads every `*.case.json` file in the gold-set directory, sorted by filename, unvalidated. */
export async function readCaseFiles(casesDir = CASES_DIR) {
  const fileNames = (await readdir(casesDir)).filter((name) => name.endsWith(".case.json")).sort();
  const entries = [];
  for (const fileName of fileNames) {
    const parsed = JSON.parse(await readFile(join(casesDir, fileName), "utf8"));
    entries.push({ fileName, case: parsed });
  }
  return entries;
}

/**
 * Loads and validates every gold case in `casesDir`. Throws, naming every
 * invalid case and its errors, rather than returning a malformed case that
 * would silently score as a miss downstream.
 */
export async function loadGoldCases(casesDir = CASES_DIR) {
  const entries = await readCaseFiles(casesDir);
  const problems = [];
  const cases = [];
  for (const { fileName, case: caseEntry } of entries) {
    const { valid, errors } = validateGoldCase(caseEntry);
    if (!valid) {
      problems.push(`${fileName}: ${errors.join("; ")}`);
    } else {
      cases.push(caseEntry);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Invalid gold case(s):\n${problems.join("\n")}`);
  }
  return cases;
}
