# Design brief — life-tracker-seat-map

> ## Amendments (2026-09-03) — shipped design supersedes the compact block below
>
> **Everything below describing the on-card map as a "compact horizontal block"
> (at most 2 rows, growing wider, the whole card never rotated) is superseded and
> was not shipped.** What actually shipped, verified live and in PR #182:
>
> - **On-card map = top-down arrangement miniature**, the same `buildSeatMapCells`
>   the panel uses — the grid's `columns × rows` block, the list's vertical stack —
>   with **"me" in the player's own seat**. It is *not* a compact 2-row block, and
>   no `buildCompactSeatMapCells` was ever created.
> - **The card content rotates (DEC-136); the map counter-rotates** by the same
>   angle to stay screen top-down (me in the player's real corner), glyphs rotated
>   back to face the seat. The real bug was the map spinning with the card.
> - **List legibility/containment fix:** the list/upright map's **width** scales off
>   the column count and card height (not the arrangement aspect ratio, which had
>   collapsed an 8-player list map to a 17px vertical sliver).
> - **Grid life-adjust split = fixed left/right** (tap left = −, right = +), ± reflowed
>   to the card edges, screen-upright; list keeps its per-seat rotation split.
>
> Authoritative product truth is REQ-081 and the **reworded REQ-173**. The
> compact-block sections and the "Owner clarification (2026-09-02)" below are kept
> for history only.

- Slug: `life-tracker-seat-map`
- Status: refined
- Surfaces touched: `PlayerLifeCard.tsx` (on-card commander-damage preview),
  `CounterPanel.tsx` (opened commander-damage matrix), `PlayerLifeTrackerApp.tsx`
  (prop wiring — passes the active arrangement down). Pure frontend/presentation.

## What the player gets

Open the life tracker. Every player's card now carries a tiny map of the table
instead of a roster list, drawn as a **compact horizontal block** — at most two
rows tall, growing wider as players are added — the exact look of the reference
images. On your own card **"me" sits in your own seat corner**, with each
opponent placed around it by their real table direction as far as the compact
block allows. Tap a player's cell (via the preview, which opens the panel) to
log the commander damage they dealt you. Across cards "me" never lands in the
same block cell twice, and the block reads as the table from each seat as a
best-effort outcome within its compact shape.

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

## Owner clarification (2026-09-02) — on-card map is a compact horizontal block

Recorded from `observations.md` and a confirmed design decision (the owner chose
"always compact & horizontal"). **This supersedes the on-card parts of "What the
player gets", "Design direction", "Resolved decisions", and acceptance criteria 1
and 3–4 below wherever they differ.** The counter panel (slice C) is unaffected —
the owner is "okay with things changing" once a panel is opened, and its top-down
seat-map matrix stands unchanged.

- **Outcome, not mechanism.** The on-card commander-damage mini-map renders as a
  **compact, horizontal block** — the *exact* look of the reference images
  (`intake/references/fullTable.PNG`, `player1..6.PNG`): a small grid **at most 2
  rows tall** that grows **wider** as players are added, "me" in the current
  player's own seat corner, opponents around it.
- **Same block in both layout modes.** It does **not** inherit
  `listSeatArrangement`'s tall stacked shape in list mode. Grid layout already
  renders this correctly (measured horizontal + contained at 7 and 8 players
  in the prior build); list layout must match it. The mini-map's shape is
  therefore **decoupled from the page's layout mode** — in list layout it stops
  literally mirroring the stacked-card positions, by the owner's explicit choice,
  in exchange for matching the reference everywhere.
- **7–8 players extrapolate sideways.** The references only go to 6. Extend the
  same 2-row block **wider** for 7 and 8 players (e.g. "me" + up to 7 opponents in
  a 2×4 block) — never a taller strip, never a near-square `ceil(√N)` blob, and no
  downgrade of the 2–6-player look.
- **Never rotate the whole card.** The fix is the mini-map's internal layout only.
  The card's existing content rotation for the life number (DEC-136) is unchanged.
  (The prior build over-scoped a callout into rotating the entire component — that
  is explicitly out of scope.)
- **Seat-consistency is preserved as an outcome** — one "me" cell at the player's
  own seat, each opponent placed by their real table direction, no two cards
  sharing a "me" position — *within* the compact block. Where a table's true
  geometry cannot fit 2 rows (7–8 players), readability, containment, and the
  reference look win over exact directional fidelity.
- **Cell order/mapping is corrected** as part of this work (the owner's "then fix
  the order displayed").
- **Verified live** at 7 and 8 players, iPhone-portrait, in **both** grid and list
  layout, against the references — measured, not reasoned from code.

## Design direction

### The panel matrix is a miniature of the arrangement; the on-card map is a compact block

`seatArrangement(count)` (grid mode) and `listSeatArrangement(count)` (list mode)
already return, per seat, `{ label, side, rotation, gridArea, gridRow,
gridColumn }` plus the table's `columns` / `rows`. `PlayerLifeTrackerApp`
computes the active one as `layout` and lays the real cards out on a
`columns × rows` CSS grid, each card at its own `gridRow`/`gridColumn`.

**The counter panel's matrix becomes a miniature of that same grid** — build it
with `layout.columns × layout.rows`, place each seat's `CommanderDamageCell` at
its own seat's `gridRow` / `gridColumn` (and `gridArea` where a seat spans, e.g.
the 3-player head seat), highlight the opener's own cell as "me", and leave any
grid slot with no seat empty. This replaces the fixed `grid-cols-2` roster loop
in `CounterPanel`.

**The on-card mini-map does not use that arrangement shape** (owner clarification
above). It renders as a compact horizontal block — at most 2 rows, growing wider
with more players — never the tall `layout.columns × layout.rows` arrangement and
never a near-square `ceil(√N)` blob. "me" sits in the current player's own seat
corner; opponents are placed around it by real table direction as a best-effort
outcome within the block. It replaces the roster-order `players.map` + `ceil(√N)`
`previewColumns` in `PlayerLifeCard`.

Because each card marks "me" in its own distinct block cell, **no two cards ever
put "me" in the same cell**. The panel matrix derives from whichever arrangement
is active, so it is a true top-down replica of the on-screen table in both grid
and list mode; the on-card block matches the reference look everywhere.

### On-card glyphs read upright; the whole card is never rotated

The card's life-number content is already rotated by `placement.rotation` (the
sole life-zone orientation input, DEC-136), and that stays. The on-card mini-map
itself is the compact horizontal block above — its shape is fixed, not spun with
the card, and **the whole card is never rotated** (the prior build over-scoped a
callout into rotating the entire component; that is out of scope). The block's
cell glyphs (the damage number, "me") should still read the right way up for the
seated player.

