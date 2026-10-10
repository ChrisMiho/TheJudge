import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  DEFAULT_SEED,
  DEFAULT_SIZES,
  MULTIPLAYER_CASE_ID,
  allocateStrata,
  buildEmitManifest,
  buildManifests,
  classifyFromTrace,
  parseManifestArgs,
  resolveEmitPath,
  runAppend,
  runManifests,
  selectHeldOut
} from "./build-answer-quality-manifests.mjs";
import { DIAGNOSTIC_MANIFEST_RELATIVE_PATH, HELD_OUT_MANIFEST_RELATIVE_PATH } from "./lib/diagnostic-arms.mjs";
import { loadManifestFile, manifestEntryFor } from "./lib/experiment-run.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// A synthetic corpus: 3 tester/named cases plus pools of partial, none and full cases across sections.
function syntheticCorpus() {
  const cases = [];
  const classes = new Map();
  const add = (id, section, klass, extra = {}) => {
    cases.push({
      id,
      tier: 1,
      review: { status: "approved" },
      question: `Question ${id}?`,
      source: extra.source ?? {},
      expected: { answer: `Answer ${id}.`, decidingRuleIds: [`${section}.1`] }
    });
    classes.set(id, klass);
  };
  add("tester-a", "614", "none", { source: { pool: "tester" } });
  add("tester-b", "514", "partial", { source: { pool: "tester" } });
  add(MULTIPLAYER_CASE_ID, "608", "full");
  for (let i = 0; i < 4; i++) add(`partial-${i}`, "701", "partial");
  for (let i = 0; i < 30; i++) add(`none-${String(i).padStart(2, "0")}`, i % 2 === 0 ? "702" : "613", "none");
  for (let i = 0; i < 60; i++) add(`full-${String(i).padStart(2, "0")}`, ["702", "701", "603", "508"][i % 4], "full");
  cases.push({ ...cases[0], id: "draft-case", review: { status: "draft" } });
  return { cases: cases.filter((c) => c.review.status === "approved"), classes };
}

test("classification follows how many deciding rules the trace selected in search", () => {
  const traced = [
    { caseId: "none", rules: [{ selectedInSearch: false }, { selectedInSearch: false }] },
    { caseId: "partial", rules: [{ selectedInSearch: true }, { selectedInSearch: false }] },
    { caseId: "full", rules: [{ selectedInSearch: true }, { selectedInSearch: true }] }
  ];
  assert.deepEqual([...classifyFromTrace(traced)], [["none", "none"], ["partial", "partial"], ["full", "full"]]);
});

test("the diagnostic set is the tester cases, the named case, every partial case, and seeded samples of none and full cases", () => {
  const { cases, classes } = syntheticCorpus();
  const { diagnostic } = buildManifests({ approvedCases: cases, classes, sizes: { ...DEFAULT_SIZES, diagnosticNone: 5, diagnosticFull: 3, heldOut: 10 }, reason: "synthetic corpus is small" });
  const ids = diagnostic.cases.map((entry) => entry.id);
  for (const mustHave of ["tester-a", "tester-b", MULTIPLAYER_CASE_ID, "partial-0", "partial-1", "partial-2", "partial-3"]) assert.ok(ids.includes(mustHave), `${mustHave} is in the diagnostic set`);
  assert.equal(diagnostic.selection.noneSampled, 5);
  assert.equal(diagnostic.selection.fullSampled, 3);
  assert.equal(diagnostic.selection.testerCases, 2);
  assert.equal(diagnostic.selection.partialCoverage, 5, "partial = the 4 partial cases plus the tester case that is partly covered");
  // Seven mandatory cases (tester-b is both a tester case and partly covered, counted once), 5 sampled with none, 3 as controls.
  assert.equal(ids.length, 7 + 5 + 3);
  assert.equal(diagnostic.selection.mandatory, 7);
  assert.deepEqual([...ids], [...ids].sort(), "sorted by id");
  assert.equal(new Set(ids).size, ids.length);
});

