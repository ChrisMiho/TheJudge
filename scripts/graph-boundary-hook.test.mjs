import assert from "node:assert/strict"
import { Readable } from "node:stream"
import test from "node:test"

import {
  EVIDENCE_LOG_PATH,
  RUN_LOCK_PATH,
  RUN_RELEASE_PATH,
  RUN_STATE_PATH,
  RUN_STOP_PATH,
  capForNode
} from "./lib/boundary-rules.mjs"
import {
  decide,
  main,
  projectRoot,
  readRunLock,
  readStopSentinel,
  recordCall,
  slugFromLock
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

/**
 * An in-memory stand-in for `.worktrees/`.
 *
 * The counter file is read *and* written by the hook, so the fake has to behave
 * like a filesystem for it: a test that only stubbed reads would never catch the
 * count failing to persist.
 */
function records({ lock = null, stop = false, state = null, counts = null, release = null } = {}) {
  const files = new Map()
  if (counts !== null) files.set(CALL_COUNT_PATH, counts)

  return {
    files,
    read: (target) => {
      if (target.endsWith(RUN_RELEASE_PATH)) {
        if (release === null) absent(target)
        return release
      }
      if (target.endsWith(RUN_LOCK_PATH)) {
        if (lock === null) absent(target)
        return lock
      }
      if (target.endsWith(RUN_STOP_PATH)) {
        if (!stop) absent(target)
        return ""
      }
      if (target.endsWith(RUN_STATE_PATH)) {
        if (state === null) absent(target)
        return state
      }
      for (const [name, contents] of files) {
        if (target.endsWith(name)) return contents
      }
      return absent(target)
    },
    write: (target, contents) => files.set(target, contents),
    move: (from, to) => {
      const contents = files.get(from)
      files.delete(from)
      files.set(CALL_COUNT_PATH, contents)
      files.set(to, contents)
    },
    ensure: () => undefined
  }
}

const CALL_COUNT_PATH = ".worktrees/.graph-node-calls.json"

/** The counts the fake filesystem is currently holding. */
function countsIn(io) {
  const raw = io.files.get(CALL_COUNT_PATH)
  return raw === undefined ? {} : JSON.parse(raw)
}

function runStateOf({ runId = "graph-1", node = "plan", attempt = 1 } = {}) {
  return JSON.stringify({ runId, node, attempt })
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


// ---------------------------------------------------------------------------
// Slice D — the per-dispatch tool-call cap.
// ---------------------------------------------------------------------------

test("the counter increments once per call", () => {
  const io = records({ lock: LOCK_CONTENTS, state: runStateOf() })
  for (let call = 1; call <= 3; call += 1) {
    const result = bash("git status", io)
    assert.equal(result.callCount, call, "each call must advance the count by one")
    assert.equal(result.decision, "allow")
  }
  assert.deepEqual(countsIn(io), { "graph-1/plan/1": 3 })
})

test("the deny fires at the cap, having allowed everything before it", () => {
  const cap = capForNode("preflight")
  const io = records({ lock: LOCK_CONTENTS, state: runStateOf({ node: "preflight" }) })

  for (let call = 1; call < cap; call += 1) {
    assert.equal(bash("git status", io).decision, "allow", `call ${call} must be allowed`)
  }

  const denied = bash("git status", io)
  assert.equal(denied.decision, "deny")
  assert.equal(denied.rule, "tool-call-cap")
  assert.equal(denied.callCount, cap)
  assert.match(denied.reason, /preflight/)
  assert.match(denied.reason, /attempt 1/)
})

test("two attempts at one node under one run id hold separate counts", () => {
  const cap = capForNode("preflight")
  const io = records({
    lock: LOCK_CONTENTS,
    state: runStateOf({ node: "preflight", attempt: 1 }),
    counts: JSON.stringify({ "graph-1/preflight/1": cap })
  })

  // Attempt 1 is spent.
  assert.equal(bash("git status", io).decision, "deny")

  // A loop-back is a new attempt with a fresh budget.
  const second = records({
    lock: LOCK_CONTENTS,
    state: runStateOf({ node: "preflight", attempt: 2 }),
    counts: JSON.stringify({ "graph-1/preflight/1": cap })
  })
  const fresh = bash("git status", second)
  assert.equal(fresh.decision, "allow")
  assert.equal(fresh.callCount, 1, "attempt 2 starts at zero")
  assert.equal(countsIn(second)["graph-1/preflight/1"], cap, "attempt 1's count is untouched")
})

test("the count survives a park and resume", () => {
  // The key is run id / node / attempt, never a session, so a counter file
  // carried across a resume continues the same attempt rather than restarting.
  const carried = JSON.stringify({ "graph-1/plan/1": 12 })
  const io = records({ lock: LOCK_CONTENTS, state: runStateOf(), counts: carried })
  assert.equal(bash("git status", io).callCount, 13)
})

test("a corrupt counter file restarts the count rather than blocking the run", () => {
  const io = records({ lock: LOCK_CONTENTS, state: runStateOf(), counts: "{ not json" })
  const result = bash("git status", io)
  assert.equal(result.decision, "allow")
  assert.equal(result.callCount, 1)
})

test("a missing run-state file allows the call and reports the degraded cap", () => {
  const io = records({ lock: LOCK_CONTENTS, state: null })
  const result = bash("git status", io)
  assert.equal(result.decision, "allow")
  assert.equal(result.callCount, null)
  assert.match(result.degraded, /cannot attribute/)
  assert.match(result.degraded, new RegExp(RUN_STATE_PATH.replace(/\./g, "\\.")))
})

test("an unparseable run-state file allows the call and reports the degraded cap", () => {
  const io = records({ lock: LOCK_CONTENTS, state: "{ not json" })
  const result = bash("git status", io)
  assert.equal(result.decision, "allow")
  assert.match(result.degraded, /not enforced/)
})

test("the degraded report reaches stderr, and never denies", async () => {
  // A cap that quietly stopped counting looks exactly like a run that stayed
  // inside it, so the degraded condition is reported rather than swallowed.
  const io = records({ lock: LOCK_CONTENTS, state: null })
  const stderr = collectStderr()
  const code = await main({
    stdin: Readable.from([JSON.stringify({ tool_name: "Bash", tool_input: { command: "ls" } })]),
    stderr,
    argv: { read: io.read }
  })
  assert.equal(code, 0)
  assert.match(stderr.text(), /degraded/)
})

test("no counting happens outside a run", () => {
  const io = records({ state: runStateOf() })
  const result = bash("git status", io)
  assert.equal(result.callCount, null)
  assert.equal(result.degraded, null)
  assert.deepEqual(countsIn(io), {}, "no run, no counter file")
})

test("recordCall is the counter's only entry point and returns its key", () => {
  const io = records({ lock: LOCK_CONTENTS, state: runStateOf() })
  const first = recordCall("/root", { runId: "graph-9", node: "close", attempt: 4 }, io)
  assert.equal(first.key, "graph-9/close/4")
  assert.equal(first.count, 1)
  const second = recordCall("/root", { runId: "graph-9", node: "close", attempt: 4 }, io)
  assert.equal(second.count, 2)
})


// ---------------------------------------------------------------------------
// Slice F — criteria start false and are earned, not written.
// ---------------------------------------------------------------------------

const CRITERIA_FILE = "slice-z.criteria.json"
const SLUG = "throwaway-slice"

function criteriaFixture() {
  return {
    slug: SLUG,
    slice: "Z",
    criteria: [
      {
        id: "Z1",
        statement: "The script test suite passes",
        value: false,
        evidence: { command: "npm run test:scripts" }
      },
      {
        id: "Z2",
        statement: "The hook file was read",
        value: false,
        evidence: { paths: ["scripts/graph-boundary-hook.mjs"] }
      },
      {
        id: "Z3",
        statement: "A human confirmed the deny text reads clearly",
        value: false,
        evidence: { manual: true }
      }
    ]
  }
}

/** A fake filesystem carrying a lock, run state, criteria, and the evidence log. */
function withCriteria({ evidence = "", criteria = criteriaFixture() } = {}) {
  const io = records({
    lock: JSON.stringify({ slug: SLUG, runId: "graph-1", pid: 1, startedAt: "t" }),
    state: runStateOf({ node: "build" })
  })
  io.files.set(EVIDENCE_LOG_PATH, evidence)
  io.files.set(CRITERIA_FILE, JSON.stringify(criteria))
  io.list = () => [CRITERIA_FILE]
  io.append = (target, contents) => {
    const existing = io.files.get(EVIDENCE_LOG_PATH) ?? ""
    io.files.set(EVIDENCE_LOG_PATH, existing + contents)
    io.files.set(target, io.files.get(EVIDENCE_LOG_PATH))
  }
  io.now = () => "2026-08-20T00:00:00.000Z"
  return io
}

function evidenceLines(io) {
  // Skips unparseable lines exactly as the hook does, so a test that plants a
  // damaged line reads the log the same way production does.
  const entries = []
  for (const line of (io.files.get(EVIDENCE_LOG_PATH) ?? "").split("\n")) {
    if (line.trim() === "") continue
    try {
      entries.push(JSON.parse(line))
    } catch {
      continue
    }
  }
  return entries
}

function write(io, filePath, content) {
  return decide(
    JSON.stringify({ tool_name: "Write", tool_input: { file_path: filePath, content } }),
    io
  )
}

function flipAll(io, criteria = criteriaFixture()) {
  const flipped = { ...criteria, criteria: criteria.criteria.map((c) => ({ ...c, value: true })) }
  return write(io, `PRD/work/${SLUG}/${CRITERIA_FILE}`, JSON.stringify(flipped))
}

test("the slug comes from the lock the run holds", () => {
  assert.equal(slugFromLock('{"slug":"a-package","runId":"r","pid":1}'), "a-package")
  assert.equal(slugFromLock("{ not json"), null)
  assert.equal(slugFromLock('{"runId":"r"}'), null)
})

test("a call matching a criterion's command pattern logs that id", () => {
  const io = withCriteria()
  assert.equal(bash("npm run test:scripts", io).decision, "allow")
  assert.deepEqual(
    evidenceLines(io).map((entry) => entry.criterionId),
    ["Z1"]
  )
  assert.equal(evidenceLines(io)[0].via, "tool-call")
  assert.equal(evidenceLines(io)[0].runId, "graph-1")
  assert.equal(evidenceLines(io)[0].slice, "Z")
})

test("a non-matching call logs nothing", () => {
  const io = withCriteria()
  bash("git status --short", io)
  assert.deepEqual(evidenceLines(io), [])
})

test("a file-path evidence block matches a call naming that path", () => {
  const io = withCriteria()
  decide(
    JSON.stringify({
      tool_name: "Read",
      tool_input: { file_path: "scripts/graph-boundary-hook.mjs" }
    }),
    io
  )
  assert.deepEqual(
    evidenceLines(io).map((entry) => entry.criterionId),
    ["Z2"]
  )
})

test("a flip with no logged evidence is denied, naming the id and what is missing", () => {
  const denied = flipAll(withCriteria())
  assert.equal(denied.decision, "deny")
  assert.equal(denied.rule, "criterion-flip-without-evidence")
  assert.equal(denied.tier, "graph")
  for (const id of ["Z1", "Z2", "Z3"]) assert.ok(denied.reason.includes(id), `must name ${id}`)
  assert.match(denied.reason, /npm run test:scripts/, "must name the missing command evidence")
  assert.match(denied.reason, /dated observation line/, "must name the manual evidence event")
})

test("the same flip is allowed once every id is in the log", () => {
  const io = withCriteria()
  bash("npm run test:scripts", io)
  decide(
    JSON.stringify({
      tool_name: "Read",
      tool_input: { file_path: "scripts/graph-boundary-hook.mjs" }
    }),
    io
  )
  write(io, `PRD/work/${SLUG}/slice-z.evidence.md`, "2026-08-20 Z3 — read the deny text aloud.")
  assert.equal(flipAll(io).decision, "allow")
})

test("a manual criterion flips only after its dated observation line", () => {
  const io = withCriteria()
  bash("npm run test:scripts", io)

  // An undated mention is not an observation.
  write(io, `PRD/work/${SLUG}/slice-z.evidence.md`, "Z3 — looks fine to me")
  assert.equal(
    evidenceLines(io).some((entry) => entry.criterionId === "Z3"),
    false,
    "an undated line must not count as an observation"
  )

  write(io, `PRD/work/${SLUG}/slice-z.evidence.md`, "2026-08-20 Z3 — confirmed against the run.")
  assert.ok(evidenceLines(io).some((entry) => entry.criterionId === "Z3"))
})

test("a manual criterion is never earned by an ordinary command", () => {
  const io = withCriteria({
    criteria: {
      slug: SLUG,
      slice: "Z",
      criteria: [
        { id: "Z9", statement: "manual", value: false, evidence: { manual: true, command: ".*" } }
      ]
    }
  })
  bash("npm run test:scripts", io)
  assert.deepEqual(evidenceLines(io), [], "manual wins over any pattern beside it")
})

test("the log is append-only: an earned id is never re-logged or rewritten", () => {
  const io = withCriteria()
  bash("npm run test:scripts", io)
  const first = io.files.get(EVIDENCE_LOG_PATH)
  bash("npm run test:scripts", io)
  bash("npm run test:scripts", io)
  assert.equal(io.files.get(EVIDENCE_LOG_PATH), first, "no duplicate and no rewrite")
  assert.equal(evidenceLines(io).length, 1)
})

test("a damaged log line is skipped, never repaired", () => {
  const io = withCriteria({ evidence: "{ not json\n" })
  bash("npm run test:scripts", io)
  const lines = (io.files.get(EVIDENCE_LOG_PATH) ?? "").split("\n")
  assert.equal(lines[0], "{ not json", "the damaged line stays exactly as it was")
  assert.ok(evidenceLines(io).some((entry) => entry.criterionId === "Z1"))
})

test("evidence from another run does not count for this one", () => {
  const foreign = JSON.stringify({
    runId: "graph-other",
    slice: "Z",
    criterionId: "Z1",
    via: "tool-call",
    observedAt: "2026-08-19T00:00:00.000Z"
  })
  const io = withCriteria({ evidence: `${foreign}\n` })
  const denied = flipAll(io)
  assert.equal(denied.decision, "deny")
  assert.ok(denied.reason.includes("Z1"), "another run's evidence must not carry over")
})

test("a criterion already true is not re-checked", () => {
  const criteria = criteriaFixture()
  criteria.criteria = criteria.criteria.map((c) => ({ ...c, value: true }))
  const io = withCriteria({ criteria })
  assert.equal(flipAll(io, criteria).decision, "allow", "no flip is happening")
})

test("criteria are not enforced outside a run", () => {
  const io = withCriteria()
  io.read = records().read
  assert.equal(flipAll(io).decision, "allow")
})

test("a package with no criteria files enforces nothing", () => {
  const io = withCriteria()
  io.list = () => []
  assert.equal(flipAll(io).decision, "allow")
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

test("a run releases its own lock by declaring a terminal state", () => {
  // The contract requires the lock deleted as the last act of every terminal
  // state; this rule denied exactly that. Before the release record there was
  // no path through that was not a bypass.
  const held = records({ lock: LOCK_CONTENTS })
  assert.equal(bash("rm .worktrees/.graph-run.lock", held).rule, "run-lock-removal")

  const releasing = records({
    lock: LOCK_CONTENTS,
    release: JSON.stringify({ runId: "r", state: "COMPLETE" })
  })
  assert.equal(bash("rm .worktrees/.graph-run.lock", releasing).decision, "allow")
  assert.equal(bash("unlink .worktrees/.graph-run.lock", releasing).decision, "allow")
})

test("a release naming another run does not open this lock", () => {
  const stale = records({
    lock: LOCK_CONTENTS,
    release: JSON.stringify({ runId: "some-earlier-run", state: "COMPLETE" })
  })
  assert.equal(bash("rm .worktrees/.graph-run.lock", stale).rule, "run-lock-removal")
})

test("a malformed release record is treated as absent, not as a release", () => {
  const broken = records({ lock: LOCK_CONTENTS, release: "{not json" })
  assert.equal(bash("rm .worktrees/.graph-run.lock", broken).rule, "run-lock-removal")
})

test("declaring a terminal state does not unlock anything else", () => {
  // Release covers the lock alone. Everything the graph tier guards stays
  // guarded right up to the moment the lock goes.
  const releasing = records({
    lock: LOCK_CONTENTS,
    release: JSON.stringify({ runId: "r", state: "COMPLETE" })
  })
  assert.equal(bash("echo x > CLAUDE.md", releasing).rule, "protected-path-write")
  assert.equal(bash("rm .worktrees/.graph-stop", releasing).rule, "stop-sentinel-removal")
  assert.equal(bash("echo x >> .worktrees/.graph-evidence.jsonl", releasing).rule, "run-record-write")
})
