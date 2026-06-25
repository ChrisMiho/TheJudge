---
status: active
---

# scan-printing-fidelity

Two presentation-only levers so scanned cards show the scanned printing's art and
typed search biases toward a standard representative printing. Identity, prompt,
rulings, and the scan engine stay frozen.

- **Scan art fidelity** — DEC-070 / REQ-048 (refines DEC-053/REQ-036)
- **Standard-print bias** — DEC-071 / REQ-049 (refines DEC-012)

See `DESIGN-BRIEF.md` for scope and `GAMEPLAN.md` for architecture and data flow.

## Slices

| Slice | Objective | Lever | Depends on | Parallel-ready |
| --- | --- | --- | --- | --- |
| [A](slice-a-scan-map-image-bridge.md) | Scan-map carries per-printing `imageUrl` (entry shape `{ oracleId, name, imageUrl }`) + regen data | 1 | — | yes |
| [B](slice-b-scanned-art-carry-through.md) | Thread scanned image through resolver → hook → `ZoneCardItem` + preview, oracle fallback | 1 | A | after A |
| [C](slice-c-standard-print-bias.md) | Standard-print bias in `choosePreferredCard` + regen metadata (final slice: PRD promotion + ship gates) | 2 | — | yes |

A and C are independent and may run concurrently. B follows A.

## Implementation map

| Area | File |
| --- | --- |
| Scan-map build | `scripts/build-card-scan-map.mjs` |
| Scan-map type/loader | `apps/frontend/src/lib/scan/resolveScanCandidates.ts`, `loadScanMap.ts` |
| Scan-map artifact | `apps/frontend/public/data/cardScanMap.json` |
| Scan resolver | `apps/frontend/src/lib/scan/resolveScanCandidates.ts` |
| Scan hook | `apps/frontend/src/hooks/useScanCapture.ts` |
| Auto-add path | `apps/frontend/src/components/ZoneCollectionStep.tsx`, `apps/frontend/src/lib/zoneCards.ts` |
| Scan preview | `apps/frontend/src/components/ScanReviewBubble.tsx` |
| Metadata build | `scripts/build-card-metadata.mjs` |
| Metadata artifact | `apps/frontend/public/data/cardMetadata.json` |
| Tests | `resolveScanCandidates.test.ts`, `useScanCapture.test.ts`, `loadScanMap.test.ts`, `metadataTransformPolicy.test.ts`, zone-collection/zone-card tests, `ScanReviewBubble.test.tsx`, new scan-map build test |

Next workflow step: `thejudge-implement` (start with Slice A).
