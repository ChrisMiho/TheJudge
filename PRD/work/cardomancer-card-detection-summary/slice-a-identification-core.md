# Slice A — Identification core (parity-critical)

## Status: done

## Depends on

None. This is the gate slice; B, C, and D depend on it.

## Goal

Port the Cardomancer identification core to TypeScript as a single authoritative module
under `apps/frontend/src/lib/scan/`, implement the shared 64×64 resize + DCT pHash "recipe"
once, and prove it with golden-vector parity tests under `npm test` — no camera, no network,
no PNG decode in the test path. (`REQ-034`, `DEC-051`.)

## Requirements

1. Port the pure scaffold modules into `apps/frontend/src/lib/scan/`:
   - `types.ts` — `RgbImage`, `Plane`, `HashDb`, `Candidate`, `IdentifyResult`
     (from `ts_scaffold/src/types.ts`).
   - `dbformat.ts` — `readDb(bytes)` binary reader for `CARDHSH1` v1 layout
     (from `ts_scaffold/src/dbformat.ts`).
   - `identify.ts` — `autoLevels`, `rotate180`, `cropRegionA`, `regionDistance`,
     `CardIdentifier` (auto-levels query-only, both-orientation matching, mean R/G/B Hamming,
     `MATCH_THRESHOLD=120`, card-back `CARD_BACK_THRESHOLD=100`, `__back` strip, ranked
     candidates) — from `ts_scaffold/src/identify.ts`.
2. Implement the **shared recipe** `recipe.ts` as the single authoritative definition of:
   - `resizeToGray64(plane: Plane): Float64Array` — one deterministic separable resampler
     (parity-critical). This replaces the unimplemented `backend.resizeToGray64` stub.
   - `phashRegionPacked(region)` / `phashGray64Packed` / DCT-II / median-includes-DC /
     MSB-first packing (port `ts_scaffold/src/phash.ts`, calling the local `resizeToGray64`
     instead of an injected backend).
   - Export the resize + hash recipe so the Slice B builder imports the **same** code
     (no FE↔build duplication — `DEC-051`, `technical-design-rules.md`).
3. Regenerate golden vectors **from this recipe** (`DEC-051`), not from the friend's PIL
   output:
   - Add `scripts/build-scan-vectors.mjs` (run via `tsx`). It decodes the friend's input
     PNGs in `/Users/chrismiho/Coding/Projects/cardomancer-card-detection/testdata/vectors/`
     **once** (build-time, dev-only decoder — decode only, the recipe does the resize),
     runs the recipe, and emits committed raw-pixel fixtures + expected packed hex into
     `apps/frontend/src/lib/scan/__fixtures__/`.
   - Keep the friend's `fixture_db.bin` (pure binary, decoder-independent) for the DB-format
     and end-to-end identify vectors; regenerate the identify expectation from the recipe.
4. Parity tests under `npm test` (Vitest) read the committed raw fixtures (no PNG decode, no
   network) and assert:
   - DB load: ids, count, and hash byte lengths from `fixture_db.bin`.
   - pHash: packed R/G/B bytes byte-for-byte against regenerated expected hex.
   - auto-levels: output pixels pixel-for-pixel against regenerated fixture.
   - identify: candidate order, ids, distances, `matched`, `was_rotated`.

## Acceptance criteria

- [ ] `apps/frontend/src/lib/scan/{types,dbformat,identify,recipe}.ts` exist; `recipe.ts` is
      the only place the 64×64 resize + DCT hash is defined and it is exported for builder reuse.
- [ ] `npm test` passes including new `src/lib/scan/*.test.ts`; the scan tests perform no
      network call and no PNG decode (they read committed raw fixtures).
- [ ] DB-load test asserts ids/count/byte-length from `fixture_db.bin`.
- [ ] pHash test passes byte-for-byte for every regenerated phash fixture.
- [ ] auto-levels test passes pixel-for-pixel against the regenerated fixture.
- [ ] identify test matches candidate order, ids, distances (±1e-2), `matched`, `was_rotated`.
- [ ] `scripts/build-scan-vectors.mjs` regenerates the committed fixtures deterministically
      (re-running produces no diff).
- [ ] `npm run quality:check` green for touched areas (coverage ≥ 45 on new lib code).
- [ ] No camera code, no `cardhashes.bin` build, no UI change in this slice.

## Verification

```bash
# regenerate vectors from the TS recipe (decode-once, dev-only)
npx tsx scripts/build-scan-vectors.mjs
git diff --exit-code apps/frontend/src/lib/scan/__fixtures__/   # deterministic: no diff

# parity tests (decode-free, no network)
npm --workspace apps/frontend run test -- src/lib/scan

# full gate for touched areas
npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/scan/types.ts` (new)
- `apps/frontend/src/lib/scan/dbformat.ts` (new)
- `apps/frontend/src/lib/scan/recipe.ts` (new — shared resize + pHash)
- `apps/frontend/src/lib/scan/identify.ts` (new)
- `apps/frontend/src/lib/scan/dbformat.test.ts`, `recipe.test.ts`, `identify.test.ts` (new)
- `apps/frontend/src/lib/scan/rawImageFixture.ts` (new — decode-free binary codec shared by the
  vector-regen script and the parity tests; not in the original file list, added so neither side
  needs a PNG decoder)
- `apps/frontend/src/lib/scan/__fixtures__/*` (new — committed raw-pixel fixtures + expected hex)
- `scripts/build-scan-vectors.mjs` (new — vector regeneration, run via tsx)
- `package.json` (new `data:scan-vectors` script; added `pngjs`/`@types/pngjs` as a dev-only
  decode dependency, used only by the regen script)

## Implementation notes

- `recipe.ts` resize is our own deterministic separable-bilinear resampler, not a PIL-Lanczos
  port (per GAMEPLAN: parity by construction, not bit-matching PIL). Golden vectors regenerated
  from it; re-running `data:scan-vectors` is a no-op diff.
- `identify.ts` calls `recipe.ts` functions directly — no `ImageBackend` injection layer, since
  there is now only one resize/hash implementation to call.
- Auto-levels cross-checked at vector-build time against the friend's PIL-generated
  `autolevels_out.png`: bit-identical (auto-levels has no resize dependency), confirming the port
  is faithful independent of the resize-filter decision.
