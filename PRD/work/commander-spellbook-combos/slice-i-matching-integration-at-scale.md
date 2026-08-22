# Slice I — Matching integration at real scale

## Status: planned

## Goal

Adapt the existing intent/matcher/zone logic (old slice C) and prompt
rendering (old slice D) to slice H's lazy-lookup interface, and re-verify the
whole path end to end against realistic corpus scale rather than only small
hand-sized fixtures.

## Requirements

1. DEC-162 amendment — slice C's data-access pattern ("index into an
   in-memory array of all variants") no longer holds; it must resolve
   candidate variant ids from the index's oracle-membership first, then
   lazily fetch each candidate's detail through slice H's loader, before
   ranking narrows the result to the top five (REQ-094, REQ-095).
2. DEC-162 amendment — this is the "affected by the same scale" risk flagged
   for slice C (105,447 variants / 7,371 distinct oracle ids) and the
   "likely intact, confirm it" risk flagged for slice D; both need positive
   verification at that scale, not an assumption that small-fixture tests
   still stand in for it.
3. No functional change to matching semantics, ranking order, zone mapping,
   card-state annotation, or prompt rendering — this slice adapts data access
   and re-verifies scale; it does not redesign matching.

## Acceptance criteria

- [ ] I1 — the matcher resolves candidate variant ids from the index's
      oracle-membership for the submitted card set, then fetches each
      candidate's detail via slice H's lazy loader — no code path still
      assumes an in-memory array of every variant.
- [ ] I2 — game-mode complete/non-intent and partial/explicit branches,
      lookup-mode attached/explicit and no-card/no-intent branches, all pass
      against a realistic-scale artifact (105,447 variants / 7,371 oracle
      ids, or a representative fixture built at that scale).
- [ ] I3 — quantity-aware distinct-instance assignment holds at scale: one
      submitted card instance never satisfies two ingredient slots across the
      larger candidate pool a popular oracle id can now produce.
- [ ] I4 — stable top-five ranking (the full six-key order) holds when the
      pre-ranking candidate pool is large, not just when it is small.
- [ ] I5 — state annotation still resolves to the matched instance's zone (or
      the expected zone for wrong-zone/missing entries) when detail is
      fetched lazily rather than read from a preloaded array.
- [ ] I6 — both prompt paths (`buildPromptText`, `buildLookupPromptText`)
      render the combo section correctly end to end against the same
      realistic-scale artifact, confirming slice D needs no functional
      change.
- [ ] I7 — rendered classification still never emits the bare word
      "complete"; the state-verification instruction is present in both
      prompt modes.

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook prompt
npm --workspace apps/backend run typecheck
npm run lint
```

## Files touched

- `apps/backend/src/commanderSpellbook/matcher.ts`
- `apps/backend/src/commanderSpellbook/formatting.ts` (verification only — no expected functional change)
- `apps/backend/src/prompt/preparation.ts`, `apps/backend/src/prompt/promptAssembly.ts` (verification only — no expected functional change)
