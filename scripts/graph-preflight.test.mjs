import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  CANARY_COMMAND,
  DEFAULT_THRESHOLDS,
  LOCK_PATH,
  PROFILE_SENTINEL_ENV,
  SECRET_PATTERNS,
  STOP_PATH,
  GRAPH_BRANCH_PREFIX,
  classifyCanary,
  classifyGraphCanary,
  classifyHeartbeat,
  classifyLock,
  classifyPendingBaseToMain,
  classifyStopSentinel,
  classifyWorkingTree,
  collectEntries,
  defaultRunId,
  findBranchCollision,
  formatFailureReport,
  isPidAlive,
  lockRecord,
  parseArgs,
  parseCommandArgs,
  parseLockFile,
  parseRefValue,
  parseThresholdValue,
  planActions,
  readProfileSentinel,
  resolveBase,
  takeLock
} from "./graph-preflight.mjs"
import { GRAPH_CANARY_COMMAND, classifyToolCall, isRunActive } from "./lib/boundary-rules.mjs"

test("graph-preflight - classifier - clean tree needs no resolution", () => {
  const result = classifyWorkingTree([])
  assert.equal(result.action, "clean")
  assert.equal(result.fileCount, 0)
  assert.equal(result.changedLines, 0)
})

test("graph-preflight - classifier - small change is committed", () => {
  const result = classifyWorkingTree([
    { path: "PRD/sections/overview.md", changedLines: 12 },
    { path: "PRD/sections/personas.md", changedLines: 3 }
  ])
  assert.equal(result.action, "commit")
  assert.equal(result.fileCount, 2)
  assert.equal(result.changedLines, 15)
})

test("graph-preflight - classifier - too many files is stashed", () => {
  const entries = Array.from({ length: 11 }, (_, i) => ({
    path: `PRD/sections/file-${i}.md`,
    changedLines: 1
  }))
  const result = classifyWorkingTree(entries)
  assert.equal(result.action, "stash")
  assert.match(result.reason, /file count/)
})

test("graph-preflight - classifier - too many lines is stashed", () => {
  const result = classifyWorkingTree([{ path: "PRD/sections/functional-requirements.md", changedLines: 201 }])
  assert.equal(result.action, "stash")
  assert.match(result.reason, /changed lines/)
})

test("graph-preflight - classifier - secrets are blocked, never auto-committed", () => {
  const result = classifyWorkingTree([{ path: ".secrets/openai-dev.env", changedLines: 1 }])
  assert.equal(result.action, "blocked")
  assert.match(result.reason, /secret/i)
})

test("graph-preflight - classifier - secret detection survives a small-change tree", () => {
  const result = classifyWorkingTree([
    { path: "PRD/sections/overview.md", changedLines: 2 },
    { path: "apps/backend/.env", changedLines: 1 }
  ])
  assert.equal(result.action, "blocked")
})

test("graph-preflight - classifier - live 2026-08-14 checkout state stashes", () => {
  // Measured from the real repo: 13 tracked files, 574 insertions + 183
  // deletions, plus 4 untracked files under PRD/work/.
  const entries = [
    { path: "PRD/sections/decisions/combo-retrieval.md", changedLines: 3 },
    { path: "PRD/sections/functional-requirements.md", changedLines: 29 },
    { path: "PRD/sections/integrations-and-data.md", changedLines: 8 },
    { path: "PRD/sections/user-flows.md", changedLines: 1 },
    { path: "PRD/work/commander-spellbook-combos/DESIGN-BRIEF.md", changedLines: 68 },
    { path: "PRD/work/commander-spellbook-combos/GAMEPLAN.md", changedLines: 189 },
    { path: "PRD/work/commander-spellbook-combos/README.md", changedLines: 86 },
    { path: "PRD/work/commander-spellbook-combos/slice-a-corpus-build-pipeline.md", changedLines: 120 },
    { path: "PRD/work/commander-spellbook-combos/slice-b-catalog-loader-and-config.md", changedLines: 57 },
    { path: "PRD/work/commander-spellbook-combos/slice-c-intent-and-matching.md", changedLines: 30 },
    { path: "PRD/work/commander-spellbook-combos/slice-d-prompt-integration.md", changedLines: 77 },
    { path: "PRD/work/commander-spellbook-combos/slice-e-eval-fixtures-and-goldens.md", changedLines: 28 },
    { path: "PRD/work/commander-spellbook-combos/slice-f-answer-quality-comparison.md", changedLines: 61 }
  ]
  const result = classifyWorkingTree(entries)
  assert.equal(result.action, "stash")
  assert.equal(result.fileCount, 13)
})

test("graph-preflight - classifier - thresholds are overridable", () => {
  const entries = [{ path: "a.md", changedLines: 500 }]
  const result = classifyWorkingTree(entries, { maxFiles: 10, maxLines: 1000 })
  assert.equal(result.action, "commit")
})

test("graph-preflight - defaults - documented thresholds are stable", () => {
  assert.deepEqual(DEFAULT_THRESHOLDS, { maxFiles: 10, maxLines: 200 })
  assert.ok(SECRET_PATTERNS.length > 0)
})

test("graph-preflight - collect - merges tracked numstat and untracked files", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "2\t1\tPRD/sections/overview.md\n5\t0\tPRD/sections/personas.md\n"
    }
    if (args.join(" ") === "diff --numstat --cached") {
      return ""
    }
    if (args.join(" ") === "ls-files --others --exclude-standard") {
      return "PRD/work/adhoc/notes.md\n"
    }
    throw new Error(`unexpected git call: ${args.join(" ")}`)
  }

  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 3)
  assert.equal(entries[0].changedLines, 3)
  assert.equal(entries[1].changedLines, 5)
  assert.equal(entries[2].path, "PRD/work/adhoc/notes.md")
})

test("graph-preflight - collect - binary numstat dashes count as zero lines", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "-\t-\tapps/frontend/public/logo.png\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].changedLines, 0)
})

test("graph-preflight - plan - commit path stages and commits", () => {
  const commands = planActions(
    { action: "commit", files: ["a.md"], fileCount: 1, changedLines: 4, reason: "small" },
    { branch: "feature/graph-demo", runId: "graph-20260814-1" }
  )
  assert.ok(commands.some((c) => c.startsWith("git add -A")))
  assert.ok(commands.some((c) => c.includes("git commit")))
  assert.ok(commands.some((c) => c.includes("git switch -c feature/graph-demo")))
  assert.ok(commands.some((c) => c.includes("git push -u origin feature/graph-demo")))
})

