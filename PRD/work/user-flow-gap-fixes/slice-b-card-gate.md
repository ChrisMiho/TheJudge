# Slice B — At least one card in selected zones

## Status: planned

## Depends on

Slice A

## Goal

Prevent advancing or submitting when the user selected zones but added no cards anywhere.

## Requirements

- **Zone collection → Continue:** disabled until at least one selected zone has ≥1 card:
  - `selectedZones.some(z => (zones[z]?.length ?? 0) > 0)`
- **Enrichment → Decrypt Stack:** same rule (handles removing all cards in enrichment).
- Shared helper e.g. `hasAtLeastOneCardInSelectedZones(selectedZones, zones)` in `contextFlow`; export from `index.ts`.
- Extend `FlowNavigationState` to include `selectedZones` + zone card map for `canAdvance("zone-collection")` and `canAdvance("enrichment")`.
- Replace copy in `ZoneCollectionStep`: remove “You can skip zones with zero cards”; explain at least one selected zone needs a card; other selected zones may stay empty.
- Remove or replace enrichment copy “No cards added — ask a timing question below” (conflicts with gate).
- `ZoneCollectionStep`: `canContinue` prop; disable Continue + hint when gate fails.
- `App.tsx` wires `canAdvance` / shared helper into steps.

## Files

- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/contextFlow/index.ts`
- `apps/frontend/src/lib/contextFlow/flow.test.ts`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/App.test.tsx`

## PRD note (full text update in slice D)

Revises **DEC-024**: no longer allow zero-card submit for timing-only questions in this flow.

## Acceptance

- [ ] Cannot Continue from collection with zero cards across all selected zones.
- [ ] Cannot Decrypt when all cards removed in enrichment.
- [ ] Can Continue when one zone has one card and other selected zones are empty.
