// Writes the two committed case manifests the diagnostic arms and the held-out
// split rest on (REQ-230), from the offline evidence trace (REQ-229):
//
//   apps/backend/src/eval/answer-quality/manifests/diagnostic.json
//   apps/backend/src/eval/answer-quality/manifests/held-out.json
//
// Diagnostic: the two tester cases, the multiplayer case that lost rule 608.2d,
// every approved case whose deciding rules are only partly selected in search,
// a seeded sample of cases with none selected, and a seeded sample of fully
// selected cases as passing controls. Held-out: a seeded sample of the
// remaining approved cases, stratified by Comprehensive Rules section and
// disjoint from the diagnostic set. Both carry case ids and the SHA-256 of each
// case's question and reference answer, nothing else, and both record the seed
// and the selection rule. A sample size may differ from its default only with a
// reason, which the files and this command's output record.
//
//   npm run eval:answer-quality:manifests               # (re)writes both files, keeping every appended group
//   npm run eval:answer-quality:manifests -- --check    # verifies the committed files; exits 1 on a problem, prints re-draw drift
//   npm run eval:answer-quality:manifests -- --seed 7 --held-out 60 --reason "..."
//   npm run eval:answer-quality:manifests -- --append-diagnostic a,b,c --group <name> --reason "..."
//
// `--check` does not re-draw: it fails, naming each problem, when a listed case is missing,
// not approved, stale, or no longer matches its listed question or reference-answer hash, or
// when the two manifests share a case. It also prints, without failing, how many cases a fresh
// seeded draw from the current corpus would change (drift).
//
// `--append-diagnostic` adds named approved cases to the committed diagnostic manifest as a
// recorded group (case ids with their hashes, the date, the reason), outside the seeded
// selection. It refuses a case that is not approved, is stale, is in the held-out manifest or is
// already in the diagnostic manifest, and never touches the held-out file. A later re-draw keeps
// every appended group.
//
// It can also write a run manifest for a paid phase without touching the committed
// files (the path must be under output/, which is gitignored):
//   npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/all-approved.json --from approved
//   npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/phase-4.json --from diagnostic --from held-out
//   npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/named.json --from approved --ids a,b,c
//   npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/primary.json --from approved --exclude a,b,c
//
// Offline, no provider, never a gate. Run via tsx (the trace reads the backend).

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { seededSample } from "./lib/answer-quality-run.mjs";
import { DIAGNOSTIC_MANIFEST_RELATIVE_PATH, HELD_OUT_MANIFEST_RELATIVE_PATH } from "./lib/diagnostic-arms.mjs";
import { manifestEntryFor } from "./lib/experiment-run.mjs";
import { ruleSections } from "./lib/gold-cases.mjs";
import { VECTOR_SOURCES } from "./lib/evidence-trace.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const MANIFEST_FORMAT_VERSION = 1;
export const DEFAULT_SEED = 20261007;
export const DEFAULT_SIZES = { diagnosticNone: 20, diagnosticFull: 10, heldOut: 80 };
export const MANIFEST_COMMAND = "npm run eval:answer-quality:manifests";
export const MULTIPLAYER_CASE_ID = "multiplayer-only-blood-ends-your-nightmares-opponents";

export const DIAGNOSTIC_RULE =
  "the two tester cases, the multiplayer case that lost rule 608.2d, every approved case whose deciding rules are partly selected in search, " +
  "a seeded sample of cases with none selected, and a seeded sample of fully selected cases as passing controls";
export const HELD_OUT_RULE =
  "a seeded sample of the approved cases not in the diagnostic manifest, allocated to Comprehensive Rules sections in proportion to their size (largest remainder), then drawn within each section by seed";

/** `full` (every deciding rule selected in search), `partial` or `none`, per case, from the evidence trace. */
export function classifyFromTrace(traced) {
  const classes = new Map();
  for (const entry of traced) {
    const selected = entry.rules.filter((rule) => rule.selectedInSearch).length;
    classes.set(entry.caseId, selected === 0 ? "none" : selected === entry.rules.length ? "full" : "partial");
  }
  return classes;
}