test("graph-preflight - plan - stash happens before the branch is created", () => {
  const commands = planActions(
    { action: "stash", files: [], fileCount: 13, changedLines: 757, reason: "too big" },
    { branch: "feature/graph-demo", runId: "graph-20260814-1" }
  )
  const stashIndex = commands.findIndex((c) => c.includes("git stash push"))
  const branchIndex = commands.findIndex((c) => c.includes("git switch -c"))
  assert.ok(stashIndex !== -1, "expected a stash command")
  assert.ok(stashIndex < branchIndex, "stash must precede branch creation")
  assert.ok(commands.some((c) => c.includes("graph-preflight/graph-20260814-1")))
})

test("graph-preflight - plan - stash uses -u so untracked work travels with it", () => {
  const commands = planActions(
    { action: "stash", files: [], fileCount: 13, changedLines: 757, reason: "too big" },
    { branch: "feature/x", runId: "r1" }
  )
  assert.ok(commands.some((c) => c.includes("git stash push -u")))
})

test("graph-preflight - plan - blocked produces no git commands at all", () => {
  const commands = planActions(
    { action: "blocked", files: [".secrets/x.env"], fileCount: 1, changedLines: 1, reason: "secret" },
    { branch: "feature/x", runId: "r1" }
  )
  assert.deepEqual(commands, [])
})

test("graph-preflight - plan - clean tree still creates and pushes the branch", () => {
  const commands = planActions(
    { action: "clean", files: [], fileCount: 0, changedLines: 0, reason: "clean" },
    { branch: "feature/x", runId: "r1" }
  )
  assert.ok(commands.some((c) => c.includes("git switch -c feature/x")))
  assert.ok(!commands.some((c) => c.includes("git stash")))
  assert.ok(!commands.some((c) => c.includes("git commit")))
})

// --- Fix: Important #1 — partially-staged files must not be double-counted ---

test("graph-preflight - collect - a file staged and unstaged merges into one entry with combined lines", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "3\t1\tPRD/sections/overview.md\n"
    }
    if (args.join(" ") === "diff --numstat --cached") {
      return "2\t0\tPRD/sections/overview.md\n"
    }
    if (args.join(" ") === "ls-files --others --exclude-standard") {
      return ""
    }
    throw new Error(`unexpected git call: ${args.join(" ")}`)
  }

  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1, "one physical file must produce one entry")
  assert.equal(entries[0].path, "PRD/sections/overview.md")
  assert.equal(entries[0].changedLines, 6)
})

test("graph-preflight - collect - deduping a partially-staged file keeps fileCount accurate for the threshold", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "3\t1\tPRD/sections/overview.md\n1\t1\tPRD/sections/personas.md\n"
    }
    if (args.join(" ") === "diff --numstat --cached") {
      return "2\t0\tPRD/sections/overview.md\n"
    }
    return ""
  }

  const entries = collectEntries(fakeGit)
  const result = classifyWorkingTree(entries)
  assert.equal(result.fileCount, 2, "the double-counted path must not inflate fileCount")
})

// --- Fix: Important #2 — the real-execution tokenizer had zero coverage ---

test("graph-preflight - parseCommandArgs - a quoted commit message tokenizes as one argument", () => {
  const args = parseCommandArgs('git commit -m "a b c"')
  assert.deepEqual(args, ["commit", "-m", "a b c"])
})

test("graph-preflight - parseCommandArgs - a stash command produced by planActions round-trips", () => {
  const commands = planActions(
    { action: "stash", files: [], fileCount: 1, changedLines: 1, reason: "x" },
    { branch: "feature/x", runId: "r1" }
  )
  const stashCommand = commands.find((c) => c.includes("git stash push"))
  const args = parseCommandArgs(stashCommand)
  assert.deepEqual(args, ["stash", "push", "-u", "-m", "graph-preflight/r1"])
})

// --- Fix: Important #3 — renamed paths must be normalized and checked on both ends ---

test("graph-preflight - collect - rename with common suffix normalizes to real source and destination paths", () => {
  // The exact string reproduced by review: `git mv config/creds.env .secrets/creds.env`.
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat --cached") {
      return "0\t0\t{config => .secrets}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].path, ".secrets/creds.env")
  assert.deepEqual(entries[0].renamedFrom, ["config/creds.env"])
})

test("graph-preflight - collect - rename with common prefix only normalizes to real source and destination paths", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "0\t0\tconfig/{creds.env => creds.env.bak}\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].path, "config/creds.env.bak")
  assert.deepEqual(entries[0].renamedFrom, ["config/creds.env"])
})

test("graph-preflight - collect - rename with common prefix and suffix normalizes to real source and destination paths", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "0\t0\tconfig/{old => .secrets}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].path, "config/.secrets/creds.env")
  assert.deepEqual(entries[0].renamedFrom, ["config/old/creds.env"])
})

test("graph-preflight - collect - bare rename with no common prefix or suffix normalizes to real source and destination paths", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "0\t0\tconfig.env => .secrets\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].path, ".secrets")
  assert.deepEqual(entries[0].renamedFrom, ["config.env"])
})

test("graph-preflight - collect+classify - a file renamed into .secrets is blocked, using the exact reproduced git output", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat --cached") {
      return "0\t0\t{config => .secrets}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  const result = classifyWorkingTree(entries)
  assert.equal(result.action, "blocked")
  assert.match(result.reason, /secret/i)
})

test("graph-preflight - classifier - a file renamed OUT of .secrets is blocked too (source path is checked)", () => {
  const entries = [{ path: "config/creds.env", changedLines: 0, renamedFrom: ".secrets/creds.env" }]
  const result = classifyWorkingTree(entries)
  assert.equal(result.action, "blocked")
  assert.match(result.reason, /secret/i)
})

// --- Fix: Critical #3 — the auto-commit must land on the new branch, never on
// the pre-existing one (which may be `main`). The old commit-path test asserted
// only that the four commands were present, never their order, which is how the
// wrong order shipped. Every action now pins its full ordered output. ---

const PLAN_OPTIONS = {
  branch: "feature/graph-demo",
  runId: "graph-20260814-093000",
  base: "main"
}

function classificationFor(action) {
  return {
    action,
    files: ["a.md"],
    fileCount: 1,
    changedLines: 4,
    reason: `test ${action}`
  }
}

