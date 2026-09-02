# Slice D — manual observation log

Live verification against `intake/references/fullTable.PNG` and
`player1..6.PNG`, run `graph-20260902-121645`, isolated dev server on port
5190 (`npm run dev --prefix apps/frontend -- --port 5190 --strictPort`),
Playwright MCP, viewport 430x900 (iPhone-portrait).

- 2026-09-02 D1: 7 players, grid layout, 430px. Captured
  `.playwright-mcp/d1-7p-grid.png` (full page) plus per-card crops
  (`d1-check-p1-card.png`, `d1-check-p5-card.png`). Every card's
  commander-damage block is 2 rows tall (confirmed via computed style:
  `gridTemplateColumns: repeat(4, ...)`, `gridTemplateRows: repeat(2, ...)`
  on every `commander-preview-Player N` element), reads horizontal, and is
  fully inside the card with the name pill — no cell clipped, no pill
  crushed or spilled. Matches the reference images' 2-row block shape.
  Observed.
- 2026-09-02 D2: 8 players, grid layout, 430px. Captured `d2-8p-grid.png`
  (full page, all 8 cards) plus a close crop of the tightest case,
  `d2-check-p8-card.png` (bottom-right corner card, rotation 270). Block is
  2 rows x 4 columns (full, no empty slots), fully contained, no clipping,
  name pill intact. Matches the brief's stated 2x4-at-8-players shape.
  Observed.
- 2026-09-02 D3: 7 players, list layout, 430px. Captured `d3-7p-list.png`.
  Every card's block reads horizontal (2 rows), including the head seat
  (Player 1, rotation 180) and the foot-less tail seats. No clipping, no
  crushed name pills. Observed.
- 2026-09-02 D4: 8 players, list layout, 430px. Captured `d4-8p-list.png`.
  Every card's block reads horizontal (2 rows x 4 columns) — critically,
  this is the exact combination the prior (pre-re-scope) design broke: list
  mode inherited `listSeatArrangement`'s tall stacked shape and overflowed
  the card bottom. Here the block does **not** inherit that shape; it reads
  identically to grid mode. No clipping, no crushed name pills. Observed.
- 2026-09-02 D5: 7-player grid layout, both side-column rotations checked.
  Player 1 (rotation 90, left column) and Player 5 (rotation 270, right
  column): captured each card in isolation, confirmed via
  `getComputedStyle(...).transform` that the content box carries exactly
  the seat's own rotation (matrix forms of `rotate(90deg)` /
  `rotate(270deg)`) with no separate counter-rotation applied to the block
  or its glyphs anywhere in `PlayerLifeCard.tsx`. Digitally counter-rotated
  each crop (`d1-check-p1-card.png`, `d1-check-p5-card.png`) by the seat's
  own angle to reconstruct the seated player's actual view: in both cases
  the name pill and life number read upright, and the block reads as a
  correct 2-row horizontal grid with "me" at its own corner — not sideways.
  This is the same single-rotation mechanism DEC-136 already established
  for the life number (no counter-rotation layer for either); the block
  inherits it and reads correctly by construction. No fix needed; glyphs
  already read upright relative to the seated player. Observed.
- 2026-09-02 D6: runtime cleanup. `browser_close` called; owned dev server
  (PID captured at launch, port 5190, `run_in_background` task id
  `blsiu9prk`) stopped via its process handle and exit confirmed; `lsof
  -ti:5190` returned empty (port released). Capture output path:
  `PRD/work/life-tracker-seat-map/.playwright-mcp/`. Observed.