test("both manifests hold case ids and hashes only, are disjoint, and record the seed and the selection rule", () => {
  const { cases, classes } = syntheticCorpus();
  const manifests = buildManifests({ approvedCases: cases, classes, sizes: { ...DEFAULT_SIZES, diagnosticNone: 5, diagnosticFull: 3, heldOut: 20 }, reason: "synthetic" });
  const diagnosticIds = new Set(manifests.diagnostic.cases.map((entry) => entry.id));
  assert.ok(manifests.heldOut.cases.length > 0);
  for (const entry of manifests.heldOut.cases) assert.ok(!diagnosticIds.has(entry.id), `${entry.id} is in only one set`);
  for (const manifest of [manifests.diagnostic, manifests.heldOut]) {
    assert.equal(manifest.seed, DEFAULT_SEED);
    assert.match(manifest.selectionRule, /seeded/);
    assert.match(manifest.command, /eval:answer-quality:manifests/);
    for (const entry of manifest.cases) {
      assert.deepEqual(Object.keys(entry).sort(), ["answerSha256", "id", "questionSha256"], "ids and hashes only");
      assert.match(entry.questionSha256, /^[0-9a-f]{64}$/);
      assert.match(entry.answerSha256, /^[0-9a-f]{64}$/);
    }
    const text = JSON.stringify(manifest);
    assert.ok(!text.includes("Answer tester-a."), "no case prose in a manifest");
  }
  assert.equal(manifests.heldOut.kind, "held-out");
  assert.equal(manifests.diagnostic.kind, "diagnostic");
});

test("the generator is seeded: the same inputs give the same bytes, another seed gives another sample", () => {
  const { cases, classes } = syntheticCorpus();
  const sizes = { ...DEFAULT_SIZES, diagnosticNone: 5, diagnosticFull: 3, heldOut: 20 };
  const first = buildManifests({ approvedCases: cases, classes, sizes, reason: "synthetic" });
  const again = buildManifests({ approvedCases: cases, classes, sizes, reason: "synthetic" });
  assert.equal(JSON.stringify(first), JSON.stringify(again));
  const other = buildManifests({ approvedCases: cases, classes, seed: 7, sizes, reason: "synthetic" });
  assert.notEqual(JSON.stringify(first.heldOut.cases), JSON.stringify(other.heldOut.cases));
});

test("held-out is stratified by rules section in proportion, and sized by largest remainder", () => {
  assert.deepEqual(allocateStrata({ "702": 50, "701": 30, "603": 20 }, 10), { "603": 2, "701": 3, "702": 5 });
  assert.deepEqual(allocateStrata({ a: 1, b: 1, c: 1 }, 2), { a: 1, b: 1, c: 0 }, "ties break by key");
  assert.deepEqual(allocateStrata({ a: 2, b: 40 }, 100), { a: 2, b: 40 }, "never above a stratum's size");
  assert.deepEqual(allocateStrata({}, 5), {});

  const { cases } = syntheticCorpus();
  const heldOut = selectHeldOut({ approvedCases: cases, excludeIds: new Set(), seed: DEFAULT_SEED, size: 20 });
  assert.equal(heldOut.cases.length, 20);
  const total = Object.values(heldOut.counts.sections).reduce((sum, count) => sum + count, 0);
  assert.equal(total, 20);
  assert.ok(Object.keys(heldOut.counts.sections).length > 3, "several sections are represented");
});

test("a sample size may change only with a recorded reason, which the manifests carry", () => {
  const { cases, classes } = syntheticCorpus();
  assert.throws(() => buildManifests({ approvedCases: cases, classes, sizes: { ...DEFAULT_SIZES, heldOut: 10 } }), /record why with --reason/);
  const { diagnostic } = buildManifests({ approvedCases: cases, classes, sizes: { ...DEFAULT_SIZES, heldOut: 10, diagnosticNone: 5 }, reason: "the pools are small" });
  assert.equal(diagnostic.sampleSizeChange.reason, "the pools are small");
  assert.deepEqual(diagnostic.sampleSizeChange.to, { diagnosticNone: 5, heldOut: 10 });
  assert.deepEqual(parseManifestArgs(["--held-out", "60", "--reason", "x"]).sizes.heldOut, 60);
  assert.throws(() => parseManifestArgs(["--seed", "abc"]), /whole number/);
});

function syntheticTrace(classes) {
  return [...classes].map(([caseId, klass]) => ({
    caseId,
    rules: klass === "full" ? [{ selectedInSearch: true }] : klass === "none" ? [{ selectedInSearch: false }] : [{ selectedInSearch: true }, { selectedInSearch: false }]
  }));
}