function sortedIds(cases) {
  return cases.map((caseEntry) => caseEntry.id).sort();
}

export function selectDiagnostic({ approvedCases, classes, seed, noneSample, fullSample }) {
  const byClass = (wanted) => approvedCases.filter((caseEntry) => classes.get(caseEntry.id) === wanted);
  const tester = approvedCases.filter((caseEntry) => caseEntry.source?.pool === "tester");
  const named = approvedCases.filter((caseEntry) => caseEntry.id === MULTIPLAYER_CASE_ID);
  const partial = byClass("partial");

  const chosen = new Map();
  for (const caseEntry of [...tester, ...named, ...partial]) chosen.set(caseEntry.id, caseEntry);
  const mandatory = chosen.size;

  const pick = (pool, count, salt) => {
    const remaining = sortedIds(pool.filter((caseEntry) => !chosen.has(caseEntry.id)));
    const ids = seededSample(remaining, count, seed + salt);
    for (const id of ids) chosen.set(id, approvedCases.find((caseEntry) => caseEntry.id === id));
    return ids.length;
  };
  const noneSampled = pick(byClass("none"), noneSample, 1);
  const fullSampled = pick(byClass("full"), fullSample, 2);

  return {
    cases: [...chosen.values()].sort((a, b) => a.id.localeCompare(b.id)),
    counts: {
      testerCases: tester.length,
      namedCases: named.length,
      partialCoverage: partial.length,
      mandatory,
      noneSampled,
      fullSampled,
      pools: { none: byClass("none").length, partial: partial.length, full: byClass("full").length }
    }
  };
}

