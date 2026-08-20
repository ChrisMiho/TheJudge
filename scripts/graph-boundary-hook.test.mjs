import assert from "node:assert/strict"
import { Readable } from "node:stream"
import test from "node:test"

import { RUN_LOCK_PATH, RUN_STOP_PATH } from "./lib/boundary-rules.mjs"
import {
  decide,
  main,
  projectRoot,
  readRunLock,
  readStopSentinel
} from "./graph-boundary-hook.mjs"

// The universal tier's whole surface, exercised through real PreToolUse
// payloads rather than through the pure rules module. A rule that is correct in
// `boundary-rules.mjs` but unreachable through the payload shape is not enforced.

// The hook reads the run records off disk; the tests hand it a reader instead of
// writing to `.worktrees/` from a test run. The reader is path-aware on purpose:
// a reader that returned the same bytes for every path would fake a stop
// sentinel in every lock test.
const LOCK_CONTENTS = '{"slug":"x","runId":"r","pid":1,"startedAt":"t"}'

function absent(target) {
  throw Object.assign(new Error(`ENOENT: ${target}`), { code: "ENOENT" })
}

function records({ lock = null, stop = false } = {}) {
  return {
    read: (target) => {
      if (target.endsWith(RUN_LOCK_PATH)) {
        if (lock === null) absent(target)
        return lock
      }
      if (target.endsWith(RUN_STOP_PATH)) {
        if (!stop) absent(target)
        return ""
      }
      return absent(target)
    }
  }
}

const LIVE_LOCK = records({ lock: LOCK_CONTENTS })
const NO_LOCK = records()
const CORRUPT_LOCK = records({ lock: "{ this is not json" })
const LOCK_AND_STOP = records({ lock: LOCK_CONTENTS, stop: true })
const STOP_NO_LOCK = records({ stop: true })

function bash(command, lock = NO_LOCK) {
  return decide(JSON.stringify({ tool_name: "Bash", tool_input: { command } }), lock)
}

function tool(toolName, toolInput, lock = NO_LOCK) {
  return decide(JSON.stringify({ tool_name: toolName, tool_input: toolInput }), lock)
}

function collectStderr() {
  const chunks = []
  return { write: (chunk) => chunks.push(chunk), text: () => chunks.join("") }
}

async function runHook(payload) {
  const stderr = collectStderr()
  const code = await main({ stdin: Readable.from([payload]), stderr })
  return { code, stderr: stderr.text() }
}

const DENIED_UNIVERSAL = [
  ["force-push, long flag", "git push --force origin topic", "force-push"],
  ["force-push, short flag", "git push -f origin topic", "force-push"],
  ["force-push, lease flag", "git push --force-with-lease origin topic", "force-push"],
  ["force-push, lease with value", "git push --force-with-lease=topic origin topic", "force-push"],
  ["force-push, leading + refspec", "git push origin +topic:topic", "force-push"],
  ["remote delete, long flag", "git push --delete origin topic", "remote-branch-delete"],
  ["remote delete, short flag", "git push -d origin topic", "remote-branch-delete"],
  ["remote delete, colon refspec", "git push origin :topic", "remote-branch-delete"],
  ["push to main", "git push origin main", "protected-branch-push"],
  ["push to master", "git push origin master", "protected-branch-push"],
  ["push to main by refspec", "git push origin HEAD:main", "protected-branch-push"],
  ["push to main by full ref", "git push origin HEAD:refs/heads/main", "protected-branch-push"],
  ["recursive force remove", "rm -rf build", "recursive-force-remove"],
  ["recursive force remove, split flags", "rm -r -f build", "recursive-force-remove"],
  ["recursive force remove, long flags", "rm --recursive --force build", "recursive-force-remove"],
  ["sudo", "sudo npm install -g something", "denied-command"],
  ["pkill", "pkill -f node", "denied-command"],
  ["killall", "killall node", "denied-command"],
  ["secrets read", "cat .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by redirection", "echo x > .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by cp", "cp local.env .secrets/openai-dev.env", "secrets-access"],
  ["secrets write by rsync", "rsync -a local/ .secrets/", "secrets-access"]
]

