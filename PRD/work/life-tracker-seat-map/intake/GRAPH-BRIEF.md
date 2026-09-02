# Graph-run brief — Life-tracker commander-damage grid as a per-seat map

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.
Everything needed is inlined here — the probe folder is evidence, not a
dependency.

## What the player gets

Open the life tracker and every player's card carries a tiny map of the table.
On your own card, **"me" sits where you actually sit**, and every opponent's cell
sits in the direction that player is really sitting — the person on your left is
on the map's left, the person across the table is across the map. Tap the cell in
a player's direction to log the commander damage they dealt you. Today the grid
is just the roster (Player 1, 2, 3… in reading order) with your own box moved
around and the whole thing spun by the card's rotation, so no two cards agree on
where anyone sits and the "me" boxes bunch toward the middle of the table. After
this, all cards agree on one seat layout, "me" never lands in the same spot on
two cards, and the grid reads as the physical table from each seat.

The same seat map applies to the bigger commander-damage matrix inside a player's
opened counter panel, not just the little on-card preview.

## Why (measured — do not re-derive)

Measured live in the running app (Playwright MCP, mock mode, iPhone-portrait
430×900) at 4 / 6 / 8 players. Two separate defects:

**1. The grid is roster order, not a seat map.** Every card lists its cells in
the same fixed order `Player 1 → N` and only marks a different cell "me"; the
card's own rotation then spins that identical grid. Measured DOM cell order (the
`me`/value text of each `commander-preview-cell` in order), 6 players:

| Card | On-card cell order (as rendered) |
| --- | --- |
| Player 1 | **me**, 0, 0, 0, 0, 0 |
| Player 2 | 0, **me**, 0, 0, 0, 0 |
| Player 3 | 0, 0, **me**, 0, 0, 0 |
| Player 4 | 0, 0, 0, **me**, 0, 0 |
| Player 5 | 0, 0, 0, 0, **me**, 0 |
| Player 6 | 0, 0, 0, 0, 0, **me** |

Identical order on every card, "me" walking the roster index. That is the
"clusters toward the middle / doesn't read as a shared seat map" defect the idea
folder named. The opened counter panel has the same shape: a fixed 2-column
roster grid with an oversized "me" tile at the opener's roster index
(`current-panel-6p-p1.png`).

The reference (`references/fullTable.PNG`, `player1..6.PNG`) instead places, on
each card, "me" at that card's own seat and numbers the opponents 1–5 by walking
the table ring outward from "me" — decoded and confirmed across all six seats
(e.g. Player 3 top-left → me top-left; Player 6 bottom-right → me bottom-right).

**2. At 7–8 players the grid overflows the card and clips.** The on-card grid
uses `ceil(√N)` columns — a near-square blob (3×3 at 8 players) — and is sized in
container-query units off the card's *rotated* long axis, so on the short 8-player
cards it spills past the card's narrow edge and is cut by the card's
`overflow-hidden`. Measured bounding boxes at 8 players, 430px wide:

| Card | Card x-range | Preview-map x-range | Name-pill x-range |
| --- | --- | --- | --- |
| Player 1 (left seat) | 12 → 211 | **1** → 95 (off left edge) | 197 → **222** (11px past right edge) |
| Player 5 (right seat) | 219 → 418 | 335 → **429** (11px past right edge) | **208** → 233 (11px into gutter) |

Visible in `current-8p-mobile-overflow.png`: the map's outer column of cells is
clipped and the name pill is crushed between the map and the life number. This is
the "names offset and covered by other UI" the owner flagged.

## Decisions already made — do not re-litigate

- **Map model: per-seat viewpoint.** Each card's map is the table *from that
  player's seat* — neighbors on their left/right, across-table players across —
  not one identical top-down diagram with only "me" highlighted. (Owner, this
  session.)
- **Cell content: keep damage value + names, fix is purely spatial.** On the
  card each opponent cell keeps showing the commander-damage amount (0 until they
  hit you); the opened panel keeps player display-names on cells. Do **not** adopt
  the reference's 1–5 relative-index labels — position already tells you *who*,
  the number tells you *how much*. (Owner, this session.)
- **Scope: both surfaces.** The on-card mini-grid **and** the opened counter
  panel's commander-damage matrix both become seat maps. (Owner, this session.)
- **Spacing/containment is in scope.** The map and the player-name pill must stay
  fully inside the card at every count (2–8), with the 7–8-player clipping and
  name collision above fixed. (Owner, this session.)

## Design direction (converged)

Direction, not slices — map-out owns slicing.

- **Reuse the seat geometry we already compute.** `seatArrangement(count)` (and
  `listSeatArrangement(count)` for list mode) already returns, per player,
  `{ label, side, rotation, gridRow, gridColumn }` plus the table's `columns` /
  `rows`. The map is a miniature of that same grid: build the mini-grid with the
  arrangement's `columns × rows`, and place each player's cell at *its own seat's*
  `gridRow`/`gridColumn` — "me" for the current player, a damage/`−`/`+` cell for
  each opponent, empty for any unused seat slot. This replaces the roster-order
  `players.map` + `ceil(√N)` columns in `PlayerLifeCard.commanderDamagePreviewCells`
  / `previewColumns`, and the fixed `grid-cols-2` roster loop in `CounterPanel`.
  The map then mirrors *whichever* arrangement is currently rendered (grid vs
  list), so it stays a true replica of the table on screen.