- **Verification owed at map-out/implement (do not assume):** confirm live that
  the block's glyphs are not sideways relative to the seated player at the
  90°/270° side-column seats — the same class of bug the card's life number
  already solves. If they read sideways, counter-rotate the glyphs only (never
  the block, never the card), matching the life-number treatment.

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

- Lay the on-card map out as the compact horizontal block — at most 2 rows,
  growing wider as players are added (e.g. a 2×4 block at 8 players) — never the
  near-square `ceil(√N)` blob and never the tall `layout.columns × layout.rows`
  arrangement shape. The block stays within the card's short edge because it
  grows sideways, not down.
- Constrain the block **and** the name pill to sit within the card's inner
  content box at every count so neither is clipped by `overflow-hidden` nor
  spills into the inter-card gutter.
- **Verify live at 7 and 8 players, iPhone-portrait (~430px), in both grid and
  list layout.**

## Acceptance criteria

1. On every card, the commander-damage preview is a compact horizontal block
   (criterion 3) with the current player's "me" cell in their own seat corner and
   each opponent placed around it by real table direction as a best-effort outcome
   within the block; no two cards share a "me" cell position. Where a table's true
   geometry cannot fit the 2-row block (7–8 players), containment and the reference
   look win over exact directional fidelity. Verified at 4 / 6 / 8 players, grid
   and list.
2. The opened counter panel's commander-damage matrix is the same seat map: the
   opener highlighted as "me" at their seat, each opponent's cell at their seat,
   unused slots empty. No fixed `grid-cols-2` roster order; no oversized "me"
   tile.
3. (Superseded for the on-card map by the 2026-09-02 owner clarification above.)
   The **on-card** commander-damage mini-map renders as a compact horizontal block
   — at most 2 rows, growing wider with more players — matching the reference in
   **both** grid and list layout; it does not inherit list mode's tall stacking.
   The **counter panel** matrix remains a top-down seat map (criterion 2). Seat
   consistency (one "me" at the player's own seat, opponents by real direction, no
   two cards sharing a "me" position) holds within the compact block.
4. On-card map + name pill are fully inside the card at every player count 2–8,
   both layouts, iPhone-portrait: no cell clipped by `overflow-hidden`, name pill
   not crushed or spilled into the gutter, and the block reads horizontal (never a
   vertical strip). Verified live at 7 and 8 players.
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
  with the compact-block builder; render the preview as the compact horizontal
  block (at most 2 rows, growing wider), not `layout.columns × rows`; apply the
  containment sizing.
- `CounterPanel.tsx` — replace the `grid-cols-2` roster matrix and the oversized
  "me" tile with the top-down seat-map matrix; keep `CommanderDamageCell` bands
  and the decrements-life behavior.

## Resolved decisions (assumption ladder, orchestrated mode)

The four intake "decisions already made" and the one flagged open choice are
recorded here as resolved, with evidence, per the preparation contract:

- **Map model = per-seat viewpoint, best-effort within the compact block** — the
  on-card map is the compact horizontal block (owner clarification above); "me"
  sits in the player's own seat corner and opponents by real table direction as
  far as the 2-row block allows, and the panel matrix is the full top-down seat
  replica. Basis: the request outcome plus the owner's compact-horizontal
  decision. Ladder #2/#3.
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

