// Deterministic working-tree resolution for autonomous graph runs.
//
// The graph workflow may auto-commit or auto-stash a dirty launch checkout
// (user decision, 2026-08-14). That is a destructive operation, so the
// decision lives here as a pure, tested function rather than as agent prose.

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"

import { CANARY_COMMAND, GRAPH_CANARY_COMMAND } from "./lib/boundary-rules.mjs"
import { pathToFileURL } from "node:url"

export const DEFAULT_THRESHOLDS = { maxFiles: 10, maxLines: 200 }

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

// Two graph runs launched against one checkout both commit to it, both rewrite
// `GRAPH-RUN.md`, and both publish before `build`. That is the same
// shared-working-directory hazard that produced the 2026-08-17 leak, except
// with no isolation between them at all. One run at a time.
//
// The path sits under `.worktrees/`, which `.gitignore` already covers, so the
// lock is never committed and never travels with a branch.
export const LOCK_PATH = ".worktrees/.graph-run.lock"

// The owner's kill switch. Its presence means a run was asked to halt, so a new
// run must not start on top of it — otherwise throwing the switch stops one run
// and the next invocation quietly starts another.
//
// It sits under `.worktrees/` alongside the lock, which `.gitignore` already
// covers, so it never travels with a branch.
export const STOP_PATH = ".worktrees/.graph-stop"

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

