// Deterministic checkout preparation for autonomous graph runs.
//
// A fresh run never mutates the launch checkout. From a root checkout it
// creates `.worktrees/kickoff-<slug>` on a new branch cut from `origin/main`
// and every later node works there (REQ-191). From a session already rooted in
// a linked worktree it works in place, on a clean tree only. The working-tree
// resolution step that existed until 2026-09-06 is gone with the reason for
// it: nothing in a run touches the owner's tree any more.

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { CANARY_COMMAND, GRAPH_CANARY_COMMAND } from "./lib/boundary-rules.mjs"

// `.claude/graph-profile.json` sets this in its `env` block, so it is present
// only in a session actually launched with `--settings <that file>`. It is the
// one observable difference between a profiled session and an unprofiled one,
// which is what turns the ledger's `Profile:` field from the user's word into
// evidence.
//
// Stated limit: the sentinel proves the *file was loaded*. It does not prove
// any individual deny rule fired, and it never will. A run cannot forge it —
// the profile denies edits to itself — but a run also cannot verify from it
// that `nohup` or a trailing `&` was refused, because neither is expressible
// as a rule at all.
export const PROFILE_SENTINEL_ENV = "THEJUDGE_GRAPH_PROFILE"

// Two graph runs launched against one root both take this lock, and the
// second refuses. The path sits under `.worktrees/`, which `.gitignore`
// already covers, so the lock is never committed and never travels with a
// branch. Concurrency across roots is structural: a session rooted in another
// checkout has its own `.worktrees/` and its own lock.
export const LOCK_PATH = ".worktrees/.graph-run.lock"

// The owner's kill switch. Its presence means a run was asked to halt, so a new
// run must not start on top of it — otherwise throwing the switch stops one run
// and the next invocation quietly starts another.
export const STOP_PATH = ".worktrees/.graph-stop"

// Every autonomous base branch is `thejudge-auto/<slug>`. The digest and the
// prune command reason about exactly those branches.
export const GRAPH_BRANCH_PREFIX = "thejudge-auto/"

// The start point of every fresh run. It is `origin/main` and not the current
// branch: a checkout left on a previous run's base used to seed the next run
// from that stale base, with only a line in the dispatch prompt standing in
// the way (2026-09-06 audit, finding 1).
export const DEFAULT_BASE = "origin/main"

/**
 * What the ledger's `Profile:` field should say, from observation alone.
 *
 * Pure, so the test suite covers both branches without launching a session.
 */
export function readProfileSentinel(env = process.env) {
  const value = env[PROFILE_SENTINEL_ENV]
  const present = value === "1"
  return {
    present,
    value: value ?? null,
    ledgerLine: present ? "Profile: loaded (env sentinel)" : "Profile: unverified"
  }
}

export const FETCH_COMMAND = "git fetch origin"

/**
 * The worktree a spec-forming run works in, under the already-ignored
 * `.worktrees/` root.
 */
export function kickoffWorktreePath(slug) {
  return `.worktrees/kickoff-${slug}`
}

/**
 * The command that creates the kickoff worktree on a fresh branch off the base.
 *
 * This is a planned preflight command, not an instruction for the owner. Until
 * 2026-09-06 the skill told the owner to run it by hand and then node 1 refused
 * the branch it had just created as a collision.
 */
export function kickoffWorktreeCommand(slug, base = DEFAULT_BASE) {
  return `git worktree add ${kickoffWorktreePath(slug)} -b ${GRAPH_BRANCH_PREFIX}${slug} ${base}`
}

/**
 * Which of the two checkout shapes preflight is running in.
 *
 * A root checkout's git dir is the common dir. A linked worktree's git dir is a
 * file under `<common>/worktrees/<name>`, so the two differ. Pure over the two
 * resolved paths so the decision is tested without a repository.
 */
export function classifyCheckoutShape({ gitDir, gitCommonDir }) {
  const normalize = (value) => path.resolve(String(value ?? "").trim())
  return normalize(gitDir) === normalize(gitCommonDir) ? "root" : "linked-worktree"
}

/**
 * Whether an in-place run may proceed: only on a clean tree.
 *
 * `git status --porcelain` output, one entry per line. A dirty in-place tree is
 * refused, never resolved on the owner's behalf — the resolution step that used
 * to do that is retired (REQ-191).
 */
