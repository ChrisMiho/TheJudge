import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  CANARY_COMMAND,
  DEFAULT_BASE,
  FETCH_COMMAND,
  LOCK_PATH,
  PROFILE_SENTINEL_ENV,
  STOP_PATH,
  GRAPH_BRANCH_PREFIX,
  classifyCanary,
  classifyCheckoutShape,
  classifyGraphCanary,
  classifyHeartbeat,
  classifyInPlaceTree,
  classifyLock,
  classifyStopSentinel,
  defaultRunId,
  findBranchCollision,
  formatFailureReport,
  isPidAlive,
  kickoffWorktreeCommand,
  kickoffWorktreePath,
  lockRecord,
  parseArgs,
  parseCommandArgs,
  parseLockFile,
  parseRefValue,
  planActions,
  readProfileSentinel,
  resolveBase,
  takeLock
} from "./graph-preflight.mjs"
import * as preflight from "./graph-preflight.mjs"
import { GRAPH_CANARY_COMMAND, classifyToolCall, isRunActive } from "./lib/boundary-rules.mjs"

// --- REQ-191: a fresh run never mutates the launch checkout. From a root
// checkout it works in a kickoff worktree; from a linked worktree it works in
// place on a clean tree. The auto-commit / stash resolution is gone. ---

test("graph-preflight - shape - a root checkout is one whose git dir is the common dir", () => {
  assert.equal(classifyCheckoutShape({ gitDir: "/repo/.git\n", gitCommonDir: "/repo/.git" }), "root")
  assert.equal(classifyCheckoutShape({ gitDir: ".git", gitCommonDir: ".git" }), "root")
})

test("graph-preflight - shape - a linked worktree has a git dir under the common dir's worktrees folder", () => {
  assert.equal(
    classifyCheckoutShape({
      gitDir: "/repo/.git/worktrees/session-b",
      gitCommonDir: "/repo/.git"
    }),
    "linked-worktree"
  )
})

test("graph-preflight - in-place - a clean tree may proceed", () => {
  const tree = classifyInPlaceTree("")
  assert.equal(tree.clean, true)
  assert.deepEqual(tree.paths, [])
})

test("graph-preflight - in-place - a dirty tree is refused and every path is named", () => {
  const tree = classifyInPlaceTree(" M scripts/dev.mjs\n?? notes.md\nA  PRD/work/x/IDEA.md\n")
  assert.equal(tree.clean, false)
  assert.deepEqual(tree.paths, ["scripts/dev.mjs", "notes.md", "PRD/work/x/IDEA.md"])
  assert.match(tree.reason, /refusing to run in place/)
  assert.match(tree.reason, /notes\.md/)
  assert.match(tree.reason, /never resolves them for you/)
})

test("graph-preflight - plan - a root checkout fetches, adds the kickoff worktree, and pushes from inside it", () => {
  assert.deepEqual(
    planActions({ shape: "root", branch: "thejudge-auto/card-fix", slug: "card-fix", base: DEFAULT_BASE }),
    [
      "git fetch origin",
      "git worktree add .worktrees/kickoff-card-fix -b thejudge-auto/card-fix origin/main",
      "git -C .worktrees/kickoff-card-fix push -u origin thejudge-auto/card-fix"
    ]
  )
})

test("graph-preflight - plan - a linked worktree switches in place and pushes", () => {
  assert.deepEqual(
    planActions({ shape: "linked-worktree", branch: "thejudge-auto/card-fix", slug: "card-fix", base: DEFAULT_BASE }),
    [
      "git fetch origin",
      "git switch -c thejudge-auto/card-fix origin/main",
      "git push -u origin thejudge-auto/card-fix"
    ]
  )
})

test("graph-preflight - plan - the fetch is always first and precedes the push", () => {
  for (const shape of ["root", "linked-worktree"]) {
    const commands = planActions({ shape, branch: "b", slug: "s", base: DEFAULT_BASE })
    assert.equal(commands[0], FETCH_COMMAND)
    assert.ok(commands.indexOf(FETCH_COMMAND) < commands.findIndex((c) => c.includes("push")))
  }
})

test("graph-preflight - plan - an explicit base is the start point in both shapes", () => {
  const root = planActions({ shape: "root", branch: "b", slug: "s", base: "origin/feature/spine" })
  const inPlace = planActions({ shape: "linked-worktree", branch: "b", slug: "s", base: "origin/feature/spine" })
  assert.ok(root[1].endsWith(" origin/feature/spine"))
  assert.equal(inPlace[1], "git switch -c b origin/feature/spine")
})