export const SECRET_PATTERNS = [/(^|\/)\.secrets\//, /(^|\/)\.env($|\.)/, /\.pem$/, /\.key$/, /(^|\/)id_rsa($|\.)/]

// An entry's rename sources are normalized to a list: one destination path can
// collect more than one source when a staged and an unstaged rename collapse
// onto it. A bare string is still accepted so hand-built entries keep working.
function renameSources(entry) {
  if (entry.renamedFrom === undefined || entry.renamedFrom === null) return []
  return Array.isArray(entry.renamedFrom) ? entry.renamedFrom : [entry.renamedFrom]
}

export function classifyWorkingTree(entries, thresholds) {
  // A default parameter only fires for `undefined`, so an explicit `null` used
  // to reach the comparisons as a TypeError. Spreading also backfills a partial
  // object: a missing bound would otherwise compare against `undefined`, which
  // is false for every `>` — a threshold that silently fails open.
  const limits = { ...DEFAULT_THRESHOLDS, ...(thresholds ?? {}) }

  const files = entries.map((entry) => entry.path)
  const fileCount = entries.length
  const changedLines = entries.reduce((total, entry) => total + entry.changedLines, 0)

  const base = { files, fileCount, changedLines }

  if (fileCount === 0) {
    return { ...base, action: "clean", reason: "working tree is clean" }
  }

  // A renamed entry's `path` is only the destination. Check every source too —
  // a file moving *out of* a secret-bearing location is equally sensitive.
  const secretCandidates = entries.flatMap((entry) => [entry.path, ...renameSources(entry)])
  const secret = secretCandidates.find((path) => SECRET_PATTERNS.some((pattern) => pattern.test(path)))
  if (secret) {
    return {
      ...base,
      action: "blocked",
      reason: `refusing to auto-resolve a working tree containing a secret-bearing path: ${secret}`
    }
  }

  if (fileCount > limits.maxFiles) {
    return {
      ...base,
      action: "stash",
      reason: `file count ${fileCount} exceeds ${limits.maxFiles}`
    }
  }

  if (changedLines > limits.maxLines) {
    return {
      ...base,
      action: "stash",
      reason: `changed lines ${changedLines} exceeds ${limits.maxLines}`
    }
  }

  return {
    ...base,
    action: "commit",
    reason: `${fileCount} file(s), ${changedLines} changed line(s) is within auto-commit thresholds`
  }
}

const AUTO_COMMIT_MESSAGE = "chore(graph): auto-commit working tree before graph run"

// `git diff --numstat` compacts a rename into one line instead of reporting
// the source and destination paths plainly. It can appear as:
//   {old => new}/suffix        (empty common prefix)
//   prefix/{old => new}        (empty common suffix)
//   prefix/{old => new}/suffix (both a common prefix and suffix)
//   old => new                 (no common prefix or suffix at all)
// Expand any of these back into real paths so downstream consumers (the
// secret check in particular) never see the compact/braced form.
//
// The two inner captures exclude braces so a *literal* `{` or `}` elsewhere in
// the path cannot be swallowed. With greedy `(.*)` captures,
// `{config => .secrets}/{legacy}/creds.env` parsed as new path
// `.secrets}/{legacy/creds.env`, which the `.secrets/` secret pattern no longer
// matches — a mis-parse that silently weakens the secret gate.
function normalizeRenamePath(rawPath) {
  const braceMatch = rawPath.match(/^(.*)\{([^{}]*) => ([^{}]*)\}(.*)$/)
  if (braceMatch) {
    const [, prefix, oldPart, newPart, suffix] = braceMatch
    return {
      oldPath: `${prefix}${oldPart}${suffix}`,
      newPath: `${prefix}${newPart}${suffix}`
    }
  }
  const bareMatch = rawPath.match(/^(.*) => (.*)$/)
  if (bareMatch) {
    const [, oldPath, newPath] = bareMatch
    return { oldPath, newPath }
  }
  return null
}

// A file with both staged and unstaged hunks appears once in each numstat
// call. Merge those back into a single entry per physical path so fileCount
// — which directly feeds the maxFiles threshold — isn't inflated.
//
// Two entries collapsing onto one destination can carry two *different* source
// paths (a staged rename and an unstaged one). Keeping only the first would
// hide the second from the secret check, so every source is preserved.
function mergeByPath(entries) {
  const merged = new Map()
  for (const entry of entries) {
    const existing = merged.get(entry.path)
    if (existing) {
      existing.changedLines += entry.changedLines
      for (const source of renameSources(entry)) {
        if (!existing.sources.includes(source)) existing.sources.push(source)
      }
    } else {
      merged.set(entry.path, {
        path: entry.path,
        changedLines: entry.changedLines,
        sources: renameSources(entry)
      })
    }
  }
  return [...merged.values()].map(({ path, changedLines, sources }) =>
    sources.length > 0 ? { path, changedLines, renamedFrom: sources } : { path, changedLines }
  )
}

export function collectEntries(runGit) {
  const entries = []

  for (const args of [
    ["diff", "--numstat"],
    ["diff", "--numstat", "--cached"]
  ]) {
    const output = runGit(args)
    for (const line of output.split("\n")) {
      if (!line.trim()) continue
      const [insertions, deletions, rawPath] = line.split("\t")
      if (!rawPath) continue
      // Binary files report "-" for both counts.
      const added = insertions === "-" ? 0 : Number(insertions)
      const removed = deletions === "-" ? 0 : Number(deletions)
      const changedLines = added + removed
      const rename = normalizeRenamePath(rawPath)
      if (rename) {
        entries.push({
          path: rename.newPath,
          changedLines,
          renamedFrom: rename.oldPath
        })
      } else {
        entries.push({ path: rawPath, changedLines })
      }
    }
  }

  const untracked = runGit(["ls-files", "--others", "--exclude-standard"])
  for (const line of untracked.split("\n")) {
    if (!line.trim()) continue
    entries.push({ path: line.trim(), changedLines: 0 })
  }

  return mergeByPath(entries)
}

export const FETCH_COMMAND = "git fetch origin"

export function planActions(classification, { branch, runId, base }) {
  if (classification.action === "blocked") return []

  // Fetch first, always. A branch-name collision then surfaces before any
  // local mutation instead of as a push rejection after the working tree has
  // already been stashed or committed.
  const commands = [FETCH_COMMAND]

  // The two resolutions are mirror images and their order is load-bearing.
  // A stash must be taken *before* the branch exists, so the stash entry
  // belongs to the checkout the work was done in. An auto-commit must land
  // *after* the branch exists, or it lands on whatever branch HEAD was on —
  // which may be `main`, leaving a silent unpushed commit there.
  // `git switch -c` keeps uncommitted changes in the working tree *when the
  // switch succeeds*, so committing afterwards commits the same tree. That
  // holds when the start point's tree matches HEAD for the dirty paths — the
  // default, since the start point is usually the current branch. With an
  // explicit `--base` that diverges on a dirty path, git refuses the switch
  // rather than overwriting it; the command fails, `formatFailureReport` names
  // it, and the auto-commit never runs. Refusal is the safe outcome, not a
  // guarantee that the changes always travel.
  if (classification.action === "stash") {
    commands.push(`git stash push -u -m ${JSON.stringify(`graph-preflight/${runId}`)}`)
  }

  commands.push(base ? `git switch -c ${branch} ${base}` : `git switch -c ${branch}`)

  if (classification.action === "commit") {
    commands.push("git add -A")
    commands.push(`git commit -m ${JSON.stringify(AUTO_COMMIT_MESSAGE)}`)
  }

  commands.push(`git push -u origin ${branch}`)

  return commands
}

// Two graph runs on the same day must not share a run id: the stash message
// `graph-preflight/<run-id>` is the documented way a user finds their own
// uncommitted work again.
export function defaultRunId(now = new Date()) {
  const iso = now.toISOString()
  return `graph-${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 19).replace(/:/g, "")}`
}

// `Number("abc")` is `NaN`, and every `>` comparison against `NaN` is false —
// a malformed threshold flag would silently disable both safety thresholds and
// classify any tree of any size as `commit`. Fail loudly instead.
export function parseThresholdValue(raw, flagName) {
  if (raw === null || raw === undefined) return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`graph-preflight: ${flagName} must be a positive integer, got ${JSON.stringify(raw)}`)
  }
  return value
}

