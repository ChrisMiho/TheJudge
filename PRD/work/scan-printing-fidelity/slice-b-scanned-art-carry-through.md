# Slice B — Scanned-art carry-through to preview + ZoneCardItem

## Status: planned

## Goal

Thread the scanned printing's `imageUrl` from the resolver through the scan hook
into the auto-added `ZoneCardItem` and the scan-session preview, so the on-screen
art matches the physical card. Oracle identity stays untouched; graceful fallback
to the oracle-level `CardMetadataItem.imageUrl` when the printing image is
missing/empty. (DEC-070 / REQ-048, FLOW-006.)

## Depends on

Slice A — the scan-map entry must already carry `imageUrl`.

## Requirements

1. `ResolvedScanCandidate` gains a printing-image field (e.g. `scanImageUrl: string`).
   `resolveScanCandidatesRanked` sets it from the **best-distance** printing's
   `scanMap[candidate.card_id].imageUrl` for the candidate that won the collapsed
   oracle identity. Collapse-by-best-distance and drop-unresolvable behavior
   (DEC-053) are otherwise unchanged.
2. Fallback: when the printing image is missing/empty, `scanImageUrl` falls back
   to the resolved `CardMetadataItem.imageUrl` so the card still previews/adds.
3. `useScanCapture` surfaces the scanned image alongside the locked
   `CardMetadataItem`: pass it into the `onScanCandidateSelected` callback (extend
   the callback signature to carry the printing image, e.g.
   `onScanCandidateSelected(card, scanImageUrl)`), and to the add-confirmation /
   preview path so the scanned art is shown, not the oracle representative.
4. `ZoneCollectionStep.addCardToActiveZone` / `buildZoneCardFromMetadata` write
   `scanImageUrl` to `ZoneCardItem.imageUrl` for the scanned card only. Typed-search
   adds keep `card.imageUrl`. No other `ZoneCardItem` field changes; owner,
   duplicate-stack block, and stack-size limit unchanged.
5. Scan-session preview (`ScanReviewBubble`, and/or the "Added X" confirmation
   surface) displays the scanned printing's art. Identity-keyed concerns
   (`cardId`, duplicate key, prompt, rulings) remain oracle-level.

## Acceptance criteria

- [ ] Resolver unit test: a candidate whose scan-map entry has an `imageUrl` yields `scanImageUrl` equal to that printing image; a candidate with empty/missing printing image falls back to the metadata `imageUrl` (extends `resolveScanCandidates.test.ts`).
- [ ] Hook test: on lock, the scanned image is passed through to `onScanCandidateSelected` / preview (extends `useScanCapture.test.ts`).
- [ ] Zone-collection: an auto-added scanned card's `ZoneCardItem.imageUrl` is the scanned printing image; a typed-search add is unchanged (extends `ZoneCollectionStep` / zone-card tests).
- [ ] Oracle identity unchanged: `cardId`, duplicate-stack key, and prompt/rulings still derive from the oracle-level `CardMetadataItem` (assert no printing-level field other than `imageUrl` enters `ZoneCardItem`).
- [ ] Scan preview surface renders the scanned art (component test asserts the scanned `imageUrl` is used).

## Verification

```bash
npm --workspace apps/frontend run test -- resolveScanCandidates useScanCapture ZoneCollectionStep zoneCards ScanReviewBubble
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` — `ResolvedScanCandidate.scanImageUrl` + carry-through with fallback
- `apps/frontend/src/hooks/useScanCapture.ts` — surface scanned image on lock; extend `onScanCandidateSelected` signature
- `apps/frontend/src/components/ZoneCollectionStep.tsx` — pass scanned image into the add path
- `apps/frontend/src/lib/zoneCards.ts` — `buildZoneCardFromMetadata` accepts an optional override image
- `apps/frontend/src/components/ScanReviewBubble.tsx` (and/or scan confirmation surface) — show scanned art
- Tests: `resolveScanCandidates.test.ts`, `useScanCapture.test.ts`, `ZoneCollectionStep`/`zoneCards` tests, `ScanReviewBubble.test.tsx`
