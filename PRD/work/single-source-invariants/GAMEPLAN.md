# Gameplan — single-source-invariants

## What ships

Five product rules currently get restated, word-for-word, in many files. This
package gives each rule **one canonical home** that carries the full text plus
an explicit list of every place it echoes, and turns every other mention into a
short pointer at that home. It also fixes one live contradiction (root
`README.md` still tells agents to write to the retired decision log) and adds a
durable process rule — grep before you amend a cross-cutting rule, never list
its homes from memory — so the near-miss that motivated this package
(image-first-cards' D5: a memory-listed set went stale and cited a retired
decision as the live rule) cannot recur silently.

This is documentation and product-truth only. No application code, no test
code, no runtime behavior changes anywhere in this package.

## Source of truth for the edits

Every edit below is **by intent from the finalized, owner-accepted proposal**:
`PRD/work/single-source-invariants/GATE-QUESTIONS.md` (five blocks, all verdict
`accept`, no edits) plus `DESIGN-BRIEF.md`'s amendment-set tables. Implementers
apply the proposed diffs shown there. Because the whole point of this package
is "never list homes from memory," an implementer locates each edit by
searching for the **quoted current text** shown in the proposal's diff, not by
trusting the line numbers — the numbers are last-verified 2026-09-04 and may
have drifted by the time a slice runs. If a quoted line has moved or changed
words since the gate answer, re-grep the pattern family in that slice's
Verification block, find the line's new location, and apply the same edit
intent there.

## Architecture (docs-only)

There is no code architecture change. The "architecture" here is the
canonical-home documentation model:

- One **canonical home** per invariant carries the full rule text, the
  enforceable carve-out (if any), and an explicit "echoed in" list.
- Every other mention keeps its existing context-appropriate one-line phrasing
  but appends a pointer (`canonical: <home>`) instead of carrying independent
  rule text.
- A pointer never cites a **retired** `DEC-###` as if it were the live rule;
  it cites the canonical home instead.
- Per-feature scope clauses (a feature's own "this doesn't touch the
  product-facing endpoint" promise) are left untouched — they reference an
  invariant, they do not restate it.

## Slices

| Slice | Invariant | Canonical home | Depends on | Parallel-ready |
| --- | --- | --- | --- | --- |
| A | INV-ENDPOINT — one main product-facing endpoint | `non-functional-requirements.md` NFR-004 | none | yes |
| B | INV-MOCK-FIRST — mock provider by default locally | `integrations-and-data.md:16` | none | yes (shares files with A/C at non-overlapping lines — see Sequencing note) |
| C | INV-RULES-ENGINE — assistant, not a rules engine | `goals-and-non-goals.md:85` Scope Notes | A (one shared line — see Sequencing note) | no (run after A) |
| D | INV-DECISION-LOG — fix the two root-README contradictions | `doc-lifecycle.md` (already canonical; unedited) | none | yes |
| E | GUARD-GREP-BEFORE-AMEND — grep-before-amend guardrail | `writing-rules.md` (new subsection) | none | yes |

## Sequencing note (the one real file/line overlap)

`functional-requirements.md`'s REQ-094 constraint line (~line 2195, drift
possible) is the **one line two invariants both touch**: the accepted
INV-ENDPOINT diff already folds in both pointers in a single edit —
`(one-endpoint rule canonical: NFR-004; rules-engine rule canonical:
goals-and-non-goals.md Scope Notes)`. Slice A performs that edit. Slice C does
**not** re-edit that line — it only verifies, during its own re-grep, that the
line already carries the rules-engine pointer left there by Slice A. Implement
A before C for this reason. Every other shared file across A/B/C
(`overview.md`, `PRD/instructions/technical-design-rules.md`,
`goals-and-non-goals.md`, `PRD/sections/quick-lookup/README.md`,
`PRD/sections/in-depth/README.md`, `PRD/README.md`, root `README.md`) is
touched at different, non-overlapping lines in each slice — safe to implement
in one sequential session in letter order (A, B, C, D, E), which is how
`thejudge-implement-all` runs anyway. Do not fan this package out across
parallel worktrees: same-file, different-line edits in parallel branches risk
a merge conflict that a single sequential session does not hit.

## Verification checklist (docs-only)

No app test command applies — this package edits no code. Verification is:

1. Read the edited file(s) and confirm the canonical home carries the full
   rule text, the carve-out, and its "echoed in" list; confirm each pointer
   home reads as a short context line plus `canonical: <home>` and cites no
   retired `DEC-###` as the live rule.
2. Re-run the slice's `grep -rniE` pattern family (see each slice's
   Verification block) across `PRD/` and root `README.md` and confirm every
   returned rule-stating line is either the canonical home or a listed pointer
   — no unlisted rule-stating home remains, and no out-of-scope (per-feature
   scope clause, bare traceability/Backed-by reference, or closed-door
   rationale) line was touched.
3. For slice D, confirm the root `README.md` no longer sends a reader to
   "start with the `decisions.md` router" or instructs authoring new `DEC-###`
   bodies.
4. For slice E, confirm the new guardrail text names grep-before-amend,
   cites the image-first-cards D5 near-miss as the reason, and that
   `requirement-format.md` cross-references it.

## Files touched (union across slices)

- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/overview.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/problem-statement.md`
- `PRD/sections/user-flows.md`
- `PRD/sections/system-map/prompt-assembly.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/life-tracker/README.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/agent-working-rules.md`
- `PRD/instructions/writing-rules.md`
- `PRD/instructions/requirement-format.md`
- `PRD/README.md`
- `README.md` (root)

Not touched (confirmed out of scope by the accepted proposal): per-feature
"no change to ... any product-facing endpoint" scope clauses in
`functional-requirements.md` and feature-spec READMEs; bare DEC-010
traceability/Backed-by lines (`system-map.md`, `non-functional-requirements.md`
Backed-by list, `in-depth/README.md:10,281`); `user-feedback/README.md:123`
(closed-door rationale); all retired `decisions.md` index rows (DEC-010,
DEC-001, DEC-002, DEC-013).

## Promotion checklist (executed at cleanup, recorded here for the record)

- [ ] All five slices `done`
- [ ] Every canonical home carries its full amendment-set "echoed in" list
- [ ] A fresh full-corpus `grep -rniE` for all four invariant families plus
      `DEC-010` returns no unlisted rule-stating home
- [ ] Root `README.md:17,163` no longer contradict `doc-lifecycle.md`
- [ ] `writing-rules.md` carries the grep-before-amend subsection;
      `requirement-format.md` cross-references it
- [ ] Receipt written at `PRD/instructions/receipts/single-source-invariants-<date>.md`
- [ ] `PRD/work/single-source-invariants/` deleted; board row removed
