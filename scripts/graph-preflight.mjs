// Deterministic working-tree resolution for autonomous graph runs.
//
// The graph workflow may auto-commit or auto-stash a dirty launch checkout
// (user decision, 2026-08-14). That is a destructive operation, so the
// decision lives here as a pure, tested function rather than as agent prose.

import { execFileSync } from "node:child_process"
import { pathToFileURL } from "node:url"

export const DEFAULT_THRESHOLDS = { maxFiles: 10, maxLines: 200 }

export const SECRET_PATTERNS = [/(^|\/)\.secrets\//, /(^|\/)\.env($|\.)/, /\.pem$/, /\.key$/, /(^|\/)id_rsa($|\.)/]

export function classifyWorkingTree(entries, thresholds = DEFAULT_THRESHOLDS) {
  const files = entries.map((entry) => entry.path)
  const fileCount = entries.length
  const changedLines = entries.reduce((total, entry) => total + entry.changedLines, 0)

  const base = { files, fileCount, changedLines }

  if (fileCount === 0) {
    return { ...base, action: "clean", reason: "working tree is clean" }
  }

  // A renamed entry's `path` is only the destination. Check the source too —
  // a file moving *out of* a secret-bearing location is equally sensitive.
  const secretCandidates = entries.flatMap((entry) =>
    entry.renamedFrom ? [entry.path, entry.renamedFrom] : [entry.path]
  )
  const secret = secretCandidates.find((path) => SECRET_PATTERNS.some((pattern) => pattern.test(path)))
  if (secret) {
    return {
      ...base,
      action: "blocked",
      reason: `refusing to auto-resolve a working tree containing a secret-bearing path: ${secret}`
    }
  }

  if (fileCount > thresholds.maxFiles) {
    return {
      ...base,
      action: "stash",
      reason: `file count ${fileCount} exceeds ${thresholds.maxFiles}`
    }
  }

  if (changedLines > thresholds.maxLines) {
    return {
      ...base,
      action: "stash",
      reason: `changed lines ${changedLines} exceeds ${thresholds.maxLines}`
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
function normalizeRenamePath(rawPath) {
  const braceMatch = rawPath.match(/^(.*)\{(.*) => (.*)\}(.*)$/)
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
function mergeByPath(entries) {
  const merged = new Map()
  for (const entry of entries) {
    const existing = merged.get(entry.path)
    if (existing) {
      existing.changedLines += entry.changedLines
      if (existing.renamedFrom === undefined && entry.renamedFrom !== undefined) {
        existing.renamedFrom = entry.renamedFrom
      }
    } else {
      merged.set(entry.path, { ...entry })
    }
  }
  return [...merged.values()]
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
  // `git switch -c` carries uncommitted changes into the new branch, so
  // committing after the switch commits the same tree.
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

function parseArgs(argv) {
  const get = (name) => {
    const index = argv.indexOf(name)
    if (index === -1) return null
    // A flag given as the final token has no value; return "" so validation
    // rejects it rather than silently falling back to the default.
    return argv[index + 1] === undefined ? "" : argv[index + 1]
  }
  const runIdArg = get("--run-id")
  return {
    branch: get("--branch"),
    base: get("--base"),
    runId: runIdArg && runIdArg.trim() ? runIdArg : defaultRunId(),
    dryRun: argv.includes("--dry-run"),
    thresholds: {
      maxFiles: parseThresholdValue(get("--max-files"), "--max-files") ?? DEFAULT_THRESHOLDS.maxFiles,
      maxLines: parseThresholdValue(get("--max-lines"), "--max-lines") ?? DEFAULT_THRESHOLDS.maxLines
    }
  }
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

  const runGit = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })

  const base = resolveBase(runGit, options.base)
  const entries = collectEntries(runGit)
  const classification = classifyWorkingTree(entries, options.thresholds)
  const commands = planActions(classification, { ...options, base })

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
