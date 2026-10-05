# Slice A — Near-edge split rule and card wiring

## Status: done

## Goal

Make each life card put `−` on the edge nearest its seated player and `+` on the far edge, in both grid and list, driven by one pure helper wired into `PlayerLifeCard`.

## Requirements

1. Add a pure helper `apps/frontend/src/lib/lifeTracker/lifeHalves.ts` exporting `lifeHalvesForSeat(placement, layout, layoutMode)` returning `{ decrease, increase }` over `"top" | "bottom" | "left" | "right"`. The seat arrangements stay untouched (non-goal): the helper derives what rotation alone cannot supply from the placement already present. `placement.side` already names the near table edge; the one missing fact is which column of a list pair row a seat is in, read from `placement.gridColumn` against `layout.columns` (column 2 of 2 and not full width = right-of-pair). No new field is added to `SeatPlacement`.
2. Grid rule: `decrease` = `placement.side` (bottom/top for 2-3p, left/right for 4-8p side columns); `increase` = the opposite edge.
3. List rule: head (top, 180deg) and foot (bottom, 0deg) keep today's output exactly (`lifeHalvesForRotation`: head `−` right, foot `−` left, from the seated player's view). Middle pair rows: left-of-pair keeps `−` left; right-of-pair gets `−` right, `+` left.
4. In `PlayerLifeCard.tsx` replace the `isGrid ? {decrease:"left",increase:"right"} : lifeHalvesForRotation(...)` branch with the helper. Grid half classes gain top/bottom variants (`GRID_HALF_CLASSES`, gutter inset like the existing left/right) so grid top/bottom bands use the same thin edge inset; list keeps `HALF_CLASSES`. Keep the grid glyph screen-upright (`glyphTransform`). Remove the now-dead `"left" | "right"` casts. Update the stale comments (props doc, grid-split comment).
5. Do not change the three interactive inner controls, content padding, default layout, arrangements, Layout toggle, MTG Assistant seed or persistence.

## Acceptance criteria

- [ ] A1: `lifeHalves.ts` exists exporting `lifeHalvesForSeat`; `seatArrangement.ts` is unmodified (`git diff origin/main -- apps/frontend/src/lib/lifeTracker/seatArrangement.ts` is empty)
- [ ] A2: Grid, 2-3 players: each bottom seat has `−` on the bottom edge and `+` on the top; each top seat has `−` on the top edge and `+` on the bottom (unit-tested over `seatArrangement(2)` and `(3)`)
- [ ] A3: Grid, 4-8 players: each left-column seat has `−` on the left edge and `+` on the right; each right-column seat has `−` on the right edge and `+` on the left (unit-tested over `seatArrangement(4..8)`); no grid card keeps the old fixed screen-left `−`
- [ ] A4: List, every count 2-8: head and foot seats produce the same halves as before (head `−` right / foot `−` left), and in every middle pair row left-of-pair `−` is left and right-of-pair `−` is right (unit-tested over `listSeatArrangement(2..8)`)
- [ ] A5: Across both layouts at every count 2-8, no seat's `−` lands on the edge farthest from its player (property-style unit test)
- [ ] A6: `PlayerLifeCard.test.tsx` asserts the per-seat grid classes and the list right-of-pair mirror, and the card's three inner controls still take their own taps (existing tests pass)
- [ ] A7: `npm run typecheck` and `npm run lint` pass for `apps/frontend`

## Verification

```bash
cd apps/frontend && npx vitest run src/lib/lifeTracker/lifeHalves.test.ts src/components/portal/life-tracker/PlayerLifeCard.test.tsx && npm run typecheck && npm run lint
```

Tests:

- `lifeHalves.test.ts` covers every seat at every count 2-8 for both layouts using `seatArrangement` / `listSeatArrangement` output, asserting the near-edge rule and that no seat's `−` is on its far edge.
- `PlayerLifeCard.test.tsx`: rewrite the grid test "splits grid-mode cards on a fixed screen left/right regardless of seat rotation" to assert per-seat near-edge classes; add a list right-of-pair case; keep the existing list rotation cases (head/foot unchanged).

## Files touched

- `apps/frontend/src/lib/lifeTracker/lifeHalves.ts (new)`
- `apps/frontend/src/lib/lifeTracker/lifeHalves.test.ts (new)`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