test("graph-preflight - plan - clean action emits its exact ordered command list", () => {
  assert.deepEqual(planActions(classificationFor("clean"), PLAN_OPTIONS), [
    "git fetch origin",
    "git switch -c feature/graph-demo main",
    "git push -u origin feature/graph-demo"
  ])
})

test("graph-preflight - plan - commit action branches BEFORE staging so the commit cannot land on the pre-existing branch", () => {
  assert.deepEqual(planActions(classificationFor("commit"), PLAN_OPTIONS), [
    "git fetch origin",
    "git switch -c feature/graph-demo main",
    "git add -A",
    'git commit -m "chore(graph): auto-commit working tree before graph run"',
    "git push -u origin feature/graph-demo"
  ])
})

test("graph-preflight - plan - stash action keeps stash BEFORE the branch switch", () => {
  assert.deepEqual(planActions(classificationFor("stash"), PLAN_OPTIONS), [
    "git fetch origin",
    'git stash push -u -m "graph-preflight/graph-20260814-093000"',
    "git switch -c feature/graph-demo main",
    "git push -u origin feature/graph-demo"
  ])
})

test("graph-preflight - plan - blocked action emits its exact (empty) command list", () => {
  assert.deepEqual(planActions(classificationFor("blocked"), PLAN_OPTIONS), [])
})

// --- Fix: Important #7 — explicit base start point and a fetch before push ---

test("graph-preflight - plan - the fetch is always the first command", () => {
  for (const action of ["clean", "commit", "stash"]) {
    const commands = planActions(classificationFor(action), PLAN_OPTIONS)
    assert.equal(commands[0], "git fetch origin", `${action} must fetch first`)
    assert.ok(
      commands.indexOf("git fetch origin") < commands.findIndex((c) => c.startsWith("git push")),
      `${action} must fetch before pushing`
    )
  }
})

test("graph-preflight - plan - the resolved base is passed to git switch -c as the start point", () => {
  const commands = planActions(classificationFor("clean"), {
    ...PLAN_OPTIONS,
    base: "origin/feature/spine"
  })
  assert.ok(commands.includes("git switch -c feature/graph-demo origin/feature/spine"))
})

test("graph-preflight - resolveBase - an explicit base wins without consulting git", () => {
  const base = resolveBase(() => {
    throw new Error("git must not be called when --base is supplied")
  }, "origin/feature/x")
  assert.equal(base, "origin/feature/x")
})

test("graph-preflight - resolveBase - with no explicit base the current branch is resolved and recordable", () => {
  const base = resolveBase((args) => {
    assert.deepEqual(args, ["rev-parse", "--abbrev-ref", "HEAD"])
    return "feature/enhancement-bangers\n"
  }, null)
  assert.equal(base, "feature/enhancement-bangers")
})

test("graph-preflight - resolveBase - a detached HEAD resolves to its commit sha", () => {
  const base = resolveBase((args) => {
    if (args.includes("--abbrev-ref")) return "HEAD\n"
    return "0123456789abcdef\n"
  }, null)
  assert.equal(base, "0123456789abcdef")
})

test("graph-preflight - findBranchCollision - reports an existing local or remote branch", () => {
  const localOnly = findBranchCollision((args) => {
    if (args.at(-1) === "refs/heads/feature/x") return "sha\n"
    throw new Error("missing ref")
  }, "feature/x")
  assert.equal(localOnly, "refs/heads/feature/x")

  const remoteOnly = findBranchCollision((args) => {
    if (args.at(-1) === "refs/remotes/origin/feature/x") return "sha\n"
    throw new Error("missing ref")
  }, "feature/x")
  assert.equal(remoteOnly, "refs/remotes/origin/feature/x")

  const free = findBranchCollision(() => {
    throw new Error("missing ref")
  }, "feature/x")
  assert.equal(free, null)
})

// --- Fix: Important #8 — a malformed threshold flag must not fail open ---

test("graph-preflight - parseThresholdValue - an absent flag returns null so the default applies", () => {
  assert.equal(parseThresholdValue(null, "--max-files"), null)
  assert.equal(parseThresholdValue(undefined, "--max-files"), null)
})

test("graph-preflight - parseThresholdValue - a positive integer parses", () => {
  assert.equal(parseThresholdValue("25", "--max-files"), 25)
})

test("graph-preflight - parseThresholdValue - a non-numeric value throws instead of disabling the threshold", () => {
  assert.throws(() => parseThresholdValue("abc", "--max-files"), /--max-files must be a positive integer/)
})

test("graph-preflight - parseThresholdValue - zero, negatives, fractions, and a missing value all throw", () => {
  for (const raw of ["0", "-1", "1.5", "", " ", "Infinity"]) {
    assert.throws(
      () => parseThresholdValue(raw, "--max-lines"),
      /--max-lines must be a positive integer/,
      `expected ${JSON.stringify(raw)} to be rejected`
    )
  }
})

// --- Fix: Important #9 — a mid-sequence failure must tell the user where the
// stash went, not die with a stack trace ---

test("graph-preflight - formatFailureReport - names what ran, what did not, and the stash recovery command", () => {
  const report = formatFailureReport({
    failedCommand: "git switch -c feature/x main",
    executed: ["git fetch origin", 'git stash push -u -m "graph-preflight/r1"'],
    remaining: ["git push -u origin feature/x"],
    stashed: true,
    runId: "r1"
  })
  assert.match(report, /FAILED at: git switch -c feature\/x main/)
  assert.match(report, /commands that ran:/)
  assert.match(report, /git stash push -u -m "graph-preflight\/r1"/)
  assert.match(report, /commands that did NOT run:/)
  assert.match(report, /git push -u origin feature\/x/)
  assert.match(report, /git stash list \| grep graph-preflight\/r1/)
  assert.match(report, /git stash apply <ref>/)
})

test("graph-preflight - formatFailureReport - no stash means no stash-recovery instructions", () => {
  const report = formatFailureReport({
    failedCommand: "git fetch origin",
    executed: [],
    remaining: ["git switch -c feature/x main"],
    stashed: false,
    runId: "r1"
  })
  assert.ok(!report.includes("git stash list"))
  assert.match(report, /commands that ran:\n {2}\(none\)/)
})

// --- Fix: Important #9b — two same-day runs must not share a run id ---

test("graph-preflight - defaultRunId - includes a time component so same-day runs differ", () => {
  const morning = defaultRunId(new Date("2026-08-14T09:30:00Z"))
  const evening = defaultRunId(new Date("2026-08-14T21:05:17Z"))
  assert.equal(morning, "graph-20260814-093000")
  assert.equal(evening, "graph-20260814-210517")
  assert.notEqual(morning, evening)
  assert.match(defaultRunId(), /^graph-\d{8}-\d{6}$/)
})

