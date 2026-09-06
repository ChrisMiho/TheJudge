import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  CONTROL_FILE_PREFIX,
  INTAKE_DIR,
  NEVER_REMOVE_BASENAMES,
  REPORT_OUTSIDE_ROOT,
  classifyLeftovers,
  formatReport,
  intakeRemovalPath,
  parseWorktreeList
} from "./graph-prune.mjs"

const PREFIX = "thejudge-auto/"

function only(items, kind) {
  const matches = items.filter((item) => item.kind === kind)
  assert.equal(matches.length, 1, `expected exactly one ${kind} item`)
  return matches[0]
}

// --- branches ---------------------------------------------------------------

test("graph-prune - classifyLeftovers - a merged branch is deleted", () => {
  const items = classifyLeftovers({
    branches: [{ name: `${PREFIX}image-first-cards`, merged: true }]
  })
  const item = only(items, "branch")
  assert.equal(item.action, "delete")
  assert.equal(item.name, `${PREFIX}image-first-cards`)
  assert.equal(item.reason, "merged into origin/main")
})

test("graph-prune - classifyLeftovers - a merged docs branch whose package is still on main is deletable (REQ-194)", () => {
  // The build half cuts `-work` from origin/main, never from the docs branch,
  // so a docs branch is finished the moment its PR merges — whether or not the
  // package folder is still waiting to be built on main.
  const items = classifyLeftovers({
    branches: [{ name: `${PREFIX}ai-answer-quality-baseline`, merged: true }]
  })
  const item = only(items, "branch")
  assert.equal(item.action, "delete")
  assert.equal(item.reason, "merged into origin/main")
})

test("graph-prune - classifyLeftovers - an unmerged branch is kept", () => {
  const items = classifyLeftovers({
    branches: [{ name: `${PREFIX}abandoned-idea`, merged: false }]
  })
  const item = only(items, "branch")
  assert.equal(item.action, "keep")
  assert.match(item.reason, /not merged/)
})

test("graph-prune - classifyLeftovers - the -work branch follows the same merged/unmerged rule", () => {
  const items = classifyLeftovers({
    branches: [
      { name: `${PREFIX}single-source-invariants-work`, merged: true },
      { name: `${PREFIX}in-flight-build-work`, merged: false }
    ]
  })
  assert.deepEqual(
    items.map((item) => item.action),
    ["delete", "keep"]
  )
})

// --- worktrees --------------------------------------------------------------

test("graph-prune - classifyLeftovers - a worktree under .worktrees with a merged branch and a clean tree is deleted", () => {
  const items = classifyLeftovers({
    worktrees: [
      { path: ".worktrees/kickoff-image-first-cards", branch: `${PREFIX}image-first-cards`, merged: true, clean: true }
    ]
  })
  const item = only(items, "worktree")
  assert.equal(item.action, "delete")
  assert.equal(item.name, ".worktrees/kickoff-image-first-cards")
})

test("graph-prune - classifyLeftovers - a worktree on an unmerged branch is kept", () => {
  const items = classifyLeftovers({
    worktrees: [{ path: ".worktrees/kickoff-live", branch: `${PREFIX}live`, merged: false, clean: true }]
  })
  const item = only(items, "worktree")
  assert.equal(item.action, "keep")
  assert.match(item.reason, /not merged/)
})

test("graph-prune - classifyLeftovers - a worktree with a dirty tree is kept even when merged", () => {
  const items = classifyLeftovers({
    worktrees: [{ path: ".worktrees/kickoff-dirty", branch: `${PREFIX}dirty`, merged: true, clean: false }]
  })
  const item = only(items, "worktree")
  assert.equal(item.action, "keep")
  assert.match(item.reason, /not clean/)
})

