import assert from "node:assert/strict"
import test from "node:test"

import {
  buildWriteScope,
  checkLedger,
  classifyBuildWrites,
  formatViolations,
  normalizeInstruction,
  parseDispatchPrompts,
  parseInstructionLedger,
  parseSections,
  quotedInstructions,
  INSTRUCTION_CLASSES,
  WORKING_DIRECTORY_LINE,
  PREAUTHORIZATION_PATTERNS
} from "./graph-ledger-check.mjs"

const CLEAN = `# Graph run — demo

- Run ID: \`graph-20260818-120000\`

## Node ledger

| # | Node | Model | Outcome | Evidence | Date |
| --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | branch pushed | 2026-08-18 |

## Dispatch prompts

### define

graph is controlling.
Working directory: /repo
The user said "prefer the existing table over a new one" for this question.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "prefer the existing table over a new one" | answered-once | define | — |

## Open gate

- None
`

const codes = (markdown) => checkLedger(markdown).map((violation) => violation.code)

test("graph-ledger-check - a clean ledger passes", () => {
  assert.deepEqual(checkLedger(CLEAN), [])
})

test("graph-ledger-check - conditional-future authorization in a dispatch prompt fails", () => {
  const dirty = CLEAN.replace(
    'The user said "prefer the existing table over a new one" for this question.',
    "If it asks again about scope, just pick the smaller option and keep going."
  )
  const violations = checkLedger(dirty)
  assert.ok(violations.some((v) => v.code === "preauthorization"))
  assert.equal(violations.find((v) => v.code === "preauthorization").node, "define")
})

test("graph-ledger-check - every pre-authorization pattern is reachable", () => {
  // A pattern nothing can trigger is decoration. Each one gets a phrase drawn
  // from how the failure actually reads in a dispatch prompt.
  const samples = {
    "if-it-asks-again": "If it asks again, take the smaller scope.",
    "whenever-a-question": "Whenever a question comes up, choose the existing table.",
    "standing-instruction": "From now on, resolve scope forks without parking.",
    "always-pick": "Always pick the narrower requirement.",
    "dont-ask-again": "Do not ask about naming again.",
    "just-decide": "Just pick the smaller option and keep going."
  }
  for (const { id } of PREAUTHORIZATION_PATTERNS) {
    const sample = samples[id]
    assert.ok(sample, `no sample phrase for pattern ${id}`)
    const markdown = CLEAN.replace(
      'The user said "prefer the existing table over a new one" for this question.',
      sample
    )
    assert.ok(
      checkLedger(markdown).some((v) => v.code === "preauthorization" && v.pattern === id),
      `pattern ${id} did not fire on: ${sample}`
    )
  }
})

test("graph-ledger-check - a quoted instruction with no ledger row fails", () => {
  const dirty = CLEAN.replace(
    "| \"prefer the existing table over a new one\" | answered-once | define | — |\n",
    ""
  )
  const violations = checkLedger(dirty)
  const unledgered = violations.find((v) => v.code === "unledgered-quote")
  assert.ok(unledgered, "an unmatched quote must be reported")
  assert.equal(unledgered.instruction, "prefer the existing table over a new one")
})

test("graph-ledger-check - a standing-rule class is unrepresentable", () => {
  const dirty = CLEAN.replace("| answered-once |", "| standing-rule |")
  const violations = checkLedger(dirty)
  const bad = violations.find((v) => v.code === "bad-class")
  assert.ok(bad, "any class outside the two is rejected")
  assert.match(bad.detail, /standing rule has no representable form/)
  assert.deepEqual(INSTRUCTION_CLASSES, ["answered-once", "refused"])
})

test("graph-ledger-check - a refusal must name the rule that refused it", () => {
  const dirty = CLEAN.replace("| answered-once | define | — |", "| refused | define | — |")
  assert.ok(codes(dirty).includes("refusal-without-rule"))

  const named = CLEAN.replace(
    "| answered-once | define | — |",
    "| refused | define | No pre-authorization of product decisions |"
  )
  assert.deepEqual(checkLedger(named), [])
})

