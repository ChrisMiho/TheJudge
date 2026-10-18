# Slice D — Smaller scan map

## Status: done

Attempt 1 parked on a snapshot mismatch; the owner chose to slim the committed map itself (`GRAPH-RUN.md` `## Open gate`). Evidence: `slice-d.evidence.md`.

## Goal

The first scan downloads 1.23 MB less (6.51 to 5.28 MB gzip): the scan map
stops storing image addresses and the scanned printing's picture is derived
from its printing id.

## Requirements

1. `scripts/build-card-scan-map.mjs` emits `{ oracleId, name }` per printing.
   Remove the now-unused `getImageUrl` helper (QC A3).
2. `resolveScanCandidatesRanked` derives the scanned printing's image from the
   printing id through `deriveCardImageUrl` (`lib/cardImage.ts`). Keep the
   oracle-level fallback (from `CardMetadataItem.imageId`) for an empty derived
   address (printing id under 2 characters). `CardScanMapEntry` loses
   `imageUrl`.
3. Owner decision (`GRAPH-RUN.md` `## Open gate`, 2026-10-18): produce the slim
   map from the committed map itself. `scripts/slim-card-scan-map.mjs`
   (`npm run data:scan-map:slim`, tested by `scripts/slim-card-scan-map.test.mjs`)
   reads the committed `apps/frontend/public/data/cardScanMap.json`, removes only
   `imageUrl` from every entry and writes it back with the same keys, key order
   and compact JSON formatting; a second run changes nothing. Never hand-edit the
   map. Never run `npm run data:refresh` or any Scryfall download.
4. The local card dump (`default-cards.json`) is a newer snapshot than the one the
   committed map and `cardhashes.bin` came from, so it is not read this attempt:
   no symbolic link, no `npm run data:scan-map` over it. A full rebuild from a
   matching snapshot (requirement 1) also emits the slim shape later.
5. Compare the slimmed map with the committed one (read the committed map from
   `git show HEAD:apps/frontend/public/data/cardScanMap.json`): same entry
   count (95,895), same keys, identical `oracleId` and `name` per key, the only
   difference being the missing `imageUrl` field. Any other difference stops
   the slice: do not commit the map, set the slice `blocked`, park and report.
6. Update test fixtures carrying `imageUrl` (QC A2):
   `TradeBalancer.scan.test.tsx` (lines 140-143), `useScanCapture.test.ts`
   (62-63), `persistence/loadScanMap.test.ts` (24),
   `identification/resolveScanCandidates.test.ts` (19-26, 109-115). Its
   "printing-no-image" and "carried imageUrl" cases change meaning: assert the
   derived address, and the oracle-level fallback for an id under 2 characters.
   `persistence/buildCardScanMap.test.ts` asserts the new entry shape.
7. Apply, by intent, the accepted diffs: REQ-048 in `functional-requirements.md`
   (two criteria, the graceful-fallback criterion, the two Constraints lines),
   `system-map.md` (### Scan art fidelity summary) and `scan/data/cardScanMap.md`
   (upstream source, "Describes Magic", build, scanner use, artifact shape with
   the measured sizes, runtime posture); REQ-066 constraint line in
   `functional-requirements.md`.
8. Practice-suite name lookup (`scripts/lib/practice-suite-card-names.mjs`,
   REQ-232) must still work: `name` stays in the map.

## Tests added or changed

- The four fixture files in requirement 6 plus `buildCardScanMap.test.ts`.
- A parity test that, for sampled printing ids, the derived address equals the
  old `imageUrl` with its `?<timestamp>` removed (use a few literal pairs taken
  from the committed map before regeneration).

## Acceptance criteria

- [ ] `build-card-scan-map.mjs` emits `{ oracleId, name }` and `getImageUrl` is removed (script tests pass)
- [ ] The resolver derives the printing image via `deriveCardImageUrl` and falls back to the oracle-level image when empty (tests pass)
- [ ] `cardScanMap.json` was slimmed from the committed map with `npm run data:scan-map:slim` (per `GRAPH-RUN.md` `## Open gate`) and has the same 95,895 keys as the committed map with identical `oracleId` and `name` per key (comparison output recorded in the evidence log)
- [ ] The only difference from the committed map is the missing `imageUrl` field; any other difference stopped the slice
- [ ] No card dump was read or linked, and nothing from it is staged
- [ ] No `npm run data:refresh` or Scryfall download was run
- [ ] The four fixtures carrying `imageUrl` and `buildCardScanMap.test.ts` are updated and pass
- [ ] REQ-048 and REQ-066 diffs applied once each in `functional-requirements.md`, `system-map.md` and `scan/data/cardScanMap.md`, matching the accepted text
- [ ] The rebuilt `public/data/cardScanMap.json` is about 5.28 MB gzip (measured with `gzip -c`, recorded)
- [ ] Frontend tests, `npm run test:scripts`, typecheck, lint and format check pass
- [ ] Live: scanning (or the scan preview with a known printing) shows the scanned printing's picture from the derived Scryfall address (manual, dated observation)
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`

## Verification

```bash
npm run data:scan-map:slim
gzip -c apps/frontend/public/data/cardScanMap.json | wc -c
npm --workspace apps/frontend run test -- resolveScanCandidates loadScanMap useScanCapture TradeBalancer.scan buildCardScanMap
npm run test:scripts
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `scripts/build-card-scan-map.mjs`
- `scripts/slim-card-scan-map.mjs`, `scripts/slim-card-scan-map.test.mjs`, `package.json` (`data:scan-map:slim`)
- `apps/frontend/public/data/cardScanMap.json` (script output only)
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts`
- `apps/frontend/src/lib/scan/types.ts` (or wherever `CardScanMapEntry` lives)
- the test files in requirement 6
- `PRD/sections/functional-requirements.md`, `PRD/sections/system-map.md`, `PRD/sections/scan/data/cardScanMap.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scanner-recovers-and-runs-lighter/` ready to delete
