# Slice G — PRD Promotion and Ship Gates

## Status: pending

## Goal

Promote shipped behavior to PRD product truth, run full quality gates, and prepare the work package for cleanup.

## Requirements

### PRD promotion

- `PRD/sections/decisions/personalization.md` — **DEC-069**: layout density toggle (`chunky` default, `slim` compact), theme panel, localStorage, presentation-only
- `PRD/sections/functional-requirements.md` — **REQ-047** (or next available ID): density preference acceptance criteria
- `PRD/sections/decisions.md` — router index line for DEC-069
- Optional FLOW note if user-flow touches are needed for scan hide/show behavior (presentation only)

### Integration tests

- Density toggle persistence + state safety in `App.test.tsx`
- Zone grid scroll + scan hide tests (Slices B, C)
- Enrichment scroll cap test (Slice D)
- Easter egg tests (Slice A)

### Ship gates

```bash
npm run quality:check
```

### Manual acceptance

- Game context (players expanded, Easter egg)
- Zone collection: 5+ cards grid scroll; scan mode focused UI
- Enrichment View all cards with 5+ cards in one zone
- Chunky regression vs remembered baseline; slim visibly tighter
- Answered conversation with frozen summary expanded

## Acceptance criteria

- [ ] All slices A–F marked done in README slice table.
- [ ] DEC-069 and REQ-047 promoted to `sections/`.
- [ ] `npm run quality:check` passes.
- [ ] Manual spot-check list completed.

## Dependencies

- `sequential`: Slices A, B, C, D, E, F — all implementation complete

## Cleanup

After human confirms ship: run `thejudge-cleanup` to write receipt and delete `PRD/work/ui-compact-layout-refinement/`.

## Verification

```bash
npm run quality:check
```