// --- Hardening #2 — `--base` must validate as strictly as the threshold flags.
// It decides the autonomous base every later PR targets, so a missing value is
// an error, never a silent fall back to whatever branch HEAD happened to be. ---

test("graph-preflight - parseArgs - omitting --base entirely still resolves from HEAD later", () => {
  const options = parseArgs(["--branch", "feature/x"])
  assert.equal(options.base, null, "an absent --base must stay null so resolveBase falls back")
  assert.equal(
    resolveBase(() => "feature/current\n", options.base),
    "feature/current"
  )
})

test("graph-preflight - parseArgs - --base as the final token throws instead of silently falling back", () => {
  assert.throws(() => parseArgs(["--branch", "feature/x", "--base"]), /--base must be a valid git ref name/)
})

test("graph-preflight - parseArgs - --base with an empty value throws", () => {
  assert.throws(() => parseArgs(["--branch", "feature/x", "--base", ""]), /--base must be a valid git ref name/)
  assert.throws(() => parseArgs(["--branch", "feature/x", "--base", "   "]), /--base must be a valid git ref name/)
})

test("graph-preflight - parseArgs - a valid --base is preserved verbatim", () => {
  assert.equal(parseArgs(["--branch", "feature/x", "--base", "origin/feature/spine"]).base, "origin/feature/spine")
})

// --- Hardening #3 — branch and run id are interpolated into command strings
// that `parseCommandArgs` re-tokenizes, and those commands are real destructive
// git invocations. A value carrying whitespace, a quote, or a shell
// metacharacter mis-tokenizes, so reject it at parse time. ---

const HOSTILE_REF_VALUES = [
  ["a space", "feature/my branch"],
  ["a double quote", 'feature/x"y'],
  ["a semicolon", "feature/x;whoami"]
]

for (const [label, value] of HOSTILE_REF_VALUES) {
  test(`graph-preflight - parseArgs - --branch containing ${label} is rejected`, () => {
    assert.throws(() => parseArgs(["--branch", value]), /--branch must be a valid git ref name/)
  })

  test(`graph-preflight - parseArgs - --run-id containing ${label} is rejected`, () => {
    assert.throws(
      () => parseArgs(["--branch", "feature/x", "--run-id", value]),
      /--run-id must be a valid git ref name/
    )
  })
}

test("graph-preflight - parseRefValue - an absent flag returns null so the caller's default applies", () => {
  assert.equal(parseRefValue(null, "--base"), null)
  assert.equal(parseRefValue(undefined, "--base"), null)
})

test("graph-preflight - parseRefValue - ordinary branch names, run ids, and shas pass", () => {
  for (const value of [
    "main",
    "feature/graph-workflow-spine",
    "origin/feature/spine",
    "thejudge-auto/commander-spellbook-combos",
    "graph-20260814-093000",
    "0123456789abcdef",
    "r1"
  ]) {
    assert.equal(parseRefValue(value, "--branch"), value, `expected ${value} to be accepted`)
  }
})

test("graph-preflight - parseRefValue - shell metacharacters, globs, and a leading dash are rejected", () => {
  for (const value of [
    "feature/x y",
    'feature/x"y',
    "feature/x'y",
    "feature/x;rm -rf /",
    "feature/x`whoami`",
    "feature/x$(whoami)",
    "feature/x|y",
    "feature/x&y",
    "feature/x>y",
    "feature/*",
    "feature/x\ty",
    "feature/x\ny",
    "--dry-run",
    "-x"
  ]) {
    assert.throws(
      () => parseRefValue(value, "--branch"),
      /--branch must be a valid git ref name/,
      `expected ${JSON.stringify(value)} to be rejected`
    )
  }
})

test("graph-preflight - parseArgs - a rejected branch never reaches planActions as a mis-tokenizing command", () => {
  // The concrete harm: without validation this planned
  // `git switch -c feature/x; rm -rf /` and `parseCommandArgs` split it into
  // extra arguments that git would receive.
  assert.throws(() => parseArgs(["--branch", "feature/x; rm -rf /"]), /--branch must be a valid git ref name/)
})

// --- Hardening #4 — a literal brace outside the rename marker must not
// mis-parse. These paths feed the secret gate, so a mis-parse weakens it. ---

test("graph-preflight - collect - a literal-brace path segment after the rename marker parses correctly", () => {
  // `git mv "config/{legacy}/creds.env" ".secrets/{legacy}/creds.env"`.
  // Greedy captures used to yield newPath `.secrets}/{legacy/creds.env`, which
  // the `.secrets/` secret pattern no longer matches.
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat --cached") {
      return "0\t0\t{config => .secrets}/{legacy}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].path, ".secrets/{legacy}/creds.env")
  assert.deepEqual(entries[0].renamedFrom, ["config/{legacy}/creds.env"])
})

test("graph-preflight - collect+classify - a literal-brace rename into .secrets is still blocked", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat --cached") {
      return "0\t0\t{config => .secrets}/{legacy}/creds.env\n"
    }
    return ""
  }
  const result = classifyWorkingTree(collectEntries(fakeGit))
  assert.equal(result.action, "blocked")
  assert.match(result.reason, /secret/i)
})

test("graph-preflight - collect - a literal brace before the rename marker parses correctly", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "0\t0\tdocs/{legacy}/{old => new}/notes.md\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries[0].path, "docs/{legacy}/new/notes.md")
  assert.deepEqual(entries[0].renamedFrom, ["docs/{legacy}/old/notes.md"])
})

// --- Hardening #5 — two entries collapsing onto one destination can carry two
// different source paths. Both feed the secret gate, so keep every one. ---

test("graph-preflight - collect - two renames onto one destination keep BOTH source paths", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "1\t0\t{config => vendor}/creds.env\n"
    }
    if (args.join(" ") === "diff --numstat --cached") {
      return "2\t0\t{.secrets => vendor}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.equal(entries.length, 1, "one destination path must produce one entry")
  assert.equal(entries[0].path, "vendor/creds.env")
  assert.deepEqual(entries[0].renamedFrom, ["config/creds.env", ".secrets/creds.env"])
})

test("graph-preflight - classifier - a second source path is still checked for secrets", () => {
  const result = classifyWorkingTree([
    { path: "vendor/creds.env", changedLines: 3, renamedFrom: ["config/creds.env", ".secrets/creds.env"] }
  ])
  assert.equal(result.action, "blocked")
  assert.match(result.reason, /\.secrets\/creds\.env/)
})

