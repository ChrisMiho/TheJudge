# Slice B - Capture And Detector Diagnostics

## Status: done

## Goal

Thread native camera/capture and detector-stage diagnostics through the scan surface and opt-in debug/export path.

## Requirements

1. Extend `ScanCameraSurface` to collect capture-stage diagnostics for each scanned frame:
   - canvas/native frame width and height
   - selected `MediaStreamTrack.getSettings()` fields when available, including width, height, facingMode, focusMode, frameRate, deviceId/groupId if exposed
   - frame index or monotonic sequence number
2. Record detector diagnostics for both outcomes:
   - success: full-res corners already surfaced through `onCorners`, guide rect, native frame dimensions, detector `maxDetectDimension`
   - failure: concrete `detector-miss` diagnostic with native frame dimensions, guide rect, and current detector config
3. Thread those diagnostics to the hook without creating product-facing scanner modes. Preferred shape: add an optional diagnostics callback/argument on the existing `ScanCameraSurface` -> `useScanCapture` boundary rather than adding a global store.
4. Extend the debug overlay and debug-enabled Capture export so a failing frame has both the raw PNG and corresponding diagnostic JSON/evidence.
5. Keep the default debug-off behavior unchanged: no visible diagnostic table/export, no scan-time network calls, and no meaningful extra work beyond cheap local metadata capture.

## Tests

- `apps/frontend/src/components/ScanCameraSurface.test.tsx` covers track settings capture, detector success/failure diagnostics, and debug-gated JSON export.
- `apps/frontend/src/components/ScanDebugOverlay.test.tsx` covers rendering/degrading of capture and detector diagnostic fields.
- Existing debug-gated frame-export tests stay green and prove debug-off export behavior is unchanged.

## Acceptance criteria

- [ ] A detector miss while debug is enabled records/displays native frame size, guide rect, detector miss, and reason `detector-miss`.
- [ ] A detector success while debug is enabled records/displays native frame size, track settings where mocked/available, corners, guide rect, and detector `maxDetectDimension`.
- [ ] Debug-disabled Capture still does not export diagnostic artifacts, matching the existing debug-gated export behavior.
- [ ] `getUserMedia` constraints remain ideal/fallback-friendly and do not introduce `exact` constraints or a hardware dependency.
- [ ] Existing debug overlay geometry tests still pass, with added tests for capture/detector diagnostic rows or export payload.

## Verification

```bash
npm --workspace apps/frontend run test -- ScanCameraSurface ScanDebugOverlay
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/src/components/ScanDebugOverlay.tsx`
- `apps/frontend/src/components/ScanDebugOverlay.test.tsx`
- `apps/frontend/src/hooks/useScanCapture.ts` only for the new callback/argument boundary
- `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts`

## Notes

This slice should not tune detector thresholds. It only exposes what happened at capture/detector stages so later experiments can be attributed.
