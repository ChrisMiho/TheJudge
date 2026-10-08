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
  runManifests,
  selectHeldOut
} from "./build-answer-quality-manifests.mjs";
import { DIAGNOSTIC_MANIFEST_RELATIVE_PATH, HELD_OUT_MANIFEST_RELATIVE_PATH } from "./lib/diagnostic-arms.mjs";
import { loadManifestFile } from "./lib/experiment-run.mjs";

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

test("check mode compares against the files on disk, and write mode writes both", async () => {
  const { cases, classes } = syntheticCorpus();
  const traced = [...classes].map(([caseId, klass]) => ({
    caseId,
    rules: klass === "full" ? [{ selectedInSearch: true }] : klass === "none" ? [{ selectedInSearch: false }] : [{ selectedInSearch: true }, { selectedInSearch: false }]
  }));
  const written = new Map();
  const argv = ["--diagnostic-none", "5", "--diagnostic-full", "3", "--held-out", "20", "--reason", "synthetic"];
  const logs = [];
  await runManifests({ argv, approvedCases: cases, traced, write: async (path, text) => written.set(path, text), readExisting: async () => "", log: (line) => logs.push(line), root: "/repo" });
  assert.equal(written.size, 2);
  assert.ok([...written.keys()].every((path) => path.startsWith("/repo/apps/backend/src/eval/answer-quality/manifests/")));
  assert.ok(logs.join("\n").includes("Sample size changed from its default. Reason: synthetic"));

  const same = await runManifests({ argv: [...argv, "--check"], approvedCases: cases, traced, write: async () => assert.fail("check mode writes nothing"), readExisting: async (path) => written.get(path), log: () => {}, root: "/repo" });
  assert.equal(same.checked, true);
  await assert.rejects(
    () => runManifests({ argv: [...argv, "--check"], approvedCases: cases, traced, write: async () => {}, readExisting: async () => "stale", log: () => {}, root: "/repo" }),
    /differ from a fresh seeded run/
  );
});

test("the committed manifests, read as data: disjoint, ids and hashes only, usable as an experiment manifest (byte-for-byte reproduction is the on-demand `npm run eval:answer-quality:manifests -- --check`, never a gate)", async () => {
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