/** Largest-remainder allocation of `total` seats across strata sized `sizes`, never above a stratum's size. */
export function allocateStrata(sizes, total) {
  const entries = Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b));
  const population = entries.reduce((sum, [, size]) => sum + size, 0);
  const target = Math.min(total, population);
  const seats = Object.fromEntries(entries.map(([key]) => [key, 0]));
  if (population === 0) return seats;
  const quotas = entries.map(([key, size]) => ({ key, size, quota: (target * size) / population }));
  for (const { key, quota } of quotas) seats[key] = Math.floor(quota);
  let left = target - Object.values(seats).reduce((sum, value) => sum + value, 0);
  const byRemainder = [...quotas].sort((a, b) => b.quota - Math.floor(b.quota) - (a.quota - Math.floor(a.quota)) || a.key.localeCompare(b.key));
  while (left > 0) {
    let progressed = false;
    for (const { key, size } of byRemainder) {
      if (left === 0) break;
      if (seats[key] < size) {
        seats[key] += 1;
        left -= 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return seats;
}

export function selectHeldOut({ approvedCases, excludeIds, seed, size }) {
  const pool = approvedCases.filter((caseEntry) => !excludeIds.has(caseEntry.id));
  const strata = new Map();
  for (const caseEntry of pool) {
    const key = ruleSections(caseEntry.expected.decidingRuleIds)[0] ?? "none";
    if (!strata.has(key)) strata.set(key, []);
    strata.get(key).push(caseEntry);
  }
  const seats = allocateStrata(Object.fromEntries([...strata].map(([key, list]) => [key, list.length])), size);
  const chosen = [];
  for (const [key, list] of [...strata].sort(([a], [b]) => a.localeCompare(b))) {
    const salt = /^\d+$/.test(key) ? Number(key) : 0;
    const ids = seededSample(sortedIds(list), seats[key], seed + 1000 + salt);
    for (const id of ids) chosen.push(list.find((caseEntry) => caseEntry.id === id));
  }
  return {
    cases: chosen.sort((a, b) => a.id.localeCompare(b.id)),
    counts: { requested: size, poolSize: pool.length, sections: Object.fromEntries([...strata].map(([key]) => [key, seats[key]]).sort(([a], [b]) => a.localeCompare(b))) }
  };
}

/** Builds both manifest objects. Pure: the same inputs give the same bytes. */
export function buildManifests({ approvedCases, classes, seed = DEFAULT_SEED, sizes = DEFAULT_SIZES, reason = null, appendedGroups = [] }) {
  const changed = Object.entries(DEFAULT_SIZES).filter(([key, value]) => sizes[key] !== value);
  if (changed.length > 0 && !reason) {
    throw new Error(`A sample size differs from its default (${changed.map(([key]) => key).join(", ")}): record why with --reason "<why>".`);
  }
  const sizeChange = changed.length > 0 ? { reason, from: Object.fromEntries(changed.map(([key]) => [key, DEFAULT_SIZES[key]])), to: Object.fromEntries(changed.map(([key]) => [key, sizes[key]])) } : null;

  const diagnostic = selectDiagnostic({ approvedCases, classes, seed, noneSample: sizes.diagnosticNone, fullSample: sizes.diagnosticFull });
  // Appended groups stay in the diagnostic manifest as recorded, outside the seeded selection, and their
  // cases leave the held-out pool so the two sets stay disjoint.
  const appendedEntries = appendedGroups.flatMap((group) => group.cases);
  const heldOut = selectHeldOut({
    approvedCases,
    excludeIds: new Set([...diagnostic.cases.map((caseEntry) => caseEntry.id), ...appendedEntries.map((entry) => entry.id)]),
    seed,
    size: sizes.heldOut
  });
  const diagnosticEntries = new Map(diagnostic.cases.map((caseEntry) => [caseEntry.id, manifestEntryFor(caseEntry)]));
  for (const entry of appendedEntries) diagnosticEntries.set(entry.id, entry);
  const diagnosticCases = [...diagnosticEntries.values()].sort((a, b) => a.id.localeCompare(b.id));
  const header = (kind, rule, selection, caseCount = selection.caseCount) => ({
    formatVersion: MANIFEST_FORMAT_VERSION,
    kind,
    seed,
    command: MANIFEST_COMMAND,
    selectionRule: rule,
    sampleSizeChange: sizeChange,
    selection,
    caseCount
  });
  return {
    diagnostic: {
      ...header("diagnostic", DIAGNOSTIC_RULE, { ...diagnostic.counts, caseCount: diagnostic.cases.length }, diagnosticCases.length),
      ...(appendedGroups.length > 0 ? { appendedGroups } : {}),
      cases: diagnosticCases
    },
    heldOut: {
      ...header("held-out", HELD_OUT_RULE, { ...heldOut.counts, caseCount: heldOut.cases.length }),
      cases: heldOut.cases.map(manifestEntryFor)
    }
  };
}

async function formatJson(value, filePath) {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  return prettier.format(`${JSON.stringify(value, null, 2)}\n`, { ...config, filepath: filePath });
}

export function parseManifestArgs(argv) {
  const parsed = { check: false, seed: DEFAULT_SEED, sizes: { ...DEFAULT_SIZES }, reason: null, emit: null, from: [], ids: null, exclude: [], append: null, group: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") parsed.check = true;
    else if (arg === "--append-diagnostic") parsed.append = String(argv[++i] ?? "").split(",").filter(Boolean);
    else if (arg === "--group") parsed.group = argv[++i];
    else if (arg === "--emit") parsed.emit = argv[++i];
    else if (arg === "--from") parsed.from.push(argv[++i]);
    else if (arg === "--ids") parsed.ids = String(argv[++i] ?? "").split(",").filter(Boolean);
    else if (arg === "--exclude") parsed.exclude = String(argv[++i] ?? "").split(",").filter(Boolean);
    else if (arg === "--seed") parsed.seed = Number(argv[++i]);
    else if (arg === "--diagnostic-none") parsed.sizes.diagnosticNone = Number(argv[++i]);
    else if (arg === "--diagnostic-full") parsed.sizes.diagnosticFull = Number(argv[++i]);
    else if (arg === "--held-out") parsed.sizes.heldOut = Number(argv[++i]);
    else if (arg === "--reason") parsed.reason = argv[++i];
  }
  if (parsed.emit === null && (parsed.from.length > 0 || parsed.ids !== null || parsed.exclude.length > 0)) {
    throw new Error("--from, --ids and --exclude belong to --emit <path>.");
  }
  if (parsed.emit !== null) {
    if (parsed.check) throw new Error("--check compares the committed manifests; it cannot be combined with --emit.");
    const bad = parsed.from.filter((source) => !["approved", "diagnostic", "held-out"].includes(source));
    if (bad.length > 0) throw new Error(`--from names approved, diagnostic or held-out, not ${bad.join(", ")}.`);
    if (parsed.from.length === 0) parsed.from.push("approved");
  }
  if (parsed.append !== null) {
    if (parsed.append.length === 0) throw new Error("--append-diagnostic needs the case ids to add, comma separated.");
    if (!parsed.reason) throw new Error('--append-diagnostic needs --reason "<why these cases join the diagnostic set>".');
    if (parsed.check || parsed.emit !== null) throw new Error("--append-diagnostic cannot be combined with --check or --emit.");
  } else if (parsed.group !== null) {
    throw new Error("--group belongs to --append-diagnostic.");
  }
  if (!Number.isInteger(parsed.seed)) throw new Error("--seed needs a whole number.");
  for (const [key, value] of Object.entries(parsed.sizes)) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`The sample size for ${key} needs a whole number of at least 0.`);
  }
  return parsed;
}

