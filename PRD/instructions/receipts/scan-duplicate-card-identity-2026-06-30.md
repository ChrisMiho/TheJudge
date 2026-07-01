# Receipt: scan-duplicate-card-identity

- **Date:** 2026-06-30
- **Slug:** scan-duplicate-card-identity
- **Status:** shipped

## Summary

Bug fix: scanned or manually-added duplicate cards in non-stack zones shared a single identity keyed on `cardId`, causing removal of one copy to remove all copies and enrichment edits on one copy to affect all copies. Each `ZoneCardItem` now carries a stable frontend-only `instanceId` assigned once at add time; UI keys, removal, and per-instance enrichment edits key on `instanceId`. `cardId` stays the oracle identity; `instanceId` is stripped at the single serialization boundary so the backend payload contract is unchanged.

## Actions taken

- [x] Slice A: `instanceId` field added to `ZoneCardItem`; `buildZoneCardFromMetadata` generates it via `crypto.randomUUID()` + fallback; `removeZoneCardByInstanceId` added; `buildAskAiRequest` strips `instanceId` before wire — verified by new `flow.test.ts` assertion
- [x] Slice B: `ZoneCardPicker`, `ScanReviewBubble`, `ZoneCollectionStep`, `useScanCapture` threaded to `instanceId` for keys, removal, and scan-session tracking; `removeZoneCardById` deleted; tests updated
- [x] Slice C: `EnrichmentStep` and `useEnrichmentTargets` keys, removal, and per-instance edit map on `instanceId`; tests updated
- [x] DEC-082 body promoted to `PRD/sections/decisions/capture-and-stack.md`; router index row present in `PRD/sections/decisions.md`
- [x] REQ-061 accepted in `PRD/sections/functional-requirements.md`
- [x] FLOW-002 and FLOW-006 per-instance notes confirmed present in `PRD/sections/user-flows.md`
- [x] Guardrails verified unchanged: DEC-004, DEC-005, DEC-007, REQ-009, FLOW-004; no backend file touched; no `instanceId` in `apps/backend/`
- [x] `instanceId` never reaches the wire; validated by `buildAskAiRequest` strip + `flow.test.ts` assertion
- [x] System-map entry added under "Frontend staged context flow" and flipped to `shipped`
- [x] `PRD/work/scan-duplicate-card-identity/` deleted

## Ship checklist

- [x] Slice A/B/C acceptance criteria satisfied and verified
- [x] All touched test suites pass: `zoneCards.test.ts` (9), `flow.test.ts` (32), `ZoneCollectionStep.test.tsx` (5), `ZoneCardPicker.test.tsx` (25), `ScanReviewBubble.test.tsx` (8), `EnrichmentStep.test.tsx` (4)
- [x] `npm --workspace apps/frontend run typecheck` clean
- [x] Public contract unchanged: no `instanceId` on the wire; no backend file touched
- [x] No secrets committed
- [x] Durable outcomes promoted; work folder deleted

## Files created / updated / deleted

### Created
- `PRD/instructions/receipts/scan-duplicate-card-identity-2026-06-30.md` (this file)

### Updated
- `apps/frontend/src/types.ts` — `instanceId?: string` on `ZoneCardItem`
- `apps/frontend/src/lib/zoneCards.ts` — `buildZoneCardFromMetadata` generates `instanceId`; `removeZoneCardByInstanceId` added; `removeZoneCardById` removed
- `apps/frontend/src/lib/contextFlow/flow.ts` — strips `instanceId` in `buildAskAiRequest`
- `apps/frontend/src/components/ZoneCardPicker.tsx` — keys and removal on `instanceId`; `sessionInstanceIds` prop
- `apps/frontend/src/components/ScanReviewBubble.tsx` — key and remove on `instanceId`
- `apps/frontend/src/components/ZoneCollectionStep.tsx` — `handleRemoveCard(instanceId)`; scan-session tracking on `instanceId`
- `apps/frontend/src/hooks/useScanCapture.ts` — `ScanAddOutcome` extended with `instanceId`
- `apps/frontend/src/components/EnrichmentStep.tsx` — `cardKey`, `updateZoneCard`, `removeCardFromZone` on `instanceId`
- `apps/frontend/src/hooks/useEnrichmentTargets.ts` — `updateZoneCard` signature takes `instanceId`
- `apps/frontend/src/lib/zoneCards.test.ts` — new `removeZoneCardByInstanceId` cases; removed `removeZoneCardById` case
- `apps/frontend/src/lib/contextFlow/flow.test.ts` — no-`instanceId`-on-wire assertion
- `apps/frontend/src/components/ZoneCollectionStep.test.tsx` — `instanceId` contract
- `apps/frontend/src/components/ZoneCardPicker.test.tsx` — `instanceId` contract
- `apps/frontend/src/components/ScanReviewBubble.test.tsx` — `instanceId` contract
- `apps/frontend/src/components/EnrichmentStep.test.tsx` — new per-instance edit/remove test
- `PRD/sections/system-map.md` — added `### Per-instance zone-card identity` entry (shipped)

### PRD promoted before this receipt (by slice authors during implementation)
- `PRD/sections/decisions/capture-and-stack.md` — DEC-082 body
- `PRD/sections/decisions.md` — DEC-082 router row
- `PRD/sections/functional-requirements.md` — REQ-061
- `PRD/sections/user-flows.md` — FLOW-002 and FLOW-006 per-instance notes

### Deleted
- `PRD/work/scan-duplicate-card-identity/` (entire folder)

## Verification results

| Check | Result |
|---|---|
| `zoneCards.test.ts` (9 tests) | ✓ pass |
| `flow.test.ts` (32 tests) | ✓ pass |
| `ZoneCollectionStep.test.tsx` (5 tests) | ✓ pass |
| `ZoneCardPicker.test.tsx` (25 tests) | ✓ pass |
| `ScanReviewBubble.test.tsx` (8 tests) | ✓ pass |
| `EnrichmentStep.test.tsx` (4 tests) | ✓ pass |
| `typecheck` | ✓ clean |
| `instanceId` in `apps/backend/` | ✗ none (contract unchanged) |
