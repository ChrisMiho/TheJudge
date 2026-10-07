import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { deriveTags } from "./gold-cases.mjs"
import {
  buildCoverageFile,
  checkCoverageGate,
  computeCoverage,
  formatCoverageReport,
  listMechanics,
  validateExcludedList
} from "./rules-coverage.mjs"
import { loadExcludedMechanics, rewriteCoverage } from "../rules-coverage.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

// A tiny rule index: two keyword actions and three keyword abilities, plus the general rules the list skips.
const RULE_INDEX = [
  { ruleId: "100.1", text: "100.1. These Magic rules apply to any Magic game." },
  { ruleId: "701.1a", text: "701.1a Keyword actions are the actions the rules refer to." },
  { ruleId: "701.2a", text: "701.2a To activate an activated ability is to put it onto the stack." },
  { ruleId: "701.8a", text: "701.8a To destroy a permanent, move it from the battlefield to its owner’s graveyard." },
  { ruleId: "701.8b", text: "701.8b Regeneration can replace destruction." },
  { ruleId: "702.1a", text: "702.1a Abilities can be keyword abilities." },
  { ruleId: "702.2a", text: "702.2a Deathtouch is a static ability." },
  { ruleId: "702.19a", text: "702.19a Trample is a static ability that modifies combat damage." },
  { ruleId: "702.19b", text: "702.19b Trample's lethal damage rule." },
  { ruleId: "702.158a", text: "702.158a One card (Space Beleren) has the space sculptor ability." }
]

const EXCLUDED = [{ id: "702.158", name: "Space Sculptor", reason: "joke-only fixture" }]

function fixtureCase(id, ruleIds, overrides = {}) {
  const raw = {
    id,
    tier: 1,
    review: { status: "draft", reviewedOn: null },
    cards: [],
    expected: { outcome: "works", shortAnswer: "Yes.", answer: `Answer ${id}.`, decidingRuleIds: ruleIds },
    source: {},
    ...overrides
  }
  return { ...raw, tags: deriveTags(raw) }
}

test("the mechanic list is every distinct 701.N and 702.N in the index except 701.1 and 702.1, in rule-number order, with a best-effort name", () => {
  const mechanics = listMechanics(RULE_INDEX)
  assert.deepEqual(
    mechanics.map((mechanic) => mechanic.id),
    ["701.2", "701.8", "702.2", "702.19", "702.158"]
  )
  assert.deepEqual(
    mechanics.map((mechanic) => mechanic.kind),
    ["action", "action", "ability", "ability", "ability"]
  )
  assert.deepEqual(
    mechanics.map((mechanic) => mechanic.name),
    ["activate", "destroy", "Deathtouch", "Trample", null]
  )
})

test("the mechanic list reads the committed rule index and numbers actions under 701 and abilities under 702, without the general rules", async () => {
  const { loadSnapshotSources } = await import("./gold-cases.mjs")
  const mechanics = listMechanics((await loadSnapshotSources()).ruleIndex)
  assert.ok(mechanics.length > 200, `expected over 200 mechanics, got ${mechanics.length}`)
  const ids = new Set(mechanics.map((mechanic) => mechanic.id))
  assert.ok(ids.has("702.19") && ids.has("701.8"))
  assert.ok(!ids.has("701.1") && !ids.has("702.1"))
  for (const mechanic of mechanics) assert.match(mechanic.id, /^70[12]\.\d+$/)
  assert.equal(mechanics.find((mechanic) => mechanic.id === "702.19").name, "Trample")
})

test("a mechanic is covered by a draft, approved or needs-edit case under it, best status wins, and a rejected case never covers", () => {
  const mechanics = listMechanics(RULE_INDEX)
  const cases = [
    fixtureCase("trample-draft", ["702.19b"]),
    fixtureCase("trample-approved", ["702.19a"], { review: { status: "approved", reviewedOn: "2026-10-06" } }),
    fixtureCase("destroy-needs-edit", ["701.8a"], { review: { status: "needs-edit", reviewedOn: "2026-10-06" } }),
    fixtureCase("deathtouch-rejected", ["702.2a"], { review: { status: "rejected", reviewedOn: "2026-10-06" } }),
    fixtureCase("no-mechanic", ["510.1c"])
  ]
  const { buckets } = computeCoverage({ cases, mechanics, excluded: EXCLUDED })

  assert.deepEqual(buckets.approved, ["702.19"])
  assert.deepEqual(buckets.needsEdit, ["701.8"])
  assert.deepEqual(buckets.draft, [])
  assert.deepEqual(buckets.none, ["701.2", "702.2"], "a rejected case leaves its mechanic uncovered")
  assert.deepEqual(buckets.excluded, ["702.158"])
})