/**
 * A run manifest for one paid phase, written outside the committed files: the union of
 * the named sources (`approved`, `diagnostic`, `held-out`), optionally narrowed to
 * `ids`. Ids and hashes only. A named id outside the sources is refused, not skipped.
 */
export function buildEmitManifest({ approvedCases, from, ids, exclude = [], committedIds }) {
  const byId = new Map(approvedCases.map((caseEntry) => [caseEntry.id, caseEntry]));
  const chosen = new Set();
  for (const source of from) {
    if (source === "approved") for (const caseEntry of approvedCases) chosen.add(caseEntry.id);
    else for (const id of committedIds[source] ?? []) chosen.add(id);
  }
  let list = [...chosen].sort();
  if (ids) {
    const missing = ids.filter((id) => !chosen.has(id));
    if (missing.length > 0) throw new Error(`These cases are not in ${from.join(" + ")}: ${missing.join(", ")}.`);
    list = list.filter((id) => ids.includes(id));
  }
  const unknownExcluded = exclude.filter((id) => !chosen.has(id));
  if (unknownExcluded.length > 0) throw new Error(`These cases to exclude are not in ${from.join(" + ")}: ${unknownExcluded.join(", ")}.`);
  list = list.filter((id) => !exclude.includes(id));
  const gone = list.filter((id) => !byId.has(id));
  if (gone.length > 0) throw new Error(`These cases are no longer approved in this checkout: ${gone.join(", ")}. Re-run the seeded command.`);
  return {
    formatVersion: MANIFEST_FORMAT_VERSION,
    kind: "run-manifest",
    sources: from,
    command: MANIFEST_COMMAND,
    caseCount: list.length,
    cases: list.map((id) => manifestEntryFor(byId.get(id)))
  };
}

/** The emit path must sit under output/ (gitignored): this command never overwrites a committed file by accident. */
export function resolveEmitPath(path, root = repoRoot) {
  const resolved = resolve(root, path);
  if (!resolved.startsWith(`${resolve(root, "output")}/`)) throw new Error(`--emit writes under output/ only, not ${path}.`);
  return resolved;
}

/** A committed manifest read back from its text; null when the file is missing or empty. */
function parseCommitted(text) {
  if (typeof text !== "string" || text.trim().length === 0) return null;
  return JSON.parse(text);
}

/**
 * The problems with the committed manifests, each naming the case (REQ-230): a listed case that is
 * missing from the corpus, not approved, flagged stale, or whose question or reference-answer hash
 * has moved, and a case both manifests list. Pure over the manifests and the corpus.
 */
