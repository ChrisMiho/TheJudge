// Mechanic coverage for the rules test corpus (REQ-223): which real Magic
// mechanics have a case, and how the corpus splits by section, tier, review
// status and outcome. Pure functions over plain data, so they run under
// `node --test` with fixture corpora -- no file system, no TypeScript loader, no
// provider, no network. scripts/rules-coverage.mjs is the command that reads the
// committed rule index, the committed excluded list and the corpus, prints the
// report and rewrites the counts-only coverage file.
//
// The mechanic list is read from the committed rule index
// (`apps/backend/data/gameRulesRuleIndex.json`), never hand-maintained: every
// distinct `701.N` (keyword action) and `702.N` (keyword ability) rule number
// other than the general rules 701.1 and 702.1. The index has no heading entry
// for a mechanic, only subrules (`702.19a`, ...), so a mechanic's name is a
// best-effort reading of its first subrule's text. A case covers a mechanic when
// one of its deciding rule ids sits under that mechanic's number (REQ-185's
// derived `mechanic:` tag).

import { OUTCOMES, REVIEW_STATUSES, mechanicPrefixes, ruleSections } from "./gold-cases.mjs";

/** Review statuses that count as covering a mechanic (A7): a rejected case does not. */
export const COVERING_STATUSES = ["draft", "approved", "needs-edit"];

function compareRuleNumbers(a, b) {
  const [aKind, aNumber] = a.split(".");
  const [bKind, bNumber] = b.split(".");
  return Number(aKind) - Number(bKind) || Number(aNumber) - Number(bNumber);
}

// A mechanic's name, as far as its first subrule's text gives one (A10: best effort, no new data
// file -- the committed index has no heading entry and the raw rules text is gitignored). Most open
// "<Name> is ..." ("702.19a Trample is a static ability ..."); keyword actions often open
// "To <verb> ..." ("701.8a To destroy a permanent ...") or quote the keyword ("“Investigate” means
// ..."). Anything else has no readable name and is listed by its number alone.
const NAME_STOP_WORDS = "a|an|the|it|that|its|their|one|each|this|two|any|your|for|up|all|target|N|means|is|are";
const NOT_A_NAME_OPENER = /^(?:To|A|An|The|If|Certain|Some|Only|One|Each|Any)\s/;

function readMechanicName(kind, firstSubruleText) {
  const text = firstSubruleText.replace(/^\d{3}\.\d+[a-z]\s+/, "");
  const isMatch = /^([A-Z∞][\w'’!-]*(?: [\w'’!-]+){0,2}?)\s+(?:is|are)\b/.exec(text);
  if (isMatch && !NOT_A_NAME_OPENER.test(isMatch[1])) return isMatch[1].trim();
  if (kind === "action") {
    const verb = new RegExp(`^To\\s+(?:“)?(.+?)(?=\\s+(?:${NAME_STOP_WORDS})\\b|\\s+\\[|”|[,.:;]|$)`).exec(text);
    if (verb) return verb[1].trim();
    const quoted = new RegExp(`^“(.+?)(?=\\s+(?:${NAME_STOP_WORDS})\\b|\\s+\\[|”|[,.:;]|$)`).exec(text);
    if (quoted) return quoted[1].trim();
    const gerund = /^([A-Z][a-z]+ing)\b/.exec(text);
    if (gerund) return gerund[1];
  }
  return null;
}

/**
 * Every real mechanic in the committed rule index, in rule-number order:
 * `{ id, kind, name }` with `id` such as `702.19`, `kind` `action` (701) or
 * `ability` (702), and `name` a best-effort reading (null when the first
 * subrule's text gives none).
 */
export function listMechanics(ruleIndex) {
  const firstSubrule = new Map();
  for (const entry of ruleIndex) {
    const match = /^(70[12])\.(\d+)[a-z]/.exec(entry.ruleId);
    if (!match) continue;
    const id = `${match[1]}.${match[2]}`;
    if (id === "701.1" || id === "702.1") continue;
    if (!firstSubrule.has(id)) firstSubrule.set(id, entry);
  }
  return [...firstSubrule.keys()].sort(compareRuleNumbers).map((id) => {
    const kind = id.startsWith("701") ? "action" : "ability";
    return { id, kind, name: readMechanicName(kind, firstSubrule.get(id).text) };
  });
}