// `branch`, `base`, and `runId` are interpolated into the command strings
// `planActions` builds, and `parseCommandArgs` re-tokenizes those strings on
// whitespace before they reach real, destructive git commands. A value carrying
// whitespace, a quote, or a shell metacharacter mis-tokenizes into extra
// arguments, so every one is validated here at parse time. The allowlist is
// deliberately narrower than `git check-ref-format`: it accepts the branch
// names, remote-qualified refs, run ids, and shas this script actually
// produces, and nothing that could split a command. A leading `-` is rejected
// too, so `--base --dry-run` is an error rather than a base named `--dry-run`.
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
// its start point is explicit and reported rather than "whatever HEAD was".
export function resolveBase(runGit, explicitBase) {
  if (explicitBase) return explicitBase
  const current = runGit(["rev-parse", "--abbrev-ref", "HEAD"]).trim()
  if (current && current !== "HEAD") return current
  return runGit(["rev-parse", "HEAD"]).trim()
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

export function formatFailureReport({ failedCommand, executed, remaining, stashed, runId }) {
  const lines = [`graph-preflight: FAILED at: ${failedCommand}`]
  lines.push("commands that ran:")
  lines.push(...(executed.length ? executed.map((c) => `  ${c}`) : ["  (none)"]))
  lines.push("commands that did NOT run:")
  lines.push(...(remaining.length ? remaining.map((c) => `  ${c}`) : ["  (none)"]))
  if (stashed) {
    lines.push(
      "your uncommitted work was stashed and has NOT been restored. Recover it with:",
      `  git stash list | grep graph-preflight/${runId}`,
      "  git stash apply <ref>"
    )
  }
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
  // must never fall back silently to the current branch while the run reports
  // "(resolved from the current HEAD)".
  const runIdArg = parseRefValue(get("--run-id"), "--run-id")
  return {
    branch: parseRefValue(get("--branch"), "--branch"),
    base: parseRefValue(get("--base"), "--base"),
    runId: runIdArg ?? defaultRunId(),
    dryRun: argv.includes("--dry-run"),
    // A resume re-enters at the node its ledger records and never re-runs the
    // branch/stash work, so it needs a way to take the lock and nothing else.
    // Without one, nothing arms the graph tier for the rest of a resumed run.
    takeLockOnly: argv.includes("--take-lock"),
    slug: parseRefValue(get("--slug"), "--slug"),
    // The lock names a process a later run tests for liveness, and this script
    // is not it: node exits the moment it returns, so a lock carrying
    // `process.pid` reads `stale` to the very next run. The driver's session
    // outlives the run, so the driver passes its own pid. `process.ppid` is the
    // fallback and is barely better — the invoking shell is short-lived too —
    // which is why this is a flag rather than a guess.
    pid: parsePidValue(get("--pid")),
    thresholds: {
      maxFiles: parseThresholdValue(get("--max-files"), "--max-files") ?? DEFAULT_THRESHOLDS.maxFiles,
      maxLines: parseThresholdValue(get("--max-lines"), "--max-lines") ?? DEFAULT_THRESHOLDS.maxLines
    }
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

  const who =
    `slug ${holder.slug ?? "<unknown>"}, run id ${holder.runId ?? "<unknown>"}, ` +
    `pid ${holder.pid}`

  if (isAlive(holder.pid)) {
    return {
      state: "held",
      holder,
      message:
        `graph run lock at ${LOCK_PATH} is held by ${who}` +
        `${holder.startedAt ? `, started ${holder.startedAt}` : ""}. ` +
        `Refusing: two runs cannot share one launch checkout. Wait for that run ` +
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

// Every autonomous base branch is `thejudge-auto/<slug>`, so a PR from a head
// under this prefix into `main` is a package's base→main hop — the merge nothing
// in the run performs and nothing reminded the owner to open (until run one now
// opens it). The guard below reasons about exactly those PRs.
export const GRAPH_BRANCH_PREFIX = "thejudge-auto/"

// The read-only query whose parsed output feeds the guard. Read-only: `gh pr
// list` never mutates, so it is safe on the fresh-run path and in a dry run.
export const OPEN_BASE_TO_MAIN_PRS_COMMAND = [
  "pr",
  "list",
  "--base",
  "main",
  "--state",
  "open",
  "--json",
  "headRefName,url"
]

/**
 * Whether a *fresh* run must refuse to start because a prior package's base→main
 * PR is still open.
 *
 * Pure over the parsed PR list, so the whole decision — including the
 * fail-closed branch — is tested without a `gh` process. A run that branches off
 * a `main` a prior package has not reached parks at the wrong base; that is what
 * happened to `user-feedback-spec` (PR #107), which is the failure this prevents.
 *
 * Fail closed: if the list could not be obtained or parsed (`openPRs` is not an
 * array), refuse rather than assume the queue is clear. The guard's entire job
 * is safety, so an unverifiable state is a block, not a pass.
 *
 * The resume path (`--take-lock`) never calls this: run two's own base→main PR
 * is legitimately open, and it shares this run's `newBranch`, so it is excluded
 * here too.
 */
export function classifyPendingBaseToMain({ openPRs, newBranch }) {
  if (!Array.isArray(openPRs)) {
    return {
      block: true,
      reason:
        `graph-preflight: could not verify open base→main PRs (gh unavailable or ` +
        `returned unparseable output). Refusing the fresh run — restore gh access, ` +
        `or merge any pending base→main PR, then retry.`
    }
  }

  const pending = openPRs.filter(
    (pr) =>
      pr &&
      typeof pr.headRefName === "string" &&
      pr.headRefName.startsWith(GRAPH_BRANCH_PREFIX) &&
      pr.headRefName !== newBranch
  )

  if (pending.length === 0) {
    return { block: false, reason: null }
  }

  const list = pending.map((pr) => `  ${pr.headRefName} → main (${pr.url ?? "<no url>"})`).join("\n")
  return {
    block: true,
    reason:
      `graph-preflight: refusing to start a fresh run while a prior package's ` +
      `base→main PR is still open:\n${list}\n` +
      `Merge it into main first, then retry. A fresh run branched off a main that ` +
      `lacks the prior package parks at the wrong base (this happened to ` +
      `user-feedback-spec, PR #107).`
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
 * Whether the hook was still firing during the node that just finished.
 *
 * Read-only over the counter file, whose sole writer is the hook. That is what
 * makes the heartbeat evidence: the driver cannot manufacture its own proof.
 *
 * A node that made tool calls while the counter stood still means the hook
 * stopped firing mid-run, which the canary at run start cannot catch.
 */
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

export function classifyHeartbeat({
  node,
  before,
  after,
  runStatePresent = true,
  toolCallsMade = true
}) {
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
 * still reported success, so the hook's entire graph tier — tool-call caps,
 * protected-path blocking, criteria evidence, stop-sentinel protection — stayed
 * inert for the whole run while the canary still reported green.
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
    // `held`, `stale`, and `unreadable` all refuse. A stale lock is reported
    // with its reclaim command, never silently stolen.
    return { taken: false, state: decision.state, message: decision.message }
  }

  const record = lockRecord({ slug, runId, pid, now })
  ensure(".worktrees", { recursive: true })
  write(LOCK_PATH, record, "utf8")
  return { taken: true, state: "taken", record }
}

/**
 * The worktree a parallel spec-forming idea runs in, under the already-ignored
 * `.worktrees/` root.
 */
export function kickoffWorktreePath(slug) {
  return `.worktrees/kickoff-${slug}`
}

/**
 * The command that creates a per-idea worktree off a shared base, so each idea's
 * `graph-kickoff` session roots in its own checkout.
 *
 * Concurrency is structural, not re-keyed: `takeLock` writes `LOCK_PATH`
 * relative to the process's working directory, and the boundary hook resolves its
 * control files relative to `$CLAUDE_PROJECT_DIR`. When a session launches inside
 * this worktree, both resolve to the worktree's own `.worktrees/`, so two ideas in
 * two worktrees each hold their own lock and never collide — with no change to the
 * lock record, `classifyLock`, or the hook. Fanning several ideas out inside one
 * root is the only shape that would force a hook run-identity rework, and it is
 * deliberately not the model.
 */
export function kickoffWorktreeCommand(slug, base = "origin/main") {
  return `git worktree add ${kickoffWorktreePath(slug)} -b ${GRAPH_BRANCH_PREFIX}${slug} ${base}`
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

  if (options.takeLockOnly && !options.slug) {
    console.error("graph-preflight: --take-lock requires --slug <slug> so the lock names its package")
    return process.exit(2)
  }

  // Before the dry run and before any mutation: a halted run must not be
  // restarted by the next invocation.
  const stop = classifyStopSentinel({ present: existsSync(STOP_PATH) })
  if (stop.state === "refused") {
    console.error(stop.message)
    return process.exit(2)
  }

  // base→main guard: a fresh run refuses to start while a prior package's
  // base→main PR is still open, so the queue never branches off a stale `main`.
  // Fresh runs only — a resume (`--take-lock`) has its own base→main PR open by
  // design. The `gh pr list` query is read-only, so this runs in a dry run too:
  // surfacing the block early is the point. A gh failure fails closed.
  if (!options.takeLockOnly) {
    const runGh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
    let openPRs
    try {
      openPRs = JSON.parse(runGh(OPEN_BASE_TO_MAIN_PRS_COMMAND))
    } catch {
      openPRs = null // unavailable or unparseable → classifyPendingBaseToMain blocks
    }
    const guard = classifyPendingBaseToMain({ openPRs, newBranch: options.branch })
    if (guard.block) {
      console.error(guard.reason)
      return process.exit(2)
    }
  }

  // The lock comes before any mutation, and before the branch work, so a second
  // run refuses rather than sharing the launch checkout. `--take-lock` stops
  // here: a resume needs the tier armed and nothing else done.
  if (!options.dryRun) {
    const lockPid = options.pid ?? process.ppid
    const lock = takeLock({ slug: options.slug ?? options.branch, runId: options.runId, pid: lockPid })
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

  const base = resolveBase(runGit, options.base)
  const entries = collectEntries(runGit)
  const classification = classifyWorkingTree(entries, options.thresholds)
  const commands = planActions(classification, { ...options, base })

  const sentinel = readProfileSentinel()
  console.log(`profile sentinel: ${sentinel.present ? "present" : "absent"}`)
  console.log(sentinel.ledgerLine)
  // The canary is a *tool call*, which a script cannot make — only the agent
  // running through the harness can. So the script names it and the skill
  // issues it, then classifies the result with `classifyCanary()`.
  console.log(`canary command: ${CANARY_COMMAND}`)
  console.log("canary: pending — issue it as a Bash tool call and require a deny")
  console.log(`action: ${classification.action}`)
  console.log(`reason: ${classification.reason}`)
  console.log(`files: ${classification.fileCount}`)
  console.log(`changed lines: ${classification.changedLines}`)
  console.log(`run id: ${options.runId}`)
  console.log(`base: ${base}${options.base ? "" : " (resolved from the current HEAD)"}`)
  console.log("planned commands:")
  for (const command of commands) console.log(`  ${command}`)

  if (classification.action === "blocked") {
    console.error("graph-preflight: blocked — resolve the listed paths manually before a graph run")
    return process.exit(1)
  }

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
      console.error(
        formatFailureReport({
          failedCommand: command,
          executed,
          remaining,
          stashed: executed.some((c) => c.includes("git stash push")),
          runId: options.runId
        })
      )
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
            remaining,
            stashed: false,
            runId: options.runId
          })
        )
        return process.exit(2)
      }
    }
  }

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
