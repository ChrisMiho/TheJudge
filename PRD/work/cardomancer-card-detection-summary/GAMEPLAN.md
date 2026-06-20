# GAMEPLAN — cardomancer-card-detection

Implementation-ready architecture and slice map for the optional on-device card
scanner. Read `DESIGN-BRIEF.md` (authoritative scope/decisions) and `SOURCE-ANALYSIS.md`
(algorithm/contract reference) first. This file translates them into lettered slices.

## Objective

Add a **frontend-only**, **zero-network-at-scan-time** card scanner as an alternate input
path into existing zone fields, feeding the *same* preview → add → owner → duplicate-block
→ stack-limit path as manual search and producing the same `ZoneCardItem`. No change to
`AskAiRequest`, `GameContext`, prompt assembly, the backend, or any product-facing endpoint
(`DEC-050`).

## Architecture & data flow

```
                      BUILD TIME (node, human-approved image download)
  Scryfall PNGs ──► scan/recipe (TS) ──► cardhashes.bin + cardhashManifest.json   [REQ-035]
  Scryfall bulk JSON ──────────────────► cardScanMap.json (printingId→oracleId)   [REQ-036]
        │                                         shipped under apps/frontend/public/data/
        └── same TS recipe used on both sides (DEC-051: parity by construction)

                      SCAN TIME (browser, no network)
  camera frame ──► detector quad + perspective warp ──► canonical 745×1040 RGB    [REQ-037]
        ──► scan/recipe identify() ──► ranked printingId candidates               [REQ-034]
        ──► resolver: printingId → oracleId → CardMetadataItem (dedupe best dist) [REQ-036]
        ──► ZoneCardPicker preview (same as a typed suggestion) ──► existing add  [REQ-038]
```

The single authoritative module is `apps/frontend/src/lib/scan/recipe.ts` — the 64×64
resize + per-channel DCT perceptual hash ("the recipe"). It is imported by the on-device
identifier (Slice A) **and** by the offline DB builder (Slice B) so the two sides cannot
drift (`DEC-051`). Golden parity vectors are regenerated from this recipe, not from the
friend's PIL output.

## Key technical decisions (resolved here, not open questions)

- **Resize parity by construction.** The friend's reference used PIL `LANCZOS`. We do **not**
  try to bit-match PIL. We implement one deterministic separable resampler in TS
  (`recipe.ts`), use it on both sides, and **regenerate** the golden vectors from it
  (`DEC-051`). "The two sides agreeing matters more than which filter you pick"
  (`backend.ts` scaffold note). This retires SOURCE-ANALYSIS open question #1.
- **Decode-free parity tests.** `npm test` (Vitest, jsdom) must not depend on a PNG decoder
  or network. The Slice A vector-regen script decodes the friend's input PNGs **once**
  (build-time, dev-only decoder) and commits raw-pixel fixtures + expected packed hashes;
  the committed parity tests read those raw fixtures. No camera, no decode, no network in
  the test path (REQ-034 acceptance).
- **Decode is a browser/build concern, not a recipe concern.** PNG/camera decode produces
  raw RGB pixels; the parity-critical math (`recipe.ts`) operates on raw pixel arrays only.
  Build-time decode (Slice B) and on-device decode (Slice D) are decode-only and feed the
  same recipe.
- **Builder runs under `tsx`** so a node build script can import the TS recipe directly
  (precedent: `retrieval:report` = `tsx scripts/...`). No FE↔build duplication.
- **Identity bridge is a static build artifact** (`cardScanMap.json`), consistent with the
  committed `cardMetadata.json` pattern; no runtime network resolves identity (`DEC-053`).
- **Lazy load only on first scan.** `cardhashes.bin` / map are fetched the first time the
  user opens the scanner, never at app startup (`REQ-035`, `NFR-010`). The existing eager
  `cardMetadata.json` fetch in `App.tsx` is unchanged.

## Module / file map

