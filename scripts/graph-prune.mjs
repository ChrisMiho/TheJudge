// Housekeeping for finished graph runs (REQ-192).
//
// A run leaves three things on the owner's machine: its autonomous base branch
// (`GRAPH_BRANCH_PREFIX`), a worktree under `.worktrees/`, and an intake
// staging folder. Nothing cleans them up: a run never prunes its own leftovers
// because a failed run's branch is evidence. Pruning is the owner's deliberate
// act, so this command lists by default and deletes only with `--apply`.
//
// Shape matches `graph-preflight.mjs`: the decision is a pure, tested function
// over the observed branch list, worktree list, intake folders, and lock;
// every git and filesystem call lives in `main()`. Deletion uses git's safe
// verbs only (`branch -d`, `worktree remove` with no flag), never touches a
// remote ref, and never removes a `.worktrees/.graph-*` control file.

import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { GRAPH_BRANCH_PREFIX, LOCK_PATH, parseLockFile } from "./graph-preflight.mjs"

export const WORKTREES_ROOT = ".worktrees"

// The codehealth loop manages its own worktree; this command never reasons
// about it.
export const CODEHEALTH_WORKTREE = ".worktrees/.codehealth"

// One staging folder per run id, created by the intake step of a kickoff.
export const INTAKE_DIR = ".worktrees/.graph-intake"

export const WORK_DIR = "PRD/work"

// The ref "merged" is judged against. The fetch in `main()` keeps it fresh.
export const MERGE_TARGET = "origin/main"

// The run's control files. A prune removes intake folders from the same parent
// directory these live in, so the exclusion is hard-coded rather than inferred:
// none of these basenames, and nothing that starts with `.graph-`, is ever a
// removal target.
export const NEVER_REMOVE_BASENAMES = Object.freeze([
  ".graph-run.lock",
  ".graph-stop",
  ".graph-run-state.json",
  ".graph-node-calls.json",
  ".graph-evidence.jsonl",
  ".graph-denials.jsonl"
])
export const CONTROL_FILE_PREFIX = ".graph-"

export const KEEP_PACKAGE_ON_MAIN = "package still on main: the build half's base"
export const REPORT_OUTSIDE_ROOT = "outside the .worktrees root; not removed"

/**
 * The package a branch belongs to: the name after the prefix, minus a trailing
 * `-work` or `-cleanup` (the build half's and the cleanup step's branches share
 * the docs branch's package).
 */
export function packageSlug(branch) {
  const name = branch.startsWith(GRAPH_BRANCH_PREFIX) ? branch.slice(GRAPH_BRANCH_PREFIX.length) : branch
  return name.replace(/-(?:work|cleanup)$/, "")
}

function toPosix(value) {
  return String(value).split(path.sep).join("/")
}

function isUnder(relativePath, dir) {
  return relativePath === dir || relativePath.startsWith(`${dir}/`)
}

/**
 * A worktree path as seen from the main checkout's root. `root` is null in the
 * tests, where paths are already root-relative.
 */
function relativeToRoot(worktreePath, root) {
  if (!root) return toPosix(worktreePath)
  return toPosix(path.relative(root, worktreePath))
}

function classifyBranch({ name, merged }, packagesOnMain) {
  const item = { kind: "branch", name }
  if (!merged) return { ...item, action: "keep", reason: `not merged into ${MERGE_TARGET}` }
  if (packagesOnMain.has(packageSlug(name))) return { ...item, action: "keep", reason: KEEP_PACKAGE_ON_MAIN }
  return {
    ...item,
    action: "delete",
    reason: `merged into ${MERGE_TARGET}; package ${packageSlug(name)} is gone from main`
  }
}

