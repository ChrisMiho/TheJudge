# Slice A — Printing-level price artifact + lazy loader

## Status: planned

## Dependencies

None. Parallel-ready with Slice B.

## Goal

Emit a committed, printing-level USD price artifact from the local Scryfall bulk source and add a lazy loader that fetches it only when the Trade Balancer first opens. (REQ-066, DEC-088, NFR-013)

## Requirements

1. New build script `scripts/build-card-prices.mjs` reads `apps/frontend/data/scryfall/default-cards.json` (streaming, modeled on `build-card-scan-map.mjs`) and writes `apps/frontend/public/data/cardPrintingPrices.json`.
2. Artifact shape carries, per printing: `id` (printing id), `oracleId`, `name`, `set`, `setName`, `collectorNumber`, `imageUrl`, `usd` (nullable), `usdFoil` (nullable). Top level: `snapshotDate` (from bulk metadata `updated_at` when available, else build date), a `printings` map keyed by printing id, and a `byOracleId` map keyed by oracle id → array of printing ids.
3. Reuse `shouldIncludeScanPrinting` (paper, gameplay layouts) for inclusion; keep printings even when both prices are null (still selectable/listable). Missing prices stored as `null`.
4. Add `node scripts/build-card-prices.mjs` to the `data:build` chain in `package.json`; it degrades gracefully — a missing/failed source keeps the prior committed artifact and does not break other artifact builds.
5. `apps/frontend/src/lib/trade/loadCardPrices.ts` mirrors `loadScanMap.ts`: fetch `/data/cardPrintingPrices.json`, cache the promise, return a typed object exposing `printings`, `byOracleId`, `snapshotDate`, plus helpers `getPrintingPrice(id)` and `listPrintingsForOracle(oracleId)`. Fetch failure rejects so the view can surface the reason.
6. Raw bulk data stays gitignored (already policy); only the trimmed artifact is committed. No change to `cardMetadata.json`, `cardScanMap.json`, `cardhashes.bin`, scan recipe/identify/lock, `AskAiRequest`, prompt assembly, or any endpoint.

## Acceptance criteria

- [ ] `npm run data:build` regenerates `apps/frontend/public/data/cardPrintingPrices.json` with printing-id keys, a populated `byOracleId` index, and a `snapshotDate`.
- [ ] A spot-checked priced gameplay printing has correct `usd`/`usdFoil` from the source; a printing with no price is present with `null` prices.
- [ ] `loadCardPrices` fetches `/data/cardPrintingPrices.json` exactly once (cached promise), and a non-ok response rejects with a descriptive error (unit test with mocked fetch, mirroring `loadScanMap.test.ts`).
- [ ] `listPrintingsForOracle` returns every printing id for a card; `getPrintingPrice` returns the entry by printing id (unit test on a small fixture).
- [ ] Removing/renaming the source file leaves the prior committed artifact intact and does not fail the rest of `data:build` (manual: temporarily rename source, run build, confirm graceful skip).

## Verification

```bash
npm run data:build
node -e "const a=require('./apps/frontend/public/data/cardPrintingPrices.json'); console.log('snapshot',a.snapshotDate,'printings',Object.keys(a.printings).length,'oracles',Object.keys(a.byOracleId).length)"
npm --workspace apps/frontend run test -- src/lib/trade/loadCardPrices.test.ts
```

## Files touched

- `scripts/build-card-prices.mjs` (new)
- `apps/frontend/public/data/cardPrintingPrices.json` (new, committed artifact)
- `apps/frontend/src/lib/trade/loadCardPrices.ts` (new)
- `apps/frontend/src/lib/trade/loadCardPrices.test.ts` (new)
- `package.json` (`data:build` chain)
</content>