const SYNTHETIC_ARGV = ["--diagnostic-none", "5", "--diagnostic-full", "3", "--held-out", "20", "--reason", "synthetic"];
const DIAGNOSTIC_PATH = `/repo/${DIAGNOSTIC_MANIFEST_RELATIVE_PATH}`;
const HELD_OUT_PATH = `/repo/${HELD_OUT_MANIFEST_RELATIVE_PATH}`;

/** Writes both synthetic manifests into a map, as the real command would write them to disk. */
async function drawSynthetic() {
  const { cases, classes } = syntheticCorpus();
  const traced = syntheticTrace(classes);
  const written = new Map();
  const logs = [];
  await runManifests({ argv: SYNTHETIC_ARGV, approvedCases: cases, traced, write: async (path, text) => written.set(path, text), readExisting: async () => "", log: (line) => logs.push(line), root: "/repo" });
  return { cases, traced, written, logs };
}

test("write mode writes both manifests under the manifests folder and logs a changed sample size's reason", async () => {
  const { written, logs } = await drawSynthetic();
  assert.equal(written.size, 2);
  assert.ok([...written.keys()].every((path) => path.startsWith("/repo/apps/backend/src/eval/answer-quality/manifests/")));
  assert.ok(logs.join("\n").includes("Sample size changed from its default. Reason: synthetic"));
});

test("--check verifies the committed files without re-drawing: it passes on sound files, writes nothing, and prints drift as information", async () => {
  const { cases, traced, written } = await drawSynthetic();
  const logs = [];
  const check = (overrides = {}) =>
    runManifests({
      argv: [...SYNTHETIC_ARGV, "--check"],
      approvedCases: cases,
      traced,
      write: async () => assert.fail("check mode writes nothing"),
      readExisting: async (path) => written.get(path),
      log: (line) => logs.push(line),
      root: "/repo",
      ...overrides
    });
  const same = await check();
  assert.equal(same.checked, true);
  assert.match(logs.join("\n"), /no drift/);

  // The corpus moves under the committed files: a fresh draw would differ, yet the committed files are still sound, so the check passes and reports drift.
  const moved = cases.filter((caseEntry) => !caseEntry.id.startsWith("full-0"));
  const drifted = await check({ approvedCases: moved, allCases: cases, traced: traced.filter((entry) => !entry.caseId.startsWith("full-0")) });
  assert.equal(drifted.checked, true);
  assert.match(logs.join("\n"), /Drift \(information only, not a failure\): a fresh seeded draw from the current corpus would add \d+ and drop \d+ diagnostic cases/);
});

test("--check fails, naming each problem, when a listed case is missing, unapproved, stale or changed, or when the two sets share a case", async () => {
  const { cases, traced, written } = await drawSynthetic();
  const diagnostic = JSON.parse(written.get(DIAGNOSTIC_PATH));
  const heldOut = JSON.parse(written.get(HELD_OUT_PATH));
  const [missing, unapproved, stale, changedQuestion, changedAnswer] = diagnostic.cases.map((entry) => entry.id);
  const all = cases
    .filter((caseEntry) => caseEntry.id !== missing)
    .map((caseEntry) => {
      if (caseEntry.id === unapproved) return { ...caseEntry, review: { status: "draft" } };
      if (caseEntry.id === changedQuestion) return { ...caseEntry, question: "A reworded question?" };
      if (caseEntry.id === changedAnswer) return { ...caseEntry, expected: { ...caseEntry.expected, answer: "A reworded answer." } };
      return caseEntry;
    });
  const sharedWithHeldOut = { ...heldOut, cases: [...heldOut.cases, diagnostic.cases.at(-1)] };
  const files = new Map([[DIAGNOSTIC_PATH, JSON.stringify(diagnostic)], [HELD_OUT_PATH, JSON.stringify(sharedWithHeldOut)]]);
  await assert.rejects(
    () =>
      runManifests({
        argv: [...SYNTHETIC_ARGV, "--check"],
        approvedCases: all.filter((caseEntry) => caseEntry.review.status === "approved"),
        allCases: all,
        isStale: (caseEntry) => caseEntry.id === stale,
        traced,
        write: async () => {},
        readExisting: async (path) => files.get(path),
        log: () => {},
        root: "/repo"
      }),
    (error) =>
      error.message.includes(`diagnostic: ${missing} is missing from the corpus`) &&
      error.message.includes(`diagnostic: ${unapproved} is not approved`) &&
      error.message.includes(`diagnostic: ${stale} is flagged stale`) &&
      error.message.includes(`diagnostic: ${changedQuestion} no longer matches its listed question hash`) &&
      error.message.includes(`diagnostic: ${changedAnswer} no longer matches its listed reference-answer hash`) &&
      error.message.includes(`${diagnostic.cases.at(-1).id} is listed in both the diagnostic and the held-out manifest`)
  );
});

