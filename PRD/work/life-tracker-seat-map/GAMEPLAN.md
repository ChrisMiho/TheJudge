# GAMEPLAN — life-tracker-seat-map (compact-horizontal re-plan)

## Objective

The on-card commander-damage preview stops being a miniature of the real seat
arrangement and becomes a **compact horizontal block** — at most 2 rows,
growing wider as players are added — matching the reference images, the same
shape in grid and list layout, "me" in the current player's own seat corner,
opponents around it as a best-effort outcome, extrapolated sideways for 7–8
players. The whole card is never rotated; only the block's internal layout
changes. The opened counter panel's commander-damage matrix is **unchanged**:
it stays a top-down miniature of the active arrangement (opener as "me" at
their own seat, each opponent at theirs, unused slots empty).

This replaces the prior plan's on-card mechanism, which reused the panel's
arrangement-miniature geometry (`layout.columns × layout.rows`) for the on-card
preview too — the owner's 2026-09-02 clarification (`DESIGN-BRIEF.md` ##
Owner clarification; `GATE-QUESTIONS.md` REQ-173, reconciled) rejects that for
the on-card surface specifically. Pure frontend/presentation; no backend,
provider, seed contract, or persistence change. REQ-173's accepted diff
applies to `PRD/sections/` at build, not here.

## Starting state (what already exists on this branch)

Slices A/B/C of the prior plan are already committed
(`thejudge-auto/life-tracker-seat-map-work`):

- `apps/frontend/src/lib/lifeTracker/seatMap.ts` exports
  `buildSeatMapCells(layout, players, viewerLabel)` — places every player at
  their own seat from `layout.seats`. **Keep this as-is**; it is exactly what
  the panel (slice C) still needs.
- `PlayerLifeCard.tsx` currently calls `buildSeatMapCells` and sizes its
  preview grid to `layout.columns × layout.rows` — **this is the part that
  must change** (slice B).
- `CounterPanel.tsx` calls `buildSeatMapCells` and sizes its matrix to
  `layout.columns × layout.rows` — **this is correct already and stays**
  (slice C re-verifies only).
- `PlayerLifeTrackerApp.tsx` already threads its computed `layout` into both
  components as a prop — no change needed for that wiring.

This re-plan does not start from zero: it adds a second, independent geometry
builder for the on-card surface and rewrites only `PlayerLifeCard.tsx`'s
rendering to use it. `CounterPanel.tsx` and `seatMap.ts`'s existing export are
untouched in substance.

## Architecture

- **Two geometry builders, one module.** `lib/lifeTracker/seatMap.ts` keeps
  exporting `buildSeatMapCells` (arrangement miniature — panel, slice C) and
  gains a second, independent export for the on-card compact block (slice A).
  Both stay pure and framework-agnostic, like `seatArrangement.ts` itself: no
  React import, no DOM/browser global read, no `lib/lifeTracker/state.ts`
  import.
- **The compact-block builder is decoupled from the arrangement's real shape.**
  It never reads `layout.columns`/`layout.rows` to size its own grid and never
  computes a near-square `ceil(√N)` grid. Its own grid is always at most 2 rows
  tall, growing wider as the player count grows (e.g. a 2×4 block at 8
  players). It may still consult each seat's real table direction (`side` in
  `SeatArrangementLayout`/`SeatPlacement`) to decide where an opponent falls
  relative to the viewer's own corner — direction is an input to placement
  *within* the block, not to the block's own row/column count. The exact
  parameter shape and algorithm are the implementing slice's call; the
  constraint is the output contract (own grid, ≤2 rows, self at a corner,
  never derived from `layout.columns`/`layout.rows`).