export function classifyInPlaceTree(porcelainOutput) {
  const paths = String(porcelainOutput ?? "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "")
    .map((line) => line.slice(3))
  if (paths.length === 0) return { clean: true, paths: [], reason: "working tree is clean" }
  return {
    clean: false,
    paths,
    reason:
      `refusing to run in place on a dirty worktree (${paths.length} path(s)): ` +
      paths.join(", ") +
      ". Commit or discard the changes yourself, then retry; preflight never resolves them for you."
  }
}

/**
 * The exact git commands a run executes, in order.
 *
 * Root shape: fetch, add the kickoff worktree on the new branch, push from
 * inside it. In-place shape: fetch, switch to the new branch, push. The fetch is
 * always first so a branch-name collision surfaces before any mutation.
 */
export function planActions({ shape, branch, slug, base }) {
  const commands = [FETCH_COMMAND]
  if (shape === "linked-worktree") {
    commands.push(`git switch -c ${branch} ${base}`)
    commands.push(`git push -u origin ${branch}`)
    return commands
  }
  const worktree = kickoffWorktreePath(slug)
  commands.push(`git worktree add ${worktree} -b ${branch} ${base}`)
  commands.push(`git -C ${worktree} push -u origin ${branch}`)
  return commands
}

// Two graph runs on the same day must not share a run id: it keys the lock,
// the intake staging folder, and every ledger row.
export function defaultRunId(now = new Date()) {
  const iso = now.toISOString()
  return `graph-${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 19).replace(/:/g, "")}`
}

// `branch`, `base`, `slug`, and `runId` are interpolated into the command
// strings `planActions` builds, and `parseCommandArgs` re-tokenizes those
// strings on whitespace before they reach real git commands. A value carrying
// whitespace, a quote, or a shell metacharacter mis-tokenizes into extra
// arguments, so every one is validated here at parse time. A leading `-` is
// rejected too, so `--base --dry-run` is an error rather than a base named
// `--dry-run`.
const REF_VALUE_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._/-]*$/

/**
 * `--pid`, or null when absent.
 *
 * A malformed value is an error rather than a silent default: a lock carrying a
 * junk pid reads `stale` to the next run, which reports the previous run dead
 * and offers to reclaim its lock. That is the wrong answer to give quietly.
 */
export function parsePidValue(raw) {
  if (raw === null) return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`graph-preflight: --pid must be a positive integer, got ${JSON.stringify(raw)}`)
  }
  return value
}

export function parseRefValue(raw, flagName) {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== "string" || !REF_VALUE_PATTERN.test(raw)) {
    throw new Error(
      `graph-preflight: ${flagName} must be a valid git ref name — letters, digits, and ._/- only, ` +
        `no whitespace, quotes, or shell metacharacters; got ${JSON.stringify(raw)}`
    )
  }
  return raw
}

// The created branch becomes the autonomous base every later PR targets, so
// its start point is explicit and reported. Without `--base` it is
// `origin/main`; the current branch is never consulted.
export function resolveBase(explicitBase) {
  return explicitBase || DEFAULT_BASE
}

export function findBranchCollision(runGit, branch) {
  for (const ref of [`refs/heads/${branch}`, `refs/remotes/origin/${branch}`]) {
    try {
      runGit(["rev-parse", "--verify", "--quiet", ref])
      return ref
    } catch {
      // `rev-parse --verify --quiet` exits non-zero when the ref is absent.
    }
  }
  return null
}

export function formatFailureReport({ failedCommand, executed, remaining }) {
  const lines = [`graph-preflight: FAILED at: ${failedCommand}`]
  lines.push("commands that ran:")
  lines.push(...(executed.length ? executed.map((c) => `  ${c}`) : ["  (none)"]))
  lines.push("commands that did NOT run:")
  lines.push(...(remaining.length ? remaining.map((c) => `  ${c}`) : ["  (none)"]))
  lines.push("graph-preflight does not roll back. Resolve the repository state manually before re-running.")
  return lines.join("\n")
}

