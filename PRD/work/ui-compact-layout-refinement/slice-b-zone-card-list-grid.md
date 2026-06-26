# Slice B — Zone Card List Grid

## Status: done

## Goal

Replace the full-width vertical card rows in `ZoneCardPicker` with a compact 2-column tile grid that shows **at most 4 cards** (2×2) before scrolling, using the same layout for every zone including stack.

## Requirements

1. Replace list rows (`flex justify-between` full width) with `grid grid-cols-2 gap-2` compact tiles.
2. Each tile: thumb (`h-20 w-14`), truncated name, owner or stack position label, Remove button at bottom of tile.
3. Grid container: `overflow-y-auto` with `max-height` tuned to exactly **2 tile rows** (4 cards visible). Use `.zone-card-grid` + `--zone-card-tile-height` CSS variable or equivalent.
4. Preserve `aria-label` on Remove buttons and `formatStackPosition` labels.
5. Zone tabs, search, scan entry, and preview flows unchanged.

## Acceptance criteria

- [ ] With 2 cards, both visible in grid without scroll.
- [ ] With 5+ cards, grid container scrolls; 5th card reachable via scroll.
- [ ] Remove button still calls `onRemoveCard` with correct `cardId`.
- [ ] Stack position labels (`bottom`, `top`, etc.) still render on tiles.
- [ ] Existing `ZoneCardPicker` scan bubble tests still pass.

## Dependencies

- `parallel-ready`: DEC-050 (scan is alternate input; list layout independent)

## Files touched

- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/index.css` (optional `.zone-card-grid` utility)
- `apps/frontend/src/components/ZoneCardPicker.test.tsx` and/or `apps/frontend/src/App.test.tsx`

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ZoneCardPicker.test.tsx
npm --workspace apps/frontend run test -- src/App.test.tsx
npm --workspace apps/frontend run typecheck
```
