---
status: active
---

# scan-capture-quality

Widen the scan **capture-quality window** so cards lock across a range of distances and lighting instead of only a narrow sweet spot. The detector is already fixed (DEC-072/DEC-073); this is the capture-quality layer feeding the frozen warp → Region A → `CARDHSH1` match → DEC-059 lock pipeline.

See [DESIGN-BRIEF.md](DESIGN-BRIEF.md) for scope, root cause, decisions, and non-goals.

## Origin

Owner re-test (2026-06-25) reported scanning works only in a narrow band of distance/lighting — "a game of finding the right spot and holding still." Diagnosis: every exported frame is **640×480** because `getUserMedia` is called with no resolution constraint, so the warp upscales a ~390px card to 1040px (~2.6×) and Region A is only sharp enough to lock in a thin sweet spot.

## Refinement result (2026-06-25)

- New **DEC-074** (`decisions/scanning.md`): request a higher-resolution camera capture mode (+ continuous autofocus, graceful `ideal` fallback), a capture-quality lever upstream of the frozen matching boundary, plus a positive in-zone cue and `tuning.ts` recalibration.
- New **REQ-053** (higher-resolution capture request + fallback), **REQ-054** (positive in-zone "hold steady" cue). **FLOW-006** edge case added.
- Scope reshaped during refinement: two of the three explored levers were already built —
  - **A (capture resolution)** is the headline new work.
  - **B (positive in-zone cue)** is a small addition to the existing DEC-062/DEC-057 searching-state feedback (the negative condition hints already ship).
  - **C (best-frame-of-burst)** already ships as a 5-frame `FrameSelector` (DEC-062); reduced to a calibration tweak (window `5 → 3` + `FRAME_QUALITY_*` recalibration for the higher resolution) — no new product truth.
- **Owner choices:** resolution + continuous autofocus only (no torch/exposure control this round); C handled as tune + recalibrate.

## Validation gate

Fresh owner **on-device** pass: a **DB-registered** card locks across a broader distance/light range than before, **no new false auto-adds**, and an exported frame reports native resolution above 640×480 on a supporting device. Frozen boundary held (`recipe.ts`, `CARDHSH1`/`cardhashes.bin`, `identify.ts`, DEC-059 lock gate).

## Slices (map-out 2026-06-25)

See [GAMEPLAN.md](GAMEPLAN.md) for architecture and data flow.

| Slice | Objective | DEC/REQ | Depends on |
| --- | --- | --- | --- |
| [A](slice-a-capture-resolution-prior.md) ✓ | Higher-resolution capture request + graceful fallback | DEC-074 / REQ-053 | — |
| [B](slice-b-positive-in-zone-cue.md) ✓ | Positive in-zone "hold steady" cue while searching | DEC-074 / REQ-054 | — |
| [C](slice-c-window-and-recalibration.md) ✓ | Best-frame window 5→3 + frame-quality recalibration | DEC-062 (calibration) | A |
| [D](slice-d-validation-and-ship-gates.md) ✓ | On-device validation, PRD promotion, ship gates | DEC-074 validation gate | A, B, C |

A and B are parallel-ready; C is sequenced after A; D is the validation/cleanup gate.

## Implementation map

| Concern | File |
| --- | --- |
| Capture constraints (A) | `apps/frontend/src/components/ScanCameraSurface.tsx` (`openCamera`) |
| Positive cue view-model (B) | `apps/frontend/src/hooks/useScanCapture.ts` (`ScanConvergence`) |
| Positive cue render (B) | `apps/frontend/src/components/ScanCameraSurface.tsx` (indicator) |
| Calibration constants (C) | `apps/frontend/src/lib/scan/tuning.ts` |
| Frozen — do not edit | `recipe.ts`, `identify.ts`, `stabilizer.ts`, `detector.ts`, `cardhashes.bin`, `cardScanMap.json` |

## Next step

Run `thejudge-cleanup` for `PRD/work/scan-capture-quality/`.
