# Slice A — Scan-map image bridge

## Status: planned

## Goal

Give `cardScanMap.json` a per-printing image so each scanned printing id resolves
to its own art: extend the entry shape to `{ oracleId, name, imageUrl }`, produced
by `build-card-scan-map.mjs` from the Scryfall printing object it already reads.
(DEC-070 / REQ-048.)

## Requirements

1. `buildScanMapEntry(card)` returns `{ oracleId, name, imageUrl }`, where
   `imageUrl` is the printing's Scryfall image (reuse the same `image_uris.normal`
   → `small` → card-face fallback logic used by `getImageUrl` in
   `build-card-metadata.mjs`; do not import across scripts unless trivially shared —
   a small local helper is acceptable). Empty string when no image exists.
2. The `CardScanMapEntry` TypeScript type (in `resolveScanCandidates.ts`) gains
   `imageUrl: string` so the loader and resolver see the new field; no other type
   widening.
3. Regenerate `apps/frontend/public/data/cardScanMap.json` via `npm run data:scan-map`
   so the committed artifact carries images. Entry count and oracle ids unchanged
   from the prior build (only the new field is added).
4. No identity/behavior change: `shouldIncludeScanPrinting` filter, oracle-id
   gating, and the printing-id keying are untouched. Bridge stays lazy-loaded
   (NFR-010) — only loaded on first scan.

## Acceptance criteria

- [ ] `buildScanMapEntry` output is exactly `{ oracleId, name, imageUrl }` with a real URL for a card that has `image_uris`, and `imageUrl: ""` for one with none (new unit test).
- [ ] `CardScanMapEntry` type includes `imageUrl: string`; `npm --workspace apps/frontend run typecheck` passes.
- [ ] Regenerated `cardScanMap.json` is valid JSON whose entries all carry an `imageUrl` key and the same oracle ids / entry count as before.
- [ ] `loadScanMap` test still passes (extended to include `imageUrl` in fixtures).
- [ ] Scan-engine boundaries untouched: no diff to `recipe.ts`, `cardhashes.bin`, `identify.ts`, stabilizer, or parity gates.

## Verification

```bash
# Unit + type checks
npm --workspace apps/frontend run test -- resolveScanCandidates loadScanMap
npm --workspace apps/frontend run typecheck

# Regenerate the bridge and spot-check the new field
npm run data:scan-map
node -e "const m=require('./apps/frontend/public/data/cardScanMap.json');const k=Object.keys(m);console.log('entries',k.length);console.log('sample',m[k[0]]);console.log('all have imageUrl key', k.every(id=>'imageUrl' in m[id]))"
```

## Files touched

- `scripts/build-card-scan-map.mjs` — `buildScanMapEntry` adds `imageUrl`
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts` — `CardScanMapEntry.imageUrl: string`
- `apps/frontend/public/data/cardScanMap.json` — regenerated (data artifact)
- `apps/frontend/src/lib/scan/loadScanMap.test.ts` — fixtures include `imageUrl`
- New: `scripts/build-card-scan-map` unit test (e.g. alongside existing script tests under `apps/frontend/src/lib/`, importing from `scripts/build-card-scan-map.mjs`)
