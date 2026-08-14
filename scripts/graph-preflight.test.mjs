import { test } from "node:test"
import assert from "node:assert/strict"

import {
  classifyWorkingTree,
  collectEntries,
  planActions,
  parseCommandArgs,
  parseThresholdValue,
  resolveBase,
  findBranchCollision,
  formatFailureReport,
  defaultRunId,
  DEFAULT_THRESHOLDS,
  SECRET_PATTERNS
} from "./graph-preflight.mjs"

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
  assert.equal(entries[0].renamedFrom, "config/creds.env")
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
  assert.equal(entries[0].renamedFrom, "config/creds.env")
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
  assert.equal(entries[0].renamedFrom, "config/old/creds.env")
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
  assert.equal(entries[0].renamedFrom, "config.env")
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
