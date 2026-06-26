# Slice C — Best-frame window 5→3 + frame-quality recalibration

## Status: done

## Goal

Recalibrate the capture-quality constants for the higher-resolution source from Slice A (DEC-062 calibration; carries no new DEC/REQ). Reduce the best-frame window `5 → 3` and re-tune the `FRAME_QUALITY_*` norms — chiefly `FRAME_QUALITY_SHARPNESS_NORM` and `FRAME_QUALITY_ACCEPT_THRESHOLD`, which were set against 640×480 frames scoring right at the `0.45` edge. Calibration only: no logic change, no new product truth.

## Depends on

Slice A — the norms must be re-tuned against real higher-resolution frames, not the old upscaled 640×480 captures.

## Requirements

1. In `tuning.ts`, set `FRAME_SELECTOR_WINDOW_SIZE = 3` (was `5`).
2. Re-tune the `FRAME_QUALITY_*` norms against higher-resolution frames so an in-focus card at a usable distance/light range scores comfortably above `FRAME_QUALITY_ACCEPT_THRESHOLD` (not at the `~0.45–0.50` edge), while genuinely poor frames still fall below it. Primary knobs: `FRAME_QUALITY_SHARPNESS_NORM`, `FRAME_QUALITY_DETAIL_NORM`, `FRAME_QUALITY_ACCEPT_THRESHOLD`. Adjust reason thresholds only if recalibration shifts the dominant-reason boundaries.
3. Keep every change inside `tuning.ts` — `frameQuality.ts`/`frameSelection.ts` logic is unchanged. Final values are outcome-validated on-device in Slice D; this slice lands defensible constants plus updated unit expectations.
4. Frozen boundary untouched (no `recipe.ts`/`identify.ts`/`stabilizer.ts`/`detector.ts`/`cardhashes.bin`/`cardScanMap.json` edit). Note these are calibration constants (DEC-052/DEC-055/DEC-059/DEC-062 precedent), not product open questions.

## Acceptance criteria

- [ ] `FRAME_SELECTOR_WINDOW_SIZE === 3`.
- [ ] `FRAME_QUALITY_*` norms updated with a one-line rationale comment tying them to the higher-resolution source.
- [ ] `frameQuality.test.ts` and `frameSelection.test.ts` updated to the new norms and green (acceptable frames pass, poor frames abstain, dominant-reason labels intact).
- [ ] `git diff --name-only` for `lib/scan/` shows edits only to `tuning.ts` and the two test files.

## Verification

```bash
npm --workspace apps/frontend run test -- frameQuality frameSelection
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/scan/tuning.ts` — `FRAME_SELECTOR_WINDOW_SIZE` 5→3; `FRAME_QUALITY_*` recalibration
- `apps/frontend/src/lib/scan/frameQuality.test.ts` — update expectations to new norms
- `apps/frontend/src/lib/scan/frameSelection.test.ts` — update window/threshold expectations