test("the report counts cases per rules section, tier, review status and outcome; a rejected case counts only under review status", () => {
  const mechanics = listMechanics(RULE_INDEX)
  const cases = [
    fixtureCase("a", ["702.19b", "510.1c"], { tier: 2 }),
    fixtureCase("b", ["510.1c"], {
      expected: { outcome: "does-not-work", shortAnswer: "No.", answer: "B.", decidingRuleIds: ["510.1c"] },
      source: { pool: "cr-example" }
    }),
    fixtureCase("c", ["613.9"], { review: { status: "rejected", reviewedOn: "2026-10-06" } })
  ]
  const coverage = computeCoverage({ cases, mechanics, excluded: EXCLUDED })

  assert.deepEqual(coverage.sections, { 510: 2, 702: 1 })
  assert.deepEqual(coverage.tiers, { 1: 1, 2: 1 })
  assert.deepEqual(coverage.reviewStatus, { draft: 2, approved: 0, "needs-edit": 0, rejected: 1 })
  assert.deepEqual(coverage.outcomes, { works: 1, "does-not-work": 1, depends: 0 })
  assert.deepEqual(coverage.pools, {
    "cr-example": { cases: 1, outcomes: { works: 0, "does-not-work": 1, depends: 0 } }
  })
})

test("the coverage gate: an uncovered mechanic fails it, naming the mechanic", () => {
  const cases = [fixtureCase("t", ["702.19a"]), fixtureCase("d", ["701.8a"]), fixtureCase("x", ["701.2a"])]
  const committed = buildCoverageFile(
    computeCoverage({ cases, mechanics: listMechanics(RULE_INDEX), excluded: EXCLUDED })
  )
  const result = checkCoverageGate({ cases, ruleIndex: RULE_INDEX, excluded: EXCLUDED, committed })
  assert.equal(result.ok, false)
  assert.deepEqual(result.failures, [
    "mechanic 702.2 (Deathtouch) has no draft, approved or needs-edit case and is not on the excluded list"
  ])
})

test("the coverage gate: an excluded id the index lacks fails it", () => {
  const cases = [
    fixtureCase("t", ["702.19a"]),
    fixtureCase("d", ["701.8a"]),
    fixtureCase("x", ["701.2a"]),
    fixtureCase("k", ["702.2a"])
  ]
  const excluded = [...EXCLUDED, { id: "702.999", name: "Imaginary", reason: "not in the index" }]
  const committed = buildCoverageFile(computeCoverage({ cases, mechanics: listMechanics(RULE_INDEX), excluded }))
  const result = checkCoverageGate({ cases, ruleIndex: RULE_INDEX, excluded, committed })
  assert.equal(result.ok, false)
  assert.match(
    result.failures.join("\n"),
    /the excluded list names 702\.999, which the committed rule index does not contain/
  )
})

test("the coverage gate: an out-of-date coverage file fails it, and a fully covered fixture with a current file passes", () => {
  const cases = [
    fixtureCase("t", ["702.19a"]),
    fixtureCase("d", ["701.8a"]),
    fixtureCase("x", ["701.2a"]),
    fixtureCase("k", ["702.2a"])
  ]
  const mechanics = listMechanics(RULE_INDEX)
  const current = buildCoverageFile(computeCoverage({ cases, mechanics, excluded: EXCLUDED }))

  const passing = checkCoverageGate({ cases, ruleIndex: RULE_INDEX, excluded: EXCLUDED, committed: current })
  assert.deepEqual(passing.failures, [])
  assert.equal(passing.ok, true)

  // Someone approves a case by hand and does not rerun the coverage command.
  const approvedByHand = [{ ...cases[0], review: { status: "approved", reviewedOn: "2026-10-06" } }, ...cases.slice(1)]
  const stale = checkCoverageGate({
    cases: approvedByHand,
    ruleIndex: RULE_INDEX,
    excluded: EXCLUDED,
    committed: current
  })
  assert.equal(stale.ok, false)
  assert.match(stale.failures[0], /coverage file is out of date/)

  assert.equal(checkCoverageGate({ cases, ruleIndex: RULE_INDEX, excluded: EXCLUDED, committed: undefined }).ok, false)
})

test("the excluded list's own checks: each entry names a rule number, a name and a reason, once", () => {
  assert.deepEqual(validateExcludedList({ excluded: EXCLUDED }), [])
  assert.match(validateExcludedList({}).join(), /needs an `excluded` array/)
  const problems = validateExcludedList({
    excluded: [
      { id: "bad", name: "", reason: "" },
      { id: "701.45", name: "Assemble", reason: "x" },
      { id: "701.45", name: "Assemble", reason: "x" }
    ]
  })
  assert.ok(problems.some((problem) => /needs a mechanic rule number/.test(problem)))
  assert.ok(problems.some((problem) => /needs a name/.test(problem)))
  assert.ok(problems.some((problem) => /needs a one-line reason/.test(problem)))
  assert.ok(problems.some((problem) => /excluded twice/.test(problem)))
})