test("graph-preflight - classifier - a legacy single-string renamedFrom is still honoured", () => {
  const result = classifyWorkingTree([{ path: "config/creds.env", changedLines: 0, renamedFrom: ".secrets/x.env" }])
  assert.equal(result.action, "blocked")
})

test("graph-preflight - collect - merging never duplicates an identical source path", () => {
  const fakeGit = (args) => {
    if (args.join(" ") === "diff --numstat") {
      return "1\t0\t{config => vendor}/creds.env\n"
    }
    if (args.join(" ") === "diff --numstat --cached") {
      return "2\t0\t{config => vendor}/creds.env\n"
    }
    return ""
  }
  const entries = collectEntries(fakeGit)
  assert.deepEqual(entries[0].renamedFrom, ["config/creds.env"])
  assert.equal(entries[0].changedLines, 3)
})

// --- Hardening #6 — an explicit `null` thresholds argument skips the default
// parameter and used to throw a TypeError. Treat it as "use the defaults". ---

test("graph-preflight - classifier - an explicit null thresholds argument uses the defaults", () => {
  const entries = [{ path: "a.md", changedLines: 201 }]
  assert.equal(classifyWorkingTree(entries, null).action, "stash")
  assert.equal(classifyWorkingTree([{ path: "a.md", changedLines: 4 }], null).action, "commit")
})

test("graph-preflight - classifier - a partial thresholds object fills the missing bound from the defaults", () => {
  // `{ maxFiles: 50 }` used to leave `maxLines` undefined, and every `>`
  // comparison against undefined is false — the line threshold failed open.
  const result = classifyWorkingTree([{ path: "a.md", changedLines: 500 }], { maxFiles: 50 })
  assert.equal(result.action, "stash")
  assert.match(result.reason, /changed lines/)
})

// --- Hardening #8 — `git stash push -u` sweeps untracked paths. A
// `node_modules` *symlink* is not a directory, so the `node_modules/` pattern
// never matched it and a real run swept the toolchain into a stash. ---

test("graph-preflight - gitignore - a node_modules symlink is ignored, not swept as untracked", () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const gitignore = fs.readFileSync(path.join(repoRoot, ".gitignore"), "utf8")

  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "graph-preflight-gitignore-"))
  try {
    const git = (args) => execFileSync("git", args, { cwd: sandbox, encoding: "utf8" })
    git(["init", "-q", "."])
    fs.writeFileSync(path.join(sandbox, ".gitignore"), gitignore)
    fs.mkdirSync(path.join(sandbox, "real_deps"))
    fs.writeFileSync(path.join(sandbox, "real_deps", "pkg.txt"), "x\n")
    fs.symlinkSync("real_deps", path.join(sandbox, "node_modules"))

    const untracked = git(["status", "--porcelain"])
    assert.ok(!untracked.includes("node_modules"), `a node_modules symlink must be ignored, got:\n${untracked}`)

    // The existing directory ignore must keep working, nested included.
    fs.mkdirSync(path.join(sandbox, "sub", "node_modules"), { recursive: true })
    fs.writeFileSync(path.join(sandbox, "sub", "node_modules", "a.js"), "x\n")
    assert.ok(!git(["status", "--porcelain"]).includes("node_modules"))
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true })
  }
})

test("graph-preflight - readProfileSentinel - a profiled session reports loaded", () => {
  const result = readProfileSentinel({ [PROFILE_SENTINEL_ENV]: "1" })
  assert.equal(result.present, true)
  assert.equal(result.ledgerLine, "Profile: loaded (env sentinel)")
})

test("graph-preflight - readProfileSentinel - an unprofiled session reports unverified", () => {
  const result = readProfileSentinel({})
  assert.equal(result.present, false)
  assert.equal(result.value, null)
  assert.equal(result.ledgerLine, "Profile: unverified")
})

test("graph-preflight - readProfileSentinel - any value other than 1 is not evidence", () => {
  // A stray export of the same name must not read as a loaded profile.
  for (const value of ["0", "", "true", "yes"]) {
    const result = readProfileSentinel({ [PROFILE_SENTINEL_ENV]: value })
    assert.equal(result.present, false, `${JSON.stringify(value)} must not count as loaded`)
    assert.equal(result.ledgerLine, "Profile: unverified")
  }
})

test("graph-preflight - the sentinel name matches the profile's env block", () => {
  // If these drift, the script reports "unverified" in a session that really
  // was launched with the profile, and the ledger understates its own evidence.
  const profile = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL("../.claude/graph-profile.json", import.meta.url)), "utf8")
  )
  assert.equal(profile.env?.[PROFILE_SENTINEL_ENV], "1")
})

test("graph-preflight - the profile denies edits to itself, so the sentinel cannot be forged", () => {
  const profile = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL("../.claude/graph-profile.json", import.meta.url)), "utf8")
  )
  assert.ok(
    profile.permissions.deny.includes("Edit(./.claude/graph-profile.json)"),
    "a run that could edit the profile could write its own sentinel"
  )
})

const HELD_LOCK = JSON.stringify({
  slug: "graph-workflow",
  runId: "graph-20260818-120000",
  pid: 4242,
  startedAt: "2026-08-18T12:00:00.000Z"
})

test("graph-preflight - lock - no lock file means the run may start", () => {
  const result = classifyLock({ contents: null })
  assert.equal(result.state, "free")
  assert.equal(result.message, null)
})

test("graph-preflight - lock - a live holder refuses and names slug, run id, and pid", () => {
  const result = classifyLock({ contents: HELD_LOCK, isAlive: () => true })
  assert.equal(result.state, "held")
  // All three, because "another run is going" is not enough to find it.
  assert.match(result.message, /slug graph-workflow/)
  assert.match(result.message, /run id graph-20260818-120000/)
  assert.match(result.message, /pid 4242/)
  assert.match(result.message, /Refusing: two runs cannot share one launch checkout/)
})

test("graph-preflight - lock - a dead holder is reported stale, never silently stolen", () => {
  const result = classifyLock({ contents: HELD_LOCK, isAlive: () => false })
  assert.equal(result.state, "stale")
  assert.match(result.message, /is stale/)
  assert.match(result.message, new RegExp(`reclaim it with: rm ${LOCK_PATH.replace(".", "\\.")}`))
  assert.match(result.message, /Confirm the run really ended/)
})