function classifyWorktree({ path: worktreePath, branch, merged, clean }, root) {
  const item = { kind: "worktree", name: worktreePath }
  const relative = relativeToRoot(worktreePath, root)
  if (relative.startsWith("..") || path.isAbsolute(relative) || !isUnder(relative, WORKTREES_ROOT)) {
    return { ...item, action: "report", reason: REPORT_OUTSIDE_ROOT }
  }
  if (isUnder(relative, CODEHEALTH_WORKTREE)) {
    return { ...item, action: "keep", reason: "the codehealth loop manages its own worktree" }
  }
  if (!branch) return { ...item, action: "keep", reason: "detached HEAD; no branch to judge" }
  if (!merged) return { ...item, action: "keep", reason: `branch ${branch} not merged into ${MERGE_TARGET}` }
  if (!clean) return { ...item, action: "keep", reason: `branch ${branch} merged but the working tree is not clean` }
  return { ...item, action: "delete", reason: `branch ${branch} merged into ${MERGE_TARGET} and the tree is clean` }
}

function classifyIntakeDir(runId, lock) {
  const item = { kind: "intake", name: `${INTAKE_DIR}/${runId}` }
  if (lock && lock.runId === runId) return { ...item, action: "keep", reason: `run ${runId} holds the live lock` }
  return { ...item, action: "delete", reason: "no live lock names this run" }
}

/**
 * Every leftover with its verdict, as a pure function of what was observed.
 *
 * - `branches`: `[{ name, merged }]` for each local branch under the prefix,
 *   `merged` meaning its tip is an ancestor of `origin/main`.
 * - `worktrees`: `[{ path, branch, merged, clean }]` for each linked worktree;
 *   `branch` is null when detached.
 * - `intakeDirs`: run ids found under `.worktrees/.graph-intake/`.
 * - `lock`: the parsed live lock, or null.
 * - `packagesOnMain`: package folder names present under `PRD/work/` on
 *   `origin/main`.
 * - `root`: the main checkout's absolute path, so worktree paths can be judged
 *   against `.worktrees/`; omit when the paths are already root-relative.
 */
export function classifyLeftovers({
  branches = [],
  worktrees = [],
  intakeDirs = [],
  lock = null,
  packagesOnMain = [],
  root = null
} = {}) {
  const onMain = new Set(packagesOnMain)
  return [
    ...branches.map((branch) => classifyBranch(branch, onMain)),
    ...worktrees.map((worktree) => classifyWorktree(worktree, root)),
    ...intakeDirs.map((runId) => classifyIntakeDir(runId, lock))
  ]
}

/**
 * Where an intake folder for `runId` lives, or null when the name is one this
 * command must never remove. The guard is by construction: the result is
 * always a direct child of the intake directory, never a control file, never
 * anything under a `.graph-` name, never a path that climbs out.
 */
export function intakeRemovalPath(runId) {
  const base = path.basename(String(runId))
  if (base !== runId || base === "" || base === "." || base === "..") return null
  if (NEVER_REMOVE_BASENAMES.includes(base) || base.startsWith(CONTROL_FILE_PREFIX)) return null
  const target = path.resolve(INTAKE_DIR, base)
  if (path.dirname(target) !== path.resolve(INTAKE_DIR)) return null
  return path.join(INTAKE_DIR, base)
}

/** `git worktree list --porcelain`, parsed. The first entry is the main worktree. */
export function parseWorktreeList(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block !== "")
    .map((block) => {
      const lines = block.split("\n")
      const entry = { path: null, head: null, branch: null, bare: false, detached: false }
      for (const line of lines) {
        if (line.startsWith("worktree ")) entry.path = line.slice("worktree ".length)
        else if (line.startsWith("HEAD ")) entry.head = line.slice("HEAD ".length)
        else if (line.startsWith("branch ")) entry.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "")
        else if (line === "bare") entry.bare = true
        else if (line === "detached") entry.detached = true
      }
      return entry
    })
    .filter((entry) => entry.path !== null)
}

/** `git ls-tree origin/main PRD/work/` reduced to the package folder names. */
export function parsePackagesOnMain(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.match(/^\S+\s+tree\s+\S+\t(.+)$/))
    .filter(Boolean)
    .map((match) => path.posix.basename(match[1]))
}