export function verifyCommittedManifests({ diagnostic, heldOut, allCases, isStale = () => false }) {
  const problems = [];
  const byId = new Map(allCases.map((caseEntry) => [caseEntry.id, caseEntry]));
  for (const [label, manifest] of [["diagnostic", diagnostic], ["held-out", heldOut]]) {
    if (!manifest || !Array.isArray(manifest.cases)) {
      problems.push(`the ${label} manifest is missing or has no case list`);
      continue;
    }
    for (const entry of manifest.cases) {
      const caseEntry = byId.get(entry.id);
      if (!caseEntry) problems.push(`${label}: ${entry.id} is missing from the corpus`);
      else if (caseEntry.review?.status !== "approved") problems.push(`${label}: ${entry.id} is not approved`);
      else if (isStale(caseEntry)) problems.push(`${label}: ${entry.id} is flagged stale`);
      else {
        const current = manifestEntryFor(caseEntry);
        if (current.questionSha256 !== entry.questionSha256) problems.push(`${label}: ${entry.id} no longer matches its listed question hash`);
        if (current.answerSha256 !== entry.answerSha256) problems.push(`${label}: ${entry.id} no longer matches its listed reference-answer hash`);
      }
    }
  }
  if (diagnostic?.cases && heldOut?.cases) {
    const diagnosticIds = new Set(diagnostic.cases.map((entry) => entry.id));
    for (const entry of heldOut.cases) {
      if (diagnosticIds.has(entry.id)) problems.push(`${entry.id} is listed in both the diagnostic and the held-out manifest`);
    }
  }
  return problems;
}

/** One line: how many cases a fresh seeded draw from the current corpus would add and drop, per manifest. Information only. */
function describeDrift({ committedDiagnostic, committedHeldOut, manifests }) {
  const compare = (committed, fresh) => {
    const had = new Set((committed?.cases ?? []).map((entry) => entry.id));
    const would = new Set(fresh.cases.map((entry) => entry.id));
    return { add: [...would].filter((id) => !had.has(id)).length, drop: [...had].filter((id) => !would.has(id)).length };
  };
  const d = compare(committedDiagnostic, manifests.diagnostic);
  const h = compare(committedHeldOut, manifests.heldOut);
  const total = d.add + d.drop + h.add + h.drop;
  return (
    `Drift (information only, not a failure): a fresh seeded draw from the current corpus would add ${d.add} and drop ${d.drop} diagnostic cases, ` +
    `and add ${h.add} and drop ${h.drop} held-out cases${total === 0 ? " (no drift)" : ""}. The committed files stay as drawn; re-draw only deliberately.`
  );
}

/**
 * Adds approved cases to the diagnostic manifest as a recorded group, outside the seeded selection
 * (REQ-230). Refuses, naming each, an id that is unknown, not approved, stale, held-out or already
 * diagnostic. Returns the new diagnostic manifest; the held-out manifest is never an output.
 */
export function appendDiagnosticGroup({ diagnostic, heldOut, allCases, isStale = () => false, ids, reason, group = null, date }) {
  const byId = new Map(allCases.map((caseEntry) => [caseEntry.id, caseEntry]));
  const heldOutIds = new Set(heldOut.cases.map((entry) => entry.id));
  const diagnosticIds = new Set(diagnostic.cases.map((entry) => entry.id));
  const name = group ?? `appended-${date}`;
  const problems = [];
  if ((diagnostic.appendedGroups ?? []).some((existing) => existing.name === name)) problems.push(`a group named "${name}" already exists`);
  const unique = [...new Set(ids)];
  for (const id of unique) {
    const caseEntry = byId.get(id);
    if (!caseEntry) problems.push(`${id}: not in the corpus`);
    else if (caseEntry.review?.status !== "approved") problems.push(`${id}: not approved`);
    else if (isStale(caseEntry)) problems.push(`${id}: flagged stale (REQ-225)`);
    else if (heldOutIds.has(id)) problems.push(`${id}: listed in the held-out manifest`);
    else if (diagnosticIds.has(id)) problems.push(`${id}: already in the diagnostic manifest`);
  }
  if (problems.length > 0) throw new Error(`--append-diagnostic refuses (${problems.length}):\n  ${problems.join("\n  ")}`);
  const entries = unique.sort().map((id) => manifestEntryFor(byId.get(id)));
  const cases = [...diagnostic.cases, ...entries].sort((a, b) => a.id.localeCompare(b.id));
  return {
    ...diagnostic,
    caseCount: cases.length,
    appendedGroups: [...(diagnostic.appendedGroups ?? []), { name, date, reason, cases: entries }],
    cases
  };
}

