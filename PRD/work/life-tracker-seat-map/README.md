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

- Quality-check: PASS (build-half re-grade, attempt 2, 2026-09-02 — after owner
  accepted REQ-173; re-confirmed against the finalized proposal)
- Checked artifact: `PRD/work/life-tracker-seat-map/DESIGN-BRIEF.md`
- Findings: none (one non-blocking citation nit, unchanged from attempt 1:
  DESIGN-BRIEF criterion 5 attributes the "me" self-cell to DEC-136, which covers
  only life-adjustment split/rotation; GATE-QUESTIONS REQ-173 scopes DEC-136 to
  rotation correctly — prose imprecision, not a product-truth error, does not
  affect implementability)

## Slice table

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-seat-map-geometry.md) | Shared `buildSeatMapCells` geometry helper; thread the full `layout` prop into `PlayerLifeCard` and `CounterPanel` | — | done |
| [B](slice-b-card-preview-seat-map.md) | `PlayerLifeCard`: on-card preview becomes the per-seat map, sized to the arrangement's real columns/rows | A | done |
| [C](slice-c-counter-panel-seat-map.md) | `CounterPanel`: commander-damage matrix becomes the top-down per-seat map; drop the fixed 2-column loop and oversized "me" tile | A | done |
| [D](slice-d-live-containment-verification.md) | Live verification: 7/8-player containment (grid + list, iPhone-portrait) and side-seat glyph orientation; runtime cleanup; Ship gates | B, C | planned |

B and C are parallel-ready once A lands. See `GAMEPLAN.md` for architecture and
data flow.

## Implementation map

- **Geometry:** `apps/frontend/src/lib/lifeTracker/seatMap.ts` (new,
  `buildSeatMapCells`) — pure per-seat cell placement shared by both surfaces.
- **Wiring:** `PlayerLifeTrackerApp.tsx` threads its already-computed `layout`
  into `PlayerLifeCard` and `CounterPanel` as a new prop.
- **On-card:** `PlayerLifeCard.tsx` — removes `previewColumns`/
  `commanderDamagePreviewCells`, renders the seat map at `layout.columns ×
  rows`.
- **Panel:** `CounterPanel.tsx` — removes the fixed `grid-cols-2` roster loop
  and the oversized `min-h-36` "me" tile; renders the same seat map top-down.
- **Product truth (by intent, at build):** REQ-173 new in
  `PRD/sections/functional-requirements.md`; prose edits to
  `PRD/sections/life-tracker/README.md` and the Player Life Tracker row in
  `PRD/sections/screen-layout.md`, per the accepted `GATE-QUESTIONS.md` diffs.
  No new `DEC-###`/`FLOW-###`.
