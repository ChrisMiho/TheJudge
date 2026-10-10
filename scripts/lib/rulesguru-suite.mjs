// The local practice suite's one folder, its ignore guard, and the shared case
// filters and selection (REQ-232). Used with permission, local only.
//
// Every piece of suite data -- raw questions, converted cases, run output and
// per-question results -- lives under SUITE_DIR, a gitignored folder that is
// never committed. Every suite command calls assertSuiteIgnored() first and
// refuses to write until git reports the folder ignored. The retrieval check
// and the answer run both select cases through selectSuiteCases(), so the
// filters mean the same thing in both.
//
// Nothing here reads SUITE_DIR on import; tests pass a temporary folder.

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { seededSample } from "./answer-quality-run.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The one suite folder (B2). Every suite command resolves its paths from this constant. */
export const SUITE_DIR = join(repoRoot, "output/rulesguru");
/** The `.gitignore` line that must exist before any suite command writes. */
export const SUITE_IGNORE_LINE = "output/rulesguru/";

export const SUITE_LEVELS = ["0", "1", "2", "3", "corner"];
export const SUITE_COMPLEXITIES = ["simple", "intermediate", "complicated"];
export const UNSUPPORTED_TAG = "Unsupported answers";

/** Real check: does git report `targetPath` ignored? Exit status 0 means ignored. */
export function gitCheckIgnore(targetPath, { cwd = repoRoot } = {}) {
  const result = spawnSync("git", ["check-ignore", "-q", targetPath], { cwd });
  return result.status === 0;
}

/**
 * Refuses (throws) unless git reports the suite folder ignored. `checkIgnore`
 * is injectable so a test can report "not ignored" without touching git.
 */
export function assertSuiteIgnored({ suiteDir = SUITE_DIR, checkIgnore = gitCheckIgnore } = {}) {
  const probe = join(suiteDir, "raw", "probe.json");
  if (!checkIgnore(probe)) {
    throw new Error(
      `Refusing to touch the suite folder ${suiteDir}: git does not report it ignored. ` +
        `Add the line "${SUITE_IGNORE_LINE}" to .gitignore first, so suite data can never be committed.`
    );
  }
}

function realpathOfDeepestExisting(target) {
  let current = resolve(target);
  const tail = [];
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) break;
    tail.unshift(current.slice(parent.length + 1));
    current = parent;
  }
  return join(realpathSync(current), ...tail);
}

/**
 * Returns the resolved target when it is exactly `suiteDir` or inside it,
 * and throws otherwise. Symlinks are resolved first, so a link that points
 * out of the folder, a `..` parent path and a sibling folder are all refused.
 */
export function resolveInsideSuite(target, { suiteDir = SUITE_DIR } = {}) {
  const root = realpathOfDeepestExisting(suiteDir);
  const resolved = realpathOfDeepestExisting(target);
  const rel = relative(root, resolved);
  if (rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))) return resolved;
  throw new Error(`Refusing ${target}: it is not the suite folder or inside it (${suiteDir}).`);
}

function toList(value) {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
}

/**
 * Validates and normalizes the shared suite filters. Values within one flag
 * are or-ed; flags are and-ed. Throws on a value outside the allowed set.
 */
export function normalizeSuiteFilters({ level, complexity, suiteTag, includeUnsupported = false } = {}) {
  const levels = toList(level).map((entry) => entry.toLowerCase());
  for (const entry of levels) {
    if (!SUITE_LEVELS.includes(entry)) throw new Error(`--level must be one of ${SUITE_LEVELS.join(", ")}, got "${entry}"`);
  }
  const complexities = toList(complexity).map((entry) => entry.toLowerCase());
  for (const entry of complexities) {
    if (!SUITE_COMPLEXITIES.includes(entry)) {
      throw new Error(`--complexity must be one of ${SUITE_COMPLEXITIES.join(", ")}, got "${entry}"`);
    }
  }
  return { levels, complexities, tags: toList(suiteTag), includeUnsupported: includeUnsupported === true };
}

function hasTag(caseEntry, tag) {
  const wanted = tag.toLowerCase();
  return (caseEntry.suite?.tags ?? []).some((entry) => String(entry).toLowerCase() === wanted);
}

/**
 * Selects suite cases. Drops excluded cases and (unless `includeUnsupported`)
 * cases tagged `Unsupported answers`, then applies the level, complexity and
 * tag filters, then drops stale cases (`isStale(caseEntry)`), and finally
 * takes a seeded sample when `sample` is given. Returns the selection and the
 * counts of what each step dropped.
 */
export function selectSuiteCases(cases, filters = normalizeSuiteFilters(), { isStale = () => false, sample, seed = 0 } = {}) {
  const counts = { total: cases.length, excluded: 0, unsupported: 0, filteredOut: 0, stale: 0, selected: 0 };
  let kept = [];
  for (const caseEntry of cases) {
    if (caseEntry.suite?.excluded) {
      counts.excluded += 1;
      continue;
    }
    if (!filters.includeUnsupported && hasTag(caseEntry, UNSUPPORTED_TAG)) {
      counts.unsupported += 1;
      continue;
    }
    const levelOk = filters.levels.length === 0 || filters.levels.includes(String(caseEntry.suite?.level).toLowerCase());
    const complexityOk =
      filters.complexities.length === 0 || filters.complexities.includes(String(caseEntry.suite?.complexity).toLowerCase());
    const tagOk = filters.tags.length === 0 || filters.tags.some((tag) => hasTag(caseEntry, tag));
    if (!(levelOk && complexityOk && tagOk)) {
      counts.filteredOut += 1;
      continue;
    }
    if (isStale(caseEntry)) {
      counts.stale += 1;
      continue;
    }
    kept.push(caseEntry);
  }
  kept.sort((a, b) => a.id.localeCompare(b.id));
  if (sample !== undefined && sample !== null) kept = seededSample(kept, sample, seed);
  counts.selected = kept.length;
  return { selected: kept, counts };
}