test("the committed excluded list holds the two joke-only mechanics and the three MSH mechanics with no official text yet, each with a reason, and every id is a mechanic the index contains", async () => {
  const excluded = await loadExcludedMechanics()
  assert.deepEqual(
    excluded.map((entry) => entry.id),
    ["701.45", "702.158", "701.69", "702.193", "702.194"]
  )
  assert.deepEqual(
    excluded.map((entry) => entry.name),
    ["Assemble", "Space Sculptor", "heal damage already dealt to", "Power-up", "Teamwork"]
  )
  // The three Marvel Super Heroes entries are temporary (owner decision 2026-10-07): no WotC ruling or
  // CR example existed to quote. Their reasons say so, so a later refresh knows to revisit them.
  for (const id of ["701.69", "702.193", "702.194"]) {
    assert.match(excluded.find((entry) => entry.id === id).reason, /TEMPORARY, revisit/, id)
  }
  for (const entry of excluded) assert.ok(entry.reason.length > 20, `${entry.id} needs a real reason`)
  const { loadSnapshotSources } = await import("./gold-cases.mjs")
  const ids = new Set(listMechanics((await loadSnapshotSources()).ruleIndex).map((mechanic) => mechanic.id))
  for (const entry of excluded) assert.ok(ids.has(entry.id), `${entry.id} must be in the committed rule index`)
})

test("the coverage report lists uncovered mechanics as output, not a failure, and prints the counts", () => {
  const mechanics = listMechanics(RULE_INDEX)
  const coverage = computeCoverage({
    cases: [fixtureCase("t", ["702.19a"], { review: { status: "approved", reviewedOn: "2026-10-06" } })],
    mechanics,
    excluded: EXCLUDED
  })
  const report = formatCoverageReport({ coverage, mechanics, excluded: EXCLUDED })
  assert.match(
    report,
    /Mechanics in the committed rule index: 5 \(2 keyword actions, 3 keyword abilities\); excluded: 1; need a case: 4/
  )
  assert.match(report, /Covered: 1 of 4 \(25%\): 1 approved, 0 draft only, 0 needs-edit only\. Uncovered: 3\./)
  assert.match(
    report,
    /Uncovered mechanics \(3; report output, not a failure here\):\n {2}701\.2 activate\n {2}701\.8 destroy\n {2}702\.2 Deathtouch/
  )
  assert.match(report, /Excluded \(joke-only, owner's list\):\n {2}702\.158 Space Sculptor: joke-only fixture/)
  assert.match(report, /Cases per tier: 1 1/)
})

test("the coverage file is counts and rule numbers only: no prose", () => {
  const cases = [fixtureCase("t", ["702.19a"], { source: { pool: "mechanic" } })]
  const file = buildCoverageFile(computeCoverage({ cases, mechanics: listMechanics(RULE_INDEX), excluded: EXCLUDED }))
  const strings = []
  const walk = (value) => {
    if (typeof value === "string") strings.push(value)
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === "object") Object.values(value).forEach(walk)
  }
  walk(file)
  for (const text of strings)
    assert.match(text, /^70[12]\.\d+$/, `only mechanic rule numbers appear as text, got "${text}"`)
  assert.deepEqual(Object.keys(file), ["mechanics", "sections", "tiers", "reviewStatus", "outcomes", "pools"])
  assert.deepEqual(Object.keys(file.outcomes), ["works", "does-not-work", "depends"])
})

test("rewriteCoverage writes the file and the committed coverage file carries counts and ids only, including counts per outcome", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rules-coverage-"))
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const out = path.join(dir, "coverage.json")
  const cases = [fixtureCase("t", ["702.19a"])]
  const { file } = await rewriteCoverage({ cases, ruleIndex: RULE_INDEX, excluded: EXCLUDED, path: out })
  assert.deepEqual(JSON.parse(fs.readFileSync(out, "utf8")), file)

  const committed = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "apps/backend/src/eval/answer-quality/coverage.json"), "utf8")
  )
  for (const key of ["mechanics", "sections", "tiers", "reviewStatus", "outcomes", "pools"])
    assert.ok(key in committed, `coverage.json has ${key}`)
  assert.deepEqual(Object.keys(committed.outcomes), ["works", "does-not-work", "depends"])
  const prose = JSON.stringify(committed).match(/"[^"]*[a-z]{4,} [a-z]{3,}[^"]*"/g)
  assert.equal(prose, null, "no sentence-like text in the committed coverage file")
})