/** `--append-diagnostic`: rewrites the diagnostic manifest only. */
export async function runAppend({ argv, allCases, isStale = () => false, readExisting, write, log = console.log, root = repoRoot, today = () => new Date().toISOString().slice(0, 10) }) {
  const args = parseManifestArgs(argv);
  const diagnosticPath = resolve(root, DIAGNOSTIC_MANIFEST_RELATIVE_PATH);
  const diagnostic = parseCommitted(await readExisting(diagnosticPath));
  const heldOut = parseCommitted(await readExisting(resolve(root, HELD_OUT_MANIFEST_RELATIVE_PATH)));
  if (!diagnostic || !heldOut) throw new Error("Both committed manifests must exist before cases are appended.");
  const next = appendDiagnosticGroup({ diagnostic, heldOut, allCases, isStale, ids: args.append, reason: args.reason, group: args.group, date: today() });
  await write(diagnosticPath, await formatJson(next, diagnosticPath));
  const group = next.appendedGroups.at(-1);
  log(`Appended ${group.cases.length} cases to the diagnostic manifest as group "${group.name}" (${group.date}); it now lists ${next.caseCount} cases. The held-out manifest is unchanged.`);
  return { diagnostic: next, group };
}

/** Generates (or checks) both files. `traced` is the evidence trace over the approved cases. */
export async function runManifests({
  argv = [],
  approvedCases,
  allCases = approvedCases,
  isStale = () => false,
  traced,
  write,
  readExisting,
  log = console.log,
  root = repoRoot
}) {
  const args = parseManifestArgs(argv);
  const classes = classifyFromTrace(traced);
  const diagnosticPath = resolve(root, DIAGNOSTIC_MANIFEST_RELATIVE_PATH);
  const heldOutPath = resolve(root, HELD_OUT_MANIFEST_RELATIVE_PATH);
  const committedDiagnostic = parseCommitted(await readExisting(diagnosticPath));
  const committedHeldOut = parseCommitted(await readExisting(heldOutPath));
  // A re-draw keeps every appended group of the committed diagnostic manifest (REQ-230).
  const manifests = buildManifests({
    approvedCases,
    classes,
    seed: args.seed,
    sizes: args.sizes,
    reason: args.reason,
    appendedGroups: committedDiagnostic?.appendedGroups ?? []
  });
  const targets = [
    [diagnosticPath, manifests.diagnostic],
    [heldOutPath, manifests.heldOut]
  ];
  const outputs = [];
  for (const [path, value] of targets) outputs.push({ path, value, text: await formatJson(value, path) });

  const d = manifests.diagnostic.selection;
  const h = manifests.heldOut.selection;
  log(
    `Pools from the trace: ${d.pools.full} fully selected, ${d.pools.partial} partly selected, ${d.pools.none} with none selected.\n` +
      `Diagnostic: ${d.caseCount} cases (${d.testerCases} tester, ${d.namedCases} named, ${d.partialCoverage} partial, ${d.noneSampled} sampled with none, ${d.fullSampled} sampled fully selected; seed ${args.seed}).\n` +
      `Held-out: ${h.caseCount} of ${h.poolSize} remaining cases, stratified over ${Object.keys(h.sections).length} rules sections (seed ${args.seed}).` +
      (manifests.diagnostic.sampleSizeChange ? `\nSample size changed from its default. Reason: ${manifests.diagnostic.sampleSizeChange.reason}` : "")
  );

  if (args.check) {
    // Verify what is committed; the fresh draw is information only (drift), because a corpus refresh moves it.
    const problems = verifyCommittedManifests({ diagnostic: committedDiagnostic, heldOut: committedHeldOut, allCases, isStale });
    if (problems.length > 0) {
      throw new Error(`The committed manifests have ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n  ${problems.join("\n  ")}`);
    }
    const drift = describeDrift({ committedDiagnostic, committedHeldOut, manifests });
    log(`Check passed: every case the committed manifests list is present, approved, current and matches its hashes, and the two sets are apart.\n${drift}`);
    return { manifests, outputs, checked: true, drift };
  }
  for (const { path, text } of outputs) await write(path, text);
  log(`Wrote ${outputs.map(({ path }) => path).join(" and ")}.`);
  return { manifests, outputs, checked: false };
}

