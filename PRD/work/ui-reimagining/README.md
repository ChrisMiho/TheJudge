status: refined

# ui-reimagining

Re-imagine the UI of every player flow except Life Tracker — Menu and shared
chrome, Quick Question, In-Depth Question, Trade Balancer — so the app reads
as an arcane, premium, enchanting Magic tool built around the chosen mana
colour at a restrained intensity, the owner's friction list fixed, Life
Tracker's own screens and `lib/lifeTracker/` state untouched (it inherits
shared chrome like every other destination, reviewed by a screenshot pair),
own motifs only (no Wizards of the Coast artwork), dark only this pass with
tokens ready for light later, and three clickable HTML mockup directions
approved before app code changes.

The owner answered every intake slot already; see `intake/OWNER-INPUT.md` and
`intake/GRAPH-BRIEF.md` for the full detail, and `intake/inspiration/` for the
86 reference images (six per-colour folders) plus `DIGEST.md`.

See `IDEA.md` for the problem/outcome/non-goals summary and prior-run receipt
matches.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/ui-reimagining/DESIGN-BRIEF.md`
- Findings: (attempt 2, 2026-09-24, Critical) `GATE-QUESTIONS.md` `## REQ-202` H2 title and its three plain-language lines (242–262) still narrate the rejected reading — a pixel-identical Life Tracker pin proved by an automated zero-differing-pixels check — contradicting the block's own finalized diff (inherits shared chrome; before/after screenshot pair per touching slice for the owner's review; no automated pixel-diff gate), `DESIGN-BRIEF.md` D6, and the README supersession note; the `## REQ-200` H2 title (16) has the same drift against its edit (restrained theme built around the chosen colour). Everything else clean: `git diff --stat origin/main HEAD -- PRD/sections` empty, no new `DEC-`, the 15 accept blocks internally consistent.

## Refinement outputs (2026-09-24)

- `DESIGN-BRIEF.md` — the design record: what the build delivers, the measured
  evidence from the live app, the settled decisions with their assumptions, the
  grep-enumerated amendment set, and how Life Tracker inherits shared chrome
  under an owner screenshot-pair review.
- `GATE-QUESTIONS.md` — the proposed `PRD/sections/` changes, one block per
  stable ID with its complete diff and a verdict slot: new `REQ-200`–`REQ-205`
  and amendments to `REQ-044`, `REQ-046`, `REQ-056`, `REQ-060`, `REQ-099`,
  `REQ-124`, `REQ-129`, `REQ-130`, `REQ-167`, `NFR-011`, `FLOW-007`. No blocker
  questions.
- `.playwright-mcp/` — before screenshots and Life Tracker diff baselines
  (git-ignored; the measured numbers are recorded in `DESIGN-BRIEF.md`).

`intake/` is evidence, never authority: it is kept verbatim and every product
decision it raises is proposed at the `define` gate, not adopted from it. The
documents and sites it cites (reference apps, past design passes, `docs/design/`
files) are recorded as citations only and were not opened.

Supersession note: `intake/OWNER-INPUT.md`'s E1 answer ("(a) pixel-identical:
pin every shared token Life Tracker consumes to today's value") is superseded
by the `gate-review` verdict on `REQ-202` (2026-09-24) — Life Tracker inherits
shared chrome like every other destination, reviewed by a before/after
screenshot pair at every touching slice, with no zero-pixel gate.

Headline shaping call: this package's build delivers the **first mockup
direction plus the approved rules, and no app code**. Directions 2–3 and the
app-code redesign are follow-on packages — see `DESIGN-BRIEF.md`.
