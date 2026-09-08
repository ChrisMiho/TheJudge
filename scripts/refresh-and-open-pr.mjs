// Weekly local refresh-and-PR wrapper (REQ-195).
//
// The owner runs this once a week (`npm run data:refresh-pr`). It runs the
// existing human-approved pipeline (`data:refresh` -> `data:build`,
// REQ-093/DEC-162 — running it locally by hand *is* the human approval), and
// when that changed at least one committed data artifact, cuts a branch off
// `origin/main`, commits the changed artifacts by explicit path, pushes, and
// opens a pull request to `main` for the owner to merge. When nothing
// changed it exits cleanly with no branch, no commit, and no PR.
//
// Every git/gh/pipeline effect is passed in as an injectable function, the
// same shape `scripts/graph-preflight.mjs` (`classifyInPlaceTree`,
// `planActions`) and `scripts/refresh-commander-spellbook-data.mjs` use, so
// the whole thing is unit-tested with no real git remote, GitHub, or
// network call. Nothing in this module invokes `npm run data:refresh`,
// `npm run data:build`, or any live git/gh operation except inside the
// default implementations wired by `main()`, which never runs on import.

import { execFileSync } from "node:child_process"
import { pathToFileURL } from "node:url"

// The explicit set of committed data artifacts `npm run data:build`'s seven
// steps write, as documented in `PRD/work/weekly-data-refresh-pr/GAMEPLAN.md`
// ("Explicit committed-artifact path list") — hard-coded here, never derived
// by globbing or by parsing the `data:build` npm script string, so a future
// build step cannot silently widen what this script stages.
export const COMMITTED_ARTIFACT_PATHS = [
  "apps/frontend/public/data/cardMetadata.json",
  "apps/backend/data/cardDetailByOracleId.json",
  "apps/backend/data/cardRulingsByOracleId.json",
  "apps/backend/data/gameRulesByTopic.json",
  "apps/backend/data/gameRulesRuleIndex.json",
  "apps/backend/data/gameRulesTokenStats.json",
  "apps/frontend/public/data/gameRulesCoreTopics.json",
  "apps/backend/data/gameRulesRuleEmbeddings.json",
  "apps/frontend/public/data/cardPrintingPrices.json",
  "apps/backend/data/commanderSpellbookCombos.json.gz",
  "apps/backend/data/commanderSpellbookComboIndex.json.gz"
]

export const REFRESH_BRANCH_PREFIX = "chore/data-refresh-"
export const DEFAULT_BASE = "origin/main"
export const DEFAULT_PR_BASE = "main"
export const PIPELINE_STEPS = ["data:refresh", "data:build"]

/** `YYYY-MM-DD` for the given date, in UTC — stable and sortable in branch/commit names. */
export function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

/** `chore/data-refresh-<YYYY-MM-DD>`, the branch this run cuts off `origin/main`. */
export function refreshBranchName(date = new Date()) {
  return `${REFRESH_BRANCH_PREFIX}${formatDateStamp(date)}`
}

/**
 * Whether the working tree is clean enough to run in.
 *
 * Pure over `git status --porcelain` output, same shape as
 * `classifyInPlaceTree` in `scripts/graph-preflight.mjs`: never invokes git
 * itself, so it is testable with a hand-written string. A dirty tree is
 * refused, never resolved on the caller's behalf.
 */
