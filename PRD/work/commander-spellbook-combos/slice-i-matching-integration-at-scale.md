# Slice I — Matching integration at real scale

## Status: done

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

- [x] I1 — the matcher resolves candidate variant ids from the index's
      oracle-membership for the submitted card set, then fetches each
      candidate's detail via slice H's lazy loader — no code path still
      assumes an in-memory array of every variant. **As built:**
      `collectCandidateVariantIds` already resolved candidates via
      `catalog.byOracleId`/`byTemplateOracleId` before this package's
      original slice C landed; the only eager-array touch was one call,
      `catalog.variants.get(variantId)`, changed to `catalog.getVariant(variantId)`
      in slice H's own commit (it does not compile otherwise). Re-verified here
      with a test asserting the real `ComboCatalog` type carries no `.variants`
      map at all.
- [x] I2 — game-mode complete/non-intent and partial/explicit branches,
      lookup-mode attached/explicit and no-card/no-intent branches, all pass
      against a realistic-scale artifact. **Scope as verified:** the
      intent/attached-card gates (partial-explicit, lookup no-card/no-intent)
      return before candidate collection ever runs, so corpus size cannot
      affect their correctness — they're exercised at small scale elsewhere
      in this suite and unchanged here (Requirement 3). What scale actually
      stresses is candidate collection and ranking, which slices I's new
      tests exercise directly: a 2,000-variant real lazy-format catalog
      (`matcher.test.ts`, "Matching at real scale") for game-mode complete
      matching, and a 501-variant one (`comboPromptIntegration.test.ts`) for
      both prompt paths end to end.
- [x] I3 — quantity-aware distinct-instance assignment holds at scale: one
      submitted card instance never satisfies two ingredient slots across the
      larger candidate pool a popular oracle id can now produce.
- [x] I4 — stable top-five ranking (the full six-key order) holds when the
      pre-ranking candidate pool is large, not just when it is small.
- [x] I5 — state annotation still resolves to the matched instance's zone (or
      the expected zone for wrong-zone/missing entries) when detail is
      fetched lazily rather than read from a preloaded array. Covered by the
      pre-existing small-scale annotation tests running unchanged against
      catalogs whose `getVariant` is now always the lazy accessor (there is
      no other kind any more), plus the at-scale tests' own annotation checks.
- [x] I6 — both prompt paths (`buildPromptText`, `buildLookupPromptText`)
      render the combo section correctly end to end against the same
      realistic-scale artifact, confirming slice D needs no functional
      change.
- [x] I7 — rendered classification still never emits the bare word
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
