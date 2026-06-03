# Slice 05 — UI zone collection

status: complete

**Prerequisites:** [slice-04-ui-game-setup-and-zones.md](./slice-04-ui-game-setup-and-zones.md)  
**Next slice:** [slice-06-ui-enrichment-and-submit.md](./slice-06-ui-enrichment-and-submit.md)

## Goal

For each **selected** zone, let users add **cards only** (identity/metadata). Zero cards per zone always allowed.

## Scope

### Zone collection step

- Iterate selected zones in **canonical order** (stack, battlefield, hand, graveyard, exile, library, command — or UX-friendly order with stack/battlefield first)
- Sub-step or tab per zone: search, autocomplete, add, remove list
- Reuse patterns from `StackBuilderStep` / `BattlefieldStep` (`hideSubmitControls`, cards-only add)
- **Stack zone**: append order = bottom to top (**DEC-004**); show stack count/order hint
- **Continue** when user finishes all selected zones (no min cards)
- **Back** to zone confirmation without losing cards

### State shape

- Cards stored in `gameContext.zones.<zoneId>[]` as `ZoneCardItem` (enrichment fields empty/default)

### Edge cases

- User selected zone but adds zero cards → OK
- Duplicate card policy: keep MVP1 duplicate block within a zone only, or per-zone allow duplicates — **default: keep existing duplicate-in-stack rule for stack zone; document in PR if changed**

## Tasks

- [x] `ZoneCollectionStep` (or per-zone subcomponents)
- [x] Generalize card search/add from existing stack assembly
- [x] Wire Back/Continue through flow shell
- [x] Tests: add to stack preserves order; empty zone omits key in `buildAskAiRequest`

## Validation gate

```bash
npm --workspace apps/frontend run test
npm run dev
```

Manual:

- [ ] Select stack + hand + battlefield; add 2 stack cards, 0 hand, 1 battlefield
- [ ] Continue → enrichment placeholder or slice 06 entry shows correct counts
- [ ] Back to zone confirm and uncheck hand — hand data retained if re-checked (or document clear-on-uncheck — **prefer retain**)

## Done when

- All selected zones can be populated (or skipped empty) with card identity
- `buildAskAiRequest` from UI state matches backend contract (test via mock submit or unit test)

## Out of scope

- Per-card enrichment (slice 06)
- Live OpenAI call required for validation (mock OK)