- **On-card (`PlayerLifeCard`):** replaces the `buildSeatMapCells` call and the
  `layout.columns`/`layout.rows` grid template with the new compact-block
  builder and its own (≤2-row) grid template. The existing rotated,
  container-query-sized content box (DEC-136's mechanism) is unchanged — the
  block rides inside it exactly like the old preview did; only the block's own
  internal shape changes. The whole card is never rotated (out of scope: no
  callout rotates the entire component).
- **Panel (`CounterPanel`):** no architectural change. Stays a non-rotated
  centered dialog (DEC-139) whose matrix is `buildSeatMapCells` sized to
  `layout.columns × layout.rows` — an absolute top-down replica of the table,
  opener highlighted as "me" at normal cell size. Slice C re-verifies this
  still holds; it does not re-derive it.
- **Preserved unchanged:** always-on commander-damage-decrements-life; the
  panel's `−`/`+` bands (~53px, REQ-112) inside `CommanderDamageCell`; the "me"
  self-cell; seat rotation as the sole life-zone orientation input (DEC-136);
  the panel's full-height overlay shape (DEC-139); `GameContext` seed contract
  (DEC-102) and persistence shape (DEC-103) — untouched, presentation only.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Seat-map geometry: add the compact-horizontal-block builder to `lib/lifeTracker/seatMap.ts`, alongside the existing `buildSeatMapCells` (kept, unchanged, for the panel) | — |
| B | `PlayerLifeCard`: on-card preview switches from the arrangement miniature to the compact-horizontal block, same shape in grid and list layout | A |
| C | `CounterPanel`: re-verify the commander-damage matrix is still the unchanged top-down arrangement miniature; re-touch only if slice A's module shape moved under it | A |
| D | Live verification: 7/8-player containment plus block-shape (≤2 rows, reads horizontal) in both grid and list layout, iPhone-portrait; side-seat glyph orientation; runtime cleanup; Ship gates | B, C |

B and C are parallel-ready once A lands (each touches a different component,
and C's own logic does not depend on B's new builder). D is the closing slice.

## Data flow

```
PlayerLifeTrackerApp
  layout = listSeatArrangement(count) | seatArrangement(count)   (already computed, unchanged)
    │
    ├─ per real card: <PlayerLifeCard player players placement layout .../>
    │     placement = this card's own seat (unchanged, drives rotation/gridArea)
    │     layout    = unchanged wiring — but PlayerLifeCard now uses it only to
    │                 read each seat's `side` (direction), NOT its columns/rows
    │        <compact-block builder>(players, player.label, layout-derived directions)
    │          → the block's OWN grid shape: ≤2 rows, grows wider
    │          → "me" at the viewer's own corner; opponents by real direction
    │            as a best-effort outcome within that shape
    │        (same output shape in grid mode and list mode — decoupled from
    │         listSeatArrangement's tall stacking)
    │
    └─ opened panel: <CounterPanel player players layout .../>
          layout = unchanged, panel is never rotated (DEC-139)
             buildSeatMapCells(layout, players, player.label)   (UNCHANGED — slice C)
               → opener's own cell renders "me" (normal size) at its own seat
               → each opponent's CommanderDamageCell at its own seat
               → grid sized to layout.columns × layout.rows (top-down replica)
```

## Verification checklist

- [ ] `npm run test` (frontend) green for `seatMap.test.ts`, `PlayerLifeCard.test.tsx`,
      `CounterPanel.test.tsx`, `PlayerLifeTrackerApp.test.tsx`.
- [ ] `npm run typecheck` (frontend) green.
- [ ] `PlayerLifeCard.tsx`'s preview grid template is never derived from
      `layout.columns`/`layout.rows` and never `ceil(Math.sqrt(...))` —
      `grep -n "layout.columns\|layout.rows\|ceil(Math.sqrt" apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` returns nothing.
- [ ] `CounterPanel.tsx` still derives its matrix grid from
      `layout.columns`/`layout.rows` via `buildSeatMapCells` (unchanged) —
      `grep -n "buildSeatMapCells\|layout.columns\|layout.rows" apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` still finds them.
- [ ] Live containment + block-shape verified at 7 and 8 players, grid and
      list, iPhone-portrait (~430px), against the reference images — slice D.
- [ ] Browser closed, owned dev server stopped, port released, capture path
      recorded — slice D.

## PRD promotion checklist (executed at cleanup)

- REQ-173 added to `PRD/sections/functional-requirements.md` (already applied
  by `build`, per the propose/apply contract — cleanup verifies presence, does
  not re-apply).
- Prose edits to `PRD/sections/life-tracker/README.md` (life-table + counter
  panel/commander-damage-matrix sections) and the Player Life Tracker row in
  `PRD/sections/screen-layout.md`, per `GATE-QUESTIONS.md`'s reconciled diffs
  — verified present, not re-applied.
- No new `DEC-###` (decision log retired); no new `FLOW-###`.