async function main() {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const parsedArgs = parseManifestArgs(process.argv.slice(2));
  const { buildTrace, PRODUCTION_CAP } = await import("./lib/evidence-trace.mjs");
  const { defaultTraceDeps } = await import("./eval-evidence-trace.mjs");
  const { compareSnapshot, loadGoldCases, loadSnapshotSources } = await import("./lib/gold-cases.mjs");
  const allCases = await loadGoldCases();
  const approvedCases = allCases.filter((caseEntry) => caseEntry.review.status === "approved");
  const sources = await loadSnapshotSources();
  const isStale = (caseEntry) => compareSnapshot(caseEntry, sources).stale;
  const readExisting = async (path) => readFile(path, "utf8").catch(() => "");
  if (parsedArgs.append !== null) {
    await runAppend({
      argv: process.argv.slice(2),
      allCases,
      isStale,
      readExisting,
      write: async (path, text) => writeFile(path, text, "utf8")
    });
    return;
  }
  if (parsedArgs.emit !== null) {
    const readIds = async (relativePath) => JSON.parse(await readFile(resolve(repoRoot, relativePath), "utf8")).cases.map((entry) => entry.id);
    const manifest = buildEmitManifest({
      approvedCases,
      from: parsedArgs.from,
      ids: parsedArgs.ids,
      exclude: parsedArgs.exclude,
      committedIds: {
        diagnostic: parsedArgs.from.includes("diagnostic") ? await readIds(DIAGNOSTIC_MANIFEST_RELATIVE_PATH) : [],
        "held-out": parsedArgs.from.includes("held-out") ? await readIds(HELD_OUT_MANIFEST_RELATIVE_PATH) : []
      }
    });
    const path = resolveEmitPath(parsedArgs.emit);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, await formatJson(manifest, path), "utf8");
    console.log(`Wrote a run manifest of ${manifest.caseCount} cases (${manifest.sources.join(" + ")}) to ${path}.`);
    return;
  }
  const deps = await defaultTraceDeps();
  const resources = await deps.loadResources();
  const ts = await deps.loadTs(resources);
  // The frozen vectors rank every case; a case awaiting a re-freeze would be embedded here and labelled, but the manifests need the committed ranking.
  const traced = await buildTrace({
    cases: approvedCases,
    resources,
    parseRequest: ts.parseRequest,
    freezeCheck: ts.freezeCheck,
    prepare: ts.prepare,
    embedLocal: ts.embedLocal,
    productionCap: PRODUCTION_CAP
  });
  const awaiting = traced.filter((entry) => entry.vectorSource !== VECTOR_SOURCES.frozen).length;
  if (awaiting > 0) console.log(`Note: ${awaiting} case(s) await a re-freeze and were ranked with a locally embedded vector.`);
  await runManifests({
    argv: process.argv.slice(2),
    approvedCases,
    allCases,
    isStale,
    traced,
    readExisting,
    write: async (path, text) => {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, text, "utf8");
    }
  });
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
