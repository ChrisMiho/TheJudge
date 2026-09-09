# Slice C — Brotli for rulings / card detail / prices in builders and loaders

## Status: planned

## Goal

The three per-card committed artifacts — rulings, card detail, and printing
prices — move from raw JSON / gzip to brotli, in both the scripts that build
them and the backend loaders that read them, with no change to what they
hold or serve.

## Requirements

1. `scripts/build-card-rulings.mjs` writes
   `apps/backend/data/cardRulingsByOracleId.json.br` (brotli, same fixed
   params as slice A: `BROTLI_PARAM_QUALITY = 11`, `BROTLI_PARAM_SIZE_HINT`
   set, no dictionary) instead of the raw `cardRulingsByOracleId.json`.
2. `scripts/build-card-detail-by-oracle-id.mjs` writes both
   `apps/backend/data/cardDetailByOracleId.json.br` (brotli, replacing raw
   JSON) and `apps/backend/data/cardPrintingPricesByOracleId.json.br`
   (brotli, replacing gzip) — same fixed params, same unified build pass it
   already runs.
3. `apps/backend/src/cardRulings.ts`, `apps/backend/src/cardDetail.ts`, and
   `apps/backend/src/cardPrices.ts` swap their current
   `readFileSync`/`gunzipSync` (or plain `readFileSync` + `JSON.parse` for
   the raw files) for `readFileSync` + `zlib.brotliDecompressSync`, decoded
   once at startup exactly where parsing happens today. The in-memory map
   shapes and every route response stay byte-identical.
4. Mock-default local dev still boots correctly both with the committed
   files present and with them missing — every loader that fails open today
   keeps failing open (no crash, no behavior regression) against the new
   file names/encoding.
5. The build's preserve/degrade-gracefully path (a missing or failed source
   keeps the prior committed artifacts and does not break other artifact
   builds) understands the new `.br` file names.

## Acceptance criteria

- [ ] C1 — `build-card-rulings.mjs` writes brotli to
      `apps/backend/data/cardRulingsByOracleId.json.br` with the fixed,
      named brotli params (no dictionary)
- [ ] C2 — `build-card-detail-by-oracle-id.mjs` writes brotli to both
      `apps/backend/data/cardDetailByOracleId.json.br` and
      `apps/backend/data/cardPrintingPricesByOracleId.json.br`
- [ ] C3 — `cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts` decode via
      `brotliDecompressSync` once at startup; exposed map shapes and route
      responses are unchanged
- [ ] C4 — each loader still fails open when its committed file is missing
      (mock-default dev boot with no data present)
- [ ] C5 — the build's missing/failed-source degrade path preserves prior
      committed `.br` artifacts and does not break sibling builds
- [ ] C6 — `node --test scripts/build-card-detail-by-oracle-id.test.mjs` and
      the backend workspace tests for `cardRulings`, `cardDetail`,
      `cardPrices` pass

## Verification

```bash
node --test scripts/build-card-detail-by-oracle-id.test.mjs
npm --workspace apps/backend run test -- cardRulings cardDetail cardPrices
```

## Files touched

- `scripts/build-card-rulings.mjs`
- `scripts/build-card-detail-by-oracle-id.mjs`
- `scripts/build-card-detail-by-oracle-id.test.mjs`
- `apps/backend/src/cardRulings.ts`
- `apps/backend/src/cardRulings.test.ts`
- `apps/backend/src/cardDetail.ts`
- `apps/backend/src/cardPrices.ts`
- `apps/backend/src/cardPrices.test.ts`
