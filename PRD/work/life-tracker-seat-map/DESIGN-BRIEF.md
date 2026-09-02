# Design brief — life-tracker-seat-map

- Slug: `life-tracker-seat-map`
- Status: refined
- Surfaces touched: `PlayerLifeCard.tsx` (on-card commander-damage preview),
  `CounterPanel.tsx` (opened commander-damage matrix), `PlayerLifeTrackerApp.tsx`
  (prop wiring — passes the active arrangement down). Pure frontend/presentation.

## What the player gets

Open the life tracker. Every player's card now carries a tiny map of the table
instead of a roster list. On your own card, **"me" sits where you actually
sit**, and each opponent's cell sits in the direction that player is really
sitting — the person on your left is on the map's left, the person across the
table is across. Tap a player's cell (via the preview, which opens the panel) to
log the commander damage they dealt you. Every card agrees on one seat layout,
"me" never lands in the same map cell on two different cards, and the map reads
as the physical table from each seat.

Open a player's counter panel and the bigger commander-damage matrix inside it
is the same seat map, not a fixed two-column roster with an oversized "me" tile.

At 7 and 8 players the map and the player-name pill now stay fully inside the
card at every seat — no clipped outer column, no name pill crushed into the
gutter between cards.

## Why (measured, from intake — treated as claim, adopted as direction)

Two defects, measured live in the running app at 4 / 6 / 8 players (intake
`GRAPH-BRIEF.md`, evidence in `intake/references/`):

1. **The grid is roster order, not a seat map.** Today
   `commanderDamagePreviewCells` maps `players` in fixed roster order (`Player 1
   → N`) and only moves the `me` mark to the current player's roster index; the
   card's rotation then spins that identical grid. So no two cards agree on where
   anyone sits and the "me" cells bunch toward the table's middle. The panel has
   the same shape: a fixed `grid-cols-2` roster loop with an oversized
   (`min-h-36`) "me" tile at the opener's roster index.
2. **At 7–8 players the on-card grid overflows and clips.** `previewColumns`
   uses `ceil(√N)` — a near-square 3×3 blob at 8 players — sized in
   container-query units off the card's rotated long axis, so it spills past the
   short-edge cards and is cut by the card's `overflow-hidden`, crushing the name
   pill into the gutter.

Per the intake-is-evidence rule these findings are adopted as design direction,
not as settled product truth; the durable product-truth change they drive gates
in `GATE-QUESTIONS.md`.

## Design direction

### The map is a miniature of the arrangement we already compute

`seatArrangement(count)` (grid mode) and `listSeatArrangement(count)` (list mode)
already return, per seat, `{ label, side, rotation, gridArea, gridRow,
gridColumn }` plus the table's `columns` / `rows`. `PlayerLifeTrackerApp`
computes the active one as `layout` and lays the real cards out on a
`columns × rows` CSS grid, each card at its own `gridRow`/`gridColumn`.

The commander-damage map becomes a **miniature of that same grid**:

- Build the mini-grid with `layout.columns × layout.rows`.
- Place each seat's cell at *its own seat's* `gridRow` / `gridColumn` (and
  `gridArea` where a seat spans, e.g. the 3-player head seat) — the current
  player's cell renders "me", every opponent's cell renders the
  commander-damage value (on-card) or the opponent's `CommanderDamageCell`
  (panel), and any grid slot with no seat renders empty.
- This replaces the roster-order `players.map` + `ceil(√N)` `previewColumns` in
  `PlayerLifeCard`, and the fixed `grid-cols-2` roster loop in `CounterPanel`.

Because each card places "me" at its own distinct seat coordinate, **no two
cards ever put "me" in the same map cell** — the property falls out of using
per-seat coordinates and needs no separate guard.

The map derives from whichever arrangement is active, so it is a true replica of
the on-screen table in both grid and list mode.

### On-card per-seat viewpoint rides the existing card rotation

The card's content box is already rotated by `placement.rotation` (the sole
life-zone orientation input, DEC-136). A map drawn in table coordinates inside
that already-rotated box rides the same rotation, so it reads egocentrically from
each seat — the same mechanism that already faces the life number toward the
seated player. The cell glyphs (the number, "me") sit inside that rotated content
box, so they face the seated player without extra work.

- **Verification owed at map-out/implement (do not assume):** confirm live that
  the map glyphs are not sideways relative to the seated player at the 90°/270°
  side-column seats — the same class of bug the card's life number already
  solves. If they read sideways, counter-rotate the glyphs only (not the map),
  matching the life-number treatment.

### The opened counter panel: absolute top-down seat map, "me" highlighted

The panel is a centered dialog and is **not** rotated (DEC-139 overlay shape —
out of scope to reopen). Its seat map is therefore an **absolute top-down replica
of the table**: the arrangement's `columns × rows` grid, each opponent's
`CommanderDamageCell` at its own seat coordinate, the opener's own seat cell
highlighted as "me", unused slots empty. See **Resolved decisions** for why
top-down beats rotating the panel to the opener's viewpoint.

Preserved unchanged inside the panel: each opponent cell keeps its always-visible
`−` / `+` bands (~53px, REQ-112); incrementing an opponent's commander damage
still decrements this player's life (always on); the oversized `min-h-36` "me"
tile is dropped — "me" becomes a normal-sized highlighted seat cell so the matrix
reads as a map. Only the *arrangement* of cells changes, never the panel's
height/overlay treatment.

### Containment fix (7–8 players, both layout modes)

- Size the on-card map to the table's **real column count** (`layout.columns` —
  1 for 2 players, 2 for 3–8) and real row count, not the near-square
  `ceil(√N)`. The map becomes a narrow strip matching the table's own shape
  rather than a blob wider than the card's short edge.