test("graph-prune - classifyLeftovers - a detached worktree is kept", () => {
  const items = classifyLeftovers({
    worktrees: [{ path: ".worktrees/detached", branch: null, merged: true, clean: true }]
  })
  const item = only(items, "worktree")
  assert.equal(item.action, "keep")
  assert.match(item.reason, /detached/)
})

test("graph-prune - classifyLeftovers - the codehealth worktree is never a candidate", () => {
  const items = classifyLeftovers({
    worktrees: [
      { path: ".worktrees/.codehealth", branch: "codehealth/loop", merged: true, clean: true },
      { path: ".worktrees/.codehealth/nested", branch: "codehealth/loop", merged: true, clean: true }
    ]
  })
  assert.deepEqual(
    items.map((item) => item.action),
    ["keep", "keep"]
  )
  assert.ok(items.every((item) => /codehealth/.test(item.reason)))
})

test("graph-prune - classifyLeftovers - a worktree outside .worktrees is reported, never removed", () => {
  const items = classifyLeftovers({
    worktrees: [{ path: ".claude/worktrees/custom-domain", branch: "fix/domain", merged: true, clean: true }]
  })
  const item = only(items, "worktree")
  assert.equal(item.action, "report")
  assert.equal(item.reason, REPORT_OUTSIDE_ROOT)
})

test("graph-prune - classifyLeftovers - absolute worktree paths are judged against the given root", () => {
  const root = "/repo/main"
  const items = classifyLeftovers({
    root,
    worktrees: [
      { path: `${root}/.worktrees/kickoff-a`, branch: `${PREFIX}a`, merged: true, clean: true },
      { path: `${root}/.worktrees/.codehealth`, branch: "codehealth/loop", merged: true, clean: true },
      { path: `${root}/.claude/worktrees/b`, branch: "fix/b", merged: true, clean: true },
      { path: "/elsewhere/.worktrees/c", branch: `${PREFIX}c`, merged: true, clean: true }
    ]
  })
  assert.deepEqual(
    items.map((item) => item.action),
    ["delete", "keep", "report", "report"]
  )
  // The name stays the absolute path so `git worktree remove` gets a usable argument.
  assert.equal(items[0].name, `${root}/.worktrees/kickoff-a`)
})

// --- intake folders ---------------------------------------------------------

test("graph-prune - classifyLeftovers - an intake folder with no live lock is deleted", () => {
  const items = classifyLeftovers({ intakeDirs: ["graph-20260830-152808"], lock: null })
  const item = only(items, "intake")
  assert.equal(item.action, "delete")
  assert.equal(item.name, `${INTAKE_DIR}/graph-20260830-152808`)
})

test("graph-prune - classifyLeftovers - the live lock's intake folder is kept", () => {
  const items = classifyLeftovers({
    intakeDirs: ["graph-20260906-092312", "graph-20260830-152808"],
    lock: { slug: "x", runId: "graph-20260906-092312", pid: 1, startedAt: null }
  })
  assert.deepEqual(
    items.map((item) => [item.name.split("/").at(-1), item.action]),
    [
      ["graph-20260906-092312", "keep"],
      ["graph-20260830-152808", "delete"]
    ]
  )
  assert.match(items[0].reason, /live lock/)
})

test("graph-prune - classifyLeftovers - is pure and empty inputs yield no items", () => {
  assert.deepEqual(classifyLeftovers({}), [])
  const args = {
    branches: [{ name: `${PREFIX}a`, merged: true }],
    worktrees: [{ path: ".worktrees/a", branch: `${PREFIX}a`, merged: true, clean: true }],
    intakeDirs: ["graph-1"],
    lock: null
  }
  assert.deepEqual(classifyLeftovers(args), classifyLeftovers(args))
})

// --- removal guard ----------------------------------------------------------

