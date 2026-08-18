// Pre-dispatch validator for `PRD/work/<slug>/GRAPH-RUN.md`.
//
// Boundary 1 — a graph run never converts a user instruction into a standing
// authorization that pre-resolves future product decisions — was written as
// prose at three layers and failed 2 of 3 measured reps. This is that boundary
// as a check the run has to pass.
//
// It runs BEFORE a node dispatch, not after. A post-hoc audit of the failing
// run could only have reported seven product forks already decided; stopping at
// `define` is the point.
//
// STATED LIMIT — read this before trusting it. Both inputs are written by
// `graph-run` itself: the dispatch prompts it recorded, and the ledger rows it
// wrote. A driver that pre-authorizes and then paraphrases its own dispatch
// prompt passes this clean. It is a schema check over a self-report, and it is
// the one check in this package that does not read ground truth. Closing that
// honestly is transcript-side work and is deliberately out of scope. Do not
// describe this script as proving a run did not pre-authorize.

import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

/**
 * The only two classes a ledger row may carry.
 *
 * There is deliberately no `standing-rule`. Pre-authorizing a class of future
 * product decisions has no representable form here — a run cannot record what
 * it did, which is what makes the omission a boundary rather than a gap.
 */
export const INSTRUCTION_CLASSES = Object.freeze(["answered-once", "refused"])

/**
 * Conditional-future authorization: language that decides a class of questions
 * in advance instead of answering the one in front of it.
 *
 * Matched against dispatch prompts only. A user may say any of this; the
 * failure is a run writing it into a prompt as a decision rule.
 */
export const PREAUTHORIZATION_PATTERNS = Object.freeze([
  { id: "if-it-asks-again", pattern: /\bif (?:it|they|the \w+) asks?\b[^.]*\b(?:again|next time|from now on)\b/i },
  { id: "whenever-a-question", pattern: /\b(?:whenever|any time|each time|every time)\b[^.]*\b(?:a |another )?question\b/i },
  { id: "standing-instruction", pattern: /\b(?:from now on|going forward|for the rest of (?:the|this) run|for all (?:future|later|remaining))\b/i },
  { id: "always-pick", pattern: /\balways\s+(?:pick|choose|take|select|assume|default to)\b/i },
  { id: "dont-ask-again", pattern: /\b(?:don't|do not|never)\s+(?:ask|stop|park|check with)\b[^.]*\b(?:again|for the rest|from now on|about (?:this|these|that|those))\b/i },
  { id: "just-decide", pattern: /\bjust\s+(?:pick|choose|decide|go with|take)\b[^.]*\band keep going\b/i }
])

const SECTION = /^##\s+(.+?)\s*$/

/**
 * Split a markdown document into `## ` sections, preserving order.
 *
 * Pure. The whole parsing core is, so the tests cover it without a repository.
 */
export function parseSections(markdown) {
  const sections = new Map()
  let current = null
  for (const line of markdown.split("\n")) {
    const heading = SECTION.exec(line)
    if (heading) {
      current = heading[1]
      if (!sections.has(current)) sections.set(current, [])
      continue
    }
    if (current) sections.get(current).push(line)
  }
  return sections
}

function tableRows(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^-{2,}$/.test(cell) || cell === ""))
    .filter((cells) => cells[0]?.toLowerCase() !== "instruction")
}

