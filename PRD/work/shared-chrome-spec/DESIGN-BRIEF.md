# Design Brief — shared-chrome-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What this is

Phase A #6 of the docs-refactor gameplan. Authors the current-state feature spec
for the **shared-chrome** bucket at `PRD/sections/shared-chrome/README.md` on the
DEC-168 template, matching the five shipped Phase A specs (`life-tracker/`,
`user-feedback/`, `trade-balancer/`, `scan/`, `quick-lookup/` — all DEC-168).

The spec is a **derived, current-state VIEW** over existing DEC/REQ/FLOW/NFR
truth, consolidated into one player-terms file. It mints **no new stable IDs** and
edits **no existing source body**. It carries an explicit draft/non-authoritative
marker; `decisions.md` stays precedence #1 through Phase A/B.

## Scope

The shared frame every destination mounts into: the suite shell + mock-mode
banner, destination routing + the route-`Suspense` load fallback, the
feature-portal Menu corner rail + full-height tray, the Theme section, the shared
answered-conversation workspace, the conversation history drawer (+ Draft slot),
the View Context / adaptive-context overlay, the suite-wide card-detail popup +
shared card presentation, the one shared overlay close control, and the
`## Shared layout language` (viewport bands, hybrid % model, fit rule,
anti-overcalibration). Per binding constraint 7, per-screen feature rows stay with
their features.

## Confirmed backing-ID set (the `Backed by:` line)

Derived from the three cited decision-domain files plus functional-requirements,
user-flows, and non-functional-requirements. Superseded DECs that shaped the
current chrome are cited as lineage (matching the scan/quick-lookup precedent).

- **Navigation chrome DECs:** DEC-095, DEC-104, DEC-109, DEC-110, DEC-111,
  DEC-121, DEC-122, DEC-133, DEC-135, DEC-137, DEC-140, DEC-147, DEC-150, DEC-157
- **Conversation/drawer/overlay chrome DECs:** DEC-118, DEC-123, DEC-124, DEC-125,
  DEC-126, DEC-127, DEC-129, DEC-130, DEC-131, DEC-134, DEC-138, DEC-141, DEC-142,
  DEC-143, DEC-144, DEC-146, DEC-153
- **Shared sizing / banner / popup DECs:** DEC-085, DEC-117, DEC-145, DEC-148,
  DEC-149, DEC-151, DEC-156, DEC-158, DEC-159, DEC-160
- **REQs:** REQ-067, REQ-089, REQ-090, REQ-096, REQ-113, REQ-114, REQ-115,
  REQ-116, REQ-117, REQ-118, REQ-119, REQ-122, REQ-123, REQ-124, REQ-126,
  REQ-127, REQ-128, REQ-131, REQ-135, REQ-140, REQ-141, REQ-142
- **FLOWs:** FLOW-010, FLOW-016, FLOW-017, FLOW-018
- **NFRs:** NFR-001, NFR-006, NFR-011, NFR-014

### Excluded as per-feature (binding constraint: "several REQs are per-feature and must stay out")

The package README flagged these among the backing list for confirmation; source
reading places them with a single feature, not shared chrome:

- **DEC-120, DEC-128, REQ-100, REQ-106** — In-Depth Question's synchronized
  player-secondary disclosure and its containment/alignment. In-Depth Game Context
  concern → future In-Depth spec.
- **REQ-045** — inline staged-step label content (In-Depth staged flow step names).
  The eyebrow *chrome* is described via DEC-122; the step-name content is per-feature.
- **REQ-125** — reachable add action in card detail (In-Depth zone collection).
- **DEC-156 clause 3** — bounded poison/energy/experience dropdowns (In-Depth Game
  Context). DEC-156 is cited for its shared clauses 1 (card-area consolidation) and
  2 (themed close icon); clause 3 is called out as out-of-bucket in the spec.
- **FLOW-001** (In-Depth staged flow) and **FLOW-014** (Send feedback, owned by
  `user-feedback/`).

## Assumption-ladder decisions (orchestrated mode; graph-run controlling)

Per `preparation-contract.md`, applied per-question. None met the three-condition
genuine-blocker test — this is a documentation-consolidation view, not a product
decision, and every question resolves from source #1 (`PRD/sections/`).

1. **Directory name `shared-chrome`.** Confirmed against the in-repo naming
   signal: `screen-layout.md` already groups exactly these rows under a
   `### Shared chrome` heading. Ladder rung 3 (established local pattern). Proposed
   to the owner for confirmation/correction at the define gate, per the gameplan.
2. **Exact REQ/DEC/FLOW set.** Confirmed by reading each candidate's source body
   and sorting shared-chrome vs per-feature (list above). Ladder rung 1 (active
   `PRD/sections/` truth).
3. **Citing superseded DECs (DEC-121, DEC-125, DEC-126, DEC-148, DEC-140, DEC-147)
   as lineage.** Matches the shipped scan/quick-lookup specs, which cite
   superseded/reshaped DECs to record closed doors. Ladder rung 3 (established
   pattern).
4. **Measured bounds inventory.** Every measurement on a still-existing
   shared-chrome surface is carried into **Measured bounds** (binding constraint 8):
   shell width, single/split rail geometry, tray, history-drawer widths + 20-cap,
   View Context ≥25% scrim / ≤75dvh, answered-workspace `--layout-surface-gap` +
   64px auto-scroll, card popup (incl. superseded 92×128/356/37px), container-relative
   card image + ~300px floor, mock banner + REQ-123 gap, routing/Suspense, 44px floor.

## Genuine blockers

None. No `Q-###` minted. No product-behavior guess made on the owner's behalf.

## Guardrails honored

- Zero new stable IDs (DEC/REQ/FLOW/NFR/Q).
- Zero edits to `screen-layout.md`, `decisions/*`, `functional-requirements.md`,
  `user-flows.md`, `non-functional-requirements.md`, `system-map.md`, or the five
  shipped Phase A specs. The only `PRD/sections/` diff is the one new file
  `shared-chrome/README.md`.
- Intake (`intake/refactor-gameplan.md`) treated as evidence only; no document it
  cites was opened.

## Output

- `PRD/sections/shared-chrome/README.md` — authored (the derived view).
- Package STATUS → `refined`.
