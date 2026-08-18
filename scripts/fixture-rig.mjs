// Rep setup and leak detection for skill fixtures.
//
// Rep isolation used to be a bullet point telling each rep to work in its
// clone. On 2026-08-17 a rep's *dispatched subagent* inherited the session's
// real working directory instead and ran the refinement phase against the live
// checkout, writing DEC-161, DEC-162, REQ-146..151, NFR-015, FLOW-019 and a new
// `decisions/card-collection.md` into product truth. Constraining a parent does
// not constrain its children, and prose cannot reach a child at all.
//
// (Phase skills are named by role here, never by filename. A protected-path
// literal in this file would trip the drift guard, and the right fix is to not
// name one rather than to add an exemption.)
//
// So the rig owns setup, and — the line that actually matters — it snapshots
// the invoking repository before and after, failing the run on any difference.
// That detects a leak mechanically instead of waiting for someone to notice.
//
// It writes only to temp directories and per-rep clones. Never a protected
// path, so `scripts/protected-write-guard.test.mjs` passes it with no
// exemption. Keep it that way.

import { execFileSync } from "node:child_process"
import { lstatSync, mkdirSync, existsSync } from "node:fs"
import path from "node:path"

/**
 * Where one rep lives.
 *
 * Each rep gets its **own** clone and its **own** bare origin. A shared origin
 * is not an implementation detail here: the scenario pushes
 * `feature/collection-manager`, so two reps sharing one remote collide on the
 * second push and the run measures the collision rather than the skill.
 */
export function repLayout(root, index) {
  const rep = path.join(root, `rep-${index}`)
  return {
    index,
    root: rep,
    origin: path.join(rep, "origin.git"),
    clone: path.join(rep, "clone"),
    nodeModules: path.join(rep, "clone", "node_modules")
  }
}

export function repLayouts(root, count) {
  return Array.from({ length: count }, (_, offset) => repLayout(root, offset + 1))
}

/** Distinct clone and origin per rep, asserted rather than assumed. */
export function layoutsAreIsolated(layouts) {
  const clones = new Set(layouts.map((layout) => layout.clone))
  const origins = new Set(layouts.map((layout) => layout.origin))
  return clones.size === layouts.length && origins.size === layouts.length
}

/**
 * The dispatch prompt for one rep.
 *
 * The clone path is absolute and baked in, and the prompt carries the same
 * `Working directory:` line `graph-run` pins in production — including the
 * instruction to propagate it. A prompt that only tells the rep to "work in
 * your clone" is the wording that failed.
 */
export function dispatchPrompt(layout, body) {
  if (!path.isAbsolute(layout.clone)) {
    throw new Error(`rep ${layout.index} clone path must be absolute: ${layout.clone}`)
  }
  return [
    `Working directory: ${layout.clone}`,
    "Copy the line above, unchanged, into every prompt you write. Never act on",
    "any path outside it.",
    "",
    body
  ].join("\n")
}

const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })

/**
 * `HEAD` plus the porcelain status of the repository that invoked the rig.
 *
 * `-uall` matters: plain `--porcelain` collapses a new untracked directory to
 * `PRD/sections/decisions/`, so a leak would be reported as a folder rather
 * than as the files a reviewer has to go revert.
 */
export function snapshotRepo(repoPath, run = git) {
  return {
    head: run(["rev-parse", "HEAD"], repoPath).trim(),
    status: run(["status", "--porcelain", "-uall"], repoPath).trim()
  }
}

/**
 * Did the invoking repository change while the reps ran?
 *
 * A real run is *supposed* to change the repository it works in — that is why
 * this check belongs to the fixture rig and not to production. Here, any
 * difference is a leak.
 */
export function compareSnapshots(before, after) {
  const changedPaths = (text) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(2).trim())

  const beforePaths = new Set(changedPaths(before.status))
  const leaked = changedPaths(after.status).filter((entry) => !beforePaths.has(entry))
  const movedHead = before.head !== after.head

  if (!movedHead && leaked.length === 0) {
    return { ok: true, leaked: [], movedHead: false, message: "invoking repository unchanged" }
  }

  const parts = []
  if (movedHead) parts.push(`HEAD moved ${before.head} -> ${after.head}`)
  if (leaked.length > 0) parts.push(`paths changed: ${leaked.join(", ")}`)
  return {
    ok: false,
    leaked,
    movedHead,
    message:
      `fixture rig: the invoking repository changed during the run — ${parts.join("; ")}. ` +
      "A rep wrote outside its clone. Revert these paths before recording any result."
  }
}

/** Build one rep: its own bare origin, its own clone, a real `node_modules`. */
export function createRep(layout, { seedRepo, run = git } = {}) {
  mkdirSync(layout.root, { recursive: true })
  run(["init", "--bare", "-q", layout.origin])
  if (seedRepo) {
    run(["clone", "-q", seedRepo, layout.clone])
    run(["remote", "set-url", "origin", layout.origin], layout.clone)
  } else {
    run(["init", "-q", layout.clone])
    run(["remote", "add", "origin", layout.origin], layout.clone)
  }
  // A symlink here is swept up by `git stash push -u`: `.gitignore`'s
  // `node_modules/` has a trailing slash, so it matches a directory but not a
  // symlink of the same name. That broke the toolchain and blocked every run at
  // the `build` node. A real directory, always.
  mkdirSync(layout.nodeModules, { recursive: true })
  return layout
}

export function repUsesOwnOrigin(layout, run = git) {
  const url = run(["remote", "get-url", "origin"], layout.clone).trim()
  return url === layout.origin
}

/** `node_modules` must be a real directory. Never a symlink. */
export function nodeModulesIsRealDirectory(layout) {
  if (!existsSync(layout.nodeModules)) return false
  const stat = lstatSync(layout.nodeModules)
  return stat.isDirectory() && !stat.isSymbolicLink()
}