/**
 * The committed excluded list's own checks: every entry names a rule number, a
 * name and a one-line reason. Returns the problems (empty when well formed).
 */
export function validateExcludedList(excludedFile) {
  const problems = [];
  const entries = excludedFile?.excluded;
  if (!Array.isArray(entries)) return ["the excluded list needs an `excluded` array"];
  const seen = new Set();
  for (const entry of entries) {
    if (typeof entry?.id !== "string" || !/^70[12]\.\d+$/.test(entry.id)) problems.push(`an excluded entry needs a mechanic rule number like 701.45, got ${JSON.stringify(entry?.id)}`);
    else if (seen.has(entry.id)) problems.push(`${entry.id} is excluded twice`);
    else seen.add(entry.id);
    if (typeof entry?.name !== "string" || entry.name.trim() === "") problems.push(`${entry?.id}: an excluded mechanic needs a name`);
    if (typeof entry?.reason !== "string" || entry.reason.trim() === "") problems.push(`${entry?.id}: an excluded mechanic needs a one-line reason`);
  }
  return problems;
}

function emptyOutcomes() {
  return Object.fromEntries(OUTCOMES.map((outcome) => [outcome, 0]));
}

function sortedCounts(counts) {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })));
}

/**
 * Where the corpus stands. For each mechanic: `excluded` (on the committed
 * list), else its best covering status -- `approved` if any case under it is
 * approved, else `draft`, else `needs-edit`, else `none`. Plus counts per
 * rules section, tier, review status and outcome, and per source pool (the
 * authored block a case came from, when it names one) with its own outcome
 * counts. A rejected case counts only under review status: it is excluded from
 * every other count and never covers a mechanic.
 */
export function computeCoverage({ cases, mechanics, excluded }) {
  const excludedIds = new Set(excluded.map((entry) => entry.id));
  const live = cases.filter((caseEntry) => caseEntry.review.status !== "rejected");

  const rank = { approved: 3, draft: 2, "needs-edit": 1 };
  const statusByMechanic = new Map();
  for (const caseEntry of live) {
    for (const mechanicId of mechanicPrefixes(caseEntry.expected.decidingRuleIds)) {
      const best = statusByMechanic.get(mechanicId);
      if (best === undefined || rank[caseEntry.review.status] > rank[best]) {
        statusByMechanic.set(mechanicId, caseEntry.review.status);
      }
    }
  }

  const buckets = { approved: [], draft: [], needsEdit: [], none: [], excluded: [] };
  for (const mechanic of mechanics) {
    if (excludedIds.has(mechanic.id)) buckets.excluded.push(mechanic.id);
    else {
      const status = statusByMechanic.get(mechanic.id);
      if (status === "approved") buckets.approved.push(mechanic.id);
      else if (status === "draft") buckets.draft.push(mechanic.id);
      else if (status === "needs-edit") buckets.needsEdit.push(mechanic.id);
      else buckets.none.push(mechanic.id);
    }
  }

  const sections = {};
  const tiers = {};
  const outcomes = emptyOutcomes();
  const pools = {};
  for (const caseEntry of live) {
    for (const section of ruleSections(caseEntry.expected.decidingRuleIds)) sections[section] = (sections[section] ?? 0) + 1;
    tiers[caseEntry.tier] = (tiers[caseEntry.tier] ?? 0) + 1;
    outcomes[caseEntry.expected.outcome] += 1;
    const pool = caseEntry.source?.pool;
    if (typeof pool === "string") {
      pools[pool] ??= { cases: 0, outcomes: emptyOutcomes() };
      pools[pool].cases += 1;
      pools[pool].outcomes[caseEntry.expected.outcome] += 1;
    }
  }
  const reviewStatus = Object.fromEntries(REVIEW_STATUSES.map((status) => [status, 0]));
  for (const caseEntry of cases) reviewStatus[caseEntry.review.status] += 1;

  return { buckets, sections: sortedCounts(sections), tiers: sortedCounts(tiers), reviewStatus, outcomes, pools: sortedCounts(pools) };
}

/**
 * The counts-only committed coverage file (REQ-189, REQ-223): rule numbers and
 * numbers, no prose. Deterministic for a given corpus, so the gate can compare
 * the committed file with a rebuild.
 */