/** The printed report: one line per item, then the summary. */
export function formatReport(items, { apply = false } = {}) {
  const count = (action) => items.filter((item) => item.action === action).length
  const itemLines = items.map((item) => `${item.action} ${item.kind} ${item.name} — ${item.reason}`)
  const summary =
    `graph-prune: ${count("delete")} to delete, ${count("keep")} kept, ${count("report")} reported` +
    (apply ? "" : " (dry run: nothing changed; pass --apply to delete)")
  return [...(itemLines.length ? itemLines : ["(no leftovers found)"]), summary].join("\n")
}

function gatherBranches(runGit, isMerged) {
  const names = runGit(["for-each-ref", "--format=%(refname:short)", `refs/heads/${GRAPH_BRANCH_PREFIX}`])
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
  return names.map((name) => ({ name, merged: isMerged(name) }))
}

function gatherWorktrees(runGit, isMerged) {
  const entries = parseWorktreeList(runGit(["worktree", "list", "--porcelain"]))
  const [main, ...linked] = entries
  const worktrees = linked
    .filter((entry) => !entry.bare)
    .map((entry) => {
      let clean = false
      try {
        clean = runGit(["-C", entry.path, "status", "--porcelain"]).trim() === ""
      } catch {
        // A worktree whose directory is gone or whose status cannot be read is
        // kept, never removed on a guess.
      }
      return {
        path: entry.path,
        branch: entry.detached ? null : entry.branch,
        merged: entry.head ? isMerged(entry.head) : false,
        clean
      }
    })
  return { root: main?.path ?? null, worktrees }
}

function gatherIntakeDirs() {
  try {
    return readdirSync(INTAKE_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

function gatherLock() {
  if (!existsSync(LOCK_PATH)) return null
  return parseLockFile(readFileSync(LOCK_PATH, "utf8"))
}

// Each failure is reported and skipped; the remaining deletions still run.
function applyDeletion(item, runGit) {
  try {
    if (item.kind === "branch") {
      runGit(["branch", "-d", item.name])
    } else if (item.kind === "worktree") {
      runGit(["worktree", "remove", item.name])
    } else {
      const target = intakeRemovalPath(path.basename(item.name))
      if (!target) throw new Error("refused: not a removable intake folder")
      rmSync(target, { recursive: true })
    }
    console.log(`deleted ${item.kind} ${item.name}`)
    return true
  } catch (error) {
    const detail = (error.stderr ?? error.message ?? String(error)).toString().trim()
    console.error(`failed ${item.kind} ${item.name} — ${detail}`)
    return false
  }
}

function applyDeletions(items, runGit) {
  return items.filter((item) => item.action === "delete").filter((item) => !applyDeletion(item, runGit))
}

function main(argv) {
  const apply = argv.includes("--apply")
  const runGit = (args) =>
    execFileSync("git", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })

  // "Merged" is judged against a fresh origin/main, so the fetch comes first
  // and a failed fetch stops the command rather than judging against a stale
  // ref.
  try {
    runGit(["fetch", "origin"])
  } catch (error) {
    console.error(`graph-prune: git fetch origin failed — ${(error.stderr ?? error.message).toString().trim()}`)
    return process.exit(1)
  }

  const isMerged = (ref) => {
    try {
      runGit(["merge-base", "--is-ancestor", ref, MERGE_TARGET])
      return true
    } catch (error) {
      // Exit 1 is git's "not an ancestor"; anything else is a real error.
      if (error.status === 1) return false
      throw error
    }
  }

  const { root, worktrees } = gatherWorktrees(runGit, isMerged)
  const items = classifyLeftovers({
    branches: gatherBranches(runGit, isMerged),
    worktrees,
    intakeDirs: gatherIntakeDirs(),
    lock: gatherLock(),
    packagesOnMain: parsePackagesOnMain(runGit(["ls-tree", MERGE_TARGET, `${WORK_DIR}/`])),
    root
  })

  console.log(formatReport(items, { apply }))
  if (!apply) return undefined

  const failures = applyDeletions(items, runGit)
  if (failures.length > 0) {
    console.error(`graph-prune: ${failures.length} deletion(s) failed; the rest were applied`)
    return process.exit(1)
  }
  console.log("graph-prune: complete")
  return undefined
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