// Appended groups ------------------------------------------------------------

function committedFiles(written) {
  return { diagnostic: JSON.parse(written.get(DIAGNOSTIC_PATH)), heldOut: JSON.parse(written.get(HELD_OUT_PATH)) };
}

test("--append-diagnostic adds an approved case as a recorded group with its reason and date, and leaves the held-out manifest byte for byte alone", async () => {
  const { cases, written } = await drawSynthetic();
  const { diagnostic, heldOut } = committedFiles(written);
  const heldOutIds = new Set(heldOut.cases.map((entry) => entry.id));
  const diagnosticIds = new Set(diagnostic.cases.map((entry) => entry.id));
  const outside = cases.find((caseEntry) => !heldOutIds.has(caseEntry.id) && !diagnosticIds.has(caseEntry.id));
  assert.ok(outside, "the synthetic corpus has a case in neither set");
  const files = new Map(written);
  const writes = [];
  const logs = [];
  const result = await runAppend({
    argv: ["--append-diagnostic", outside.id, "--group", "hard-set", "--reason", "hard layer cases"],
    allCases: cases,
    readExisting: async (path) => files.get(path),
    write: async (path, text) => writes.push([path, text]),
    log: (line) => logs.push(line),
    root: "/repo",
    today: () => "2026-10-10"
  });
  assert.deepEqual(writes.map(([path]) => path), [DIAGNOSTIC_PATH], "only the diagnostic manifest is written");
  assert.equal(files.get(HELD_OUT_PATH), written.get(HELD_OUT_PATH), "the held-out manifest is untouched");
  const next = JSON.parse(writes[0][1]);
  assert.equal(next.appendedGroups.length, 1);
  assert.deepEqual(next.appendedGroups[0], { name: "hard-set", date: "2026-10-10", reason: "hard layer cases", cases: [manifestEntryFor(outside)] });
  assert.equal(next.caseCount, diagnostic.caseCount + 1);
  assert.deepEqual(next.cases.map((entry) => entry.id), [...next.cases.map((entry) => entry.id)].sort());
  assert.ok(next.cases.some((entry) => entry.id === outside.id));
  assert.equal(result.group.name, "hard-set");
  assert.match(logs[0], /Appended 1 cases .* group "hard-set"/);
  assert.deepEqual(Object.keys(next.cases.find((entry) => entry.id === outside.id)).sort(), ["answerSha256", "id", "questionSha256"], "ids and hashes only");
});