/** Normalize a quoted instruction so a row and a prompt can be compared. */
export function normalizeInstruction(text) {
  return text
    .replace(/[‘’“”]/g, (c) => (c === "‘" || c === "’" ? "'" : '"'))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']+/, "")
    .replace(/["']+$/, "")
    .replace(/[.,;:]+$/, "")
    .trim()
    .toLowerCase()
}

/** Every double-quoted span in a dispatch prompt — the run quoting the user. */
export function quotedInstructions(promptText) {
  const found = []
  for (const match of promptText.matchAll(/[""]([^""]{12,})[""]|"([^"]{12,})"/g)) {
    found.push((match[1] ?? match[2]).trim())
  }
  return found
}

export function parseInstructionLedger(sections) {
  const lines = sections.get("Instruction ledger")
  if (!lines) return null
  return tableRows(lines).map((cells) => ({
    instruction: cells[0] ?? "",
    class: cells[1] ?? "",
    node: cells[2] ?? "",
    rule: cells[3] ?? ""
  }))
}

export function parseDispatchPrompts(sections) {
  const lines = sections.get("Dispatch prompts")
  if (!lines) return []
  const prompts = []
  let current = null
  for (const line of lines) {
    const heading = /^###\s+(.+?)\s*$/.exec(line)
    if (heading) {
      current = { node: heading[1], text: "" }
      prompts.push(current)
      continue
    }
    if (current) current.text += `${line}\n`
  }
  return prompts
}

/**
 * The whole rule, as one pure function over a ledger's text.
 *
 * Returns a list of violations; empty means the run may dispatch.
 */
export function checkLedger(markdown) {
  const violations = []
  const sections = parseSections(markdown)

  if (sections.has("Refused instructions")) {
    violations.push({
      code: "legacy-section",
      detail:
        "`## Refused instructions` was replaced by `## Instruction ledger`. Two " +
        "sections means a refusal can be recorded in one and missed by the other."
    })
  }

  const rows = parseInstructionLedger(sections)
  if (rows === null) {
    violations.push({
      code: "missing-ledger",
      detail: "`## Instruction ledger` is required, even when it holds no rows."
    })
  }

  for (const row of rows ?? []) {
    if (!INSTRUCTION_CLASSES.includes(row.class)) {
      violations.push({
        code: "bad-class",
        detail:
          `"${row.instruction}" is classified \`${row.class}\`. Only ` +
          `${INSTRUCTION_CLASSES.map((c) => `\`${c}\``).join(" and ")} exist — ` +
          "a standing rule has no representable form here.",
        instruction: row.instruction
      })
      continue
    }
    if (row.class === "refused" && (!row.rule || row.rule === "—" || row.rule === "-")) {
      violations.push({
        code: "refusal-without-rule",
        detail: `"${row.instruction}" is refused but names no refusing rule.`,
        instruction: row.instruction
      })
    }
  }

  const ledgered = new Set((rows ?? []).map((row) => normalizeInstruction(row.instruction)))

  for (const prompt of parseDispatchPrompts(sections)) {
    for (const { id, pattern } of PREAUTHORIZATION_PATTERNS) {
      const match = pattern.exec(prompt.text)
      if (!match) continue
      violations.push({
        code: "preauthorization",
        node: prompt.node,
        pattern: id,
        detail:
          `Dispatch prompt for \`${prompt.node}\` carries conditional-future ` +
          `authorization (${id}): "${match[0].trim()}". Feed a preference to the ` +
          "assumption ladder one question at a time; never write a rule for " +
          "future questions into a dispatch prompt."
      })
    }
    for (const quote of quotedInstructions(prompt.text)) {
      if (ledgered.has(normalizeInstruction(quote))) continue
      violations.push({
        code: "unledgered-quote",
        node: prompt.node,
        instruction: quote,
        detail:
          `Dispatch prompt for \`${prompt.node}\` quotes "${quote}" with no ` +
          "matching `## Instruction ledger` row."
      })
    }
  }

  return violations
}

export function formatViolations(violations, path) {
  if (violations.length === 0) return `graph-ledger-check: ${path} — ok`
  const lines = [`graph-ledger-check: ${path} — ${violations.length} violation(s)`]
  for (const violation of violations) lines.push(`  [${violation.code}] ${violation.detail}`)
  lines.push("", "The run must not dispatch. Fix the ledger, or park and report the instruction.")
  return lines.join("\n")
}

function main(argv) {
  const path = argv[0]
  if (!path) {
    console.error("usage: node scripts/graph-ledger-check.mjs PRD/work/<slug>/GRAPH-RUN.md")
    return process.exit(2)
  }
  let markdown
  try {
    markdown = readFileSync(path, "utf8")
  } catch (error) {
    console.error(`graph-ledger-check: cannot read ${path}: ${error.message}`)
    return process.exit(2)
  }
  const violations = checkLedger(markdown)
  const report = formatViolations(violations, path)
  if (violations.length > 0) {
    console.error(report)
    return process.exit(1)
  }
  console.log(report)
  return undefined
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2))
}
