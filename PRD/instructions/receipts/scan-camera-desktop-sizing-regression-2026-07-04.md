# Receipt — scan-camera-desktop-sizing-regression

- Date: 2026-07-04
- Slug: `scan-camera-desktop-sizing-regression`
- Status: shipped

## Actions taken

- [x] Slice A: breakpoint-scoped the scan video's className so the `100dvh` viewport-height clamp introduced in `666ac18` applies only below `md:`; added `md:aspect-[3/4] md:h-auto md:!max-h-none` to restore proportion-stable desktop sizing (REQ-068's desktop-fallback acceptance criterion).
- [x] Slice B: removed the generic `"Searching for a card…"` label — `indicatorText` now resolves to `searchingNudge ?? inZoneCue` (or nothing) while searching, the render is conditional, and the now-redundant duplicate `searchingNudge`/`inZoneCue` spans were removed since their text is carried by `indicatorText` itself (DEC-093/REQ-071).
- [x] Updated `ScanCameraSurface.test.tsx`: new md-breakpoint sizing test; removed/updated every assertion expecting the literal `"Searching for a card…"` string; added a test asserting no indicator text renders while searching with no hint/nudge/cue active.
- [x] Verified: `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx` (49/49 passed) and `npm run quality:check` (exit 0) after each slice.
- [x] Promoted durable outcome into `PRD/sections/system-map.md` ("Scan UX in zone picker" entry): added REQ-071/DEC-093 to the "Backed by" list and a new dated bullet covering both the desktop-fallback sizing and the searching-label removal.
- [x] No new/changed decisions or requirements needed — REQ-068, REQ-071, DEC-090, DEC-093 were already fully drafted in `sections/` during refinement; this work implemented against them as-is.
- [x] Deleted `PRD/work/scan-camera-desktop-sizing-regression/`.

## Files touched

Updated:
- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `PRD/sections/system-map.md`

Deleted:
- `PRD/work/scan-camera-desktop-sizing-regression/README.md`
- `PRD/work/scan-camera-desktop-sizing-regression/GAMEPLAN.md`
- `PRD/work/scan-camera-desktop-sizing-regression/IDEA.md`
- `PRD/work/scan-camera-desktop-sizing-regression/DESIGN-BRIEF.md`
- `PRD/work/scan-camera-desktop-sizing-regression/slice-a-desktop-video-sizing.md`
- `PRD/work/scan-camera-desktop-sizing-regression/slice-b-searching-label-overlap.md`

## Verification results

- `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx`: 49/49 tests passed (run after Slice A and again after Slice B).
- `npm run quality:check`: exit 0 (run after Slice A and again after Slice B).
- No public contract change: frontend-only, no `AskAiRequest`/Zod/`GameContext`/prompt/provider/endpoint change.
- No secrets committed.