for (const [name, command, rule] of DENIED_UNIVERSAL) {
  test(`universal tier denies ${name}`, () => {
    const result = bash(command)
    assert.match(result.reason, /\S/)
    assert.equal(result.decision, "deny", `expected a deny for: ${command}`)
    assert.equal(result.rule, rule)
    assert.equal(result.tier, "universal")
    assert.ok(result.reason.length > 0, "a deny must carry a reason the caller can read")
  })
}

test("a nohup wrapper is unwrapped before matching", () => {
  // The profile's `Bash(nohup*)` deny only ever caught the wrapper by name; the
  // command behind it was never matched at all.
  const result = bash("nohup git push --force origin topic")
  assert.equal(result.decision, "deny")
  assert.equal(result.rule, "force-push")
})

test("a backgrounded, wrapped, chained deny is still a deny", () => {
  const result = bash("cd /tmp && nohup env FOO=1 git push -f origin main &")
  assert.equal(result.decision, "deny")
  assert.equal(result.trailingAmpersand, true)
})

test("a trailing ampersand is observed on an allowed call", () => {
  const result = bash("npm run dev &")
  assert.equal(result.decision, "allow")
  assert.equal(result.trailingAmpersand, true)
  assert.equal(result.backgrounded, true)
})

const ALLOWED = [
  "git push origin main-line-feature",
  "git push origin maintenance",
  "git push origin HEAD:main-line-feature",
  "git push -u origin thejudge-auto/some-slug",
  "git status",
  "git log --oneline -5",
  "rm build/stale.txt",
  "rm -r build",
  "npm run test:scripts",
  "cp source.txt destination.txt",
  "echo hello > notes.txt"
]

for (const command of ALLOWED) {
  test(`universal tier allows: ${command}`, () => {
    assert.equal(bash(command).decision, "allow", `wrongly denied: ${command}`)
  })
}

test("branch matching is whole-name, so near-misses stay pushable", () => {
  // The same false-positive boundary `graph-preflight.test.mjs` asserts for the
  // permission profile: no trailing wildcard after the branch name.
  for (const branch of ["main-line-feature", "maintenance", "mainly", "remaster"]) {
    assert.equal(
      bash(`git push origin ${branch}`).decision,
      "allow",
      `${branch} is not a protected branch`
    )
  }
})

test("file-editing tools are denied on the secrets subtree", () => {
  assert.equal(tool("Read", { file_path: ".secrets/openai-dev.env" }).decision, "deny")
  assert.equal(tool("Write", { file_path: "./.secrets/new.env" }).decision, "deny")
  assert.equal(tool("NotebookEdit", { notebook_path: ".secrets/x.ipynb" }).decision, "deny")
  assert.equal(
    tool("MultiEdit", { edits: [{ file_path: ".secrets/openai-dev.env" }] }).decision,
    "deny"
  )
  assert.equal(tool("Read", { file_path: "PRD/README.md" }).decision, "allow")
})


// ---------------------------------------------------------------------------
// Slice B — the graph tier, which fires only while the run lock exists.
// ---------------------------------------------------------------------------

const GRAPH_TIER = [
  ["a project instruction file", "echo x > CLAUDE.md", "protected-path-write"],
  ["the hook's own settings", "echo x > .claude/settings.json", "protected-path-write"],
  ["the permission profile", "echo x > .claude/graph-profile.json", "protected-path-write"],
  ["the hook itself", "echo x > scripts/graph-boundary-hook.mjs", "protected-path-write"],
  [
    "a canonical lifecycle skill",
    "echo x > .claude/skills/thejudge-implement-all/SKILL.md",
    "protected-path-write"
  ],
  [
    "the lifecycle skill mirror",
    "echo x > .agents/skills/thejudge-implement-all/SKILL.md",
    "protected-path-write"
  ],
  ["the call counter", "echo x >> .worktrees/.graph-node-calls.json", "run-record-write"],
  ["the evidence log", "echo x >> .worktrees/.graph-evidence.jsonl", "run-record-write"],
  ["the evidence log by cp", "cp forged.jsonl .worktrees/.graph-evidence.jsonl", "run-record-write"],
  ["removing the run lock", "rm .worktrees/.graph-run.lock", "run-lock-removal"],
  ["a nohup wrapper", "nohup npm run dev", "nohup-wrapper"],
  ["a background launch", "npm run dev &", "background-launch"],
  ["a background launch mid-chain", "npm run dev & npm run test", "background-launch"]
]

