status: active

# life-tracker-seat-map

Turn the life-tracker commander-damage grid into a per-seat map on both the
on-card preview and the opened counter panel, and fix map/name containment at
7–8 players. Autonomous graph run; spec-forming half driven by `graph-kickoff`.

See `IDEA.md` for the shaped idea, `intake/` for the probe evidence, and
`GRAPH-RUN.md` for the run ledger.

## Autonomous metadata

- Autonomous base: origin/main
- Shared build branch: thejudge-auto/life-tracker-seat-map-work
- Base note: the spec-forming half's base `thejudge-auto/life-tracker-seat-map`
  merged to `main` via docs PR #180 (the answer-then-merge build signal). The
  build half therefore branches off fresh `main` (loaded `graph-implement` skill,
  Model B) and opens one code PR `…-work → main`, rather than a nested
  `-work → base` PR into an already-merged base. `main` is the PR target only;
  the driver never pushes `main`, and the owner merges the code PR at `land`.

## Preparation gate

- Quality-check: PASS (build-half re-scope, attempt 4, 2026-09-02 — re-graded
  after the `define` reconciliation of the brief and REQ-173 to the owner's
  compact-horizontal on-card decision)
- Checked artifact: `PRD/work/life-tracker-seat-map/DESIGN-BRIEF.md`
- Findings: none. The two prior findings are resolved: no on-card requirement or
  acceptance criterion still mandates the literal-arrangement grid (real
  columns/rows, `ceil(√N)`, or per-seat arrangement `gridRow`/`gridColumn`) — the
  on-card map is uniformly a compact horizontal block (≤2 rows, grows wider,
  contained at 2–8). `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` REQ-173 agree; the
  panel top-down seat map, the containment guarantee, and the preserved behaviors
  (always-on decrements-life, REQ-112 bands, DEC-136, DEC-139 not reopened) are
  intact.

## Slice table

Re-planned 2026-09-02 (build-half re-scope) after the owner's compact-horizontal
on-card clarification. The prior plan's slices A/B/C are already committed on
this branch under the OLD design (on-card preview = arrangement miniature,
sized to `layout.columns × layout.rows`); this table and its criteria replace
that plan and re-earn every criterion under run `graph-20260902-121645` — none
of the old evidence carries forward.

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-seat-map-geometry.md) | Add the compact-horizontal-block builder to `lib/lifeTracker/seatMap.ts`, alongside the existing `buildSeatMapCells` (kept, unchanged, for the panel) | — | done |
| [B](slice-b-card-preview-seat-map.md) | `PlayerLifeCard`: on-card preview switches to the compact-horizontal block (≤2 rows, grows wider), same shape in grid and list layout | A | done |
| [C](slice-c-counter-panel-seat-map.md) | `CounterPanel`: re-verify the commander-damage matrix is still the unchanged top-down arrangement miniature | A | planned |
| [D](slice-d-live-containment-verification.md) | Live verification: 7/8-player containment + block-shape (grid + list, iPhone-portrait, against the reference images) and side-seat glyph orientation; runtime cleanup; Ship gates | B, C | planned |

B and C are parallel-ready once A lands. See `GAMEPLAN.md` for architecture and
data flow.

## Implementation map

- **Geometry:** `apps/frontend/src/lib/lifeTracker/seatMap.ts` — keeps the
  existing `buildSeatMapCells` (arrangement miniature, panel) and gains a new
  compact-horizontal-block builder (on-card).
- **Wiring:** `PlayerLifeTrackerApp.tsx` already threads its computed `layout`
  into `PlayerLifeCard` and `CounterPanel` as a prop — unchanged.
- **On-card:** `PlayerLifeCard.tsx` — replaces the `layout.columns ×
  layout.rows` preview grid with the compact-horizontal block (≤2 rows, grows
  wider), same in grid and list layout; the whole card is never rotated.
- **Panel:** `CounterPanel.tsx` — unchanged: still the top-down seat map sized
  to `layout.columns × layout.rows`, opener's "me" cell without `min-h-36`,
  every opponent's `CommanderDamageCell` keeping its `min-h-[53px]` bands.
- **Product truth (by intent, at build):** REQ-173 new in
  `PRD/sections/functional-requirements.md`; prose edits to
  `PRD/sections/life-tracker/README.md` and the Player Life Tracker row in
  `PRD/sections/screen-layout.md`, per the accepted `GATE-QUESTIONS.md` diffs
  (reconciled 2026-09-02). No new `DEC-###`/`FLOW-###`.
