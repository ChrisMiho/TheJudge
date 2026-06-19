# Slice C — Frontend EnrichmentStep extraction

## Status: planned

## Goal

Extract the embedded utilities and the pending-target state cluster out of `apps/frontend/src/components/EnrichmentStep.tsx` (689 lines), and audit frontend player-name rendering for inline label logic. No prop API, render output, or behavior change.

## Requirements

1. Create `apps/frontend/src/lib/enrichmentFormat.ts` with the three embedded utilities, moved verbatim:
   - `parseManaSpent(value: string): number | undefined` (`EnrichmentStep.tsx:47`)
   - `formatContextTarget(target: ContextTarget, displayNamesByPlayer: Record<PlayerLabel, string | undefined>): string` (`:54`) — imports `formatPlayerDisplayLabel` from `./playerLabels` and `ZONE_LABELS` from `./zoneLabels`
   - `hasOwnerControl(zone: ZoneId): boolean` (`:63`) — imports `NON_STACK_ZONES_WITH_OWNER` from `./contextFlow`
   Import the `ContextTarget`, `PlayerLabel`, `ZoneId` types from `../types`.
2. Create `apps/frontend/src/hooks/useEnrichmentTargets.ts` encapsulating the pending-target state cluster — `pendingKindByKey`, `pendingPlayerByKey`, `pendingCardIdByKey`, `pendingOtherByKey` and their getter / add / remove handlers. The hook returns the state values and handlers `EnrichmentStep` currently uses inline; signatures preserved so the component body changes only at the call boundary.
3. Update `EnrichmentStep.tsx`: delete the three util definitions and import them from `../lib/enrichmentFormat`; replace the inline pending-target `useState` block and handlers with a `useEnrichmentTargets(...)` call. Leave wizard/view state (`viewMode`, `wizardIndex`, `wizardFinished`, `cardAnimKey`, `followUpText`) and the totalCards `useEffect` in the component — out of scope for this slice.
4. **Audit (finding-only).** Search all `apps/frontend/src/` for player-name rendering that inlines the trim/length/fallback algorithm instead of importing `formatPlayerDisplayLabel` / `buildPlayerDisplayNameMap` from `lib/playerLabels.ts`. Known importers to confirm: `App.tsx`, `components/ZoneCardPicker.tsx`, `components/EnrichmentStep.tsx`. Record results in the Audit section below. No fixes in this package.

## Acceptance criteria

- [ ] `apps/frontend/src/lib/enrichmentFormat.ts` exists and exports `parseManaSpent`, `formatContextTarget`, `hasOwnerControl`
- [ ] `apps/frontend/src/hooks/useEnrichmentTargets.ts` exists and exports the hook
- [ ] `grep -n "function parseManaSpent\|function formatContextTarget\|function hasOwnerControl" apps/frontend/src/components/EnrichmentStep.tsx` returns nothing
- [ ] `EnrichmentStep.tsx` imports the three utils from `../lib/enrichmentFormat` and the hook from `../hooks/useEnrichmentTargets`
- [ ] Audit section below filled in (even if "none found")
- [ ] Frontend typecheck and tests green; rendered output unchanged

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run test
grep -n "function parseManaSpent\|function formatContextTarget\|function hasOwnerControl" apps/frontend/src/components/EnrichmentStep.tsx
grep -rn "parseManaSpent\|formatContextTarget\|hasOwnerControl" apps/frontend/src
```

## Files touched

- `apps/frontend/src/lib/enrichmentFormat.ts` (new)
- `apps/frontend/src/hooks/useEnrichmentTargets.ts` (new)
- `apps/frontend/src/components/EnrichmentStep.tsx`

---

## Audit findings — inline playerLabel usage

_To be completed during implementation. Append findings here (file, line, inline vs. imported)._