test("graph-prune - intakeRemovalPath - only a plain run-id child of the intake dir is removable", () => {
  assert.equal(intakeRemovalPath("graph-20260830-152808"), `${INTAKE_DIR}/graph-20260830-152808`)
  for (const control of NEVER_REMOVE_BASENAMES) assert.equal(intakeRemovalPath(control), null, control)
  assert.equal(intakeRemovalPath(`${CONTROL_FILE_PREFIX}anything`), null)
  assert.equal(intakeRemovalPath(".graph-run.lock"), null)
  assert.equal(intakeRemovalPath(".."), null)
  assert.equal(intakeRemovalPath("."), null)
  assert.equal(intakeRemovalPath(""), null)
  assert.equal(intakeRemovalPath("../.graph-stop"), null)
  assert.equal(intakeRemovalPath("nested/child"), null)
})

test("graph-prune - NEVER_REMOVE_BASENAMES - names every control file the run writes", () => {
  assert.deepEqual(
    [...NEVER_REMOVE_BASENAMES],
    [
      ".graph-run.lock",
      ".graph-stop",
      ".graph-run-state.json",
      ".graph-node-calls.json",
      ".graph-evidence.jsonl",
      ".graph-denials.jsonl"
    ]
  )
})

// --- parsers ----------------------------------------------------------------

test("graph-prune - parseWorktreeList - reads the porcelain format, main worktree first", () => {
  const porcelain = [
    "worktree /repo/main",
    "HEAD aaaa",
    "branch refs/heads/main",
    "",
    "worktree /repo/main/.worktrees/kickoff-x",
    "HEAD bbbb",
    "branch refs/heads/thejudge-auto/x",
    "",
    "worktree /repo/main/.worktrees/loose",
    "HEAD cccc",
    "detached",
    ""
  ].join("\n")
  assert.deepEqual(parseWorktreeList(porcelain), [
    { path: "/repo/main", head: "aaaa", branch: "main", bare: false, detached: false },
    { path: "/repo/main/.worktrees/kickoff-x", head: "bbbb", branch: `${PREFIX}x`, bare: false, detached: false },
    { path: "/repo/main/.worktrees/loose", head: "cccc", branch: null, bare: false, detached: true }
  ])
  assert.deepEqual(parseWorktreeList(""), [])
})

// --- report -----------------------------------------------------------------

test("graph-prune - formatReport - one line per item and a dry-run summary", () => {
  const items = classifyLeftovers({
    branches: [
      { name: `${PREFIX}gone`, merged: true },
      { name: `${PREFIX}in-flight`, merged: false }
    ],
    worktrees: [{ path: ".claude/worktrees/x", branch: "fix/x", merged: true, clean: true }]
  })
  const out = formatReport(items)
  assert.match(out, new RegExp(`^delete branch ${PREFIX}gone — merged into origin/main$`, "m"))
  assert.match(out, new RegExp(`^keep branch ${PREFIX}in-flight — not merged into origin/main$`, "m"))
  assert.match(out, /^report worktree \.claude\/worktrees\/x — outside the \.worktrees root; not removed$/m)
  assert.match(
    out,
    /graph-prune: 1 to delete, 1 kept, 1 reported \(dry run: nothing changed; pass --apply to delete\)$/
  )
  assert.doesNotMatch(formatReport(items, { apply: true }), /dry run/)
  assert.match(formatReport([]), /no leftovers found/)
})

// --- safety by construction ------------------------------------------------

test("graph-prune - source - has no git push, no forced flag, and no forced branch delete", () => {
  const source = readFileSync(new URL("./graph-prune.mjs", import.meta.url), "utf8")
  assert.doesNotMatch(source, /push/)
  assert.doesNotMatch(source, /--force/)
  assert.doesNotMatch(source, /-D\b/)
  // The safe verbs are the only ones present.
  assert.match(source, /\["branch", "-d", item\.name\]/)
  assert.match(source, /\["worktree", "remove", item\.name\]/)
  // The protected-write guard scans this file: no protected-path literal may sit beside its rmSync.
  assert.doesNotMatch(source, /thejudge-/)
})