test("graph-preflight - plan - never stages, commits, stashes, or switches the launch checkout on the root path", () => {
  const commands = planActions({ shape: "root", branch: "b", slug: "s", base: DEFAULT_BASE })
  for (const forbidden of ["git add", "git commit", "git stash", "git switch"]) {
    assert.ok(!commands.some((c) => c.startsWith(forbidden)), `${forbidden} must not appear`)
  }
})

test("graph-preflight - plan - every planned command round-trips through parseCommandArgs", () => {
  for (const shape of ["root", "linked-worktree"]) {
    for (const command of planActions({ shape, branch: "thejudge-auto/x", slug: "x", base: DEFAULT_BASE })) {
      const args = parseCommandArgs(command)
      assert.equal(`git ${args.join(" ")}`, command)
    }
  }
})

test("graph-preflight - resolveBase - the default is origin/main, never the current branch", () => {
  assert.equal(DEFAULT_BASE, "origin/main")
  assert.equal(resolveBase(null), "origin/main")
  assert.equal(resolveBase(undefined), "origin/main")
  assert.equal(resolveBase(""), "origin/main")
})

test("graph-preflight - resolveBase - an explicit base wins", () => {
  assert.equal(resolveBase("origin/feature/x"), "origin/feature/x")
})

test("graph-preflight - retired - the working-tree classifier, thresholds, secret gate, and base-to-main guard no longer exist", () => {
  for (const name of [
    "classifyWorkingTree",
    "collectEntries",
    "parseThresholdValue",
    "DEFAULT_THRESHOLDS",
    "SECRET_PATTERNS",
    "classifyPendingBaseToMain",
    "OPEN_BASE_TO_MAIN_PRS_COMMAND"
  ]) {
    assert.equal(typeof preflight[name], "undefined", `${name} must be gone`)
  }
})

test("graph-preflight - formatFailureReport - names what ran and what did not, with no stash recovery", () => {
  const report = formatFailureReport({
    failedCommand: "git worktree add .worktrees/kickoff-x -b feature/x origin/main",
    executed: ["git fetch origin"],
    remaining: ["git -C .worktrees/kickoff-x push -u origin feature/x"]
  })
  assert.match(report, /FAILED at: git worktree add/)
  assert.match(report, /commands that ran:\n {2}git fetch origin/)
  assert.match(report, /commands that did NOT run:\n {2}git -C/)
  assert.ok(!report.includes("stash"))
  assert.match(formatFailureReport({ failedCommand: "git fetch origin", executed: [], remaining: [] }), /\(none\)/)
})

test("graph-preflight - parseArgs - omitting --base leaves null so resolveBase supplies origin/main", () => {
  const options = parseArgs(["--branch", "feature/x", "--slug", "x"])
  assert.equal(options.base, null)
  assert.equal(resolveBase(options.base), "origin/main")
  assert.equal(options.slug, "x")
})

test("graph-preflight - parseArgs - threshold flags are no longer recognised", () => {
  const options = parseArgs(["--branch", "feature/x", "--slug", "x", "--max-files", "50"])
  assert.equal("thresholds" in options, false)
})

