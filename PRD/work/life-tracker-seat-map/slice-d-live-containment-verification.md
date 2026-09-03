# Slice D — Live containment + block-shape + orientation verification

## Status: SUPERSEDED (verification target changed)

> **Superseded.** This slice verified the abandoned compact-horizontal block.
> The shipped map is the top-down **arrangement miniature** (grid → the `columns
> × rows` block, list → the vertical stack), so the "at most 2 rows / horizontal"
> checks (D1–D4) no longer apply — the correct live checks are: the map mirrors
> the real table with "me" in the player's own seat, it stays contained at 2–8
> players in both layouts at ~430px, and a 7–8 player list map stays legible
> (width scaled off the column count, not collapsed to a sliver). D5 (glyphs read
> upright at 90°/270° side seats via glyph-only counter-rotation) did ship and
> holds. All counts were re-verified live with Playwright on 2026-09-03; captures
> under `.playwright-mcp/`. See REQ-173 (reworded) and `DESIGN-BRIEF.md`
> ## Amendments. The plan below is kept for history only.

## Goal

Prove, live in a running app rather than by reading code, that the on-card
compact-horizontal block from slice B actually reads as the reference images
— at most 2 rows, horizontal, growing wider — and stays inside the card at
the two hardest player counts, in both layout modes, at phone width; and that
the on-card glyphs read right-side-up from every seat, including the
90°/270° side-column seats. This is the browser-observable-risk slice per
`PRD/instructions/runtime-process-hygiene.md`: responsive geometry, shape, and
containment that component tests (jsdom, no real layout/paint) cannot
establish.

## Requirements

1. Start an isolated `vite` dev server for this checkout, owned by this
   slice's session (autonomous run: pick a free port, `npm run dev -- --port
   <port> --strictPort`, verify it started before navigating).
2. With Playwright MCP, set the viewport to iPhone-portrait (~430×900) and, for
   each of the 4 combinations {7 players, 8 players} × {grid layout, list
   layout}: set the player count and layout mode via Game Setup, then observe
   the rendered life table and screenshot it to
   `PRD/work/life-tracker-seat-map/.playwright-mcp/` (create the folder if
   absent). For each capture, confirm — as a plain visual read of the
   screenshot against `intake/references/fullTable.PNG` and `player1..6.PNG`,
   not a pixel-diff tool — that on every card:
   - the commander-damage block is at most 2 rows tall and reads horizontal
     (wider than tall), not a near-square blob and not a vertical strip;
   - no block cell is cut off by the card's edge;
   - the player-name pill is neither crushed into nor spilling past the
     gutter between cards.
3. Pick one card seated in a 90°/270° side column at 7 or 8 players (the left
   or right column in grid mode) and confirm its block glyphs (the damage
   numbers, "me") read upright relative to that seated player, the same way
   the card's life number already does — not sideways. If they read sideways,
   fix it by counter-rotating the glyphs only (not the block, not the card),
   matching the life-number treatment already in `PlayerLifeCard.tsx`, then
   re-verify the same seat.
4. Before ending this slice — success, failure, or blocker — run the full
   runtime-ownership cleanup contract in order: `browser_close`, stop the
   owned dev server through its exact process handle, wait for that process
   tree to exit, verify the port is released, and record the capture output
   path (or `none`) in this slice's evidence log.

## Acceptance criteria

- [ ] D1: at 7 players, grid layout, iPhone-portrait (~430px), every card's
      commander-damage block is at most 2 rows tall, reads horizontal, and is
      fully inside the card along with the player-name pill — no cell
      clipped, no name pill crushed or spilled into the gutter — matching the
      reference images.
- [ ] D2: same check at 8 players, grid layout.
- [ ] D3: same check at 7 players, list layout.
- [ ] D4: same check at 8 players, list layout — in particular the block does
      **not** inherit list mode's tall stacked shape; it reads the same
      horizontal block as grid mode.
- [ ] D5: at a 90°/270° side-column seat (7 or 8 players), the block's glyphs
      read upright relative to the seated player, not sideways — either
      because they already did, or because they were counter-rotated (glyphs
      only) and re-verified.
- [ ] D6: runtime cleanup complete — browser closed, the owned dev server
      process stopped and its exit confirmed, its port verified released, and
      the capture output path recorded (or `none`).

## Verification

```bash
# Isolated dev server, owned by this session
npm run dev --prefix apps/frontend -- --port <assigned-port> --strictPort
# Playwright MCP: resize to ~430x900, navigate to the life tracker, set
# player count + layout mode via Game Setup, screenshot each of the 4
# combinations to PRD/work/life-tracker-seat-map/.playwright-mcp/, and
# compare each against intake/references/fullTable.PNG / player1..6.PNG.
# Then: browser_close, stop the dev server by its owned process handle,
# and confirm the port is free:
lsof -ti:<assigned-port> || echo "port released"
```

## Files touched

- `PRD/work/life-tracker-seat-map/.playwright-mcp/` (screenshot captures,
  disposable — not committed, removed with the work folder at cleanup)
- `PRD/work/life-tracker-seat-map/slice-d.evidence.md` (dated manual-criterion
  observation lines)
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
  (conditional — only if D5 surfaces a sideways-glyph defect; counter-rotate
  the glyphs only, per the DESIGN-BRIEF's called-out contingency)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/life-tracker-seat-map/` ready to delete
