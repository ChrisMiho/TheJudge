// The morning digest: one read-only command that summarizes what the night's
// graph run(s) did, and which graph PRs are waiting on the owner — a docs PR to
// answer and merge, or a code PR to merge into `main`.
//
// The queue spans multiple packages, so no single run can summarize the others —
// this reads every ledger at once: under the launch checkout's `PRD/work/` and
// inside every linked worktree under `.worktrees/`, because a run writes its
// ledger in its own worktree (REQ-191, REQ-193) and the launch checkout sees it
// only after a merge. It is strictly read-only: it reads files and issues one
// read-only `gh pr list`, and prints. The decision logic is pure (`parseLedger`,
// `preferWorktreeLedgers`, `formatDigest`) so the whole shape is tested without
// a run.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { GRAPH_BRANCH_PREFIX } from "./graph-preflight.mjs"

// The read-only query behind `## PRs waiting on you`. It lived in
// `graph-preflight.mjs` while preflight's base→main guard used it; the guard
// retired on 2026-09-06 (REQ-191) and the digest is now its only reader. Both
// halves' PRs match: the docs PR and the code PR are `thejudge-auto/*` → `main`.
export const OPEN_GRAPH_PRS_COMMAND = [
  "pr",
  "list",
  "--base",
  "main",
  "--state",
  "open",
  "--json",
  "headRefName,url"
]

export const WORK_DIR = "PRD/work"
export const RECEIPTS_DIR = "PRD/instructions/receipts"

// Linked worktrees live here; a run's ledger is at `<root>/PRD/work/<slug>/`.
export const WORKTREES_ROOT = ".worktrees"

