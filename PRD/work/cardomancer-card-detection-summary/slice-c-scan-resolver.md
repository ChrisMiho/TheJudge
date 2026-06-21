# Slice C — Scan → metadata resolver bridge

## Status: done

## Depends on

Slice A (consumes `Candidate[]` from the identify core). Independent of Slice B and D.

## Goal

Bridge engine candidates (Scryfall printing ids) to existing `CardMetadataItem` records via a
build-time printing-id → oracle-id artifact, and add a frontend resolver that returns ranked,
deduped metadata candidates to the picker. (`REQ-036`, `DEC-053`.)

## Requirements

1. `scripts/build-card-scan-map.mjs` — emit `apps/frontend/public/data/cardScanMap.json` from
   the existing Scryfall bulk source (`apps/frontend/data/scryfall/default-cards.json`, the
   same input `build-card-metadata.mjs` uses). Map shape:
   ```json
   { "<scryfall-printing-id>": { "oracleId": "<oracle-id>", "name": "Counterspell" } }
   ```
   Streaming-oriented (the source is large; mirror the metadata builder's streaming parse).
   Build from local bulk JSON only — no runtime network.
2. `apps/frontend/src/lib/scan/resolveScanCandidates.ts` — given ranked engine `Candidate[]`
   (printing ids + distances), the scan map, and the loaded `CardMetadataItem[]` (keyed by
   `cardId` = oracle id):
   - map each printing id → `oracleId` → `CardMetadataItem`;
   - collapse repeated oracle ids keeping the **best (lowest) distance**;
   - drop candidates that don't resolve to committed metadata;
   - return ranked `CardMetadataItem` candidates (ascending distance) for the picker.
3. Wire the build into the data pipeline (coordinate the one `package.json` edit with Slice B).
4. Pure-function unit tests (decode-free, no network).

## Acceptance criteria

- [ ] A known Scryfall printing id resolves to the expected existing `CardMetadataItem`.
- [ ] Multiple printings of one oracle id collapse to a single candidate, keyed by best distance.
- [ ] Unresolvable scan candidates are ignored without breaking the resolver / picker.
- [ ] `cardScanMap.json` builds from local bulk JSON; no backend route or request-schema change.
- [ ] Resolver returns candidates ranked ascending by distance, typed as `CardMetadataItem`.
- [ ] `npm run quality:check` green for touched areas (coverage ≥ 45 on new lib code).

## Verification

```bash
npx tsx scripts/build-card-scan-map.mjs        # emits cardScanMap.json from local bulk JSON
npm --workspace apps/frontend run test -- src/lib/scan/resolveScanCandidates
npm run quality:check
```

## Files touched

- `scripts/build-card-scan-map.mjs` (new)
- `apps/frontend/public/data/cardScanMap.json` (new artifact)
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` (new)
- `apps/frontend/src/lib/scan/resolveScanCandidates.test.ts` (new)
- `package.json` (`data:scan` / `data:build` wiring — coordinate with Slice B)