test("--append-diagnostic refuses, naming each, a held-out, non-approved, stale, unknown or already-diagnostic case, and a repeated group name", async () => {
  const { cases, written } = await drawSynthetic();
  const { diagnostic, heldOut } = committedFiles(written);
  const files = new Map(written);
  const outside = cases.filter((caseEntry) => !heldOut.cases.some((entry) => entry.id === caseEntry.id) && !diagnostic.cases.some((entry) => entry.id === caseEntry.id));
  const draft = { ...outside[0], id: "draft-new", review: { status: "draft" } };
  const append = (ids, extra = {}) =>
    runAppend({
      argv: ["--append-diagnostic", ids.join(","), "--reason", "r"],
      allCases: [...cases, draft],
      isStale: (caseEntry) => caseEntry.id === outside[1].id,
      readExisting: async (path) => files.get(path),
      write: async () => assert.fail("a refused append writes nothing"),
      log: () => {},
      root: "/repo",
      today: () => "2026-10-10",
      ...extra
    });
  await assert.rejects(
    () => append([heldOut.cases[0].id, "draft-new", outside[1].id, "no-such-case", diagnostic.cases[0].id]),
    (error) =>
      error.message.includes(`${heldOut.cases[0].id}: listed in the held-out manifest`) &&
      error.message.includes("draft-new: not approved") &&
      error.message.includes(`${outside[1].id}: flagged stale`) &&
      error.message.includes("no-such-case: not in the corpus") &&
      error.message.includes(`${diagnostic.cases[0].id}: already in the diagnostic manifest`)
  );
  files.set(DIAGNOSTIC_PATH, JSON.stringify({ ...diagnostic, appendedGroups: [{ name: "appended-2026-10-10", date: "2026-10-09", reason: "x", cases: [] }] }));
  await assert.rejects(() => append([outside[0].id]), /a group named "appended-2026-10-10" already exists/);
  assert.throws(() => parseManifestArgs(["--append-diagnostic", "a"]), /needs --reason/);
  assert.throws(() => parseManifestArgs(["--append-diagnostic", "a", "--reason", "r", "--check"]), /cannot be combined/);
  assert.throws(() => parseManifestArgs(["--group", "g"]), /belongs to --append-diagnostic/);
});

test("a re-draw keeps appended groups, and their cases stay out of the held-out set", async () => {
  const { cases, traced, written } = await drawSynthetic();
  const { diagnostic, heldOut } = committedFiles(written);
  const heldOutIds = new Set(heldOut.cases.map((entry) => entry.id));
  const outside = cases.find((caseEntry) => !heldOutIds.has(caseEntry.id) && !diagnostic.cases.some((entry) => entry.id === caseEntry.id));
  const group = { name: "hard-set", date: "2026-10-10", reason: "hard layer cases", cases: [manifestEntryFor(outside)] };
  const withGroup = { ...diagnostic, caseCount: diagnostic.caseCount + 1, appendedGroups: [group], cases: [...diagnostic.cases, manifestEntryFor(outside)].sort((a, b) => a.id.localeCompare(b.id)) };
  const files = new Map([[DIAGNOSTIC_PATH, JSON.stringify(withGroup)], [HELD_OUT_PATH, JSON.stringify(heldOut)]]);
  const redrawn = new Map();
  await runManifests({ argv: SYNTHETIC_ARGV, approvedCases: cases, traced, write: async (path, text) => redrawn.set(path, text), readExisting: async (path) => files.get(path), log: () => {}, root: "/repo" });
  const next = JSON.parse(redrawn.get(DIAGNOSTIC_PATH));
  assert.deepEqual(next.appendedGroups, [group]);
  assert.ok(next.cases.some((entry) => entry.id === outside.id), "the appended case stays in the diagnostic set");
  assert.equal(next.caseCount, next.cases.length);
  assert.ok(!JSON.parse(redrawn.get(HELD_OUT_PATH)).cases.some((entry) => entry.id === outside.id), "and out of the held-out set");
  // A re-draw with no groups writes no appendedGroups key at all.
  assert.equal("appendedGroups" in JSON.parse(written.get(DIAGNOSTIC_PATH)), false);
});

test("the committed manifests, read as data: disjoint, ids and hashes only, usable as an experiment manifest (verifying them against the corpus is the on-demand `npm run eval:answer-quality:manifests -- --check`, never a gate)", async () => {
  const diagnostic = JSON.parse(await readFile(join(repoRoot, DIAGNOSTIC_MANIFEST_RELATIVE_PATH), "utf8"));
  const heldOut = JSON.parse(await readFile(join(repoRoot, HELD_OUT_MANIFEST_RELATIVE_PATH), "utf8"));
  assert.equal(diagnostic.kind, "diagnostic");
  assert.equal(heldOut.kind, "held-out");
  const diagnosticIds = new Set(diagnostic.cases.map((entry) => entry.id));
  assert.equal(diagnosticIds.size, diagnostic.cases.length);
  assert.equal(new Set(heldOut.cases.map((entry) => entry.id)).size, heldOut.cases.length);
  assert.deepEqual(heldOut.cases.filter((entry) => diagnosticIds.has(entry.id)), [], "the two manifests are disjoint");
  assert.ok(diagnosticIds.has("academy-manufactor-esix-treasure") && diagnosticIds.has("necropotence-silence-borne-upon-a-wind-cleanup") && diagnosticIds.has(MULTIPLAYER_CASE_ID));
  assert.equal(heldOut.cases.length, 80);
  for (const manifest of [diagnostic, heldOut]) {
    for (const entry of manifest.cases) assert.deepEqual(Object.keys(entry).sort(), ["answerSha256", "id", "questionSha256"]);
    assert.equal(manifest.seed, DEFAULT_SEED);
  }
  // They load as experiment manifests (shape only). Nothing here reads the live corpus or runs the
  // evidence trace: a later corpus refresh must never turn this suite red (REQ-229, NFR-018).
  const { manifest } = await loadManifestFile(join(repoRoot, DIAGNOSTIC_MANIFEST_RELATIVE_PATH));
  assert.equal(manifest.cases.length, diagnostic.cases.length);
});

