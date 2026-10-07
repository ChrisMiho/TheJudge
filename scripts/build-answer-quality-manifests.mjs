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
//   npm run eval:answer-quality:manifests               # (re)writes both files
//   npm run eval:answer-quality:manifests -- --check    # exits 1 if they would change
//   npm run eval:answer-quality:manifests -- --seed 7 --held-out 60 --reason "..."
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
export function buildManifests({ approvedCases, classes, seed = DEFAULT_SEED, sizes = DEFAULT_SIZES, reason = null }) {
  const changed = Object.entries(DEFAULT_SIZES).filter(([key, value]) => sizes[key] !== value);
  if (changed.length > 0 && !reason) {
    throw new Error(`A sample size differs from its default (${changed.map(([key]) => key).join(", ")}): record why with --reason "<why>".`);
  }
  const sizeChange = changed.length > 0 ? { reason, from: Object.fromEntries(changed.map(([key]) => [key, DEFAULT_SIZES[key]])), to: Object.fromEntries(changed.map(([key]) => [key, sizes[key]])) } : null;

  const diagnostic = selectDiagnostic({ approvedCases, classes, seed, noneSample: sizes.diagnosticNone, fullSample: sizes.diagnosticFull });
  const heldOut = selectHeldOut({
    approvedCases,
    excludeIds: new Set(diagnostic.cases.map((caseEntry) => caseEntry.id)),
    seed,
    size: sizes.heldOut
  });
  const header = (kind, rule, selection) => ({
    formatVersion: MANIFEST_FORMAT_VERSION,
    kind,
    seed,
    command: MANIFEST_COMMAND,
    selectionRule: rule,
    sampleSizeChange: sizeChange,
    selection,
    caseCount: selection.caseCount
  });
  return {
    diagnostic: {
      ...header("diagnostic", DIAGNOSTIC_RULE, { ...diagnostic.counts, caseCount: diagnostic.cases.length }),
      cases: diagnostic.cases.map(manifestEntryFor)
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
  const parsed = { check: false, seed: DEFAULT_SEED, sizes: { ...DEFAULT_SIZES }, reason: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") parsed.check = true;
    else if (arg === "--seed") parsed.seed = Number(argv[++i]);
    else if (arg === "--diagnostic-none") parsed.sizes.diagnosticNone = Number(argv[++i]);
    else if (arg === "--diagnostic-full") parsed.sizes.diagnosticFull = Number(argv[++i]);
    else if (arg === "--held-out") parsed.sizes.heldOut = Number(argv[++i]);
    else if (arg === "--reason") parsed.reason = argv[++i];
  }
  if (!Number.isInteger(parsed.seed)) throw new Error("--seed needs a whole number.");
  for (const [key, value] of Object.entries(parsed.sizes)) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`The sample size for ${key} needs a whole number of at least 0.`);
  }
  return parsed;
}

/** Generates (or checks) both files. `traced` is the evidence trace over the approved cases. */
export async function runManifests({ argv = [], approvedCases, traced, write, readExisting, log = console.log, root = repoRoot }) {
  const args = parseManifestArgs(argv);
  const classes = classifyFromTrace(traced);
  const manifests = buildManifests({ approvedCases, classes, seed: args.seed, sizes: args.sizes, reason: args.reason });
  const targets = [
    [resolve(root, DIAGNOSTIC_MANIFEST_RELATIVE_PATH), manifests.diagnostic],
    [resolve(root, HELD_OUT_MANIFEST_RELATIVE_PATH), manifests.heldOut]
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
    const stale = [];
    for (const { path, text } of outputs) {
      if ((await readExisting(path)) !== text) stale.push(path);
    }
    if (stale.length > 0) {
      throw new Error(`The committed manifests differ from a fresh seeded run: ${stale.join(", ")}. Re-run ${MANIFEST_COMMAND} and commit the result.`);
    }
    log("Check passed: re-running the seeded command reproduces both committed files byte for byte.");
    return { manifests, outputs, checked: true };
  }
  for (const { path, text } of outputs) await write(path, text);
  log(`Wrote ${outputs.map(({ path }) => path).join(" and ")}.`);
  return { manifests, outputs, checked: false };
}

async function main() {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { buildTrace, PRODUCTION_CAP } = await import("./lib/evidence-trace.mjs");
  const { defaultTraceDeps } = await import("./eval-evidence-trace.mjs");
  const { loadGoldCases } = await import("./lib/gold-cases.mjs");
  const deps = await defaultTraceDeps();
  const approvedCases = (await loadGoldCases()).filter((caseEntry) => caseEntry.review.status === "approved");
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
    traced,
    readExisting: async (path) => readFile(path, "utf8").catch(() => ""),
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
