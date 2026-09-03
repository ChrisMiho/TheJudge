# Slice C — CounterPanel: re-verify the top-down seat-map matrix (unchanged)

## Status: planned

## Goal

The opened counter panel's commander-damage matrix is **not** part of the
owner's compact-horizontal clarification — it stays exactly what the prior
plan already built and shipped on this branch: an absolute top-down replica of
the table (the panel is a non-rotated centered dialog, DEC-139), opener
highlighted as "me" at their own seat, each opponent's `CommanderDamageCell`
at its own seat, unused slots empty, sized to `layout.columns × layout.rows`.

This slice's job is to confirm that design is still intact after slice A adds
the new compact-block builder alongside `buildSeatMapCells`, and to re-touch
`CounterPanel.tsx` **only if** slice A's changes to `seatMap.ts` moved
anything under it (they should not — slice A is additive).

## Starting state

`CounterPanel.tsx` currently (committed on this branch) builds its matrix from
`buildSeatMapCells(layout, players, player.label)`, with a grid template of
`repeat(layout.columns, ...)` / `repeat(layout.rows, ...)`, the opener's "me"
cell without `min-h-36`, and every opponent's `CommanderDamageCell` keeping its
`min-h-[53px]` `−`/`+` bands (REQ-112) and `onAdjustCommanderDamage` wiring.
This is correct under the reconciled `DESIGN-BRIEF.md`/REQ-173 and is not
being redesigned.

## Requirements

1. Confirm `CounterPanel.tsx` still imports and calls `buildSeatMapCells`
   (unchanged export from slice A) — not the new compact-block builder. The
   panel's geometry must never be swapped for the on-card one.
2. Confirm the matrix's grid template is still derived from
   `layout.columns`/`layout.rows`, not a fixed `grid-cols-2` and not the
   compact block's own shape.
3. Confirm the opener's "me" cell still has no `min-h-36`, and every
   opponent's cell still keeps its `min-h-[53px]` bands and
   `onAdjustCommanderDamage` wiring, unchanged.
4. If (and only if) slice A's edits to `seatMap.ts` required any adjustment to
   `buildSeatMapCells`'s exports or types to add the new builder alongside it,
   update `CounterPanel.tsx`'s import/usage to match — otherwise this file is
   untouched.
5. No change to the panel's dialog wrapper, tab structure, or overlay/scrim
   treatment (DEC-139).

## Acceptance criteria

- [ ] C1: `CounterPanel.tsx`'s commander-damage matrix still derives its cells
      from `buildSeatMapCells`, and its grid template is still
      `layout.columns`/`layout.rows`, not a fixed `grid-cols-2` class and not
      the on-card compact block's shape (grep/read evidence).
- [ ] C2: the opener's own "me" cell still has no `min-h-36` and still renders
      at the opener's own seat coordinate (existing `CounterPanel.test.tsx`
      case, re-run and passing).
- [ ] C3: every opponent's cell still renders its `−`/`+` bands at
      `min-h-[53px]` and still calls `onAdjustCommanderDamage` with the same
      arguments as before (existing `CounterPanel.test.tsx` case, re-run and
      passing).
- [ ] C4: `npm run test` passes for `CounterPanel.test.tsx` with no
      regressions from slice A's additive change to `seatMap.ts`.

## Verification

```bash
cd apps/frontend
npx vitest run src/components/portal/life-tracker/CounterPanel.test.tsx
grep -n "buildSeatMapCells\|layout.columns\|layout.rows\|grid-cols-2\|min-h-36" src/components/portal/life-tracker/CounterPanel.tsx
```

## Files touched

- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
  (conditional — only if slice A's export shape moved under it; expected to be
  a no-op)
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.test.tsx`
  (conditional, same reason)
