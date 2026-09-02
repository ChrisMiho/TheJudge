# Slice A — Seat-map geometry: add the compact-horizontal-block builder

## Status: planned

## Goal

Give `PlayerLifeCard` (slice B) a second, independent geometry builder for the
on-card compact-horizontal block, while keeping `CounterPanel`'s existing
arrangement-miniature builder exactly as it is. Both live in
`lib/lifeTracker/seatMap.ts`. No rendering changes in this slice — B consumes
the new builder, C keeps consuming the existing one.

## Starting state

`apps/frontend/src/lib/lifeTracker/seatMap.ts` already exports
`buildSeatMapCells(layout: SeatArrangementLayout, players: TrackerPlayer[],
viewerLabel: PlayerLabel): SeatMapCell[]` — committed on this branch, still
correct, still required by `CounterPanel`. This slice does not remove or
change its behavior.

## Requirements

1. Add a new export to `apps/frontend/src/lib/lifeTracker/seatMap.ts` — a
   compact-horizontal-block builder (naming is the implementer's call, e.g.
   `buildCompactSeatMapCells`) that computes its **own** grid shape for a given
   player count, independent of any `SeatArrangementLayout`'s `columns`/`rows`:
   - At most 2 rows tall at every supported count (2–8), growing wider (more
     columns) as the player count grows — never a near-square `ceil(√N)` grid,
     never a tall stack.
   - The current player ("me"/viewer) sits in a fixed corner cell of the
     block.
   - Each opponent is placed elsewhere in the block as a best-effort outcome —
     it may use each seat's real table direction (`SeatPlacement.side` from
     the active `SeatArrangementLayout`) as an input to *where within the
     block* an opponent falls, but the block's own row/column count never
     comes from `layout.columns`/`layout.rows`.
   - The same output shape for the same player count regardless of which
     arrangement (`seatArrangement` grid mode vs. `listSeatArrangement` list
     mode) supplied the direction data — the block does not inherit list
     mode's tall stacking.
2. The new builder is pure and framework-agnostic like `seatArrangement.ts`
   and the existing `buildSeatMapCells`: no React import, no DOM/browser
   global read, no `lib/lifeTracker/state.ts` import.
3. Export whatever placement type the new builder returns (e.g. row/column
   index or CSS grid-area/row/column strings — implementer's call) plus the
   block's own declared column/row count, so `PlayerLifeCard` can build a grid
   template from it without recomputing shape logic itself.
4. `buildSeatMapCells` (used by `CounterPanel`) is untouched — same signature,
   same behavior, same exports. Confirm `CounterPanel.tsx`'s existing import
   still compiles unmodified.
5. New unit tests in `seatMap.test.ts` for the new builder, alongside (not
   replacing) the existing `buildSeatMapCells` tests.

## Acceptance criteria

- [ ] A1: the new compact-block builder's returned grid shape has at most 2
      rows at every supported player count 2–8 (unit test sweeping 2 through
      8).
- [ ] A2: at higher player counts the block's column count increases (grows
      wider) rather than its row count — e.g. 8 players is 2 rows × 4 columns,
      not 4 rows × 2 columns or a `ceil(√8) = 3` square (unit test).
- [ ] A3: exactly one cell in the block is marked as the viewer/self cell, at a
      fixed corner position, for every supported count (unit test).
- [ ] A4: the new builder's output does not depend on `layout.columns`/
      `layout.rows` — calling it with direction data derived from
      `seatArrangement(N)` and from `listSeatArrangement(N)` for the same `N`
      and viewer produces the same block shape (row/column count) (unit test
      comparing both).
- [ ] A5: the new export contains no React import and no import from
      `lib/lifeTracker/state.ts` (grep evidence — same purity bar as
      `seatArrangement.ts` and the existing `buildSeatMapCells`).
- [ ] A6: `buildSeatMapCells`'s existing exported signature and behavior are
      unchanged — the existing `seatMap.test.ts` cases for `buildSeatMapCells`
      still pass unmodified.
- [ ] A7: `npm run typecheck` passes.
- [ ] A8: `npm run test` passes for `seatMap.test.ts`.

## Verification

```bash
cd apps/frontend
npm run typecheck
npx vitest run src/lib/lifeTracker/seatMap.test.ts
```

## Files touched

- `apps/frontend/src/lib/lifeTracker/seatMap.ts`
- `apps/frontend/src/lib/lifeTracker/seatMap.test.ts`