test("graph-preflight - the profile allows no git stash command", () => {
  const { allow } = graphProfile().permissions
  assert.deepEqual(
    allow.filter((rule) => rule.includes("git stash")),
    [],
    "preflight no longer stashes, so the allow rules for it are dead weight"
  )
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

// --- Fix: Important #9b — two same-day runs must not share a run id ---

test("graph-preflight - defaultRunId - includes a time component so same-day runs differ", () => {
  const morning = defaultRunId(new Date("2026-08-14T09:30:00Z"))
  const evening = defaultRunId(new Date("2026-08-14T21:05:17Z"))
  assert.equal(morning, "graph-20260814-093000")
  assert.equal(evening, "graph-20260814-210517")
  assert.notEqual(morning, evening)
  assert.match(defaultRunId(), /^graph-\d{8}-\d{6}$/)
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

// --- The `node_modules` *symlink* case: preflight no longer stashes, but the
// repository's ignore rules still decide what an in-place run sees as dirty. A
// symlink is not a directory, so the `node_modules/` pattern used to miss it. ---

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
  assert.match(result.message, /Refusing: two runs cannot share one root/)
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
  assert.equal(
    isPidAlive(4242, () => undefined),
    true
  )
  assert.equal(
    isPidAlive(0, () => undefined),
    false
  )
  assert.equal(
    isPidAlive(-1, () => undefined),
    false
  )
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
  const contract = fs.readFileSync(
    fileURLToPath(new URL("../PRD/instructions/graph-workflow-contract.md", import.meta.url)),
    "utf8"
  )
  const section = /## Terminal states\n([\s\S]*?)\n## /.exec(contract)
  assert.ok(section, "the contract must have a ## Terminal states section")
  return [...section[1].matchAll(/^\|\s*`([A-Z]+)`\s*\|/gm)].map((match) => match[1])
}

test("graph-preflight - lock - the releasing states are exactly the four in the contract's table", () => {
  assert.deepEqual(terminalStates(), ["COMPLETE", "PARKED", "BLOCKED", "PROMPTED"])
})

test("graph-preflight - lock - release is stated by reference, not re-enumerated", () => {
  // A second list of releasing states drifts, and a lock released on a state one
  // list omits is a stranded lock that blocks every later run. The table lives in
  // the contract alone; the graph skills point to it and never re-enumerate it.
  const contract = fs.readFileSync(
    fileURLToPath(new URL("../PRD/instructions/graph-workflow-contract.md", import.meta.url)),
    "utf8"
  )
  assert.match(contract, /Release the concurrency lock on every state in this table/)

  for (const file of [
    "../.claude/skills/graph-preflight/SKILL.md",
    "../.claude/skills/graph-kickoff/SKILL.md",
    "../.claude/skills/graph-implement/SKILL.md"
  ]) {
    const text = fs.readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8")
    const enumerated = text.match(/`PROMPTED`/g) ?? []
    assert.ok(enumerated.length <= 1, `${file} enumerates terminal states instead of pointing at the contract's table`)
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

test("graph-preflight - worktree - a per-idea worktree lives under the ignored .worktrees root", () => {
  assert.equal(kickoffWorktreePath("card-fix"), ".worktrees/kickoff-card-fix")
})

test("graph-preflight - worktree - the add command branches a per-idea worktree off the shared base", () => {
  assert.equal(
    kickoffWorktreeCommand("card-fix"),
    "git worktree add .worktrees/kickoff-card-fix -b thejudge-auto/card-fix origin/main"
  )
  // A caller may override the base; the branch is always thejudge-auto/<slug>.
  assert.match(kickoffWorktreeCommand("card-fix", "origin/develop"), / origin\/develop$/)
})

test("graph-preflight - lock - two worktree roots each hold their own lock without colliding", () => {
  // Concurrency is structural: takeLock writes LOCK_PATH relative to the working
  // directory, so two ideas in two worktree roots read different lock files. Idea
  // A holding a lock must not make idea B refuse. Model each root as its own store.
  const rootA = { lock: null }
  const rootB = { lock: null }
  const ioFor = (root) => ({
    read: () => {
      if (root.lock === null) throw new Error("ENOENT")
      return root.lock
    },
    write: (_path, contents) => {
      root.lock = contents
    },
    ensure: () => {}
  })

  const a = takeLock({ slug: "idea-a", runId: "graph-a", io: ioFor(rootA) })
  const b = takeLock({ slug: "idea-b", runId: "graph-b", io: ioFor(rootB) })

  assert.equal(a.taken, true, "idea A takes its own root's lock")
  assert.equal(b.taken, true, "idea B takes its own root's lock even while A holds A's")

  // Within one root the lock still serializes: a second take in root A refuses.
  const aAgain = takeLock({ slug: "idea-a2", runId: "graph-a2", io: { ...ioFor(rootA), isAlive: () => true } })
  assert.equal(aAgain.taken, false, "a second run in the same root still refuses")
  assert.equal(aAgain.state, "held")
})

function graphProfile() {
  return JSON.parse(fs.readFileSync(fileURLToPath(new URL("../.claude/graph-profile.json", import.meta.url)), "utf8"))
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
  // throwing it stops one run and the next graph run quietly starts another.
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

test("graph-preflight - the branch prefix is the graph convention", () => {
  assert.equal(GRAPH_BRANCH_PREFIX, "thejudge-auto/")
})
