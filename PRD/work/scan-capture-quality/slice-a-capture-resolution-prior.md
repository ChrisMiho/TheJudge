# Slice A — Higher-resolution capture request

## Status: planned

## Goal

Request a higher-resolution camera capture mode (with continuous autofocus) via `getUserMedia`, degrading gracefully so weak/locked-down devices still open the camera. This is the headline lever (DEC-074 / REQ-053): a larger source flows into the unchanged warp, so Region A is sampled from real pixels instead of a ~2.6× upscale.

## Requirements

1. In `ScanCameraSurface.openCamera`, replace the bare `video: { facingMode: { ideal: "environment" } }` constraint with `MediaTrackConstraints` requesting:
   - `width: { ideal: 1920 }`, `height: { ideal: 1080 }`
   - `facingMode: { ideal: "environment" }`
   - continuous focus where supported — `focusMode: { ideal: "continuous" }` (advanced/vendor-extended; tolerate absence)
2. Every constraint is `ideal`, never `exact`, so a device that cannot satisfy a hint degrades instead of throwing `OverconstrainedError`. The existing `try/catch → updateStatus("camera-error")` remains the final fallback.
3. No other capture-path change: the hidden canvas still sizes to `video.videoWidth`/`videoHeight` (already native), detection still runs on the `MAX_DETECT_DIMENSION` (640) downscale, and the warp output stays 745×1040. No detection slowdown.
4. Frozen boundary untouched: no edit to `recipe.ts`, `identify.ts`, `detector.ts`, `stabilizer.ts`, `cardhashes.bin`, `cardScanMap.json`.

## Acceptance criteria

- [ ] `openCamera` passes a `getUserMedia` video constraint object containing `width`/`height` `{ ideal: 1920/1080 }`, `facingMode { ideal: "environment" }`, and a continuous `focusMode` hint — asserted via a mocked `navigator.mediaDevices.getUserMedia` in `ScanCameraSurface.test.tsx`.
- [ ] No constraint uses `exact`.
- [ ] Camera still reaches the scanning path (not `camera-error`) when the mocked `getUserMedia` resolves a stream regardless of the requested resolution (simulating a device that returns a lower mode).
- [ ] `camera-error` is still surfaced when `getUserMedia` rejects.
- [ ] `git diff --name-only` shows the only product-code edit is `ScanCameraSurface.tsx`.

## Verification

```bash
npm --workspace apps/frontend run test -- ScanCameraSurface
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx` — `getUserMedia` constraints in `openCamera`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx` — assert constraint shape + graceful-fallback path
