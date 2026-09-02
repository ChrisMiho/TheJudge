# Slice B — PlayerLifeCard: on-card preview becomes the seat map

## Status: planned

## Goal

The commander-damage preview on every card stops listing players in roster
order and instead becomes a miniature of the real table: "me" at the current
player's own seat, each opponent at the seat they actually occupy, sized to the
arrangement's real column/row count instead of a near-square `ceil(√N)` blob.

## Requirements

1. Remove `previewColumns` (the `Math.ceil(Math.sqrt(count))` near-square
   sizing) and `commanderDamagePreviewCells` (the roster-order `players.map`)
   from `PlayerLifeCard.tsx`.
2. Build the preview cells with `buildSeatMapCells(layout, players,
   player.label)` (slice A). Render the preview button's grid at
   `gridTemplateColumns: repeat(layout.columns, minmax(0, 1fr))` and
   `gridTemplateRows: repeat(layout.rows, minmax(0, 1fr))`, each cell placed at
   its own `gridRow`/`gridColumn` (and `gridArea` where a seat spans, e.g. the
   3-player head seat) from the layout-derived coordinates — not the mini-grid's
   scan order.
3. Cell content is unchanged: the current player's own cell still renders
   `"me"`; each opponent's cell still renders `player.commanderDamage[seat] ??
   0`. Only where each cell sits changes.
4. Containment: the preview grid + the player-name pill stay within the card's
   rotated content box at every player count 2–8, in both grid and list layout
   mode — keep sizing in container-query units (`cqmin`/`cqw`/`cqh`) so a seat
   map with more rows/columns at high player counts does not overflow the
   already-rotated, already-container-sized content box that `overflow-hidden`
   clips. (Live confirmation at the extremes, 7/8 players, is slice D's job —
   this slice's job is to not regress the existing container-query sizing
   discipline while switching the grid's shape and cell placement.)

## Acceptance criteria

- [ ] B1: `previewColumns` and `commanderDamagePreviewCells` no longer exist in
      `PlayerLifeCard.tsx` (grep evidence).
- [ ] B2: the preview grid's `gridTemplateColumns`/`gridTemplateRows` equal
      `layout.columns`/`layout.rows` — verified for an 8-player grid-mode
      arrangement (`columns: 2`, not `ceil(√8) = 3`) and a 4-player arrangement
      (component test).
- [ ] B3: each opponent's preview cell's `gridRow`/`gridColumn` equals that
      opponent's own seat placement in the active `layout` — verified for at
      least one 4-player and one 8-player case, including a seat that is not in
      roster-index order relative to the viewer (component test).
- [ ] B4: exactly one preview cell renders `"me"`, and it sits at the current
      player's own seat coordinate, not a fixed roster index (component test).
- [ ] B5: `npm run test` passes for `PlayerLifeCard.test.tsx`.

## Verification

```bash
cd apps/frontend
npx vitest run src/components/portal/life-tracker/PlayerLifeCard.test.tsx
grep -n "previewColumns\|commanderDamagePreviewCells" src/components/portal/life-tracker/PlayerLifeCard.tsx || echo "removed"
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx`