- **Per-seat viewpoint falls out of the card rotation — but keep glyphs upright.**
  The card content is already rotated by `placement.rotation`, so a map drawn in
  table coordinates rides that rotation and reads egocentrically from each seat.
  The one thing to get right: the cell *contents* (the number / "me") should stay
  readable in the seat's own orientation (they already sit inside the rotated
  content box, so this likely needs no extra work — but map-out should verify the
  glyphs aren't sideways relative to the seated player, the same class of bug the
  card's life number already solves).
- **The opened counter panel is not rotated.** It is a centered dialog, so the
  seat map there is a top-down replica with "me" at the opener's seat. Recommended:
  orient it so the opener reads as the near/bottom seat (their own viewpoint), to
  match the card feel; if that proves fiddly, an absolute top-down replica with
  "me" highlighted is an acceptable fallback — refinement should pick one. Keep
  each opponent cell's always-visible `−`/`+` bands and the "incrementing an
  opponent's commander damage decrements this player's life" behavior unchanged
  (life-tracker spec, DEC-102-era behavior); only the *arrangement* of cells
  changes.
- **Containment.** Size the on-card map to the table's real column count (2
  columns for 4–8 players, matching the table's own 2-column shape) rather than a
  near-square `ceil(√N)`, and constrain the map + name pill to sit within the
  card's inner content box at every count so nothing is clipped by
  `overflow-hidden` or spills into the gutter. Verify live at 7 and 8 players,
  portrait, both grid and list layout.

## Current-state PRD truth to amend

Name the files; do not edit them here (refinement / graph-kickoff own that write).

- `PRD/sections/life-tracker/README.md` — the "Counter panel and
  commander-damage matrix" section and the "Life table" section. Today it says a
  "me" cell "marks the player's own seat"; make explicit that both the on-card
  preview and the panel matrix are **seat maps** (me at own seat, opponents in
  their table directions, per-seat viewpoint, no two "me" cells coincident). Add
  the containment guarantee (map + name pill fit the card at 2–8, no clip).
- `PRD/sections/functional-requirements.md` — a new REQ for seat-consistent
  commander-damage placement (both surfaces) and its containment acceptance
  criteria. Refinement/quality-check assign the REQ id; do not mint one here.
- `PRD/sections/screen-layout.md` — the life-tracker card entry, for the map/name
  containment band at high player counts (fit, no clip, no gutter spill).

Precedence #2 note: the idea folder
`PRD/ideasForLater/life-tracker-me-map-and-tray/` framed this (its "tray" half is
already owned elsewhere as DEC-139 and is out of scope here — see Constraints).

## Constraints (don't rediscover)

- **Mock-default must keep working** — this is a pure frontend/presentation
  change; touch no backend, no provider path, no `GameContext` seed contract
  (DEC-102), no persistence shape (DEC-103). The commander-damage *data* model is
  unchanged; only how cells are arranged/sized changes.
- **Don't reopen the counter-panel tray shape.** The panel being a full-height
  overlay is DEC-139, owned by the `chrome-hit-areas-and-mid-flight-exits`
  package; this brief changes only the *matrix arrangement inside* the panel, not
  the panel's height/overlay treatment. Two packages must not ship contradictory
  panel treatments.
- **Keep the existing life/commander-damage behaviors** — always-on
  commander-damage-decrements-life, the `−`/`+` bands (~53px, REQ-112), the "me"
  self-cell, seat rotation as the sole life-zone orientation input (DEC-136).
- **Both layout modes** — the map must derive from the active arrangement so it
  stays correct in grid *and* list mode.
- Out of scope (deferred, per the idea folder): per-player theming, history,
  mana/dice, auto-KO, the panel tray reshape.

## Evidence + reusable tooling

`PRD/work/probe-life-tracker-seat-map/` (this folder):
- `references/fullTable.PNG`, `references/player1..6.PNG` — owner reference of the
  target seat-map behavior (6 seats).
- `references/current-default.png` (4p), `current-6p.png`, `current-8p.png` —
  measured current roster-order grid.
- `references/current-panel-6p-p1.png` — current counter-panel matrix.
- `references/current-8p-mobile-overflow.png` — the 7–8-player clipping / name
  collision.
- The decode and measurements are inlined in **Why** above; re-run via `npm run
  dev` then the life tracker at `/life-tracker`, Game Setup → player count.

## What the graph run should produce

A DESIGN-BRIEF that turns the on-card commander-damage preview and the opened
counter-panel matrix into per-seat maps built from `seatArrangement` /
`listSeatArrangement` geometry (me at own seat, opponents in their table
directions, damage-value + name cell content, per-seat viewpoint on the rotated
card), plus a containment fix so the map and name pill fit inside the card at
2–8 players in both layout modes; the matching amendments to
`PRD/sections/life-tracker/README.md`, a new seat-map REQ in
`functional-requirements.md`, and the `screen-layout.md` containment band; and the
slices that implement it with live verification at 4 / 6 / 8 players. The four
decisions under **Decisions already made** are settled — the run must not reopen
them.

## How to hand this off

/graph-kickoff "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players" PRD/work/probe-life-tracker-seat-map/GRAPH-BRIEF.md
