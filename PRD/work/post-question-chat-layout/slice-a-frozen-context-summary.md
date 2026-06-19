# Slice A - Frozen Context Summary

## Status: planned

## Goal

Add a reusable read-only frozen context summary for the answered-state display.

## Requirements

1. Create a compact frozen context summary UI that accepts a `GameContext` snapshot.
2. Show turn phase, combat step when relevant, active player when known, and populated zones with card names.
3. Include a disclosure control with `aria-expanded` that expands/collapses the full frozen context.
4. In the expanded state, show setup details, populated zones, card names, and enrichment details:
   - owner for non-stack zones when present
   - caster and mana spent for stack items when present
   - targets when present
   - context notes when present
   - oracle text or type metadata when useful and already available in the card item
5. Keep all rendered content read-only; do not render controls that mutate zone, card, target, or enrichment state.
6. Reuse existing labels and formatting helpers where practical:
   - `apps/frontend/src/lib/zoneLabels.ts`
   - `apps/frontend/src/lib/playerLabels.ts`
   - `apps/frontend/src/lib/enrichmentFormat.ts`
   - `apps/frontend/src/lib/contextFlow/index.ts` for canonical zone order if exported there

## Acceptance criteria

- [ ] A compact summary renders `Game context (frozen)` or equivalent read-only label, turn phase, active player when known, and populated zone card names.
- [ ] The disclosure control toggles full context visibility and exposes correct `aria-expanded` state.
- [ ] The expanded full context shows setup, zones, cards, and populated enrichment details from the frozen snapshot.
- [ ] No edit controls are present in the summary or expanded full context.
- [ ] Empty or missing optional frozen fields do not crash rendering.

## Verification

```bash
npm --workspace apps/frontend run test -- App.test.tsx
```

```bash
npm --workspace apps/frontend run typecheck
```

Manual check:

- Complete a first decrypt in mock mode, expand the frozen context summary, and confirm the expanded content contains only text/buttons for disclosure and no edit fields.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/FrozenContextSummary.tsx`
- `apps/frontend/src/App.test.tsx`