export function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name)
    if (index === -1) return null
    // A flag given as the final token has no value; return "" so validation
    // rejects it rather than silently falling back to the default.
    return argv[index + 1] === undefined ? "" : argv[index + 1]
  }
  // Every ref-shaped flag is validated identically: absent means "use the
  // caller's default", but present-and-malformed is always an error. `--base`
  // in particular decides the autonomous base every later PR targets, so it
  // must never fall back silently.
  const runIdArg = parseRefValue(get("--run-id"), "--run-id")
  return {
    branch: parseRefValue(get("--branch"), "--branch"),
    base: parseRefValue(get("--base"), "--base"),
    runId: runIdArg ?? defaultRunId(),
    dryRun: argv.includes("--dry-run"),
    // A resume re-enters at the node its ledger records and never re-runs the
    // branch work, so it needs a way to take the lock and nothing else.
    takeLockOnly: argv.includes("--take-lock"),
    slug: parseRefValue(get("--slug"), "--slug"),
    // The lock names a process a later run tests for liveness, and this script
    // is not it: node exits the moment it returns. The driver's session outlives
    // the run, so the driver passes its own pid.
    pid: parsePidValue(get("--pid"))
  }
}

/**
 * Is the recorded holder still running?
 *
 * Signal 0 performs the permission and existence checks without delivering
 * anything. `EPERM` means the process exists under another user — alive, and
 * emphatically not ours to reclaim.
 */
export function isPidAlive(pid, kill = process.kill.bind(process)) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    kill(pid, 0)
    return true
  } catch (error) {
    return error.code === "EPERM"
  }
}

export function parseLockFile(contents) {
  try {
    const parsed = JSON.parse(contents)
    if (!parsed || typeof parsed !== "object") return null
    return {
      slug: typeof parsed.slug === "string" ? parsed.slug : null,
      runId: typeof parsed.runId === "string" ? parsed.runId : null,
      pid: Number.isInteger(parsed.pid) ? parsed.pid : null,
      startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : null
    }
  } catch {
    return null
  }
}

/**
 * What a run should do about the lock it found — the whole decision, as a pure
 * function over the file's contents.
 *
 * A stale lock is *reported*, never silently stolen: a run that reclaims
 * without saying so is indistinguishable from one that never contended.
 */
export function classifyLock({ contents, isAlive = isPidAlive }) {
  if (contents === null || contents === undefined) {
    return { state: "free", holder: null, message: null }
  }

  const holder = parseLockFile(contents)
  if (!holder || holder.pid === null) {
    return {
      state: "corrupt",
      holder: null,
      message:
        `graph run lock at ${LOCK_PATH} is unreadable. Inspect it, confirm no ` +
        `run is active, then delete it before starting.`
    }
  }

  const who = `slug ${holder.slug ?? "<unknown>"}, run id ${holder.runId ?? "<unknown>"}, ` + `pid ${holder.pid}`

  if (isAlive(holder.pid)) {
    return {
      state: "held",
      holder,
      message:
        `graph run lock at ${LOCK_PATH} is held by ${who}` +
        `${holder.startedAt ? `, started ${holder.startedAt}` : ""}. ` +
        `Refusing: two runs cannot share one root. Wait for that run ` +
        `to reach a terminal state, which releases the lock.`
    }
  }

  return {
    state: "stale",
    holder,
    message:
      `graph run lock at ${LOCK_PATH} names ${who}` +
      `${holder.startedAt ? `, started ${holder.startedAt}` : ""}, but that ` +
      `process is not running. The lock is stale. Confirm the run really ended, ` +
      `then reclaim it with: rm ${LOCK_PATH}`
  }
}

/**
 * Whether the owner's stop sentinel blocks a new run.
 *
 * Pure, so the refusal is tested without touching the filesystem. The message
 * names both the sentinel and the file to remove: a refusal the owner cannot
 * act on is a dead end, not a boundary.
 */
export function classifyStopSentinel({ present }) {
  if (!present) return { state: "clear", message: null }
  return {
    state: "refused",
    message:
      `graph-preflight: refusing to start — the owner's stop sentinel exists at ` +
      `${STOP_PATH}. A run was asked to halt, and starting another would undo ` +
      `that. Confirm the halted run finished, then remove it to resume: ` +
      `rm ${STOP_PATH}`
  }
}

/**
 * The canary the run issues to prove its own enforcer is firing.
 *
 * Re-exported rather than restated: the command literal lives in
 * `boundary-rules.mjs` with every other one in this system, so the canary and
 * the rule that denies it can never drift apart.
 */
export { CANARY_COMMAND }