// The body of a `## <heading>` section, up to the next `## ` heading or the end
// of the document. Plain string slicing rather than a regex, so a stray `##`
// inside a fenced block or a table cell cannot mis-terminate it at the wrong
// place — the section boundary is a line that *starts* with `## `.
function sectionBody(markdown, heading) {
  const marker = `## ${heading}`
  const start = markdown.indexOf(marker)
  if (start === -1) return null
  const afterHeading = markdown.indexOf("\n", start)
  if (afterHeading === -1) return ""
  const rest = markdown.slice(afterHeading + 1)
  const next = rest.indexOf("\n## ")
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

function field(markdown, label) {
  const match = markdown.match(new RegExp(`^- ${label}:\\s*(.+?)\\s*$`, "m"))
  return match ? match[1].replace(/`/g, "").trim() : null
}

function firstMeaningfulLine(body) {
  return (
    body
      .split("\n")
      .map((line) => line.replace(/^[-*\s]+/, "").trim())
      .find((line) => line.length > 0) ?? null
  )
}

/**
 * One package's ledger reduced to what a digest shows.
 *
 * Pure over the markdown, so both the parked and the running case are tested
 * without a run on disk. `slugFallback` is the package folder name, used when the
 * ledger title is missing or malformed.
 */
export function parseLedger(markdown, slugFallback = null) {
  const titleMatch = markdown.match(/^#\s+Graph run\s*[—-]\s*(.+?)\s*$/m)
  const slug = (titleMatch && titleMatch[1].trim()) || slugFallback

  const currentNode = field(markdown, "Current node")
  const nextAction = field(markdown, "Next action")

  const gateBody = sectionBody(markdown, "Open gate")
  const hasGate = gateBody !== null && gateBody.length > 0
  // A resolved or absent gate reads `- None`. Anything else is a live park.
  const parked = hasGate && !/^-?\s*None\b/i.test(gateBody)

  const questionsFile = parked ? (gateBody.match(/([^\s`]*GATE-QUESTIONS\.md)/) || [])[1] || null : null
  const resumeMatch = parked ? gateBody.match(/\/graph-[a-z-]+\s+[^\s`]+/) : null
  const resumeCommand = (resumeMatch && resumeMatch[0]) || nextAction || null
  const gateSummary = parked ? firstMeaningfulLine(gateBody) : null

  return { slug, currentNode, nextAction, parked, questionsFile, resumeCommand, gateSummary }
}

/**
 * One list of ledgers from the launch checkout's `PRD/work/` and from every
 * linked worktree's `PRD/work/`. A run writes its ledger in its worktree
 * (`.worktrees/kickoff-<slug>` in the spec-forming half, `.worktrees/implement-<slug>`
 * in the build half), so the worktree copy is the live one and wins for a slug
 * present in both; the launch checkout's copy is what the last merge left.
 *
 * `worktreePackages` entries carry `worktree`: the `.worktrees/<dir>` they came
 * from, printed beside the run so the owner knows where to look.
 */
export function preferWorktreeLedgers(mainPackages = [], worktreePackages = []) {
  const bySlug = new Map()
  for (const pkg of mainPackages) bySlug.set(pkg.slug, pkg)
  for (const pkg of worktreePackages) bySlug.set(pkg.slug, pkg)
  return [...bySlug.values()]
}

/**
 * The printed digest, as a pure function of already-gathered inputs.
 *
 * `packages` are `parseLedger` results (optionally carrying `worktree`),
 * `receipts` are file names (newest first), `pendingGraphPRs` are
 * `{ headRefName, url }` PRs from a `thejudge-auto/*` head into `main` — the
 * docs PR the owner answers and merges, or the code PR the owner merges.
 */
export function formatDigest({ packages = [], receipts = [], pendingGraphPRs = [], now = new Date() } = {}) {
  const lines = [`Graph digest — ${now.toISOString().slice(0, 10)}`, ""]

  lines.push("## Runs")
  if (packages.length === 0) {
    lines.push(
      `  (no graph run ledgers found under ${WORK_DIR}/*/GRAPH-RUN.md or ${WORKTREES_ROOT}/*/${WORK_DIR}/*/GRAPH-RUN.md)`
    )
  } else {
    for (const pkg of packages) {
      const state = pkg.parked
        ? "PARKED — needs you"
        : pkg.currentNode
          ? `running (at \`${pkg.currentNode}\`)`
          : "state unknown"
      const where = pkg.worktree ? ` [in ${pkg.worktree}]` : ""
      lines.push(`- ${pkg.slug ?? "<unknown>"}: ${state}${where}`)
      if (pkg.gateSummary) lines.push(`    gate: ${pkg.gateSummary}`)
      if (pkg.questionsFile) lines.push(`    answer: ${pkg.questionsFile}`)
      if (pkg.resumeCommand) lines.push(`    resume: ${pkg.resumeCommand}`)
    }
  }
  lines.push("")

  lines.push("## PRs waiting on you")
  if (pendingGraphPRs.length === 0) {
    lines.push("  none — nothing to answer or merge")
  } else {
    for (const pr of pendingGraphPRs) {
      lines.push(`- ${pr.headRefName} → main (${pr.url ?? "<no url>"}) — answer and merge, or merge`)
    }
  }
  lines.push("")

  lines.push("## Recent receipts")
  if (receipts.length === 0) {
    lines.push("  (none)")
  } else {
    for (const receipt of receipts) lines.push(`- ${receipt}`)
  }

  return lines.join("\n")
}

function gatherLedgersUnder(workDir, { read, listDir, exists, worktree = null }) {
  const packages = []
  let entries
  try {
    entries = listDir(workDir, { withFileTypes: true })
  } catch {
    return packages
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const ledgerPath = path.join(workDir, entry.name, "GRAPH-RUN.md")
    if (!exists(ledgerPath)) continue
    try {
      const parsed = parseLedger(read(ledgerPath, "utf8"), entry.name)
      packages.push(worktree ? { ...parsed, worktree } : parsed)
    } catch {
      // An unreadable or malformed ledger is skipped, never fatal — the digest
      // reports what it can rather than failing the whole morning summary.
    }
  }
  return packages
}

function listWorktreeDirs(listDir) {
  try {
    return listDir(WORKTREES_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

function gatherPackages(read = readFileSync, listDir = readdirSync, exists = existsSync) {
  const io = { read, listDir, exists }
  const inWorktrees = listWorktreeDirs(listDir).flatMap((dir) => {
    const worktree = path.posix.join(WORKTREES_ROOT, dir)
    return gatherLedgersUnder(path.join(WORKTREES_ROOT, dir, WORK_DIR), { ...io, worktree })
  })
  return preferWorktreeLedgers(gatherLedgersUnder(WORK_DIR, io), inWorktrees)
}

function gatherReceipts(listDir = readdirSync, limit = 5) {
  try {
    // Receipts are named `<slug>-<date>.md`, so a reverse lexical sort surfaces
    // the newest dates first for the same slug; good enough for a "recent" list.
    return listDir(RECEIPTS_DIR)
      .filter((name) => name.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, limit)
  } catch {
    return []
  }
}

function gatherPendingPRs(runGh) {
  try {
    const prs = JSON.parse(runGh(OPEN_GRAPH_PRS_COMMAND))
    if (!Array.isArray(prs)) return []
    return prs.filter((pr) => typeof pr?.headRefName === "string" && pr.headRefName.startsWith(GRAPH_BRANCH_PREFIX))
  } catch {
    // gh missing, unauthenticated, or offline: the digest still prints the rest
    // rather than erroring. The list is information for the owner, not a gate.
    return []
  }
}

function main() {
  const runGh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  console.log(
    formatDigest({
      packages: gatherPackages(),
      receipts: gatherReceipts(),
      pendingGraphPRs: gatherPendingPRs(runGh)
    })
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
