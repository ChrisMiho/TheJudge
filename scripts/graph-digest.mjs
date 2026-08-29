// The morning digest: one read-only command that summarizes what the night's
// graph run(s) did, and which base→main PRs still need merging to reach `main`.
//
// The queue spans multiple packages, so no single run can summarize the others —
// this reads every ledger at once. It is strictly read-only: it reads files and
// issues one read-only `gh pr list`, and prints. The decision logic is pure
// (`parseLedger`, `formatDigest`) so the whole shape is tested without a run.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { GRAPH_BRANCH_PREFIX, OPEN_BASE_TO_MAIN_PRS_COMMAND } from "./graph-preflight.mjs"

export const WORK_DIR = "PRD/work"
export const RECEIPTS_DIR = "PRD/instructions/receipts"

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
 * The printed digest, as a pure function of already-gathered inputs.
 *
 * `packages` are `parseLedger` results, `receipts` are file names (newest
 * first), `pendingBaseToMainPRs` are `{ headRefName, url }` PRs from a
 * `thejudge-auto/*` head into `main`.
 */
export function formatDigest({ packages = [], receipts = [], pendingBaseToMainPRs = [], now = new Date() } = {}) {
  const lines = [`Graph digest — ${now.toISOString().slice(0, 10)}`, ""]

  lines.push("## Runs")
  if (packages.length === 0) {
    lines.push("  (no graph run ledgers found under PRD/work/*/GRAPH-RUN.md)")
  } else {
    for (const pkg of packages) {
      const state = pkg.parked ? "PARKED — needs you" : pkg.currentNode ? `running (at \`${pkg.currentNode}\`)` : "state unknown"
      lines.push(`- ${pkg.slug ?? "<unknown>"}: ${state}`)
      if (pkg.gateSummary) lines.push(`    gate: ${pkg.gateSummary}`)
      if (pkg.questionsFile) lines.push(`    answer: ${pkg.questionsFile}`)
      if (pkg.resumeCommand) lines.push(`    resume: ${pkg.resumeCommand}`)
    }
  }
  lines.push("")

  lines.push("## Pending base→main PRs")
  if (pendingBaseToMainPRs.length === 0) {
    lines.push("  none — main is current")
  } else {
    for (const pr of pendingBaseToMainPRs) {
      lines.push(`- ${pr.headRefName} → main (${pr.url ?? "<no url>"}) — merge to reach main`)
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

function gatherPackages(read = readFileSync, listDir = readdirSync, exists = existsSync) {
  const packages = []
  let entries
  try {
    entries = listDir(WORK_DIR, { withFileTypes: true })
  } catch {
    return packages
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const ledgerPath = path.join(WORK_DIR, entry.name, "GRAPH-RUN.md")
    if (!exists(ledgerPath)) continue
    try {
      packages.push(parseLedger(read(ledgerPath, "utf8"), entry.name))
    } catch {
      // An unreadable or malformed ledger is skipped, never fatal — the digest
      // reports what it can rather than failing the whole morning summary.
    }
  }
  return packages
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
    const prs = JSON.parse(runGh(OPEN_BASE_TO_MAIN_PRS_COMMAND))
    if (!Array.isArray(prs)) return []
    return prs.filter((pr) => typeof pr?.headRefName === "string" && pr.headRefName.startsWith(GRAPH_BRANCH_PREFIX))
  } catch {
    // gh missing, unauthenticated, or offline: the digest still prints the rest
    // rather than erroring. The preflight guard, not the digest, is the gate.
    return []
  }
}

function main() {
  const runGh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  console.log(
    formatDigest({
      packages: gatherPackages(),
      receipts: gatherReceipts(),
      pendingBaseToMainPRs: gatherPendingPRs(runGh)
    })
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