/**
 * Whether the canary proved the hook is live.
 *
 * A canary that was *denied* is the proof — the hook returned a reason, which
 * only a firing hook can do. A canary that was *allowed* is not a warning to
 * note and continue past: the run has no working enforcer, so it ends at
 * `BLOCKED` before node 2 is ever dispatched.
 *
 * `.claude/graph-profile.json` is deliberately not a fallback here. A failed
 * proof is refused, never downgraded to a weaker one.
 */
export function classifyCanary({ denied, response, workspaceTrusted = true }) {
  if (denied) {
    return {
      state: "proven",
      message: null,
      ledgerLine: `Canary: denied — hook live (\`${CANARY_COMMAND}\`)`
    }
  }

  // An untrusted workspace cannot run project hooks at all, so it fails the
  // canary the same way a missing hook does. Naming it separately is the point:
  // "your hook is broken" and "you never trusted this checkout" have completely
  // different recovery actions.
  if (!workspaceTrusted) {
    return {
      state: "blocked",
      reason: "untrusted-workspace",
      message:
        `graph-preflight: BLOCKED — the workspace is not trusted, so project ` +
        `hooks never load and the boundary hook cannot deny anything.\n` +
        `  tried:    ${CANARY_COMMAND}\n` +
        `  response: ${response ?? "(allowed — no hook reason returned)"}\n` +
        `  recovery: trust this checkout in Claude Code, then re-run preflight. ` +
        `Do not start the run until the canary is denied.`,
      ledgerLine: "Canary: allowed — BLOCKED (untrusted workspace)"
    }
  }

  return {
    state: "blocked",
    reason: "canary-not-denied",
    message:
      `graph-preflight: BLOCKED — the liveness canary was not denied, so the ` +
      `boundary hook is not firing. The run has no enforcer and must not start.\n` +
      `  tried:    ${CANARY_COMMAND}\n` +
      `  response: ${response ?? "(allowed — no hook reason returned)"}\n` +
      `  recovery: confirm .claude/settings.json registers the PreToolUse hook ` +
      `and that scripts/graph-boundary-hook.mjs runs, then re-run preflight. ` +
      `The permission profile is not a fallback — a failed proof is refused, ` +
      `never downgraded.`,
    ledgerLine: "Canary: allowed — BLOCKED (hook not firing)"
  }
}

/**
 * The graph-tier canary's verdict.
 *
 * Separate from `classifyCanary` because it answers a different question and is
 * issued at a different moment. `classifyCanary` asks whether the hook is loaded
 * at all, before the lock exists. This asks whether the graph tier is armed,
 * after it does. A run that passes the first and fails the second has a live
 * hook and no lock — the exact state that went unnoticed on 2026-08-23.
 */
export function classifyGraphCanary({ denied, response }) {
  if (denied) {
    return {
      state: "ok",
      ledgerLine: `Graph canary: denied — graph tier armed (\`${GRAPH_CANARY_COMMAND}\`)`
    }
  }
  return {
    state: "blocked",
    ledgerLine: `Graph canary: allowed — BLOCKED (\`${GRAPH_CANARY_COMMAND}\`)`,
    message:
      "graph-preflight: the graph-tier canary was not denied.\n" +
      `  tried:    ${GRAPH_CANARY_COMMAND}\n` +
      `  response: ${response ?? "(allowed)"}\n` +
      "The hook may be live while the graph tier is disarmed, which is what a\n" +
      "missing or unreadable `.worktrees/.graph-run.lock` looks like. The universal\n" +
      "canary cannot see this: it is denied either way. Confirm the lock exists and\n" +
      "parses as a JSON object, then retry. Do not proceed on an unproven tier."
  }
}

/**
 * Whether the hook was still firing during the node that just finished.
 *
 * Read-only over the counter file, whose sole writer is the hook. That is what
 * makes the heartbeat evidence: the driver cannot manufacture its own proof.
 *
 * A node that made tool calls while the counter stood still means the hook
 * stopped firing mid-run, which the canary at run start cannot catch.
 */
