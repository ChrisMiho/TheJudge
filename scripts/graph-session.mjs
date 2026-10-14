// Opens a fresh Claude session in its own worktree (REQ-170).
//
// Two graph runs cannot share one checkout: the boundary hook resolves the lock
// and every control file from the session's launch root, and that root is fixed
// when the session starts. So a second idea at the same moment needs a second
// session rooted somewhere else. This command does exactly that and nothing
// more: it cuts `.worktrees/session-<name>` from `origin/main` with a detached
// HEAD, then starts `claude` there under the graph profile. What the session
// does next — `/graph-kickoff` or anything else — is the owner's call.
//
// `--detach` is deliberate: preflight works in place inside a linked worktree
// and creates the run's own `thejudge-auto/<slug>` branch, so a branch made
// here would only collide with it.
//
// Shape matches the other graph scripts: the decisions are pure, tested
// functions; every git, filesystem, and process call lives in `main()`.

import { execFileSync, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const SESSION_PREFIX = "session-"
export const PROFILE_PATH = ".claude/graph-profile.json"
export const BASE_REF = "origin/main"

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/

/** `YYYYMMDD-HHMM` in local time — the name used when none is given. */
export function defaultSessionName(now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0")
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}`
  )
}

/**
 * The session's name, or an error. Lowercase letters, digits, and hyphens only,
 * so the folder name is safe to type and never escapes `.worktrees/`. A leading
 * `session-` is dropped rather than doubled.
 */
export function resolveSessionName(arg, now = new Date()) {
  if (arg === undefined || arg === null || String(arg).trim() === "") {
    return { name: defaultSessionName(now), error: null }
  }
  let name = String(arg).trim()
  if (name.startsWith(SESSION_PREFIX)) name = name.slice(SESSION_PREFIX.length)
  if (!NAME_PATTERN.test(name)) {
    return {
      name: null,
      error:
        `graph-session: "${arg}" is not a usable name. Use lowercase letters, ` +
        `digits, and hyphens, e.g. npm run graph:session -- card-search`
    }
  }
  return { name, error: null }
}

/** `.worktrees/session-<name>`, relative to the main checkout. */
export function sessionWorktreePath(name) {
  return path.join(".worktrees", `${SESSION_PREFIX}${name}`)
}

/**
 * The main checkout, from `git rev-parse --git-common-dir` run anywhere in the
 * repo. Sessions always land under the main checkout's `.worktrees/`, even when
 * this command is run from inside another worktree.
 */
export function mainCheckoutRoot(gitCommonDir, cwd = process.cwd()) {
  return path.dirname(path.resolve(cwd, String(gitCommonDir).trim()))
}

/** The `git worktree add` arguments for a session. */
export function worktreeAddArgs(worktreePath) {
  return ["worktree", "add", "--detach", worktreePath, BASE_REF]
}

/** The `claude` arguments for a session. */
export function claudeArgs() {
  return ["--settings", PROFILE_PATH]
}

function main(argv) {
  const positional = argv.filter((value) => !value.startsWith("-"))
  if (positional.length > 1 || argv.some((value) => value.startsWith("-"))) {
    console.error("usage: npm run graph:session -- [name]")
    return process.exit(2)
  }

  const { name, error } = resolveSessionName(positional[0])
  if (error) {
    console.error(error)
    return process.exit(2)
  }

  const runGit = (args, options = {}) => execFileSync("git", args, { encoding: "utf8", ...options })
  const root = mainCheckoutRoot(runGit(["rev-parse", "--git-common-dir"]))
  const relative = sessionWorktreePath(name)
  const worktree = path.join(root, relative)

  if (existsSync(worktree)) {
    console.error(
      `graph-session: ${relative} already exists. Pick another name, or remove it ` +
        `first with: git worktree remove ${relative}`
    )
    return process.exit(2)
  }

  runGit(["fetch", "origin", "main"], { cwd: root, stdio: "inherit" })
  runGit(worktreeAddArgs(relative), { cwd: root, stdio: "inherit" })

  console.log(`\ngraph-session: starting Claude in ${relative} (graph profile)`)
  const result = spawnSync("claude", claudeArgs(), { cwd: worktree, stdio: "inherit" })
  if (result.error) {
    console.error(`graph-session: could not start claude: ${result.error.message}`)
  }

  console.log(`\ngraph-session: the worktree stays. When you are done with it: git worktree remove ${relative}`)
  return process.exit(result.status ?? 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