- New **REQ-173** — commander-damage placement that reads as the table on both
  surfaces (a top-down seat-map matrix in the panel; a compact horizontal block
  on the card, seat-consistent as a best-effort outcome within it), with
  containment acceptance criteria.
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

## Amendments

### 2026-09-02 — HELD: on-card map reverts to the arrangement miniature (me at own seat)

**Item (owner, `HANDOFF.md`):** the on-card commander-damage mini-grid must be a
**miniature of the real table** — "me" at the viewer's own seat, each opponent at
the seat they actually occupy, cell order mirroring where players really sit
(the 2×2 for 4-player grid, the diamond for 4-player list, etc.). Then fix only
the 7–8-player containment bug without breaking that seat order. This reverses
the on-card design to the arrangement miniature and abandons the compact
horizontal block.

**Held — exceeds `thejudge-amend`. Route to `thejudge-refinement`.** This is not a
fold: it reverses a *settled* requirement that pervades this package —
`GATE-QUESTIONS.md` REQ-173's proposal ("the on-card commander-damage preview is
a compact horizontal block"), acceptance criteria 1/3/4 above, the
`Owner clarification (2026-09-02)` and `Design direction` sections, and slice
objectives A (add the compact-block builder), B (on-card → compact block) and D
(verify the compact-block shape). Amend may not rewrite settled requirements,
acceptance criteria, REQ-173, or slice objectives; reversing them is a refinement
round with the owner present.

**Load-bearing code-premise correction (verified on this branch, PR #182 head
`thejudge-auto/life-tracker-seat-map-work`):** the on-card code already renders
the arrangement miniature the owner wants. `PlayerLifeCard.tsx:121` uses
`buildSeatMapCells(layout, players, player.label)` — every player at their own
seat's `gridRow`/`gridColumn`/`gridArea`, viewer marked "me" — and lines 254–255
size the preview to `layout.columns × layout.rows`, so each card mirrors the real
table with "me" at that seat. `buildCompactSeatMapCells` does **not** exist
anywhere on this branch; the compact-horizontal re-scope landed in the **docs
only** (commits `eaa5aef`, `15f6ab2`, both `docs(graph)`). The HANDOFF's premise
that PR #182 shipped a compact fixed-corner block is therefore false for this
branch. **The reversal is a docs/spec reversal, not a code rewrite** — the spec
must be re-settled back to the arrangement miniature to match the code and the
owner's intent.

**Product truth it needs:** REQ-173 re-worded so the on-card map is a *per-seat
miniature of the active arrangement (me at own seat)* — not a compact horizontal
block — with containment (not block-shape) as the guarantee; the matching prose
in the proposed `PRD/sections/life-tracker/README.md` and `screen-layout.md`
diffs re-aligned the same way. Refinement writes these to `GATE-QUESTIONS.md`
(never `PRD/sections/`), and map-out re-slices: drop slice A (no compact
builder), re-point slice B to keep `buildSeatMapCells`, and re-frame slice D's
7–8-player containment to preserve seat order (the one genuine bug — `min-h-6
min-w-6` preview cells overflow the short card at high counts). Live verification
of order and containment owed at that point.

### 2026-09-02 — DONE (owner-directed, live): top-down map + clockwise seating

The owner directed the fix live in this session (superseding the HELD note
above) after live review disproved the HANDOFF premise. Three defects were
found and fixed in `PlayerLifeCard.tsx` / `seatArrangement.ts`, each verified in
the running app (Mac `localhost:5173`, iPhone-portrait ~430px) and against the
reference photos:

1. **On-card map rotated with the card** so "me" never landed in the player's
   own corner (grid looked scrambled; list looked closer only because its seats
   rotate 0/180). Fixed by counter-rotating the preview grid by
   `-placement.rotation` (absolute top-down positions) and rotating each glyph
   by `+placement.rotation` (still faces the seated player). "me" now lands in
   each player's real seat in both grid and list, 4/6/8 players.
2. **7–8-player containment.** 8-player grid is now fully contained (the old
   ~40px clip was the sideways rotation). 8-player list, iPhone-portrait, sits
   within ~3px (cell edge kisses the boundary, not visibly clipped) after
   scaling the cells/gap/padding with the card (`cqmin`), since the life number
   (DEC-136) dominates the stack height.
3. **Seat order (REQ-081).** The owner approved matching the photos: Player 1
   now sits nearest and the rest are seated clockwise, in both `seatArrangement`
   (grid: left column bottom-to-top, right column top-to-bottom) and
   `listSeatArrangement` (foot first, up the left column, head, down the right).
   `seatArrangement.test.ts` + `PlayerLifeTrackerApp/PlayerLifeCard/CounterPanel`
   tests updated; full frontend suite green (1309 passing), typecheck clean.

Product-truth still owed (not written here — refinement/owner-present):
`GATE-QUESTIONS.md` REQ-173 re-worded to the per-seat arrangement miniature
(me at own seat, absolute top-down, containment guarantee) and the REQ-081
seat-order note updated to "Player 1 nearest, clockwise." Slice docs A/B/D still
describe the abandoned compact block and need re-aligning at map-out.
