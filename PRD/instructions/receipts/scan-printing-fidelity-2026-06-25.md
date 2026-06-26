# Receipt: scan-printing-fidelity

- Date: 2026-06-25
- Slug: scan-printing-fidelity
- Status: shipped

## Actions taken

- [x] All slice acceptance criteria verified against codebase
- [x] 55 tests across 7 files — all pass (`npm --workspace apps/frontend run test`)
- [x] `npm --workspace apps/frontend run typecheck` — clean
- [x] Public contract unchanged (frontend-only at scan time; build-time only for Lever 2)
- [x] Scan-engine + REQ-034/DEC-051 parity gates untouched
- [x] No secrets committed
- [x] DEC-070 and DEC-071 bodies verified in place and match shipped reality
- [x] FLOW-006 edge-case notes (scanned art, oracle fallback) verified in `sections/user-flows.md`
- [x] Router index lines for DEC-070 / DEC-071 verified in `sections/decisions.md`
- [x] `sections/system-map.md` — added `### Scan art fidelity` (shipped) under `## Card scanning`
- [x] `sections/system-map.md` — added `### Standard-print bias` (shipped) under `## Data pipeline`
- [x] Receipt written
- [x] `PRD/work/scan-printing-fidelity/` deleted

## Files created / updated / deleted

### Created
- `PRD/instructions/receipts/scan-printing-fidelity-2026-06-25.md` (this file)
- `apps/frontend/src/lib/scan/buildCardScanMap.test.ts`
- `apps/frontend/src/components/ScanReviewBubble.test.tsx`

### Updated
- `scripts/build-card-scan-map.mjs` — `buildScanMapEntry` adds `imageUrl`
- `scripts/build-card-metadata.mjs` — `isStandardPrinting` predicate + tiebreak in `choosePreferredCard`
- `apps/frontend/public/data/cardScanMap.json` — regenerated; entries now `{ oracleId, name, imageUrl }`
- `apps/frontend/public/data/cardMetadata.json` — regenerated with standard-print bias
- `apps/backend/data/cardRulingsByOracleId.json` — regenerated (data refresh)
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` — `CardScanMapEntry.imageUrl`, `ResolvedScanCandidate.scanImageUrl`
- `apps/frontend/src/lib/scan/resolveScanCandidates.test.ts` — extended for scan image carry-through
- `apps/frontend/src/lib/scan/loadScanMap.test.ts` — fixtures include `imageUrl`
- `apps/frontend/src/hooks/useScanCapture.ts` — surfaces `scanImageUrl` on lock
- `apps/frontend/src/hooks/useScanCapture.test.ts` — extended for scanned image pass-through
- `apps/frontend/src/components/ZoneCollectionStep.tsx` — passes scanned image into add path
- `apps/frontend/src/lib/zoneCards.ts` — `buildZoneCardFromMetadata` accepts optional image override
- `apps/frontend/src/lib/zoneCards.test.ts` — extended for scanned image on auto-add
- `apps/frontend/src/components/ScanReviewBubble.tsx` — renders scanned art; thumbnail sized up
- `apps/frontend/src/components/EnrichmentStep.tsx` — thumbnail sized up
- `apps/frontend/src/components/ZoneCardPicker.tsx` — thumbnail sized up
- `apps/frontend/src/lib/metadataTransformPolicy.test.ts` — standard-print preference + fallback tests
- `PRD/sections/system-map.md` — two new shipped subsections added

### Deleted
- `PRD/work/scan-printing-fidelity/` (entire folder)

## Verification results

```
Test Files  7 passed (7)
     Tests  55 passed (55)
npm --workspace apps/frontend run typecheck — clean (0 errors)
```
