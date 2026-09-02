# Slice B — PlayerLifeCard: on-card preview becomes the compact horizontal block

## Status: planned

## Goal

The commander-damage preview on every card stops being sized to the active
arrangement's real `columns`/`rows` (the prior design) and becomes the
compact, horizontal block from slice A — at most 2 rows, growing wider as
players are added — matching the reference images
(`intake/references/fullTable.PNG`, `player1..6.PNG`), the **same** shape in
grid layout and list layout. "Me" sits in the current player's own seat
corner; opponents sit around it as a best-effort outcome. The whole card is
never rotated — only the block's own internal grid changes.

## Starting state

`PlayerLifeCard.tsx` currently (committed on this branch) calls
`buildSeatMapCells(layout, players, player.label)` and renders the preview
button's grid at `gridTemplateColumns: repeat(layout.columns, ...)` /
`gridTemplateRows: repeat(layout.rows, ...)` — each cell placed at its own
`gridArea`/`gridRow`/`gridColumn` from the active arrangement. That is the
mechanism this slice replaces.

## Requirements

1. Replace the `buildSeatMapCells` call and the `layout.columns`/`layout.rows`
   grid template in `PlayerLifeCard.tsx`'s commander-damage preview with the
   compact-block builder from slice A. The preview button's grid template
   comes from the block's **own** declared column/row count, never from
   `layout.columns`/`layout.rows`, and never `Math.ceil(Math.sqrt(count))`.
2. The block is at most 2 rows tall at every player count 2–8, growing wider
   (more columns) as players are added — e.g. 8 players renders as a 2×4
   block, not a 4×2 or `ceil(√8)=3` square.
3. The current player's own cell renders `"me"` at a fixed corner of the
   block; every other cell renders `player.commanderDamage[seat] ?? 0` as
   today. Cell *content* is unchanged — only placement and the grid's own
   shape change.
4. The block renders identically (same shape for the same player count) in
   both grid layout mode and list layout mode — it must **not** inherit
   `listSeatArrangement`'s tall stacked shape the way the prior
   `layout.columns`/`layout.rows` mechanism did.
5. The whole card is never rotated by this change. The existing rotated,
   container-query-sized content box (DEC-136's mechanism, `rotate()` on
   `content-<label>`) is untouched — the block rides inside it exactly like
   the old preview did.
6. Containment: the block plus the player-name pill stay within the card's
   rotated content box at every player count 2–8, in both grid and list
   layout mode — keep sizing in container-query units (`cqmin`/`cqw`/`cqh`) so
   the block's own shape at high player counts does not overflow the already
   rotated, already container-sized content box that `overflow-hidden` clips.
   (Live confirmation at the extremes, 7/8 players, against the reference
   images is slice D's job — this slice's job is to not regress the existing
   container-query sizing discipline while switching the grid's shape.)

## Acceptance criteria

- [ ] B1: `PlayerLifeCard.tsx`'s preview grid template is never derived from
      `layout.columns`/`layout.rows` and never `Math.ceil(Math.sqrt(...))`
      (grep evidence: neither identifier appears wired into the preview grid
      template).
- [ ] B2: the preview grid has at most 2 rows at every tested player count
      (2, 4, 6, 8) — verified via the component's rendered grid template
      (component test).
- [ ] B3: at 8 players the preview grid is wider than it is tall (more columns
      than rows), not a near-square `ceil(√8)=3` grid and not a tall stack
      (component test).
- [ ] B4: exactly one preview cell renders `"me"`, at a fixed corner position,
      for the current player's own label — verified for at least one 4-player
      and one 8-player case (component test).
- [ ] B5: the preview's rendered shape (row/column count) for a given player
      count is the same whether the card is rendered with a grid-mode
      `layout` or a list-mode `layout` for that same count (component test
      comparing both).
- [ ] B6: `npm run test` passes for `PlayerLifeCard.test.tsx`.

## Verification

```bash
cd apps/frontend
npx vitest run src/components/portal/life-tracker/PlayerLifeCard.test.tsx
grep -n "layout.columns\|layout.rows\|ceil(Math.sqrt" src/components/portal/life-tracker/PlayerLifeCard.tsx || echo "removed"
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
