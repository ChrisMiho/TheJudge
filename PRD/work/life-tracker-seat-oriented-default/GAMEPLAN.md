# Gameplan — life-tracker-seat-oriented-default

## Player outcome

On the life table, each player's `−` sits on the card edge nearest them and `+` on the far edge, in grid and list, at 2–8 players. Players tap toward themselves to lose life. Grid stays the default layout.

## Architecture

The split cannot come from rotation: left and right list pair seats are both 0°. Finding: `SeatPlacement` already carries `side` (the near table edge: top/bottom/left/right) and `gridColumn`. Grid needs only `side`. List needs one extra fact, which column of a pair row a seat is in, readable from `gridColumn` against `layout.columns`. So nothing is added to `seatArrangement.ts`; it stays untouched (non-goal).

- New pure helper `lib/lifeTracker/lifeHalves.ts`: `lifeHalvesForSeat(placement, layout, layoutMode)` returns `{decrease, increase}` edges.
  - Grid: `decrease = placement.side`, `increase` = opposite.
  - List: head/foot unchanged (rotation split); right-of-pair mirrors to `−` right.
- `PlayerLifeCard.tsx` calls the helper in place of the fixed grid branch; grid gets top/bottom gutter classes; grid glyphs stay screen-upright.

## Data flow

`seatArrangement` / `listSeatArrangement` -> placement + layout -> `lifeHalvesForSeat` -> half classes on the two life buttons. No state, persistence, backend or `GameContext` change.

## Slices (sequential: B needs A's behavior, C applies truth for what A/B shipped)

| Slice | Scope | Depends on |
| --- | --- | --- |
| A | Helper + `PlayerLifeCard` wiring + helper/card unit tests (7 criteria) | none |
| B | Fix downstream tests that assert the old split, full suite, live browser check at 2–8 in both layouts, one-screen fit (7 criteria) | A |
| C | Apply the REQ-217 four-file PRD diff, promotion checklist, ship gates (6 criteria) | A, B |

## Non-goals

Default layout, seat arrangements, Game Setup Layout toggle, MTG Assistant seed, layout persistence.

## Verification checklist

- [ ] Helper test covers every seat at 2–8 in both layouts; no seat has `−` on its far edge
- [ ] Full frontend suite and `npm run quality:check` green
- [ ] Live: near-edge `−` correct and one-screen fit at 2/3/4/6/8, phone and desktop, grid and list (DEC-136, `screen-layout.md`); browser closed, server stopped
- [ ] REQ-217, DEC-170 amendment, life-tracker README, system-map applied; no stale "fixed screen left" text