test("graph-preflight - lock - an unreadable lock is corrupt, not free", () => {
  // Treating a garbled lock as absent is how two runs end up sharing a checkout.
  for (const contents of ["not json", "[]", "null", '{"slug":"x"}']) {
    const result = classifyLock({ contents })
    assert.equal(result.state, "corrupt", `${contents} must not read as free`)
    assert.match(result.message, /confirm no run is active/i)
  }
})

test("graph-preflight - lock - parseLockFile keeps only well-typed fields", () => {
  assert.deepEqual(parseLockFile(HELD_LOCK), {
    slug: "graph-workflow",
    runId: "graph-20260818-120000",
    pid: 4242,
    startedAt: "2026-08-18T12:00:00.000Z"
  })
  assert.deepEqual(parseLockFile('{"pid":"4242"}'), {
    slug: null,
    runId: null,
    pid: null,
    startedAt: null
  })
})

test("graph-preflight - lock - isPidAlive treats EPERM as alive", () => {
  // A process owned by another user exists. Reclaiming it would be theft.
  const eperm = () => {
    const error = new Error("operation not permitted")
    error.code = "EPERM"
    throw error
  }
  assert.equal(isPidAlive(4242, eperm), true)

  const esrch = () => {
    const error = new Error("no such process")
    error.code = "ESRCH"
    throw error
  }
  assert.equal(isPidAlive(4242, esrch), false)
  assert.equal(isPidAlive(4242, () => undefined), true)
  assert.equal(isPidAlive(0, () => undefined), false)
  assert.equal(isPidAlive(-1, () => undefined), false)
})

test("graph-preflight - lock - the record round-trips through the classifier", () => {
  const record = lockRecord({
    slug: "demo",
    runId: "graph-20260818-130000",
    pid: 99,
    now: "2026-08-18T13:00:00.000Z"
  })
  const result = classifyLock({ contents: record, isAlive: () => true })
  assert.equal(result.state, "held")
  assert.equal(result.holder.slug, "demo")
  assert.equal(result.holder.pid, 99)
})

test("graph-preflight - lock - the path is under the ignored .worktrees root", () => {
  assert.equal(LOCK_PATH, ".worktrees/.graph-run.lock")
})

function terminalStates() {
  const skill = fs.readFileSync(
    fileURLToPath(new URL("../.claude/skills/graph-run/SKILL.md", import.meta.url)),
    "utf8"
  )
  const section = /## Terminal states\n([\s\S]*?)\n## /.exec(skill)
  assert.ok(section, "graph-run must have a ## Terminal states section")
  return [...section[1].matchAll(/^\|\s*`([A-Z]+)`\s*\|/gm)].map((match) => match[1])
}

test("graph-preflight - lock - the releasing states are exactly the four in graph-run's table", () => {
  assert.deepEqual(terminalStates(), ["COMPLETE", "PARKED", "BLOCKED", "PROMPTED"])
})

test("graph-preflight - lock - release is stated by reference, not re-enumerated", () => {
  // A second list of releasing states drifts, and a lock released on a state one
  // list omits is a stranded lock that blocks every later run.
  const skill = fs.readFileSync(
    fileURLToPath(new URL("../.claude/skills/graph-run/SKILL.md", import.meta.url)),
    "utf8"
  )
  assert.match(skill, /Release the concurrency lock on every state in this table/)

  for (const file of [
    "../.claude/skills/graph-preflight/SKILL.md",
    "../PRD/instructions/graph-workflow-contract.md"
  ]) {
    const text = fs.readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8")
    const enumerated = text.match(/`PROMPTED`/g) ?? []
    assert.ok(
      enumerated.length <= 1,
      `${file} enumerates terminal states instead of pointing at graph-run's table`
    )
  }
})

test("graph-preflight - lock - taking then releasing leaves no lock, for each terminal state", () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "graph-lock-"))
  try {
    const lockPath = path.join(sandbox, LOCK_PATH)
    fs.mkdirSync(path.dirname(lockPath), { recursive: true })

    for (const state of terminalStates()) {
      fs.writeFileSync(
        lockPath,
        lockRecord({ slug: "demo", runId: `graph-${state}`, pid: process.pid, now: new Date().toISOString() })
      )
      assert.equal(
        classifyLock({ contents: fs.readFileSync(lockPath, "utf8") }).state,
        "held",
        `a live run must hold the lock before terminating ${state}`
      )

      // The terminal state's last act.
      fs.rmSync(lockPath)

      assert.equal(fs.existsSync(lockPath), false, `${state} must release the lock`)
      assert.equal(classifyLock({ contents: null }).state, "free")
    }
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true })
  }
})

function graphProfile() {
  return JSON.parse(
    fs.readFileSync(fileURLToPath(new URL("../.claude/graph-profile.json", import.meta.url)), "utf8")
  )
}

test("graph-profile - merge and pull are allowed", () => {
  const { allow } = graphProfile().permissions
  assert.ok(allow.includes("Bash(git merge *)"))
  assert.ok(allow.includes("Bash(git pull *)"))
})

test("graph-profile - the destructive merge and pull variants are denied", () => {
  // `-s ours` produces a merge commit that keeps none of the incoming work, and
  // `-X ours`/`-X theirs` auto-resolves conflicts by picking a side — the
  // shared-branch contract's "preserve both flows' intent" inverted. These are
  // the "forced" forms of a merge; there is no `git merge --force`.
  const { deny } = graphProfile().permissions
  for (const command of ["merge", "pull"]) {
    for (const flag of [
      "-s ours",
      "--strategy=ours",
      "-X ours",
      "-X theirs",
      "--strategy-option=ours",
      "--strategy-option=theirs",
      "--allow-unrelated-histories"
    ]) {
      // Denied both before and after the ref — flags are legal in either place.
      assert.ok(deny.includes(`Bash(git ${command} ${flag}*)`), `git ${command} ${flag}`)
      assert.ok(deny.includes(`Bash(git ${command} * ${flag}*)`), `git ${command} <ref> ${flag}`)
    }
  }
  assert.ok(deny.includes("Bash(git pull --force*)"))
  assert.ok(deny.includes("Bash(git pull * --force*)"))
})

