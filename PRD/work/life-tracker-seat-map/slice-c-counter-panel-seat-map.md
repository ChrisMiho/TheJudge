# Slice C — CounterPanel: commander-damage matrix becomes the seat map

## Status: planned

## Goal

The opened counter panel's commander-damage matrix stops being a fixed
two-column roster loop with an oversized "me" tile and becomes the same seat
map as the card preview: an absolute top-down replica of the table (the panel
is a non-rotated centered dialog, DEC-139), opener highlighted as "me" at their
own seat, each opponent's `CommanderDamageCell` at its own seat.

## Requirements

1. Replace the `role="group" aria-label="Commander damage by source"` element's
   fixed `grid-cols-2` template and `players.map` roster loop with
   `buildSeatMapCells(layout, players, player.label)` (slice A). Grid template:
   `gridTemplateColumns: repeat(layout.columns, minmax(0, 1fr))`,
   `gridTemplateRows: repeat(layout.rows, minmax(0, 1fr))`; each cell placed at
   its own `gridRow`/`gridColumn`/`gridArea` from the seat-map coordinates.
2. The opener's own cell keeps its `data-testid="commander-cell-<label>"` and
   renders `"me"`, but drops `min-h-36` — it becomes a normal seat-sized cell,
   not an oversized tile.
3. Every opponent's cell stays exactly `CommanderDamageCell` as it exists today
   — same `−`/`+` bands (`min-h-[53px]`, REQ-112), same
   `onAdjustCommanderDamage` wiring, same value source
   (`player.commanderDamage[source.label] ?? 0`). Only its grid placement
   changes.
4. No change to the panel's dialog wrapper, tab structure, or overlay/scrim
   treatment (DEC-139) — this slice touches only the commander-damage matrix
   container inside the "Player" tab.

## Acceptance criteria

- [ ] C1: the commander-damage matrix container no longer has a fixed
      `grid-cols-2` class; its grid template derives from `layout.columns`/
      `layout.rows` — verified for an 8-player arrangement where `columns: 2`
      would coincidentally match `grid-cols-2` by value but must now come from
      `layout`, not a hardcoded class (component test checking the computed
      style, not the class name).
- [ ] C2: each opponent's cell's `gridRow`/`gridColumn` matches that opponent's
      own seat placement in the active layout (component test, at least one
      4-player and one 8-player case).
- [ ] C3: the opener's own "me" cell no longer carries `min-h-36`; it renders at
      the opener's own seat coordinate (component test).
- [ ] C4: every opponent's cell still renders its decrease/increase buttons at
      `min-h-[53px]` and still calls `onAdjustCommanderDamage` with the same
      arguments as today (existing behavior, re-verified by the updated test).
- [ ] C5: `npm run test` passes for `CounterPanel.test.tsx`.

## Verification

```bash
cd apps/frontend
npx vitest run src/components/portal/life-tracker/CounterPanel.test.tsx
grep -n "grid-cols-2\|min-h-36" src/components/portal/life-tracker/CounterPanel.tsx || echo "removed"
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`
