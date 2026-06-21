# Slice B — TheJudge-owned fingerprint library + lazy load

## Status: code done — artifact build deferred

**Implemented & verified:** build logic, `writeDb`/`readDb` round-trip, `loadHashDb.ts` lazy
loader, `--self-test` (all `quality:check`-green).
**Not done:** the real `cardhashes.bin` + `cardhashManifest.json` have not completed yet (no
live artifact committed on disk). The resumable/non-destructive production build path is now
shipped under `DEC-054` / `REQ-039`; this slice remains blocked until that build run produces
the live artifacts.

## Depends on

Slice A (imports the shared `recipe.ts`; round-trips through `dbformat.ts`).

## Goal

Add a build step that produces `cardhashes.bin` + a manifest from Scryfall card images using
the **same** TS recipe as Slice A, and a frontend loader that fetches it **only on first
scan**. TheJudge owns and refreshes the library; the browser never downloads card images at
scan time. (`REQ-035`, `DEC-051`, `NFR-010`.)

## Requirements

1. `scripts/build-card-hashes.mjs` (run via `tsx` so it imports `apps/frontend/src/lib/scan/recipe.ts`):
   - Input: canonical Scryfall PNGs (decode-only; the recipe does crop Region A + resize +
     hash — no library-side resize). File naming `<scryfall_id>.png`,
     `<scryfall_id>__back.png`, optional card-back reference → emitted as `_card_back`.
   - Exclude non-gameplay layouts: `art_series`, `planar`, `scheme`, `vanguard`, oversized,
     memorabilia, substitute/checklist, minigame (use Scryfall bulk JSON to filter, same
     `default-cards.json` source the metadata build uses).
   - Emit `cardhashes.bin` (`CARDHSH1` v1, R[32]|G[32]|B[32] per entry) + a versioned
     `cardhashManifest.json` (count, version, source snapshot, byte size).
   - Image download requires **explicit human approval before the command runs**, same policy
     as `scripts/refresh-scryfall-data.mjs`; downloaded PNGs are cached locally, never fetched
     at scan time.
2. Ship artifacts under `apps/frontend/public/data/cardhashes.bin` and
   `apps/frontend/public/data/cardhashManifest.json`.
3. `apps/frontend/src/lib/scan/loadHashDb.ts` — lazy loader: fetch + `readDb` only when first
   invoked (on scanner open), memoized, never called at app startup. Must not touch the
   existing eager `cardMetadata.json` fetch in `App.tsx`.
4. Wire the build into the data pipeline (a `data:scan` script and/or a line in `data:build`
   — coordinate the one `package.json` edit with Slice C).

## Acceptance criteria

- [x] `scripts/build-card-hashes.mjs` emits a versioned `cardhashes.bin` + manifest from local
      inputs using the Slice A recipe (no second resize/hash implementation). Logic implemented
      and proven via `--self-test` (in-memory synthetic images, same `cropRegionA` +
      `phashRegionPacked` path as `identify.ts`); the real production artifact build against the
      full Scryfall image corpus is deliberately deferred (see Notes).
- [x] Non-gameplay layouts are excluded; a `_card_back` reference entry is included when present.
- [x] `cardhashes.bin` round-trips byte-identical through `readDb` (Slice A reader) — `writeDb`
      added to `dbformat.ts`; `--self-test` and `loadHashDb.test.ts` both assert byte-identical
      round trips.
- [x] `loadHashDb.ts` fetches the library **only on first scan**; app startup performs no scan
      fetch (verified by test: no `/data/cardhashes.bin` request until the loader is invoked).
- [x] Image download is gated behind explicit human approval (same gate as the Scryfall refresh);
      identification path makes zero network calls. `--download` flag required for any fetch;
      default build path is local-only.
- [x] `npm run quality:check` green for touched areas.
- [x] No change to `AskAiRequest`, `GameContext`, backend, or any endpoint.

## Notes

- The real `apps/frontend/public/data/cardhashes.bin` + `cardhashManifest.json` production
  artifacts were **not** generated in this session — that requires running
  `npx tsx scripts/build-card-hashes.mjs --download` against the full Scryfall image corpus,
  which is a large network operation requiring separate explicit human approval (same posture
  as `scripts/refresh-scryfall-data.mjs`). The build/round-trip logic is fully implemented and
  verified via `--self-test`; running the real build is a follow-up action, not a Slice B
  blocker.

## Verification

```bash
# build (human-approved image download) — run against a small local sample first
npx tsx scripts/build-card-hashes.mjs --help   # confirm approval prompt / dry-run
# round-trip + lazy-load tests
npm --workspace apps/frontend run test -- src/lib/scan/loadHashDb
npm run quality:check
```

## Files touched

- `scripts/build-card-hashes.mjs` (new — run via tsx, imports recipe.ts)
- `apps/frontend/public/data/cardhashes.bin` (new artifact)
- `apps/frontend/public/data/cardhashManifest.json` (new artifact)
- `apps/frontend/src/lib/scan/loadHashDb.ts` (new)
- `apps/frontend/src/lib/scan/loadHashDb.test.ts` (new)
- `package.json` (`data:scan` script / `data:build` wiring — coordinate with Slice C)
- decode dependency for the builder (decode-only; resize stays in recipe.ts)
