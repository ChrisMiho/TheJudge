import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  SUITE_DIR,
  SUITE_IGNORE_LINE,
  assertSuiteIgnored,
  gitCheckIgnore,
  normalizeSuiteFilters,
  resolveInsideSuite,
  selectSuiteCases
} from "./rulesguru-suite.mjs";

// The folder-guard test: the only test allowed to name the suite folder path.
test("the real repo ignores a path inside the suite folder and tracks nothing there", () => {
  assert.equal(SUITE_IGNORE_LINE, "output/rulesguru/");
  assert.ok(gitCheckIgnore("output/rulesguru/raw/probe.json"), "git check-ignore matches a path inside the suite folder");
  const tracked = spawnSync("git", ["ls-files", "output/rulesguru"], { encoding: "utf8" });
  assert.equal(tracked.status, 0);
  assert.equal(tracked.stdout.trim(), "", "git tracks nothing under the suite folder");
  assert.doesNotThrow(() => assertSuiteIgnored({ suiteDir: SUITE_DIR }));
});

test("the ignore guard refuses when git reports the folder not ignored, naming the .gitignore line", () => {
  assert.throws(
    () => assertSuiteIgnored({ suiteDir: "/tmp/some-suite", checkIgnore: () => false }),
    (error) => /Refusing/.test(error.message) && error.message.includes('"output/rulesguru/"') && /\.gitignore/.test(error.message)
  );
  assert.doesNotThrow(() => assertSuiteIgnored({ suiteDir: "/tmp/some-suite", checkIgnore: () => true }));
});

test("the path check accepts the suite folder and paths inside it, and refuses everything else", () => {
  const base = mkdtempSync(join(tmpdir(), "suite-path-"));
  const suiteDir = join(base, "suite");
  const outside = join(base, "outside");
  mkdirSync(join(suiteDir, "raw"), { recursive: true });
  mkdirSync(outside);
  symlinkSync(outside, join(suiteDir, "escape"));

  assert.doesNotThrow(() => resolveInsideSuite(suiteDir, { suiteDir }));
  assert.doesNotThrow(() => resolveInsideSuite(join(suiteDir, "raw", "1.json"), { suiteDir }));
  assert.doesNotThrow(() => resolveInsideSuite(join(suiteDir, "not", "yet", "there.txt"), { suiteDir }));
  assert.throws(() => resolveInsideSuite(base, { suiteDir }), /not the suite folder/);
  assert.throws(() => resolveInsideSuite(join(suiteDir, ".."), { suiteDir }), /not the suite folder/);
  assert.throws(() => resolveInsideSuite(join(suiteDir, "raw", "..", "..", "outside"), { suiteDir }), /not the suite folder/);
  assert.throws(() => resolveInsideSuite(outside, { suiteDir }), /not the suite folder/);
  assert.throws(() => resolveInsideSuite(join(suiteDir, "escape", "x.json"), { suiteDir }), /not the suite folder/);
  assert.throws(() => resolveInsideSuite(`${suiteDir}-sibling`, { suiteDir }), /not the suite folder/);
});

function suiteCase(id, suite) {
  return { id, suite: { level: 1, complexity: "simple", tags: [], excluded: null, ...suite } };
}

const CASES = [
  suiteCase("c1", { level: 0, tags: ["Combat"] }),
  suiteCase("c2", { level: 1, tags: ["Combat", "Stack"] }),
  suiteCase("c3", { level: "corner", complexity: "complicated", tags: ["Stack"] }),
  suiteCase("c4", { level: 1, complexity: "intermediate", tags: ["Unsupported answers"] }),
  suiteCase("c5", { level: 2, excluded: "unresolved-card" }),
  suiteCase("c6", { level: 2, tags: ["Combat"] }),
  suiteCase("c7", { level: 0, tags: ["Stack"] })
];

test("filters: values within a flag are or-ed, flags are and-ed, unsupported is dropped by default", () => {
  const ids = (filters, options) => selectSuiteCases(CASES, normalizeSuiteFilters(filters), options).selected.map((c) => c.id);

  assert.deepEqual(ids({}), ["c1", "c2", "c3", "c6", "c7"]);
  assert.deepEqual(ids({ level: ["0", "corner"] }), ["c1", "c3", "c7"]);
  assert.deepEqual(ids({ level: ["0", "1"], suiteTag: "combat" }), ["c1", "c2"]);
  assert.deepEqual(ids({ level: "0", suiteTag: ["Combat", "Stack"] }), ["c1", "c7"]);
  assert.deepEqual(ids({ complexity: "complicated" }), ["c3"]);
  assert.deepEqual(ids({ includeUnsupported: true }), ["c1", "c2", "c3", "c4", "c6", "c7"]);
  assert.throws(() => normalizeSuiteFilters({ level: "9" }), /--level/);
  assert.throws(() => normalizeSuiteFilters({ complexity: "hard" }), /--complexity/);
});

test("selection counts excluded, unsupported, filtered-out and stale cases", () => {
  const { selected, counts } = selectSuiteCases(CASES, normalizeSuiteFilters({ level: ["0", "1", "2"] }), {
    isStale: (caseEntry) => caseEntry.id === "c2"
  });
  assert.deepEqual(selected.map((c) => c.id), ["c1", "c6", "c7"]);
  assert.deepEqual(counts, { total: 7, excluded: 1, unsupported: 1, filteredOut: 1, stale: 1, selected: 3 });
});

test("a seeded sample is repeatable and differs with the seed", () => {
  const filters = normalizeSuiteFilters();
  const pick = (seed) => selectSuiteCases(CASES, filters, { sample: 3, seed }).selected.map((c) => c.id);
  assert.deepEqual(pick(7), pick(7));
  assert.equal(pick(7).length, 3);
  const seeds = new Set([1, 2, 3, 4, 5, 6].map((seed) => pick(seed).join(",")));
  assert.ok(seeds.size > 1, "different seeds give different samples");
});
