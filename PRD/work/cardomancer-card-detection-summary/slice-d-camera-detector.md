# Slice D — Camera capture & detector

## Status: code done — real-device outcome validation pending

**Implemented & verified:** CV-free TS detector, perspective warp, synthetic geometry tests,
standalone camera surface (`quality:check`-green).
**Not done (gated on the fingerprint library existing):** real-mobile capture → usable warp,
plausible top-1 identification, and a recorded detect-rate / top-1 accuracy figure; final
calibration constants validated by outcome (`DEC-052`).

## Depends on

Slice A (feeds the canonical image into `CardIdentifier.identify`). Independent of B and C.

## Goal

Add a browser camera surface that detects a single card quad, perspective-warps it to the
canonical 745×1040 RGB image, and feeds the Slice A core. Continuous auto-scan + manual
tap-to-capture. Tuned and validated **by outcome**, not bit-equality. (`REQ-037`, `DEC-052`.)

## Requirements

1. `apps/frontend/src/lib/scan/detector.ts` — port `reference/detect.py` (single-card detector
   + perspective warp) to TS over the browser image stack:
   - frame → grayscale/B/G/R channels, Gaussian blur, Canny `(30,90)`, morph cascade, largest
     valid card-shaped quad (shape filters: area `MIN_AREA_FRAC..MAX_AREA_FRAC` of frame,
     solidity ≥ 0.65, aspect within 35% of 1.396, rectangularity ≥ 0.70, 4-corner
     `approxPolyDP`), outward refinement, perspective warp to (0,0)/(744,0)/(744,1039)/(0,1039)
     with landscape guard.
   - Decode is browser-side (camera frame → raw RGB); warped output is a canonical `RgbImage`
     fed directly to the recipe — no library-side resize substitutes for `recipe.ts`.
   - Detector area fractions / Canny / refinement bounds are **calibration constants validated
     by outcome** (`DEC-052`), not product open questions.
2. `apps/frontend/src/components/ScanCameraSurface.tsx` — live `getUserMedia` video, card-shaped
   guide overlay, continuous auto-scan loop with an always-available manual tap-to-capture
   fallback. Emits a canonical `RgbImage` on capture for identification. Must degrade gracefully
   (drop/throttle frames, never freeze the UI) on slower devices (`NFR-010`).
3. Identify wiring: capture → `identify()` → expose `{ matched, was_rotated, candidates }` and
   card-back / no-match state to the caller (Slice E owns the picker integration). Card-back and
   no-match are handled with **zero backend calls**.
4. Record an outcome measurement on a representative capture set: detect-rate, top-1 accuracy
   after warp, card-back rejection behavior.

## Acceptance criteria

- [ ] Representative real mobile captures produce a usable canonical 745×1040 image after warp.
- [ ] A plausible top-1 identification results after warp + recipe on the capture set.
- [ ] Card-back and no-match states are handled in-UI without any backend/network call.
- [ ] Continuous auto-scan degrades gracefully (throttles/drops frames) rather than freezing.
- [ ] A measured detect-rate / top-1 accuracy figure on a representative set is recorded
      (in the slice notes / PR description) as acceptance evidence.
- [ ] `npm run quality:check` green for touched areas; no backend or endpoint change.

## Verification

```bash
# unit-testable pure pieces (corner ordering, warp geometry) under vitest
npm --workspace apps/frontend run test -- src/lib/scan/detector
# outcome validation is manual: run the app, scan representative cards, record metrics
npm run dev:mock   # then exercise ScanCameraSurface on a device/emulator
```

Detector parity is **not** bit-exact across image libraries (`SOURCE-ANALYSIS` Detector
Mechanics). Validate by outcome: real captures detect a usable quad and produce a correct
top-1 after warp + hash. Record the metrics in the PR.

## Files touched

- `apps/frontend/src/lib/scan/detector.ts` (new)
- `apps/frontend/src/lib/scan/detector.test.ts` (new — pure geometry pieces)
- `apps/frontend/src/components/ScanCameraSurface.tsx` (new)
- browser image-stack dependency if required for decode/warp (decode-only; recipe.ts owns resize)
