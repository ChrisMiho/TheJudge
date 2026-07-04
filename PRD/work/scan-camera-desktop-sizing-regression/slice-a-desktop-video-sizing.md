# Slice A — Desktop video sizing fallback

## Status: planned

## Dependencies

None. Parallel-ready with Slice B — both touch `ScanCameraSurface.tsx`/its test file on independent codepaths, so implement one PR at a time to avoid a diff clash, but neither blocks the other.

## Goal

Restore proportion-stable desktop sizing for the scan video while preserving the `666ac18` mobile viewport-height clamp, per REQ-068's existing desktop-fallback acceptance criterion ("the layout degrades gracefully on short viewports and desktop: where there is no excess vertical space the frame falls back toward its prior sizing and nothing clips or scrolls unexpectedly").

## Requirements

1. In `apps/frontend/src/components/ScanCameraSurface.tsx`, breakpoint-scope the `<video>` className (~line 437): keep `h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none` as the base (unprefixed, mobile) classes, and add `md:`-prefixed classes that restore the pre-`666ac18` proportion-stable behavior at `md:` (768px) and above — e.g. `md:aspect-[3/4] md:h-auto md:!max-h-none` (exact utility names are calibration; the acceptance criteria below are the contract).
2. `w-full` and `object-cover` are unchanged and apply at every width; the feed is always cropped, never stretched/distorted.
3. Below `md:`, behavior is byte-for-byte unchanged from `666ac18` — this slice does not touch the mobile ergonomics intent (non-goal per `DESIGN-BRIEF.md`).
4. At `md:` and above, the frame is proportion-stable (does not grow/shrink with `100dvh`) and bounded — no more excess vertical space causing an oversized/distorted panel, matching the desktop screenshot regression.
5. No change to the alignment guide, lock outline, debug overlay, or any control positioning inside the frame — they already scale to the rendered frame per DEC-090 and continue to do so under the new desktop classes.

## Acceptance criteria

- [ ] Below `md:`, the video element still carries classes `h-[clamp(20rem,calc(100dvh-17rem),42rem)]` and `!max-h-none` (mobile behavior unchanged).
- [ ] At `md:` and above, the video element carries a proportion-stable sizing class (e.g. `md:aspect-[3/4]`) instead of inheriting the mobile height clamp as its rendered size.
- [ ] `w-full` and `object-cover` remain present at every breakpoint.
- [ ] Nothing else inside the frame (alignment guide, lock outline, debug overlay, mute toggle, watermark, indicator box) is repositioned or resized by this change.
- [ ] The existing sizing test (`"uses a bounded viewport-responsive frame height without the fixed aspect ratio"`) is updated to assert the mobile classes are still present unprefixed, and a new test asserts the `md:` fallback classes are present.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
npm run quality:check
```

Manual: open the scan screen in a desktop-width browser window (~1200px+) and confirm the capture panel renders at a stable, non-distorted proportion instead of stretching to fill `100dvh`; then narrow to a phone-width viewport and confirm the tall-phone growth behavior from `666ac18` still works.

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
