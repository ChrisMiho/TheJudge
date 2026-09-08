# Slice A — Backend price build & artifact

## Status: planned

## Goal

Fold the printing-price projection into the existing card-detail build so one
pass over `default-cards.json` emits both the rules map and a new backend
price map; commit the new artifact; retire the old frontend-only price build;
keep the Lambda 250 MB package budget green with the new artifact bundled.

## Requirements

1. Extend `scripts/build-card-detail-by-oracle-id.mjs` (or a module it
   imports) to also emit `apps/backend/data/cardPrintingPricesByOracleId.json`
   from the same `default-cards.json` stream and the same
   dedupe/preferred-card logic already in the file — no second pass over the
   source and no fourth extract script. Shape: keyed by oracle id, each entry
   carries a `printings` array of `{ id, set, setName, collectorNumber, usd,
   usdFoil }`; a top-level `snapshotDate` is recorded.
2. Missing non-foil/foil prices are stored as `null` (never omitted, never
   coerced to `0`) so the frontend's existing $0-plus-caution logic
   (`pricing.ts`, untouched) keeps working unchanged.
3. Delete `scripts/build-card-prices.mjs` and remove its invocation from the
   root `package.json`'s `data:build` script. Do **not** delete the already
   -committed `apps/frontend/public/data/cardPrintingPrices.json` in this
   slice — the frontend still reads it until Slice D migrates off it; only the
   build script that regenerates it is retired here.
4. Add coverage for the new price-map emission in
   `scripts/build-card-detail-by-oracle-id.test.mjs`, matching that file's
   existing flat `test()` style: a priced printing, a null-price printing, and
   the emitted `snapshotDate`.
5. Regenerate both committed artifacts with `npm run data:build` (rebuilds
   from the already-committed `apps/frontend/data/scryfall/default-cards.json`
   — no network call; `data:refresh` is untouched and not run here) and commit
   `apps/backend/data/cardPrintingPricesByOracleId.json`.
6. Run `scripts/lambda-package-budget.test.mjs` with the new artifact
   committed under `apps/backend/data/` and confirm the 120 MB data budget
   (250 MB unzipped quota minus the 130 MB non-data reserve) still holds. If
   the header-comment/observed-footprint figure documented in that test's
   top-of-file comment is now stale, update it to the newly measured total.
7. Apply the REQ-066 diff from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md` verbatim (the `+` lines
   byte-for-byte), and update `sections/system-map.md`'s
   `### Printing-price artifact build` entry to describe the unified build
   (one pass, backend artifact, `build-card-prices.mjs` retired). The
   system-map file-list update for the deleted frontend file lands in Slice D.

## Acceptance criteria

- [ ] A1: `scripts/build-card-detail-by-oracle-id.mjs` emits both
      `apps/backend/data/cardDetailByOracleId.json` and
      `apps/backend/data/cardPrintingPricesByOracleId.json` from one pass over
      `default-cards.json`.
- [ ] A2: `scripts/build-card-prices.mjs` no longer exists, and root
      `package.json`'s `data:build` script no longer references it.
- [ ] A3: `apps/backend/data/cardPrintingPricesByOracleId.json` is keyed by
      oracle id; each entry's `printings` array carries `id, set, setName,
      collectorNumber, usd, usdFoil`; a top-level `snapshotDate` is present; a
      printing with no source price stores `usd`/`usdFoil` as `null`.
- [ ] A4: `node --test scripts/build-card-detail-by-oracle-id.test.mjs` passes,
      including new coverage for a priced printing, a null-price printing, and
      the snapshot date.
- [ ] A5: `npm run test:scripts` passes (full scripts suite green after
      retiring `build-card-prices.mjs`).
- [ ] A6: `node --test scripts/lambda-package-budget.test.mjs` passes with the
      new price artifact committed under `apps/backend/data/`.
- [ ] A7: `PRD/sections/functional-requirements.md`'s REQ-066 block matches
      the `GATE-QUESTIONS.md` REQ-066 diff's `+` lines byte-for-byte.
- [ ] A8: `PRD/sections/system-map.md`'s `### Printing-price artifact build`
      entry describes the unified build.

## Verification

```bash
npm run data:build
node --test scripts/build-card-detail-by-oracle-id.test.mjs
npm run test:scripts
node --test scripts/lambda-package-budget.test.mjs
```

## Files touched

- `scripts/build-card-detail-by-oracle-id.mjs`
- `scripts/build-card-detail-by-oracle-id.test.mjs`
- `scripts/build-card-prices.mjs` (deleted)
- `package.json`
- `apps/backend/data/cardPrintingPricesByOracleId.json` (new)
- `scripts/lambda-package-budget.test.mjs` (header comment only, if stale)
- `PRD/sections/functional-requirements.md` (REQ-066)
- `PRD/sections/system-map.md`