export function classifyHeartbeat({ node, before, after, runStatePresent = true, toolCallsMade = true }) {
  if (!runStatePresent) {
    return {
      state: "degraded",
      message:
        `graph: degraded heartbeat at node \`${node}\` — no usable run ` +
        `state, so there was no counter key to advance. This is not a hook ` +
        `failure. The run-start canary remains the binding proof.`,
      ledgerLine: `Heartbeat: degraded (no run state) at \`${node}\``
    }
  }

  if (after > before) {
    return {
      state: "ok",
      message: null,
      ledgerLine: `Heartbeat: ${before} → ${after} at \`${node}\``
    }
  }

  if (!toolCallsMade) {
    return {
      state: "ok",
      message: null,
      ledgerLine: `Heartbeat: no tool calls at \`${node}\` — nothing to prove`
    }
  }

  return {
    state: "blocked",
    message:
      `graph: BLOCKED — the boundary hook stopped firing during node ` +
      `\`${node}\`.\n` +
      `  expected: the counter to advance past ${before}\n` +
      `  observed: ${after}\n` +
      `  meaning:  the node made tool calls that no hook saw, so the run has ` +
      `been unenforced for an unknown span. The run does not advance.\n` +
      `  recovery: re-run the liveness canary, repair the hook, then resume.`,
    ledgerLine: `Heartbeat: static at ${after} during \`${node}\` — BLOCKED`
  }
}

/** The record a run writes when it takes the lock. */
export function lockRecord({ slug, runId, pid, now }) {
  return JSON.stringify({ slug, runId, pid, startedAt: now }, null, 2) + "\n"
}

/**
 * Take the lock, or report why it cannot be taken.
 *
 * Until 2026-08-24 nothing called this or `classifyLock`: both were tested pure
 * functions with no caller, and the skill asked the agent to write the file by
 * hand. On the first attempt of run `graph-20260823-170119` the agent forgot and
 * still reported success, so the hook's entire graph tier stayed inert for the
 * whole run while the canary still reported green.
 *
 * A guardrail that depends on an agent remembering is not a guardrail, so the
 * script takes it.
 */
export function takeLock({ slug, runId, pid = process.pid, now = new Date().toISOString(), io = {} }) {
  const read = io.read ?? readFileSync
  const write = io.write ?? writeFileSync
  const ensure = io.ensure ?? mkdirSync

  let contents
  try {
    contents = read(LOCK_PATH, "utf8")
  } catch {
    // An absent lock is the normal case: there is no run to collide with.
    contents = null
  }

  if (contents !== null) {
    const decision = classifyLock({ contents, isAlive: io.isAlive ?? isPidAlive })
    // `held`, `stale`, and `corrupt` all refuse. A stale lock is reported
    // with its reclaim command, never silently stolen.
    return { taken: false, state: decision.state, message: decision.message }
  }

  const record = lockRecord({ slug, runId, pid, now })
  ensure(".worktrees", { recursive: true })
  write(LOCK_PATH, record, "utf8")
  return { taken: true, state: "taken", record }
}

