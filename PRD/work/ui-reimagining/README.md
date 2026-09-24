status: active

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

- Quality-check: PASS
- Checked artifact: `PRD/work/ui-reimagining/DESIGN-BRIEF.md`
- Findings: none

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

## Slices

| Slice | Goal | Status | Dependencies |
| --- | --- | --- | --- |
| [A — prd-truth-application](slice-a-prd-truth-application.md) | Apply the finalized `GATE-QUESTIONS.md` diffs (`REQ-200`-`REQ-205` new; nine amendments in `functional-requirements.md`, plus `NFR-011` and `FLOW-007`) to `PRD/sections/` by intent, exactly once | planned | parallel-ready — no dependency |
| [B — design-system-and-baselines](slice-b-design-system-and-baselines.md) | Shared token/motif CSS every mockup page consumes (`REQ-200`, `REQ-201`), plus "before" screenshots of today's live app for every in-scope destination and Life Tracker at 390x844/1440x900 | planned | parallel-ready — no dependency |
| [C — shared-chrome-and-menu-mockup](slice-c-shared-chrome-and-menu-mockup.md) | Clickable mockup of shared chrome and the Menu; produces the Life Tracker before/after pair proving `REQ-202` inheritance | planned | sequential — B |
| [D — quick-question-mockup](slice-d-quick-question-mockup.md) | Clickable Quick Question mockup fixing `REQ-129` (Send Request in the first viewport at 5 cards) and `REQ-205` touch floors | planned | sequential — B |
| [E — in-depth-question-mockup](slice-e-in-depth-question-mockup.md) | Clickable In-Depth Question mockup (every step) fixing `REQ-130` (>=3 zone tiles visible) and `REQ-205`; demonstrates `REQ-203`'s Easter-egg entry point | planned | sequential — B |
| [F — trade-balancer-mockup](slice-f-trade-balancer-mockup.md) | Clickable Trade Balancer mockup implementing `REQ-204` (phone tabs; desktop unchanged) and `REQ-205` | planned | sequential — B |
| [G — gallery-and-ship-gates](slice-g-gallery-and-ship-gates.md) | `docs/design/ui-reimagining/index.html` gallery, PRD promotion checklist, no-app-code confirmation; carries the Ship gates block | planned | sequential — A, C, D, E, F |

## Implementation map

- `PRD/sections/functional-requirements.md`, `non-functional-requirements.md`,
  `user-flows.md`, `goals-and-non-goals.md`, `system-map.md` — slice A, edited
  (durable PRD truth: `REQ-200`-`REQ-205` new; `REQ-044/046/056/060/099/124/
  129/130/167`, `NFR-011`, `FLOW-007` amended)
- `docs/design/ui-reimagining/README.md`,
  `docs/design/ui-reimagining/direction-1/tokens.css`,
  `docs/design/ui-reimagining/direction-1/motifs/`,
  `docs/design/ui-reimagining/direction-1/shell.css`,
  `docs/design/ui-reimagining/before/*.png` — slice B, new
- `docs/design/ui-reimagining/direction-1/shared-chrome-menu.html`,
  `docs/design/ui-reimagining/after/life-tracker-*.png` — slice C, new
- `docs/design/ui-reimagining/direction-1/quick-question.html` — slice D, new
- `docs/design/ui-reimagining/direction-1/in-depth-question.html` — slice E,
  new
- `docs/design/ui-reimagining/direction-1/trade-balancer.html` — slice F, new
- `docs/design/ui-reimagining/index.html` — slice G, new; the one entry point
  for the owner's review, linking every mockup page and the Life Tracker
  before/after pair

These are committed deliverables outside `PRD/work/ui-reimagining/`, mirroring
`docs/design/tab-icon/`'s precedent for committed design candidates, so they
survive `thejudge-cleanup`'s deletion of this package folder.

Full architecture, data flow, and verification checklist: `GAMEPLAN.md`.

## Next step

`/thejudge-implement PRD/work/ui-reimagining/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/ui-reimagining/ slice A` (Codex) — A and B are
both valid starting points since neither depends on the other. For one
unattended agent completing every slice,
`/thejudge-implement-all PRD/work/ui-reimagining/`.