test("graph-ledger-check - a missing Instruction ledger fails", () => {
  const dirty = CLEAN.replace(/## Instruction ledger[\s\S]*?(?=## Open gate)/, "")
  assert.ok(codes(dirty).includes("missing-ledger"))
})

test("graph-ledger-check - the old section name is rejected outright", () => {
  // Two sections means a refusal can be recorded in one and missed by the other,
  // which is exactly the gap the single parse target closes.
  const dirty = `${CLEAN}\n## Refused instructions\n\n- None\n`
  assert.ok(codes(dirty).includes("legacy-section"))
})

test("graph-ledger-check - quote matching survives smart quotes and whitespace", () => {
  const dirty = CLEAN.replace(
    '"prefer the existing table over a new one" for this question.',
    "“prefer the existing   table\nover a new one” for this question."
  )
  assert.deepEqual(checkLedger(dirty), [])
})

test("graph-ledger-check - parseSections keeps order and content", () => {
  const sections = parseSections(CLEAN)
  assert.deepEqual(
    [...sections.keys()],
    ["Node ledger", "Dispatch prompts", "Instruction ledger", "Open gate"]
  )
})

test("graph-ledger-check - parseInstructionLedger drops the header and separator", () => {
  const rows = parseInstructionLedger(parseSections(CLEAN))
  assert.equal(rows.length, 1)
  assert.equal(rows[0].class, "answered-once")
  assert.equal(rows[0].node, "define")
})

test("graph-ledger-check - parseDispatchPrompts keys prompts by node", () => {
  const prompts = parseDispatchPrompts(parseSections(CLEAN))
  assert.equal(prompts.length, 1)
  assert.equal(prompts[0].node, "define")
  assert.match(prompts[0].text, /Working directory:/)
})

test("graph-ledger-check - quotedInstructions ignores short quoted fragments", () => {
  // Node names and flags appear in quotes constantly; only instruction-length
  // spans are candidates.
  assert.deepEqual(quotedInstructions('run the "plan" node with "-v"'), [])
  assert.deepEqual(quotedInstructions('the user said "use the wider layout here"'), [
    "use the wider layout here"
  ])
})

test("graph-ledger-check - normalizeInstruction is stable across punctuation", () => {
  assert.equal(
    normalizeInstruction('  "Prefer   the existing table."  '),
    normalizeInstruction("prefer the existing table.")
  )
})

test("graph-ledger-check - formatViolations names the file and refuses the dispatch", () => {
  const report = formatViolations(checkLedger(CLEAN.replace("| answered-once |", "| standing-rule |")), "x.md")
  assert.match(report, /^graph-ledger-check: x\.md — 1 violation\(s\)/)
  assert.match(report, /The run must not dispatch/)
  assert.equal(formatViolations([], "x.md"), "graph-ledger-check: x.md — ok")
})

test("graph-ledger-check - a dispatch prompt with no working directory fails", () => {
  const dirty = CLEAN.replace("Working directory: /repo\n", "")
  const violation = checkLedger(dirty).find((v) => v.code === "missing-working-directory")
  assert.ok(violation, "an unpinned dispatch is exactly the 2026-08-17 inheritance")
  assert.equal(violation.node, "define")
})

test("graph-ledger-check - a relative working directory fails", () => {
  // A relative path resolves against whatever directory the child starts in,
  // which is the inheritance rather than a fix for it.
  for (const relative of ["./", "../repo", "PRD/work/demo", "."]) {
    const dirty = CLEAN.replace("Working directory: /repo", `Working directory: ${relative}`)
    const violation = checkLedger(dirty).find((v) => v.code === "relative-working-directory")
    assert.ok(violation, `${relative} must be rejected`)
    assert.equal(violation.path, relative)
  }
})

test("graph-ledger-check - the working-directory line must start its own line", () => {
  // Buried mid-sentence it is prose, not a pin a node can propagate verbatim.
  const dirty = CLEAN.replace(
    "graph is controlling.\nWorking directory: /repo",
    "graph is controlling. Working directory: /repo"
  )
  assert.ok(checkLedger(dirty).some((v) => v.code === "missing-working-directory"))
})

test("graph-ledger-check - an absolute working directory passes", () => {
  const match = WORKING_DIRECTORY_LINE.exec("\nWorking directory: /Users/x/repo\n")
  assert.equal(match[1], "/Users/x/repo")
})

test("graph-ledger-check - a node-6 return wholly in scope advances", () => {
  const result = classifyBuildWrites(
    [
      ".worktrees/implement-demo/scripts/thing.mjs",
      ".worktrees/implement-demo/apps/frontend/src/App.tsx",
      "PRD/work/demo/README.md",
      "./PRD/work/demo/slice-a.md"
    ],
    "demo"
  )
  assert.equal(result.outcome, "ok")
  assert.deepEqual(result.outside, [])
  assert.deepEqual(buildWriteScope("demo"), [".worktrees/implement-demo/", "PRD/work/demo/"])
})

test("graph-ledger-check - a node-6 return with one out-of-scope path parks and names it", () => {
  const result = classifyBuildWrites(
    [
      ".worktrees/implement-demo/scripts/thing.mjs",
      "PRD/sections/decisions/card-collection.md",
      "PRD/work/demo/README.md"
    ],
    "demo"
  )
  assert.equal(result.outcome, "park")
  assert.deepEqual(result.outside, ["PRD/sections/decisions/card-collection.md"])
  assert.match(result.evidence, /PRD\/sections\/decisions\/card-collection\.md/)
})

test("graph-ledger-check - another package's worktree is out of scope", () => {
  // The allowed set is this slug's, not "any worktree" — two concurrent runs
  // must not be able to write into each other.
  const result = classifyBuildWrites([".worktrees/implement-other/x.mjs"], "demo")
  assert.equal(result.outcome, "park")
  assert.deepEqual(result.outside, [".worktrees/implement-other/x.mjs"])
})