export function buildCoverageFile(coverage) {
  const { buckets } = coverage;
  return {
    mechanics: {
      total: buckets.approved.length + buckets.draft.length + buckets.needsEdit.length + buckets.none.length + buckets.excluded.length,
      approved: buckets.approved,
      draft: buckets.draft,
      needsEdit: buckets.needsEdit,
      none: buckets.none,
      excluded: buckets.excluded
    },
    sections: coverage.sections,
    tiers: coverage.tiers,
    reviewStatus: coverage.reviewStatus,
    outcomes: coverage.outcomes,
    pools: coverage.pools
  };
}

/**
 * The coverage gate: every listed mechanic not on the excluded list has a case
 * (draft, approved or needs-edit), the excluded list names only rule numbers the
 * index contains, and the committed coverage file matches the corpus. It makes
 * no provider call, no network call, no embedding call. Returns `{ ok, failures,
 * coverage }`.
 */
export function checkCoverageGate({ cases, ruleIndex, excluded, committed }) {
  const failures = [];
  const mechanics = listMechanics(ruleIndex);
  const mechanicIds = new Set(mechanics.map((mechanic) => mechanic.id));
  for (const entry of excluded) {
    if (!mechanicIds.has(entry.id)) failures.push(`the excluded list names ${entry.id}, which the committed rule index does not contain`);
  }
  const coverage = computeCoverage({ cases, mechanics, excluded });
  const names = new Map(mechanics.map((mechanic) => [mechanic.id, mechanic.name]));
  for (const id of coverage.buckets.none) {
    failures.push(`mechanic ${id}${names.get(id) ? ` (${names.get(id)})` : ""} has no draft, approved or needs-edit case and is not on the excluded list`);
  }
  if (JSON.stringify(committed) !== JSON.stringify(buildCoverageFile(coverage))) {
    failures.push("the committed coverage file is out of date with the corpus (run `npm run eval:rules-coverage`)");
  }
  return { ok: failures.length === 0, failures, coverage };
}

function percent(part, whole) {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

/** The printed coverage report: mechanic x {approved, draft, none}, then the counts. */
export function formatCoverageReport({ coverage, mechanics, excluded, uncoveredLimit = 400 }) {
  const { buckets } = coverage;
  const names = new Map(mechanics.map((mechanic) => [mechanic.id, mechanic.name]));
  const label = (id) => (names.get(id) ? `${id} ${names.get(id)}` : id);
  const required = mechanics.length - buckets.excluded.length;
  const covered = buckets.approved.length + buckets.draft.length + buckets.needsEdit.length;
  const lines = [
    "RULES TEST CORPUS COVERAGE (REQ-223)",
    `Mechanics in the committed rule index: ${mechanics.length} (${mechanics.filter((m) => m.kind === "action").length} keyword actions, ${mechanics.filter((m) => m.kind === "ability").length} keyword abilities); excluded: ${buckets.excluded.length}; need a case: ${required}`,
    `Covered: ${covered} of ${required} (${percent(covered, required)}): ${buckets.approved.length} approved, ${buckets.draft.length} draft only, ${buckets.needsEdit.length} needs-edit only. Uncovered: ${buckets.none.length}.`,
    "",
    "Excluded (joke-only, owner's list):",
    ...(excluded.length === 0 ? ["  (none)"] : excluded.map((entry) => `  ${entry.id} ${entry.name}: ${entry.reason}`)),
    ""
  ];
  if (buckets.none.length > 0) {
    lines.push(`Uncovered mechanics (${buckets.none.length}; report output, not a failure here):`);
    for (const id of buckets.none.slice(0, uncoveredLimit)) lines.push(`  ${label(id)}`);
    if (buckets.none.length > uncoveredLimit) lines.push(`  ... and ${buckets.none.length - uncoveredLimit} more`);
    lines.push("");
  }
  const countLine = (title, counts) => `${title}: ${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(", ") || "none"}`;
  lines.push(countLine("Cases per tier", coverage.tiers));
  lines.push(countLine("Cases per review status", coverage.reviewStatus));
  lines.push(countLine("Cases per outcome", coverage.outcomes));
  lines.push(countLine("Cases per rules section", coverage.sections));
  for (const [pool, entry] of Object.entries(coverage.pools)) {
    lines.push(`Pool ${pool}: ${entry.cases} cases; ${Object.entries(entry.outcomes).map(([key, value]) => `${key} ${value}`).join(", ")}`);
  }
  return `${lines.join("\n")}\n`;
}