function main(argv) {
  let options
  try {
    options = parseArgs(argv)
  } catch (error) {
    console.error(error.message)
    return process.exit(2)
  }

  // `--take-lock` is the resume path: the branch already exists and is checked
  // out, so requiring `--branch` there would only invite a caller to re-pass a
  // name that `findBranchCollision` would then reject as already taken.
  if (!options.branch && !options.takeLockOnly) {
    console.error("graph-preflight: --branch <name> is required")
    return process.exit(2)
  }

  // The slug names the lock's package and, on a fresh run, the kickoff
  // worktree. Both paths need it.
  if (!options.slug) {
    console.error(
      options.takeLockOnly
        ? "graph-preflight: --take-lock requires --slug <slug> so the lock names its package"
        : "graph-preflight: --slug <slug> is required; it names the kickoff worktree and the lock's package"
    )
    return process.exit(2)
  }

  // Before the dry run and before any mutation: a halted run must not be
  // restarted by the next invocation.
  const stop = classifyStopSentinel({ present: existsSync(STOP_PATH) })
  if (stop.state === "refused") {
    console.error(stop.message)
    return process.exit(2)
  }

  // The lock comes before any mutation, and before the branch work, so a second
  // run in this root refuses rather than sharing it. `--take-lock` stops here: a
  // resume needs the tier armed and nothing else done.
  if (!options.dryRun) {
    const lockPid = options.pid ?? process.ppid
    const lock = takeLock({ slug: options.slug, runId: options.runId, pid: lockPid })
    if (!lock.taken) {
      console.error(lock.message)
      return process.exit(2)
    }
    console.log(`lock: taken at ${LOCK_PATH} (run ${options.runId}, pid ${lockPid})`)
    if (options.pid === null) {
      console.warn(
        "lock warning: no --pid given, so the lock records this script's parent. " +
          "Both exit immediately, which makes the lock read `stale` to the next run. " +
          "Pass the driver's own long-lived session pid."
      )
    }
    console.log(`graph canary command: ${GRAPH_CANARY_COMMAND}`)
    console.log("graph canary: pending — issue it as a Bash tool call and require a deny")
  }

  if (options.takeLockOnly) {
    console.log("graph-preflight: lock taken; --take-lock did nothing else")
    return undefined
  }

  const runGit = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })

  const shape = classifyCheckoutShape({
    gitDir: runGit(["rev-parse", "--git-dir"]),
    gitCommonDir: runGit(["rev-parse", "--git-common-dir"])
  })
  const base = resolveBase(options.base)
  const worktree = shape === "root" ? kickoffWorktreePath(options.slug) : null
  const commands = planActions({ shape, branch: options.branch, slug: options.slug, base })

  const sentinel = readProfileSentinel()
  console.log(`profile sentinel: ${sentinel.present ? "present" : "absent"}`)
  console.log(sentinel.ledgerLine)
  // The canary is a *tool call*, which a script cannot make — only the agent
  // running through the harness can. So the script names it and the skill
  // issues it, then classifies the result with `classifyCanary()`.
  console.log(`canary command: ${CANARY_COMMAND}`)
  console.log("canary: pending — issue it as a Bash tool call and require a deny")
  console.log(`shape: ${shape}${shape === "root" ? " (nodes work in the kickoff worktree)" : " (nodes work in place)"}`)
  console.log(`run id: ${options.runId}`)
  console.log(`base: ${base}${options.base ? " (explicit --base)" : " (default)"}`)
  if (worktree) console.log(`worktree: ${path.resolve(worktree)}`)

  // An in-place run needs a clean tree. Refused, never resolved: the owner's
  // uncommitted work is theirs to commit or discard.
  if (shape === "linked-worktree") {
    const tree = classifyInPlaceTree(runGit(["status", "--porcelain"]))
    console.log(`tree: ${tree.clean ? "clean" : "dirty"}`)
    if (!tree.clean) {
      console.error(`graph-preflight: ${tree.reason}`)
      return process.exit(1)
    }
  }

  // A kickoff worktree that already exists is a prior run's, and adopting it
  // would make two runs share a working tree — the hazard this layout exists
  // to remove.
  if (worktree && existsSync(worktree)) {
    console.error(
      `graph-preflight: ${worktree} already exists. A prior run for this slug left it behind; ` +
        `inspect it, then remove it (\`npm run graph:prune\`, or \`git worktree remove ${worktree}\`) or pick a different --slug.`
    )
    return process.exit(2)
  }

  console.log("planned commands:")
  for (const command of commands) console.log(`  ${command}`)

  if (options.dryRun) {
    console.log("dry run: no commands executed")
    return undefined
  }

  const executed = []
  for (const [index, command] of commands.entries()) {
    const remaining = commands.slice(index + 1)
    try {
      execFileSync("git", parseCommandArgs(command), { stdio: "inherit" })
    } catch (error) {
      console.error(formatFailureReport({ failedCommand: command, executed, remaining }))
      console.error(`underlying error: ${error.message}`)
      return process.exit(1)
    }
    executed.push(command)

    // The fetch is the only command that runs before any mutation, so this is
    // the last point at which a name collision costs nothing to discover.
    if (command === FETCH_COMMAND) {
      const collision = findBranchCollision(runGit, options.branch)
      if (collision) {
        console.error(
          `graph-preflight: branch ${options.branch} already exists (${collision}) — pick a different --branch name`
        )
        console.error(
          formatFailureReport({
            failedCommand: `${command} (branch-name collision check)`,
            executed,
            remaining
          })
        )
        return process.exit(2)
      }
    }
  }

  if (worktree) console.log(`worktree: ${path.resolve(worktree)} on ${options.branch}`)
  console.log("graph-preflight: complete")
  return undefined
}

export function parseCommandArgs(command) {
  // Splits `git a b "c d"` into ["a", "b", "c d"], dropping the leading `git`.
  const matches = command.match(/"(?:[^"\\]|\\.)*"|\S+/g) ?? []
  return matches.slice(1).map((token) => (token.startsWith('"') ? JSON.parse(token) : token))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