test("--emit writes a run manifest for a paid phase from the named sources, optionally narrowed to ids, under output/ only", () => {
  const { cases } = syntheticCorpus();
  const committedIds = { diagnostic: ["partial-0", "partial-1"], "held-out": ["full-00", "full-01", "none-00"] };
  const all = buildEmitManifest({ approvedCases: cases, from: ["approved"], ids: null, committedIds });
  assert.equal(all.caseCount, cases.length);
  assert.equal(all.kind, "run-manifest");
  assert.deepEqual(Object.keys(all.cases[0]).sort(), ["answerSha256", "id", "questionSha256"]);

  const union = buildEmitManifest({ approvedCases: cases, from: ["diagnostic", "held-out"], ids: null, committedIds });
  assert.deepEqual(union.cases.map((entry) => entry.id), ["full-00", "full-01", "none-00", "partial-0", "partial-1"]);
  const narrowed = buildEmitManifest({ approvedCases: cases, from: ["approved"], ids: ["tester-a", "partial-2"], committedIds });
  assert.deepEqual(narrowed.cases.map((entry) => entry.id), ["partial-2", "tester-a"]);
  assert.throws(() => buildEmitManifest({ approvedCases: cases, from: ["diagnostic"], ids: ["full-00"], committedIds }), /not in diagnostic: full-00/);
  const without = buildEmitManifest({ approvedCases: cases, from: ["diagnostic", "held-out"], ids: null, exclude: ["partial-0", "none-00"], committedIds });
  assert.deepEqual(without.cases.map((entry) => entry.id), ["full-00", "full-01", "partial-1"], "excluded cases are left out");
  assert.throws(() => buildEmitManifest({ approvedCases: cases, from: ["diagnostic"], ids: null, exclude: ["full-00"], committedIds }), /to exclude are not in diagnostic: full-00/);
  assert.throws(() => buildEmitManifest({ approvedCases: cases, from: ["diagnostic"], ids: null, committedIds: { diagnostic: ["retired-case"] } }), /no longer approved .*retired-case/);

  assert.equal(resolveEmitPath("output/answer-quality/manifests/x.json", "/repo"), "/repo/output/answer-quality/manifests/x.json");
  assert.throws(() => resolveEmitPath("apps/backend/src/eval/answer-quality/manifests/diagnostic.json", "/repo"), /under output\/ only/);
  assert.throws(() => resolveEmitPath("output/../PRD/x.json", "/repo"), /under output\/ only/);

  assert.deepEqual(parseManifestArgs(["--emit", "output/x.json"]).from, ["approved"]);
  assert.deepEqual(parseManifestArgs(["--emit", "output/x.json", "--from", "diagnostic", "--ids", "a,b"]).ids, ["a", "b"]);
  assert.throws(() => parseManifestArgs(["--from", "diagnostic"]), /belong to --emit/);
  assert.throws(() => parseManifestArgs(["--exclude", "a"]), /belong to --emit/);
  assert.deepEqual(parseManifestArgs(["--emit", "output/x.json", "--exclude", "a,b"]).exclude, ["a", "b"]);
  assert.throws(() => parseManifestArgs(["--emit", "output/x.json", "--from", "everything"]), /approved, diagnostic or held-out/);
  assert.throws(() => parseManifestArgs(["--emit", "output/x.json", "--check"]), /cannot be combined/);
});