| Concern | Path | Slice |
| --- | --- | --- |
| Shared hash recipe (resize + DCT pHash) | `apps/frontend/src/lib/scan/recipe.ts` | A |
| DB binary reader | `apps/frontend/src/lib/scan/dbformat.ts` | A |
| Identify (auto-levels, orientation, rank) | `apps/frontend/src/lib/scan/identify.ts` | A |
| Scan types | `apps/frontend/src/lib/scan/types.ts` | A |
| Parity tests + committed raw fixtures | `apps/frontend/src/lib/scan/*.test.ts`, `.../__fixtures__/` | A |
| Vector regeneration (dev/build) | `scripts/build-scan-vectors.mjs` | A |
| Fingerprint DB builder | `scripts/build-card-hashes.mjs` | B |
| Lazy DB loader | `apps/frontend/src/lib/scan/loadHashDb.ts` | B |
| Shipped artifacts | `apps/frontend/public/data/cardhashes.bin`, `cardhashManifest.json` | B |
| Scan-map builder + artifact | `scripts/build-card-scan-map.mjs`, `apps/frontend/public/data/cardScanMap.json` | C |
| Candidate resolver | `apps/frontend/src/lib/scan/resolveScanCandidates.ts` | C |
| Camera capture + detector + warp | `apps/frontend/src/lib/scan/detector.ts`, `apps/frontend/src/components/ScanCameraSurface.tsx` | D |
| Scan UX in picker | `apps/frontend/src/components/ZoneCardPicker.tsx`, `ZoneCollectionStep.tsx`, scan hook | E |

## Existing surfaces to preserve

- `ZoneCardPicker.tsx` / `ZoneCollectionStep.tsx` — add a Scan entry point **beside** the
  search input; reuse `selectedCard` state, `CardSelectionPreview`, `handleAddSelectedCard`,
  `validateZoneCardAdd`, `buildZoneCardFromMetadata`, owner/duplicate/stack-limit behavior
  unchanged.
- `CardMetadataItem` (`types.ts`) keyed by `cardId` = oracle id — the resolver's output type.
- `scripts/refresh-scryfall-data.mjs` human-approval download policy — the image download
  (Slice B) and scan-map build (Slice C) follow the same gate; reuse `default-cards.json`.
- `npm test` = Vitest; `npm run quality:check` = typecheck + lint + format:check + test +
  coverage (lines ≥ 45). Touched areas keep coverage green.

## Slice dependency graph

```
A (core + recipe + vectors)
 ├─► B (DB build + lazy load)  ─┐
 ├─► C (scan-map + resolver)   ─┼─► E (scan UX in picker; NFR-010 measured)
 └─► D (camera + detector)     ─┘
```

- **A** is the gate: it ships the recipe B/D depend on and the identify core.
- **B**, **C**, **D** are parallel after A. B and C both add a line to `data:build` wiring;
  coordinate that one edit (low conflict, different artifacts/scripts).
- **E** is last: it needs the lazy DB (B), the resolver (C), and the camera (D).

## Verification checklist (whole package)

- [ ] `npm test` green, including new `src/lib/scan/*.test.ts` (decode-free, no network).
- [ ] `npm run quality:check` green for touched areas (typecheck, lint, format, coverage ≥ 45).
- [ ] Golden-vector parity (DB load, pHash bytes, auto-levels pixels, end-to-end identify)
      passes against TS-recipe-regenerated vectors (REQ-034).
- [ ] `cardhashes.bin` + manifest build from local inputs; lazy-loaded only on first scan;
      round-trips byte-identical through the TS reader (REQ-035).
- [ ] A known printing id resolves to the expected `CardMetadataItem`; duplicate oracle ids
      collapse to one candidate by best distance; unresolvable candidates dropped (REQ-036).
- [ ] Real mobile captures warp to a usable canonical image and a plausible top-1; card-back
      and no-match handled with zero backend calls; detect-rate / top-1 recorded (REQ-037).
- [ ] Manual search unchanged; an accepted scan candidate reaches the existing preview/add
      flow; scanned cards produce the same `ZoneCardItem` shape; batch loop + unhappy paths
      work; NFR-010 budgets measured and recorded (REQ-038, DEC-052, NFR-010).
- [ ] No change to `AskAiRequest`, `GameContext`, prompt assembly, backend, or any endpoint.
- [ ] PRD promotion checklist in Slice E executed at cleanup; system-map entry flips to
      `shipped` only per the doc-lifecycle gate.

## Out of scope (do not build)

Printing disambiguation, grading/condition/pricing, multi-card-per-frame, runtime network
calls during identification, duplicate-card support, manual zone/stack reorder. (`DESIGN-BRIEF`
Non-goals.)