test("graph-profile - pushing the trunk is denied in every allowed spelling", () => {
  // This is where "never merge into main" is actually enforced. A permission
  // rule reads command text, and `git merge <ref>` names the branch merged
  // FROM, never the branch merged INTO — so the merge itself is unreachable by
  // a rule and the push is the enforcement point.
  const { allow, deny } = graphProfile().permissions

  // The premise: only origin pushes are allowed at all, so only origin
  // spellings need denying. If a broader push allow is ever added, this fails.
  const pushAllows = allow.filter((rule) => rule.startsWith("Bash(git push"))
  assert.deepEqual(pushAllows, ["Bash(git push -u origin *)", "Bash(git push origin HEAD:*)"])

  for (const branch of ["main", "master"]) {
    for (const rule of [
      `Bash(git push origin ${branch})`,
      `Bash(git push origin ${branch} *)`,
      `Bash(git push origin ${branch}:*)`,
      `Bash(git push origin HEAD:${branch})`,
      `Bash(git push origin HEAD:${branch} *)`,
      `Bash(git push -u origin ${branch})`,
      `Bash(git push -u origin ${branch} *)`,
      `Bash(git push -u origin ${branch}:*)`,
      `Bash(git push -u origin HEAD:${branch})`
    ]) {
      assert.ok(deny.includes(rule), `missing deny: ${rule}`)
    }
  }
})

test("graph-profile - the trunk denies do not catch a branch merely starting with main", () => {
  // No trailing `*` sits directly after the branch name, so `main-line-feature`
  // and `maintenance` stay pushable. A rule that blocked them would be found at
  // the worst possible moment — mid-run, as a prompt.
  const { deny } = graphProfile().permissions
  const offenders = deny.filter((rule) => /(?:main|master)\*/.test(rule))
  assert.deepEqual(offenders, [], "a deny ending `main*` would also block `main-line-feature`")
})

test("graph-profile - the run cannot tidy up a local merge it should not have made", () => {
  // The honest backstop: a local merge into main is reachable, publishing it is
  // not, and the run cannot erase the evidence either.
  const { deny } = graphProfile().permissions
  assert.ok(deny.includes("Bash(git reset --hard*)"))
  assert.ok(deny.some((rule) => rule.startsWith("Bash(git push --force")))
})

test("an absent stop sentinel does not block a run", () => {
  const clear = classifyStopSentinel({ present: false })
  assert.equal(clear.state, "clear")
  assert.equal(clear.message, null)
})

test("a present stop sentinel refuses the run and names the file to remove", () => {
  // The owner's kill switch has to survive the next invocation. Otherwise
  // throwing it stops one run and the next `/graph-run` quietly starts another.
  const refused = classifyStopSentinel({ present: true })
  assert.equal(refused.state, "refused")
  assert.match(refused.message, new RegExp(STOP_PATH.replace(/\./g, "\\.")))
  assert.match(refused.message, /rm /, "a refusal the owner cannot act on is a dead end")
  assert.match(refused.message, /refusing to start/)
})

