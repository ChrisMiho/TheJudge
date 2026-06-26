# Slice D — Enrichment List Scroll Cap

## Status: pending

## Goal

In enrichment **View all cards** mode (`viewMode === "list"`), cap each zone's card list to **4 visible full-width edit rows** with internal scroll for additional cards. Card-by-card wizard mode is unchanged.

## Requirements

1. Wrap each zone's `<ul className="space-y-3">` in list mode with `.scroll-cap-4-enrichment` (or equivalent): `max-height` for 4 rows + `overflow-y-auto`.
2. Tune `--enrichment-card-row-height` so four typical rows (with targets/notes) fit before scroll.
3. Zones with ≤4 cards: no effective scroll (natural height within cap).
4. Wizard mode (`viewMode === "wizard"`) untouched.

## Acceptance criteria

- [ ] Toggle to View all cards with 5+ cards in one zone → list container scrolls.
- [ ] All enrichment fields reachable by scrolling within the zone list.
- [ ] Wizard card-by-card flow unchanged.
- [ ] Existing enrichment / decrypt tests pass.

## Dependencies

- `parallel-ready`: REQ-025 / FLOW-005 (enrichment step behavior)

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/index.css` (`.scroll-cap-4-enrichment`)
- `apps/frontend/src/App.test.tsx` and/or new `EnrichmentStep.test.tsx`

## Verification

```bash
npm --workspace apps/frontend run test -- src/App.test.tsx
npm --workspace apps/frontend run typecheck
```

## Notes

Incremental improvement only — page may still be tall with multiple zones and the decrypt form below.