export function parseDirtyTree(porcelainOutput) {
  const paths = String(porcelainOutput ?? "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "")
  if (paths.length === 0) return { status: "proceed", paths: [] }
  return {
    status: "refuse",
    paths,
    reason:
      `refusing to run on a dirty working tree (${paths.length} path(s)): ` +
      paths.map((line) => line.slice(3)).join(", ") +
      ". Commit or discard the changes yourself, then retry."
  }
}

/**
 * The git commands this run cuts, as argv arrays (no leading `git`) — mirrors
 * `planActions()` in `scripts/graph-preflight.mjs`. Fetch always comes first,
 * and the branch's start point is `origin/main` by default: never invokes git
 * itself, so the plan is testable without a repository.
 */
export function planBranchActions(date = new Date(), base = DEFAULT_BASE) {
  const branch = refreshBranchName(date)
  return [
    ["fetch", "origin"],
    ["checkout", "-b", branch, base]
  ]
}

/**
 * Runs the existing human-approved pipeline, `data:refresh` then
 * `data:build`, through an injectable runner — never reimplements either
 * step. The second step never runs once the first throws: the loop rethrows
 * immediately rather than continuing.
 */
export function runPipeline(runPipelineImpl) {
  for (const step of PIPELINE_STEPS) {
    try {
      runPipelineImpl(step)
    } catch (error) {
      const wrapped = new Error(`pipeline step "${step}" failed: ${error.message}`)
      wrapped.cause = error
      wrapped.step = step
      throw wrapped
    }
  }
}

/** The explicit `git add` path list — a copy of the hard-coded constant, never globbed. */
export function buildAddPathList() {
  return [...COMMITTED_ARTIFACT_PATHS]
}

/** `chore: refresh data artifacts (<YYYY-MM-DD>)`. */
export function buildCommitMessage(date = new Date()) {
  return `chore: refresh data artifacts (${formatDateStamp(date)})`
}

/**
 * Stages exactly the explicit artifact paths and commits them with a dated
 * message, through an injectable git-command runner. Always the explicit
 * path list — never a wildcard staging flag or a bare current-directory
 * argument.
 */
export function commitArtifacts({ paths = buildAddPathList(), message, gitRunner }) {
  gitRunner(["add", "--", ...paths])
  gitRunner(["commit", "-m", message])
}

/** Pushes the branch to `origin` — never a rewriting push of any kind. */
export function pushBranch({ branch, gitRunner }) {
  gitRunner(["push", "origin", branch])
}

export function buildPrTitle(date = new Date()) {
  return `chore: refresh data artifacts (${formatDateStamp(date)})`
}

export function buildPrBody() {
  return (
    "Automated weekly data refresh, run locally by the owner via `npm run " +
    "data:refresh-pr`. Runs the existing human-approved pipeline " +
    "(`npm run data:refresh` then `npm run data:build`) and commits whatever " +
    "committed data artifacts it changed. Nothing about the running app's " +
    "runtime posture changes: the app still reads only the committed " +
    "artifact (DEC-087, DEC-088, NFR-013)."
  )
}

/**
 * Opens the pull request through an injectable `gh` runner and returns the
 * URL from its stdout. When the runner throws — `gh` unauthenticated or
 * missing — this rethrows a wrapped error that names PR creation as the
 * failed step, distinct from a pipeline or git failure, rather than
 * swallowing it into a false success.
 */
export function openPullRequest({ branch, base = DEFAULT_PR_BASE, title = buildPrTitle(), body = buildPrBody(), ghRunner }) {
  let stdout
  try {
    stdout = ghRunner(["pr", "create", "--base", base, "--head", branch, "--title", title, "--body", body])
  } catch (error) {
    const wrapped = new Error(
      `PR creation failed (gh pr create --base ${base} --head ${branch}): ${error.message}`
    )
    wrapped.cause = error
    wrapped.step = "pr-create"
    throw wrapped
  }
  const url = String(stdout ?? "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .pop()
  if (!url) {
    throw new Error(`PR creation failed (gh pr create --base ${base} --head ${branch}): no URL in output`)
  }
  return url
}

/**
 * The whole run, over injected effects — no real git, gh, or pipeline call
 * unless the caller passes the real implementations (only `main()` does
 * that). Returns a result object describing the outcome rather than calling
 * `process.exit` itself, so it is testable as a plain async function.
 *
 * Control flow so far: dirty-tree refusal -> branch cut -> pipeline ->
 * commit -> push -> open PR. A pipeline failure stops before any git
 * mutation beyond the already-cut local branch — no commit, push, or PR —
 * so the partial state is left in place to inspect. Change detection and the
 * no-op path are wired in by a later slice.
 */
export async function refreshAndOpenPr({
  getDirtyTreeOutput = defaultGetDirtyTreeOutput,
  gitRunner = defaultGitRunner,
  runPipelineImpl = defaultRunPipelineStep,
  ghRunner = defaultGhRunner,
  commit = commitArtifacts,
  push = pushBranch,
  openPr = openPullRequest,
  now = new Date(),
  log = console.log,
  errorLog = console.error
} = {}) {
  const dirty = parseDirtyTree(getDirtyTreeOutput())
  if (dirty.status === "refuse") {
    errorLog(dirty.reason)
    return { status: "refused", reason: dirty.reason }
  }

  const branch = refreshBranchName(now)
  for (const args of planBranchActions(now)) gitRunner(args)

  try {
    runPipeline(runPipelineImpl)
  } catch (error) {
    // Partial state preserved on purpose: the branch stays, nothing is
    // staged, committed, pushed, or opened — matches the "keep partial
    // state" pattern in `refresh-commander-spellbook-data.mjs`'s
    // `main().catch()`.
    errorLog(`pipeline failed, leaving branch ${branch} in place for inspection: ${error.message}`)
    return { status: "pipeline-failed", branch, error }
  }

  const message = buildCommitMessage(now)
  commit({ paths: buildAddPathList(), message, gitRunner })
  push({ branch, gitRunner })

  let url
  try {
    url = openPr({ branch, ghRunner })
  } catch (error) {
    errorLog(
      `${error.message}\nThe branch and commit still exist locally and on origin/${branch} — open the pull ` +
        "request by hand once gh is authenticated."
    )
    throw error
  }

  log(`Pull request opened: ${url}`)
  return { status: "pr-opened", branch, url }
}

// ---- Real-effect defaults, wired only by main() below. ----

function defaultGetDirtyTreeOutput() {
  return execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" })
}

function defaultGitRunner(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] })
}

function defaultRunPipelineStep(step) {
  execFileSync("npm", ["run", step], { stdio: "inherit" })
}

function defaultGhRunner(args) {
  return execFileSync("gh", args, { encoding: "utf8" })
}

async function main() {
  const result = await refreshAndOpenPr()
  if (result.status === "refused" || result.status === "pipeline-failed") {
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
