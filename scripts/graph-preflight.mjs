// Deterministic working-tree resolution for autonomous graph runs.
//
// The graph workflow may auto-commit or auto-stash a dirty launch checkout
// (user decision, 2026-08-14). That is a destructive operation, so the
// decision lives here as a pure, tested function rather than as agent prose.

import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
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
        `graph-run lock at ${LOCK_PATH} is unreadable. Inspect it, confirm no ` +
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
        `graph-run lock at ${LOCK_PATH} is held by ${who}` +
        `${holder.startedAt ? `, started ${holder.startedAt}` : ""}. ` +
        `Refusing: two runs cannot share one launch checkout. Wait for that run ` +
        `to reach a terminal state, which releases the lock.`
    }
  }

  return {
    state: "stale",
    holder,
    message:
      `graph-run lock at ${LOCK_PATH} names ${who}` +
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

/** The record a run writes when it takes the lock. */
export function lockRecord({ slug, runId, pid, now }) {
  return JSON.stringify({ slug, runId, pid, startedAt: now }, null, 2) + "\n"
}

function main(argv) {
  let options
  try {
    options = parseArgs(argv)
  } catch (error) {
    console.error(error.message)
    return process.exit(2)
  }

  if (!options.branch) {
    console.error("graph-preflight: --branch <name> is required")
    return process.exit(2)
  }

  // Before the dry run and before any mutation: a halted run must not be
  // restarted by the next invocation.
  const stop = classifyStopSentinel({ present: existsSync(STOP_PATH) })
  if (stop.state === "refused") {
    console.error(stop.message)
    return process.exit(2)
  }

  const runGit = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })

  const base = resolveBase(runGit, options.base)
  const entries = collectEntries(runGit)
  const classification = classifyWorkingTree(entries, options.thresholds)
  const commands = planActions(classification, { ...options, base })

  const sentinel = readProfileSentinel()
  console.log(`profile sentinel: ${sentinel.present ? "present" : "absent"}`)
  console.log(sentinel.ledgerLine)
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
