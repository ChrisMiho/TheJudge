# Slice A — Shared affirmative card-outline renderer

## Status: planned

## Goal

Extract the detected-card outline polygon from `ScanDebugOverlay` into a small,
reusable, reduced-motion-safe presentational component (`ScanCardOutline`) with a
color variant, and refactor `ScanDebugOverlay` to consume it with **no behavior
change**. This is the reuse mechanism the locking cue (Slice B) draws through.

## Requirements

1. Add `apps/frontend/src/components/ScanCardOutline.tsx` — a pure presentational SVG
   component that draws a single 4-corner card outline polygon from
   `corners: Point[] | null` + `frameWidth`/`frameHeight` (native-frame coordinate
   space), using the same `viewBox="0 0 {w} {h}"` + `preserveAspectRatio="xMidYMid slice"`
   pattern `ScanDebugOverlay` uses today.
2. Render nothing (return `null`) unless there is a full quad (`corners.length === 4`)
   and both frame dims are present — the graceful-degrade contract.
3. Support a `variant` (or explicit stroke/props) so callers pick the color:
   - `debug` → the existing detected-card sky stroke `#38bdf8`, `strokeWidth={2}`,
     `vectorEffect="non-scaling-stroke"` (byte-for-byte the current debug outline).
   - `affirmative` → an emerald affirmative treatment consistent with the scanner
     theming (matches the existing `emerald` in-zone "Good — hold steady" cue). Exact
     shade is presentation calibration (DEC-052/DEC-068), not a product question.
4. Pointer-transparent and non-focusable (`pointer-events-none`, `aria-hidden="true"`);
   no animation library. Any optional subtle emphasis must be CSS-only and honor
   `prefers-reduced-motion` (NFR-006). Default is a static outline.
5. Refactor `ScanDebugOverlay` to render its detected-card outline **through**
   `ScanCardOutline` (`variant="debug"`), keeping its art-crop read-region polygon and
   metrics panel exactly as they are. The read region stays in `ScanDebugOverlay`
   (it is debug-exclusive, REQ-062/DEC-060) — only the plain card outline is shared.

## Acceptance criteria

- [ ] `ScanCardOutline` draws the affirmative polygon given a 4-corner quad + frame
      dims, and returns `null` for `null`/incomplete corners or missing dims.
- [ ] The `debug` variant renders an identical polygon (points, `#38bdf8`, width 2,
      non-scaling stroke) to the pre-refactor `ScanDebugOverlay` outline.
- [ ] `ScanDebugOverlay` behavior is unchanged: default-off, and when enabled still
      draws the sky card outline + pink dashed read region + full metrics panel; its
      existing test suite passes without modification of assertions.
- [ ] Component is `pointer-events-none` + `aria-hidden`, adds no animation library,
      and has no non-CSS motion.
- [ ] New unit test `ScanCardOutline.test.tsx` covers: renders polygon for a valid
      quad, returns null on incomplete corners, applies the affirmative vs debug
      stroke per variant.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCardOutline src/components/ScanDebugOverlay
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/ScanCardOutline.tsx` (new)
- `apps/frontend/src/components/ScanCardOutline.test.tsx` (new)
- `apps/frontend/src/components/ScanDebugOverlay.tsx` (refactor to consume the renderer)
```