test("the stop sentinel and the run lock are different files", () => {
  assert.notEqual(STOP_PATH, LOCK_PATH)
  assert.match(STOP_PATH, /^\.worktrees\//)
})

// ---------------------------------------------------------------------------
// Slice E — hook liveness, proven at run start and between nodes.
// ---------------------------------------------------------------------------

test("a denied canary is the proof, and says so in the ledger line", () => {
  const proven = classifyCanary({ denied: true, response: "rm -rf is denied in every session." })
  assert.equal(proven.state, "proven")
  assert.equal(proven.message, null)
  assert.match(proven.ledgerLine, /denied/)
  assert.match(proven.ledgerLine, /hook live/)
})

test("an allowed canary blocks, naming what was tried, what came back, and the fix", () => {
  const blocked = classifyCanary({ denied: false, response: "(no output, exit 0)" })
  assert.equal(blocked.state, "blocked")
  assert.equal(blocked.reason, "canary-not-denied")
  assert.match(blocked.message, /BLOCKED/)
  assert.ok(blocked.message.includes(CANARY_COMMAND), "the message must name what was tried")
  assert.match(blocked.message, /\(no output, exit 0\)/, "and what came back")
  assert.match(blocked.message, /recovery:/, "and the recovery action")
  assert.match(blocked.message, /not a fallback/, "the profile is never a downgrade path")
})

test("an untrusted workspace blocks for its own named reason", () => {
  // "Your hook is broken" and "you never trusted this checkout" have completely
  // different recovery actions, so they must not collapse into one message.
  const untrusted = classifyCanary({ denied: false, workspaceTrusted: false })
  assert.equal(untrusted.state, "blocked")
  assert.equal(untrusted.reason, "untrusted-workspace")
  assert.match(untrusted.message, /not trusted/)
  assert.match(untrusted.message, /trust this checkout/)

  const plain = classifyCanary({ denied: false })
  assert.notEqual(untrusted.reason, plain.reason)
  assert.notEqual(untrusted.message, plain.message)
})

test("a trusted workspace with a denied canary is still proven", () => {
  assert.equal(classifyCanary({ denied: true, workspaceTrusted: false }).state, "proven")
})

test("the canary is denied by the universal tier and is inert if it runs", () => {
  // Both halves matter. A canary the tier does not deny proves nothing, and a
  // canary with a side effect is not a proof worth running.
  assert.match(CANARY_COMMAND, /^rm -rf /, "must be a universal-tier deny")
  assert.match(CANARY_COMMAND, /\.worktrees\//, "must target the ignored run-record directory")
  assert.match(CANARY_COMMAND, /nonexistent/, "must target a path that does not exist")
})

test("a heartbeat that advanced passes and records the span", () => {
  const ok = classifyHeartbeat({ node: "plan", before: 3, after: 21 })
  assert.equal(ok.state, "ok")
  assert.equal(ok.message, null)
  assert.match(ok.ledgerLine, /3 → 21/)
  assert.match(ok.ledgerLine, /plan/)
})

test("a static counter with calls made blocks, with the expected and observed values", () => {
  const blocked = classifyHeartbeat({ node: "build", before: 40, after: 40 })
  assert.equal(blocked.state, "blocked")
  assert.match(blocked.message, /BLOCKED/)
  assert.match(blocked.message, /build/)
  assert.match(blocked.message, /advance past 40/, "the expected advance")
  assert.match(blocked.message, /observed: 40/, "the observed counter")
  assert.match(blocked.message, /does not advance/)
})

test("a node that made no tool calls has nothing to prove", () => {
  const ok = classifyHeartbeat({ node: "land", before: 7, after: 7, toolCallsMade: false })
  assert.equal(ok.state, "ok")
  assert.match(ok.ledgerLine, /nothing to prove/)
})

test("a missing run-state file is a degraded heartbeat, not a hook failure", () => {
  const degraded = classifyHeartbeat({
    node: "plan",
    before: 0,
    after: 0,
    runStatePresent: false
  })
  assert.equal(degraded.state, "degraded")
  assert.match(degraded.message, /not a hook failure/)
  assert.match(degraded.message, /canary remains the binding proof/)
  assert.match(degraded.ledgerLine, /degraded/)
})

test("a degraded heartbeat never reports as blocked, so the run continues", () => {
  for (const toolCallsMade of [true, false]) {
    const degraded = classifyHeartbeat({
      node: "define",
      before: 5,
      after: 5,
      runStatePresent: false,
      toolCallsMade
    })
    assert.equal(degraded.state, "degraded")
  }
})

test("takeLock writes the lock the run depends on", () => {
  // Until 2026-08-24 nothing called this: the lock was written by the agent
  // remembering to, and on one run it forgot and still reported success. The
  // hook gates its whole graph tier on this file existing.
  const written = new Map()
  const result = takeLock({
    slug: "example",
    runId: "graph-20260824-000000",
    pid: 4242,
    now: "2026-08-24T00:00:00.000Z",
    io: {
      read: () => {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" })
      },
      write: (target, contents) => written.set(target, contents),
      ensure: () => undefined
    }
  })

  assert.equal(result.taken, true)
  const record = JSON.parse(written.get(LOCK_PATH))
  assert.equal(record.slug, "example")
  assert.equal(record.runId, "graph-20260824-000000")
  assert.equal(record.pid, 4242)
  assert.equal(isRunActive(written.get(LOCK_PATH)), true, "the hook must read the written lock as an active run")
})

test("takeLock refuses rather than stealing a live lock", () => {
  const held = JSON.stringify({ slug: "other", runId: "graph-19990101-000000", pid: 999, startedAt: "t" })
  let wrote = false
  const result = takeLock({
    slug: "example",
    runId: "graph-20260824-000000",
    io: { read: () => held, write: () => (wrote = true), ensure: () => undefined, isAlive: () => true }
  })

  assert.equal(result.taken, false)
  assert.equal(result.state, "held")
  assert.equal(wrote, false, "a second run must not overwrite the first run's lock")
  assert.match(result.message, /other/)
})

test("takeLock reports a stale lock instead of silently reclaiming it", () => {
  const stale = JSON.stringify({ slug: "dead", runId: "graph-19990101-000000", pid: 1, startedAt: "t" })
  let wrote = false
  const result = takeLock({
    slug: "example",
    runId: "graph-20260824-000000",
    io: { read: () => stale, write: () => (wrote = true), ensure: () => undefined, isAlive: () => false }
  })

  assert.equal(result.taken, false)
  assert.equal(result.state, "stale")
  assert.equal(wrote, false)
})

test("the graph canary proves the tier the universal canary cannot see", () => {
  // The universal canary is denied whether or not a run holds the lock, so it
  // returns the same answer for an armed tier and a disarmed one.
  for (const runActive of [false, true]) {
    assert.equal(
      classifyToolCall({ toolName: "Bash", toolInput: { command: CANARY_COMMAND }, runActive }).decision,
      "deny",
      "the universal canary cannot discriminate"
    )
  }

  assert.equal(
    classifyToolCall({ toolName: "Bash", toolInput: { command: GRAPH_CANARY_COMMAND }, runActive: false }).decision,
    "allow"
  )
  const armed = classifyToolCall({
    toolName: "Bash",
    toolInput: { command: GRAPH_CANARY_COMMAND },
    runActive: true
  })
  assert.equal(armed.decision, "deny")
  assert.equal(armed.tier, "graph")
})

test("an undenied graph canary blocks the run", () => {
  assert.equal(classifyGraphCanary({ denied: true }).state, "ok")
  const blocked = classifyGraphCanary({ denied: false, response: "(allowed)" })
  assert.equal(blocked.state, "blocked")
  assert.match(blocked.message, /graph tier is disarmed/)
})

// ---------------------------------------------------------------------------
// base→main guard — a fresh run refuses to start while a prior package's
// base→main PR is still open, so the queue never branches off a stale main.
// ---------------------------------------------------------------------------

const NEW_BRANCH = "thejudge-auto/overnight-run-tuning"

test("graph-preflight - base-to-main guard - blocks on another slug's open PR", () => {
  const guard = classifyPendingBaseToMain({
    openPRs: [{ headRefName: "thejudge-auto/user-feedback-spec", url: "https://x/1" }],
    newBranch: NEW_BRANCH
  })
  assert.equal(guard.block, true)
  assert.match(guard.reason, /thejudge-auto\/user-feedback-spec/)
  assert.match(guard.reason, /https:\/\/x\/1/, "the message must name the PR to merge")
})

test("graph-preflight - base-to-main guard - allows when only this branch's PR is open", () => {
  // Run two's own base→main PR is legitimately open; it must not block itself.
  const guard = classifyPendingBaseToMain({
    openPRs: [{ headRefName: NEW_BRANCH, url: "https://x/own" }],
    newBranch: NEW_BRANCH
  })
  assert.equal(guard.block, false)
  assert.equal(guard.reason, null)
})

test("graph-preflight - base-to-main guard - allows on an empty PR list", () => {
  const guard = classifyPendingBaseToMain({ openPRs: [], newBranch: NEW_BRANCH })
  assert.equal(guard.block, false)
})

test("graph-preflight - base-to-main guard - ignores non-graph heads", () => {
  // A human's feature PR into main is not the queue's concern.
  const guard = classifyPendingBaseToMain({
    openPRs: [
      { headRefName: "feature/some-work", url: "https://x/2" },
      { headRefName: "main-line-experiment", url: "https://x/3" }
    ],
    newBranch: NEW_BRANCH
  })
  assert.equal(guard.block, false)
})

test("graph-preflight - base-to-main guard - fails closed when the list is unavailable", () => {
  // The guard's whole job is safety, so an unverifiable state refuses rather
  // than assuming the queue is clear.
  for (const bad of [null, undefined, "not-an-array", 42]) {
    const guard = classifyPendingBaseToMain({ openPRs: bad, newBranch: NEW_BRANCH })
    assert.equal(guard.block, true, `openPRs=${JSON.stringify(bad)} must fail closed`)
    assert.match(guard.reason, /could not verify/)
  }
})

test("graph-preflight - base-to-main guard - the branch prefix is the graph convention", () => {
  assert.equal(GRAPH_BRANCH_PREFIX, "thejudge-auto/")
})