for (const [name, command, rule] of GRAPH_TIER) {
  test(`graph tier denies ${name} with a lock present`, () => {
    const denied = bash(command, LIVE_LOCK)
    assert.equal(denied.decision, "deny", `expected a deny for: ${command}`)
    assert.equal(denied.rule, rule)
    assert.equal(denied.tier, "graph")
    assert.equal(denied.runActive, true)
  })

  test(`graph tier allows ${name} with no lock`, () => {
    const allowed = bash(command, NO_LOCK)
    assert.equal(allowed.decision, "allow", `wrongly denied without a lock: ${command}`)
    assert.equal(allowed.runActive, false)
  })
}

test("the graph tier denies file-tool writes to the protected set", () => {
  assert.equal(tool("Write", { file_path: "CLAUDE.md" }, LIVE_LOCK).tier, "graph")
  assert.equal(
    tool("Edit", { file_path: ".claude/skills/thejudge-map-out/SKILL.md" }, LIVE_LOCK).decision,
    "deny"
  )
  assert.equal(tool("Write", { file_path: "CLAUDE.md" }, NO_LOCK).decision, "allow")
  assert.equal(tool("Write", { file_path: "PRD/README.md" }, LIVE_LOCK).decision, "allow")
})

test("the universal tier fires in both lock states", () => {
  for (const [name, command, rule] of DENIED_UNIVERSAL) {
    for (const [state, lock] of [["no lock", NO_LOCK], ["lock present", LIVE_LOCK]]) {
      const result = bash(command, lock)
      assert.equal(result.decision, "deny", `${name} must deny with ${state}`)
      assert.equal(result.rule, rule)
      assert.equal(result.tier, "universal")
    }
  }
})

test("a corrupt lock means no run active, and never disarms the universal tier", () => {
  // The permissive reading is the safe one here: a hook that hardened on
  // garbage would brick ordinary work in this repository.
  const graphRule = bash("echo x > CLAUDE.md", CORRUPT_LOCK)
  assert.equal(graphRule.decision, "allow")
  assert.equal(graphRule.runActive, false)

  const universalRule = bash("git push --force origin topic", CORRUPT_LOCK)
  assert.equal(universalRule.decision, "deny")
  assert.equal(universalRule.tier, "universal")
})

test("a missing lock means no run active", () => {
  assert.equal(bash("git status", NO_LOCK).runActive, false)
  assert.equal(bash("git status", LIVE_LOCK).runActive, true)
})

test("readRunLock reports absence rather than throwing", () => {
  assert.equal(readRunLock("/nonexistent-root-xyz"), null)
  assert.equal(readRunLock("/any", NO_LOCK.read), null)
  assert.equal(typeof readRunLock("/any", LIVE_LOCK.read), "string")
})

test("readStopSentinel reports presence, not contents", () => {
  assert.equal(readStopSentinel("/nonexistent-root-xyz"), false)
  assert.equal(readStopSentinel("/any", NO_LOCK.read), false)
  assert.equal(readStopSentinel("/any", LOCK_AND_STOP.read), true)
})

test("the project root comes from the harness, not the call's working directory", () => {
  assert.equal(projectRoot({}, { CLAUDE_PROJECT_DIR: "/repo" }), "/repo")
  assert.equal(projectRoot({ cwd: "/repo/sub" }, {}), "/repo/sub")
})

test("ordinary work is untouched while a run holds the lock", () => {
  // NFR-016 in the direction that matters most: the strict tier must not make
  // the repository unusable for the run that is holding the lock.
  for (const command of [
    "npm run test:scripts",
    "git status --short",
    "git commit -m 'feat: something'",
    "node --test scripts/graph-boundary-hook.test.mjs",
    "echo notes > PRD/work/example/notes.md"
  ]) {
    assert.equal(bash(command, LIVE_LOCK).decision, "allow", `wrongly denied: ${command}`)
  }
})


