status: refined

# ui-reimagining

Re-imagine the UI of every player flow except Life Tracker — Menu and shared
chrome, Quick Question, In-Depth Question, Trade Balancer — so the app reads
as an arcane, premium, enchanting Magic tool with the chosen mana colour
carrying through the whole surface, the owner's friction list fixed, Life
Tracker pixel-identical, own motifs only (no Wizards of the Coast artwork),
dark only this pass with tokens ready for light later, and three clickable
HTML mockup directions approved before app code changes.

The owner answered every intake slot already; see `intake/OWNER-INPUT.md` and
`intake/GRAPH-BRIEF.md` for the full detail, and `intake/inspiration/` for the
86 reference images (six per-colour folders) plus `DIGEST.md`.

See `IDEA.md` for the problem/outcome/non-goals summary and prior-run receipt
matches.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ui-reimagining

## Refinement outputs (2026-09-24)

- `DESIGN-BRIEF.md` — the design record: what the build delivers, the measured
  evidence from the live app, the settled decisions with their assumptions, the
  grep-enumerated amendment set, and the Life Tracker pin.
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

Headline shaping call: this package's build delivers the **first mockup
direction plus the approved rules, and no app code**. Directions 2–3 and the
app-code redesign are follow-on packages — see `DESIGN-BRIEF.md`.
