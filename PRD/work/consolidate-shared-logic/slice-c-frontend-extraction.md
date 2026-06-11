# Slice C — Frontend EnrichmentStep extraction

## Status: planned

## Goal

Extract the two embedded utility functions and the multi-state management block from
`apps/frontend/src/components/EnrichmentStep.tsx` (689 lines) into dedicated lib and hook
files, and audit frontend code for inline playerLabel algorithm usage.

## Requirements

1. Create `apps/frontend/src/lib/enrichmentUtils.ts` containing:
   - `parseManaSpent(value: string): number | undefined` (currently `EnrichmentStep.tsx` line 47–52)
   - `formatContextTarget(target: ContextTarget, displayNamesByPlayer: Record<PlayerLabel, string | undefined>): string`
     (currently `EnrichmentStep.tsx` line 54–61)
   Import types from `../types` as needed; import `formatPlayerDisplayLabel` from `./playerLabels`.

2. Create `apps/frontend/src/hooks/useEnrichmentStep.ts` containing a custom hook that
   encapsulates the ~10 `useState` declarations (lines 91–99: `pendingKindByKey`,
   `pendingPlayerByKey`, `pendingCardIdByKey`, `pendingOtherByKey`, `viewMode`, `wizardIndex`,
   `wizardFinished`, `cardAnimKey`, `followUpText`) and the `useEffect` (lines 123–131) that
   syncs `wizardIndex` when `totalCards` changes.
   The hook accepts the dependencies it needs (e.g. `totalCards`) and returns the state
   values and setters that `EnrichmentStep` currently uses.

3. Update `apps/frontend/src/components/EnrichmentStep.tsx`:
   - Remove `parseManaSpent` and `formatContextTarget` definitions; import from `../lib/enrichmentUtils`.
   - Replace the inline `useState` block and related `useEffect` with a call to `useEnrichmentStep`.
   - No prop API, render output, or behavior changes.

4. Audit: search all `apps/frontend/src/` files for inline playerLabel formatting that does
   not import from `./playerLabels` or `../lib/playerLabels`. Record any findings in a comment
   at the bottom of this slice doc. No code changes for this item — documentation only.

## Acceptance criteria

- [ ] `parseManaSpent` and `formatContextTarget` are NOT defined inside `EnrichmentStep.tsx`
      (grep confirms)
- [ ] `apps/frontend/src/lib/enrichmentUtils.ts` exists and exports both functions
- [ ] `apps/frontend/src/hooks/useEnrichmentStep.ts` exists and exports the custom hook
- [ ] `EnrichmentStep.tsx` imports `parseManaSpent`, `formatContextTarget` from `../lib/enrichmentUtils`
- [ ] `EnrichmentStep.tsx` imports the custom hook from `../hooks/useEnrichmentStep`
- [ ] Audit note appended to this doc (even if finding is "none found")
- [ ] `npm run typecheck` exits 0 (frontend)
- [ ] `npm run test` exits 0 (frontend)

## Verification

```bash
grep -n "function parseManaSpent\|function formatContextTarget" apps/frontend/src/components/EnrichmentStep.tsx
# Should return 0 lines

grep -rn "parseManaSpent\|formatContextTarget" apps/frontend/src/
# Should show only: lib/enrichmentUtils.ts (definition) and EnrichmentStep.tsx (import)

npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run test
```

## Files touched

- NEW `apps/frontend/src/lib/enrichmentUtils.ts`
- NEW `apps/frontend/src/hooks/useEnrichmentStep.ts`
- MOD `apps/frontend/src/components/EnrichmentStep.tsx`

---

## Audit findings — inline playerLabel usage

_To be completed during implementation. Append findings here._
