// Slice E check (criterion E1): every `Current:` excerpt in GATE-QUESTIONS.md is
// gone from its live file and every `Proposed:` block is present.
//
// Run from the repository root:  node PRD/work/graph-workflow-branching/check-applied.mjs
// With `--apply` it performs the amendments (Current → Proposed) for the
// amendment blocks and appends the new-entry blocks after the last `### REQ-`
// entry of functional-requirements.md. Applying is idempotent: a block already
// applied is skipped.

import { readFileSync, writeFileSync } from "node:fs"

const GATE = "PRD/work/graph-workflow-branching/GATE-QUESTIONS.md"
const FR = "PRD/sections/functional-requirements.md"
const UF = "PRD/sections/user-flows.md"

const gate = readFileSync(GATE, "utf8")
const apply = process.argv.includes("--apply")

// Amendments: `Current (`<file>`, …):` fence followed by a `Proposed:` fence.
const amendments = []
const amendRe = /Current \(`([^`]+)`[^)]*\):\n\n```markdown\n([\s\S]*?)\n```\n\nProposed:\n\n```markdown\n([\s\S]*?)\n```/g
let m
while ((m = amendRe.exec(gate))) amendments.push({ file: m[1], current: m[2], proposed: m[3] })

// New entries: `Proposed (new entry, …):` fence.
const additions = []
const addRe = /Proposed \(new entry[^)]*\):\n\n```markdown\n([\s\S]*?)\n```/g
while ((m = addRe.exec(gate))) additions.push({ file: FR, proposed: m[1] })

const files = new Map()
const load = (f) => {
  if (!files.has(f)) files.set(f, readFileSync(f, "utf8"))
  return files.get(f)
}

let ok = 0
let total = 0
for (const a of amendments) {
  total += 1
  let text = load(a.file)
  if (apply && text.includes(a.current)) {
    text = text.replace(a.current, a.proposed)
    files.set(a.file, text)
  }
  const done = !text.includes(a.current) && text.includes(a.proposed)
  if (done) ok += 1
  console.log(`${done ? "OK  " : "MISS"} amend ${a.file}: ${a.proposed.split("\n")[0].slice(0, 70)}`)
}
for (const n of additions) {
  total += 1
  let text = load(n.file)
  if (apply && !text.includes(n.proposed)) {
    // Append after the last REQ entry: the file ends with the last `### REQ-`
    // block, so appending keeps numeric order (REQ-185–190 are reserved by
    // another package and will be inserted before these when it applies them).
    text = text.trimEnd() + "\n\n" + n.proposed.trimEnd() + "\n"
    files.set(n.file, text)
  }
  const done = text.includes(n.proposed)
  if (done) ok += 1
  console.log(`${done ? "OK  " : "MISS"} add   ${n.file}: ${n.proposed.split("\n")[0]}`)
}

if (apply) for (const [f, text] of files) writeFileSync(f, text)
console.log(`${ok}/${total} applied${apply ? " (written)" : ""}`)
if (ok !== total) process.exit(1)