// ---------------------------------------------------------------------------
// Slice C — the owner's kill switch.
// ---------------------------------------------------------------------------

function dispatch(toolName, lock) {
  return decide(
    JSON.stringify({ tool_name: toolName, tool_input: { prompt: "run the next node" } }),
    lock
  )
}

test("a node dispatch is denied while the stop sentinel exists", () => {
  for (const toolName of ["Task", "Agent"]) {
    const denied = dispatch(toolName, LOCK_AND_STOP)
    assert.equal(denied.decision, "deny", `${toolName} must be denied after a stop request`)
    assert.equal(denied.rule, "dispatch-after-stop")
    assert.equal(denied.tier, "graph")
    assert.equal(denied.stopRequested, true)
    assert.match(denied.reason, /release the lock/)
  }
})

test("a node dispatch is allowed with a lock and no stop sentinel", () => {
  for (const toolName of ["Task", "Agent"]) {
    const allowed = dispatch(toolName, LIVE_LOCK)
    assert.equal(allowed.decision, "allow", `${toolName} must run while no stop was requested`)
    assert.equal(allowed.stopRequested, false)
  }
})

test("the halting run can still write its own terminal state", () => {
  // The kill switch stops dispatches, not the halt itself. A run that could not
  // write its ledger, status marker, and board row would strand exactly the
  // state this slice exists to avoid.
  for (const command of [
    "printf 'PARKED\n' >> PRD/work/example/GRAPH-RUN.md",
    "git add PRD/work/example",
    "git commit -m 'halt'",
    "rm .worktrees/.graph-run.lock"
  ]) {
    const result = bash(command, LOCK_AND_STOP)
    if (command.includes("graph-run.lock")) {
      // Releasing the lock is the run's own path, not a Bash deletion.
      assert.equal(result.rule, "run-lock-removal")
      continue
    }
    assert.equal(result.decision, "allow", `the halt path must stay open: ${command}`)
  }
})

test("a run cannot delete the owner's stop sentinel to escape it", () => {
  const denied = bash("rm .worktrees/.graph-stop", LOCK_AND_STOP)
  assert.equal(denied.decision, "deny")
  assert.equal(denied.rule, "stop-sentinel-removal")
  assert.equal(denied.tier, "graph")
})

test("the owner removes the sentinel to resume, once no run holds the lock", () => {
  assert.equal(bash("rm .worktrees/.graph-stop", STOP_NO_LOCK).decision, "allow")
})

test("a stop sentinel with no lock changes nothing", () => {
  // The graph tier is gated on the lock. A leftover sentinel must not harden an
  // ordinary session.
  assert.equal(dispatch("Task", STOP_NO_LOCK).decision, "allow")
  assert.equal(bash("echo x > CLAUDE.md", STOP_NO_LOCK).decision, "allow")
})

test("a deny exits 2 with the reason on stderr", async () => {
  const { code, stderr } = await runHook(
    JSON.stringify({ tool_name: "Bash", tool_input: { command: "git push --force origin main" } })
  )
  assert.equal(code, 2)
  assert.match(stderr, /graph-boundary/)
  assert.match(stderr, /Force-push is denied/)
})

test("an allow exits 0 and says nothing", async () => {
  const { code, stderr } = await runHook(
    JSON.stringify({ tool_name: "Bash", tool_input: { command: "git status" } })
  )
  assert.equal(code, 0)
  assert.equal(stderr, "")
})

test("the hook never fails closed", async () => {
  // A hook that denies on its own bugs bricks every session in the repository.
  for (const payload of ["not json", "", "[]", '{"tool_name":null}']) {
    const { code } = await runHook(payload)
    assert.equal(code, 0, `a malformed payload must not deny: ${JSON.stringify(payload)}`)
  }
})

test("an internal error prints a diagnostic before allowing", async () => {
  const { code, stderr } = await runHook("not json")
  assert.equal(code, 0)
  assert.match(stderr, /hook error, allowing the call/)
})
