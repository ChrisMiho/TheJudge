# Idea — life-tracker-seat-map

## Problem

In the life tracker, every card's commander-damage mini-grid lists cells in
fixed roster order (Player 1 → N), with only the "me" cell moved to the
current card's own index and the whole grid spun by the card's rotation. No
two cards agree on where any player sits, and "me" boxes bunch toward the
table's middle instead of reading as each player's own seat. The opened
counter panel's commander-damage matrix has the same fixed roster-order shape
with an oversized "me" tile at the opener's index. Separately, at 7–8 players
the on-card grid (a near-square `ceil(√N)`-column blob) overflows the card's
narrow edge and clips, and the player-name pill gets crushed into the gutter.

## Outcome

Every card's commander-damage mini-grid, and the opened counter panel's
matrix, becomes a per-seat map: "me" sits at the current player's own seat,
and each opponent's cell sits in the table direction that player actually
occupies (left neighbor left, across-table player across), for both grid and
list layout modes. The map and the player-name pill stay fully contained
inside the card at every player count (2–8), with the 7–8-player clipping and
name-pill collision fixed.

## Non-goals

- Reopening the counter panel's tray/overlay shape (owned by DEC-139 /
  `chrome-hit-areas-and-mid-flight-exits`) — only the matrix arrangement
  inside the panel is in scope.
- Changing the commander-damage data model, persistence shape, or
  `GameContext` seed contract (DEC-102/DEC-103) — this is a pure
  frontend/presentation change.
- Adopting the owner-reference screenshots' 1–5 relative-index labels —
  cells keep showing the damage value (and, in the panel, player names);
  only cell position changes.
- Per-player theming, history, mana/dice counters, auto-KO, or any other item
  the `life-tracker-me-map-and-tray` idea folder deferred.

## Intake (evidence, not authority)

Staged from `.worktrees/.graph-intake/graph-20260902-093611/` into
`intake/` in this package: `GRAPH-BRIEF.md`, `PROBE.md`, and
`references/` (6 owner-reference screenshots of the target seat layout,
plus 6 measured before-state screenshots of the current roster-order grid
and 7–8-player clipping). Per the "Intake is evidence, never authority"
contract, its findings and its four "Decisions already made" are recorded
below as PROPOSED/claimed items — refinement resolves them, they are not
settled truth from this gate.

### Claimed findings (to verify at refinement)

- DOM cell order is claimed to be identical roster order on every card (only
  the "me" mark moves), measured live at 6 players via Playwright MCP —
  `intake/GRAPH-BRIEF.md` "Why" table.
- The opened counter panel is claimed to share the same fixed
  roster-order/`grid-cols-2` shape with an oversized "me" tile.
- At 8 players, 430px viewport, the on-card map and name pill are claimed to
  measurably overflow the card's edges — bounding-box table in
  `intake/GRAPH-BRIEF.md`.
- The reference screenshots (`intake/references/fullTable.PNG`,
  `player1..6.PNG`) are claimed to show "me" at each card's own seat with
  opponents numbered outward by table ring, decoded across all six seats.

### Claimed "Decisions already made" (proposed, to re-affirm or challenge at refinement)

1. Map model: per-seat viewpoint — each card's map is the table from that
   player's own seat, not one shared top-down diagram with "me" highlighted.
2. Cell content unchanged: on-card cells keep the damage value; panel cells
   keep player display-names. The fix is spatial only — do not adopt the
   reference's 1–5 relative-index labels.
3. Scope covers both surfaces: the on-card mini-grid and the opened counter
   panel's matrix both become seat maps.
4. Spacing/containment is in scope: map + name pill must stay fully inside
   the card at every count (2–8), with the 7–8-player clipping and name
   collision fixed.

### Claimed design direction (proposed, for refinement to accept/adjust)

- Reuse `seatArrangement(count)` / `listSeatArrangement(count)` geometry
  (`{ label, side, rotation, gridRow, gridColumn }` plus table `columns`/
  `rows`) to build the mini-grid and the panel matrix, replacing the
  roster-order `players.map` + `ceil(√N)` columns in
  `PlayerLifeCard.commanderDamagePreviewCells`/`previewColumns` and the fixed
  `grid-cols-2` loop in `CounterPanel`.
- On-card per-seat viewpoint is claimed to fall out of the existing card
  rotation (`placement.rotation`); cell contents should stay upright in the
  seated player's own orientation — flagged as needing live verification, not
  assumed.
- The counter panel is not rotated (centered dialog); claimed recommendation
  is to orient it so the opener reads as the near/bottom seat, with an
  absolute top-down "me"-highlighted replica as a fallback if that proves
  fiddly — refinement picks one.
- Containment fix: size the on-card map to the table's real column count
  (not `ceil(√N)`) and constrain map + name pill within the card's inner
  content box at every count.

### Claimed PRD truth to amend (files only, not content — refinement/graph-kickoff own the write)

- `PRD/sections/life-tracker/README.md` — "Counter panel and commander-damage
  matrix" and "Life table" sections.
- `PRD/sections/functional-requirements.md` — new seat-consistent
  commander-damage placement REQ (ID assigned at refinement/quality-check).
- `PRD/sections/screen-layout.md` — life-tracker card entry, containment band
  at high player counts.

### Constraints named by intake (to verify, not assume)

- Mock-default must keep working; no backend/provider/`GameContext` seed
  contract change.
- Do not reopen the counter-panel tray/overlay shape (DEC-139).
- Preserve existing always-on commander-damage-decrements-life behavior, the
  `−`/`+` bands (~53px, REQ-112), the "me" self-cell, and seat rotation as
  the sole life-zone orientation input (DEC-136).
- Map must derive from whichever arrangement (grid or list) is active.

## Prior run

- `PRD/instructions/receipts/player-life-tracker-2026-08-03.md` — original
  Player Life Tracker build; introduced the seat-arrangement module, counter
  panel, and commander-damage additive counter contract this request now
  reworks the layout of.
- `PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md` —
  prior life-tracker refinement pass; verified commander-damage band sizing
  (`min-h-[53px]`, REQ-112) and DEC-136/DEC-139 half-card + full-height
  counter-panel behavior this request must preserve.
- `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md` — wrote the
  current-state feature spec `PRD/sections/life-tracker/README.md`,
  including the "me" cell / commander-damage matrix sections this request
  will amend.
- `PRD/instructions/receipts/chrome-hit-areas-and-mid-flight-exits-2026-08-05.md`
  — DEC-139 full-height counter-panel overlay shape; edited
  `CounterPanel.tsx`/`CounterPanel.test.tsx`. Named in intake as the
  boundary this request must not reopen (panel tray shape stays DEC-139's).
- `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` —
  flagged duplication touching `PlayerLifeCard.tsx`, `CounterPanel.tsx`,
  `GameSetupPanel.tsx`, and life-tracker long-press increment; relevant
  context for the `PlayerLifeCard`/`CounterPanel` cell-arrangement rework.
- `PRD/instructions/receipts/ui-review-2026-08-11.md` — prior UI review
  noted an 8px label→input gap across commander-damage/named-counter/scalar
  rows; adjacent spacing context for the containment fix.