- Constrain the map **and** the name pill to sit within the card's inner content
  box at every count so neither is clipped by `overflow-hidden` nor spills into
  the inter-card gutter.
- **Verify live at 7 and 8 players, iPhone-portrait (~430px), in both grid and
  list layout.**

## Acceptance criteria

1. On every card, the commander-damage preview places the current player's "me"
   cell at that player's own seat and each opponent's cell at the seat that
   player occupies in the active arrangement; no two cards share a "me" cell
   position. Verified at 4 / 6 / 8 players, grid and list.
2. The opened counter panel's commander-damage matrix is the same seat map: the
   opener highlighted as "me" at their seat, each opponent's cell at their seat,
   unused slots empty. No fixed `grid-cols-2` roster order; no oversized "me"
   tile.
3. The map derives from the active arrangement (`seatArrangement` in grid mode,
   `listSeatArrangement` in list mode) and stays a correct table replica in both.
4. On-card map + name pill are fully inside the card at every player count 2–8,
   both layouts, iPhone-portrait: no cell clipped by `overflow-hidden`, name pill
   not crushed or spilled into the gutter. Verified at 7 and 8 players.
5. Preserved: always-on commander-damage-decrements-life; the panel opponent
   cells' `−`/`+` bands (~53px, REQ-112); the "me" self-cell (DEC-136); seat
   rotation as the sole life-zone orientation input (DEC-136); the panel's
   full-height overlay shape (DEC-139).
6. No backend, provider path, `GameContext` seed contract (DEC-102), or
   persistence shape (DEC-103) change; mock-default keeps working.

## Surfaces and wiring

- `PlayerLifeTrackerApp.tsx` — already computes the active `layout`. Thread the
  full arrangement (its `columns` / `rows` / `seats`) into `PlayerLifeCard` and
  `CounterPanel`, which today receive only their own `placement` / `players`.
  Presentation-only prop additions.
- `PlayerLifeCard.tsx` — replace `previewColumns`/`commanderDamagePreviewCells`
  with the seat-map builder; render the preview grid at `layout.columns × rows`
  with per-seat placement; apply the containment sizing.
- `CounterPanel.tsx` — replace the `grid-cols-2` roster matrix and the oversized
  "me" tile with the top-down seat-map matrix; keep `CommanderDamageCell` bands
  and the decrements-life behavior.

## Resolved decisions (assumption ladder, orchestrated mode)

The four intake "decisions already made" and the one flagged open choice are
recorded here as resolved, with evidence, per the preparation contract:

- **Map model = per-seat viewpoint** (each card is the table from that player's
  seat), adopted. Basis: the request outcome and the existing card-rotation
  mechanism (DEC-136) already deliver it. Ladder #2/#3.
- **Cell content unchanged** — on-card cells keep the damage value; panel cells
  keep player display-names; the reference's 1–5 relative-index labels are not
  adopted. Basis: position tells you *who*, the number tells you *how much*;
  preserves current cell semantics (ladder #5).
- **Scope = both surfaces** (on-card preview and panel matrix), adopted per the
  request.
- **Containment in scope**, adopted per the request; acceptance criteria 4.
- **Counter-panel orientation = absolute top-down replica with "me"
  highlighted**, not rotated to the opener's near/bottom viewpoint. This is the
  one choice the intake flagged as open. Resolved by the assumption ladder, not
  surfaced as a gate question, because it fails the genuine-fork test's condition
  2 — the PRD and code *do* provide an authoritative basis:
  - The panel is a non-rotated centered dialog by established design (DEC-139);
    it carries no rotation input, unlike the card (DEC-136). Rotating the whole
    matrix to the opener's viewpoint would add a new orientation mechanism to a
    surface that deliberately has none.
  - Top-down is the smaller reversible scope (ladder #4) and preserves the flat
    centered-dialog pattern (ladder #3/#5).
  - The intake itself names top-down as the acceptable outcome if rotating
    "proves fiddly"; it is fiddly precisely because the panel has no rotation
    input.
  - It still delivers the whole win: seat-consistent placement, no oversized
    "me" tile, opponents where they physically sit.

## Non-goals

- Reopening the counter-panel tray/overlay shape (DEC-139, owned by
  `chrome-hit-areas-and-mid-flight-exits`) — only the matrix arrangement inside
  the panel changes.
- Commander-damage data model, persistence shape (DEC-103), or `GameContext`
  seed contract (DEC-102).
- The reference screenshots' 1–5 relative-index labels.
- Per-player theming, history, mana/dice counters, auto-KO, or anything else the
  `life-tracker-me-map-and-tray` idea folder deferred.

## Product truth proposed

Durable product-truth change is needed and gates in `GATE-QUESTIONS.md`:

- New **REQ-173** — seat-consistent commander-damage placement across both
  surfaces, with containment acceptance criteria.
- Prose edits to `PRD/sections/life-tracker/README.md` (the life-table and
  counter-panel/commander-damage-matrix sections) making both surfaces explicit
  seat maps and adding the containment guarantee.
- An edit to the Player Life Tracker row in `PRD/sections/screen-layout.md`
  adding the map/name containment band at high player counts.

All three ride the single new stable id (REQ-173); no new FLOW, no new DEC (the
decision log is retired).

## Intake (evidence, not authority)

`intake/GRAPH-BRIEF.md`, `intake/PROBE.md`, `intake/references/` (owner reference
of the target seat map at 6 seats; measured before-state of the roster-order grid
and the 7–8-player clipping). Cited paths only; not re-fetched.
