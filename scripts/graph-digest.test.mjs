import { test } from "node:test"
import assert from "node:assert/strict"

import { formatDigest, parseLedger, preferWorktreeLedgers } from "./graph-digest.mjs"

const PARKED_LEDGER = `# Graph run — overnight-run-tuning

- Run ID: \`graph-20260828-010101\`
- Current node: \`gate-qc\`
- Next action: \`/graph-implement PRD/work/overnight-run-tuning/\`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | gate-qc | sonnet | ok | \`3 → 9\` | PASS | 2026-08-28 |

## Open gate

- Run one stopped at quality-check PASS. Answer the questions file, then resume.
- Questions: \`PRD/work/overnight-run-tuning/GATE-QUESTIONS.md\`
- Resume: \`/graph-implement PRD/work/overnight-run-tuning/\`
`

const RUNNING_LEDGER = `# Graph run — some-other-package

- Run ID: \`graph-20260828-020202\`
- Current node: \`build\`
- Next action: \`/graph-implement PRD/work/some-other-package/\`

## Open gate

- None
`

test("graph-digest - parseLedger - reads a parked run's gate, questions file, and resume", () => {
  const parsed = parseLedger(PARKED_LEDGER)
  assert.equal(parsed.slug, "overnight-run-tuning")
  assert.equal(parsed.currentNode, "gate-qc")
  assert.equal(parsed.parked, true)
  assert.equal(parsed.questionsFile, "PRD/work/overnight-run-tuning/GATE-QUESTIONS.md")
  assert.equal(parsed.resumeCommand, "/graph-implement PRD/work/overnight-run-tuning/")
  assert.match(parsed.gateSummary, /quality-check PASS/)
})

test("graph-digest - parseLedger - a `- None` open gate is not parked", () => {
  const parsed = parseLedger(RUNNING_LEDGER)
  assert.equal(parsed.slug, "some-other-package")
  assert.equal(parsed.currentNode, "build")
  assert.equal(parsed.parked, false)
  assert.equal(parsed.questionsFile, null)
})

test("graph-digest - parseLedger - falls back to the folder name when the title is missing", () => {
  const parsed = parseLedger("- Current node: `plan`\n\n## Open gate\n\n- None\n", "folder-slug")
  assert.equal(parsed.slug, "folder-slug")
})

test("graph-digest - formatDigest - a parked package shows PARKED and the answer file", () => {
  const out = formatDigest({
    packages: [parseLedger(PARKED_LEDGER)],
    now: new Date("2026-08-28T07:00:00Z")
  })
  assert.match(out, /Graph digest — 2026-08-28/)
  assert.match(out, /overnight-run-tuning: PARKED/)
  assert.match(out, /answer: PRD\/work\/overnight-run-tuning\/GATE-QUESTIONS\.md/)
  assert.match(out, /resume: \/graph-implement/)
})

test("graph-digest - formatDigest - lists the graph PRs waiting on the owner with their urls", () => {
  const out = formatDigest({
    pendingGraphPRs: [
      { headRefName: "thejudge-auto/scan-spec", url: "https://x/42" },
      { headRefName: "thejudge-auto/scan-spec-work", url: "https://x/43" }
    ]
  })
  assert.match(out, /## PRs waiting on you/)
  assert.match(out, /thejudge-auto\/scan-spec → main \(https:\/\/x\/42\) — answer and merge, or merge/)
  assert.match(out, /thejudge-auto\/scan-spec-work → main \(https:\/\/x\/43\)/)
  assert.doesNotMatch(out, /base→main/)
})

test("graph-digest - formatDigest - the empty case reads cleanly and names both ledger roots", () => {
  const out = formatDigest({})
  assert.match(out, /no graph run ledgers found under PRD\/work\/\*\/GRAPH-RUN\.md or \.worktrees\/\*\/PRD\/work\/\*\/GRAPH-RUN\.md/)
  assert.match(out, /none — nothing to answer or merge/)
  assert.match(out, /## Recent receipts/)
})

test("graph-digest - preferWorktreeLedgers - a worktree ledger wins over the launch checkout's copy and says where it is", () => {
  const onMain = parseLedger(PARKED_LEDGER)
  const inWorktree = { ...parseLedger(RUNNING_LEDGER), slug: "overnight-run-tuning", worktree: ".worktrees/implement-overnight-run-tuning" }
  const merged = preferWorktreeLedgers([onMain, parseLedger(RUNNING_LEDGER)], [inWorktree])
  assert.equal(merged.length, 2)
  const winner = merged.find((pkg) => pkg.slug === "overnight-run-tuning")
  assert.equal(winner.parked, false)
  assert.equal(winner.worktree, ".worktrees/implement-overnight-run-tuning")
  const out = formatDigest({ packages: merged })
  assert.match(out, /overnight-run-tuning: running \(at `build`\) \[in \.worktrees\/implement-overnight-run-tuning\]/)
  assert.deepEqual(preferWorktreeLedgers(), [])
})

test("graph-digest - formatDigest - is pure: same inputs give the same string", () => {
  const args = {
    packages: [parseLedger(RUNNING_LEDGER)],
    receipts: ["life-tracker-2026-08-20.md"],
    pendingGraphPRs: [],
    now: new Date("2026-08-28T07:00:00Z")
  }
  assert.equal(formatDigest(args), formatDigest(args))
})

test("graph-digest - owns the read-only waiting-PR query inherited from the retired preflight guard", async () => {
  const { OPEN_GRAPH_PRS_COMMAND } = await import("./graph-digest.mjs")
  assert.deepEqual(OPEN_GRAPH_PRS_COMMAND, [
    "pr",
    "list",
    "--base",
    "main",
    "--state",
    "open",
    "--json",
    "headRefName,url"
  ])
  // Read-only by construction: no mutating gh verb appears.
  assert.ok(!OPEN_GRAPH_PRS_COMMAND.some((token) => ["merge", "close", "create", "edit"].includes(token)))
})
