# Slice A — Debug-Gated Raw-Frame Export

## Status: planned

## Goal

Reuse the existing scan **Capture** button to export the exact raw camera frame, but only while the opt-in debug overlay is enabled (REQ-051).

## Requirements

1. With the debug overlay off, Capture keeps today's behavior and exports/downloads nothing (DEC-065 no-clutter intent).
2. With the debug overlay on, Capture additionally saves/downloads the same raw frame used for that scan attempt (e.g. a PNG of the camera pixel buffer).
3. Export is diagnostic only: no change to `detectCard`, warp, identify, stabilizer, the add flow, or scan UI controls; no network call.
4. No new scan-screen control is added — this reuses the DEC-060/REQ-041 debug overlay.
5. Export code must not depend on card metadata or scan corpus artifacts.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx` verifies Capture does not export when Debug is disabled.
- [ ] Same test file verifies enabling Debug then pressing Capture triggers exactly one raw-frame export/download from the frame canvas.
- [ ] Same test file verifies the normal `onCapture`/`identify` path still receives the detector-warped card image, not the exported raw frame.
- [ ] Manual check: open scanner, Capture with Debug off → no file export.
- [ ] Manual check: enable Debug, Capture → a raw camera-frame PNG downloads matching the live frame dimensions.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
