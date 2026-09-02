# Handoff — life-tracker-seat-map: on-card grid must mirror the real table (me at own seat)

**Fresh-session kickoff doc. Start here, then `GRAPH-RUN.md`. Route the work
through `thejudge-amend` (active package). Do NOT merge PR #182 — it is the wrong
design.**

## The target (definitive) — the mini-grid is a miniature of the real table

Each card's on-card commander-damage mini-grid must be a **miniature of the actual
seat arrangement**: **"me" at the viewer's OWN seat**, and each opponent at the
seat/direction they actually occupy. The cell ORDER mirrors where players really
sit relative to the viewer.

Target images (these show the DESIRED ORDER — **not** what the app currently does;
owner confirmed this 2026-09-02):

- `intake/references/4TableGrid.png` — 4 players, GRID layout. The table is 2×2.
  Each card's mini-grid is a 2×2 miniature with "me" at that player's own corner:
  Player 2 top-left, Player 3 top-right, Player 1 bottom-left, Player 4
  bottom-right; opponents fill their real positions.
- `intake/references/4TableList.png` — 4 players, LIST layout. The table is a
  diamond (top / left+right / bottom). Each card's mini-grid is that diamond with
  "me" at the viewer's seat: Player 3 top, Player 2 left, Player 4 right, Player 1
  bottom.
- `intake/references/fullTable.PNG`, `fullTableList.PNG` (6 players) and
  `player1..6.PNG` — same principle at 6 seats.

This is exactly what the existing `buildSeatMapCells` produces (it places each
player at their own `seat.gridRow`/`gridColumn`/`gridArea` from the active
`SeatArrangementLayout`) — the function the **panel** already uses.

## What the app currently does (wrong) — PR #182

PR #182 replaced the on-card map with a second builder, `buildCompactSeatMapCells`
(`apps/frontend/src/lib/lifeTracker/seatMap.ts`): a fixed 2-row block with **"me"
pinned to the top-left corner on every card** and opponents flattened into
row-major "table order". That does NOT mirror the table and does NOT put "me" at
the viewer's seat. It is the wrong design — a driver re-scope detour (see History).
**Do not merge PR #182.**

## The fix

1. **Use the arrangement-miniature for the on-card map** — the same
   `buildSeatMapCells` the panel uses (me at own seat via the arrangement's
   per-seat `gridRow`/`gridColumn`/`gridArea`), so grid → 2×2/etc. and list → the
   diamond/stacked shape, with the ORDER matching the real table. Abandon
   `buildCompactSeatMapCells` (delete it or stop using it on-card).
2. **Then fix containment at high player counts (7–8) — the ONE genuine bug** —
   without breaking the seat order. The arrangement-miniature must fit inside the
   card at 2–8 in both grid and list, no clipped cell, name pill not crushed. At
   4–6 players it is already small and contained (the target images prove it); the
   real engineering is keeping it contained at 7–8 while preserving correct
   positions. (This is the original "goes tall / off-screen at 8 players"
   complaint.)
3. **Verify LIVE on Mac `localhost:5173`** (hard-refreshed), checking the ORDER
   against `4TableGrid.png`/`4TableList.png` (4p) and `fullTable.PNG` (6p) in BOTH
   grid and list, and containment at 7 and 8.

## Product truth to re-align

REQ-173 was reconciled during the bad re-scope to describe a "compact horizontal
block". That wording is now wrong too — it should describe the on-card map as a
**per-seat miniature of the arrangement (me at own seat)**, with containment as the
guarantee. The amend should re-align `GATE-QUESTIONS.md` REQ-173 and the
`PRD/sections/` edits back to the arrangement-miniature.

## State

- Launch checkout on branch `thejudge-auto/life-tracker-seat-map-work`,
  `STATUS.owner-action`, parked. Dev stack stopped, ports free.
- PR #182 open — **DO NOT MERGE** (wrong design). It can be reused as the branch
  to push the corrected map onto, or closed and redone.
- Target refs: `4TableGrid.png`, `4TableList.png` (order), `fullTable.PNG`,
  `fullTableList.PNG`, `player1..6.PNG`.

## History — so the next session does NOT repeat the loop

Three wrong turns, all from misreading the ask:
1. "rotate the whole component" (over-scoped a callout).
2. compact-horizontal **fixed-corner** block (dropped per-seat placement) — driven
   by a driver `AskUserQuestion` whose preview smuggled in the fixed corner.
3. treating the compact block as the design in the spec.

The **original arrangement-miniature (`buildSeatMapCells`, me at own seat) was
correct all along.** The only genuine bug is containment at 7–8 players. Revert to
it and fix only that.
