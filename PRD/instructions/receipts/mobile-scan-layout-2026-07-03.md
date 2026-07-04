# Receipt — mobile-scan-layout

- Date: 2026-07-03
- Slug: mobile-scan-layout
- Status: shipped

## Summary

The mobile camera scan view now uses non-overlapping, guide-relative controls,
a normal-flow exit row above the feed, and a bounded dynamic-viewport frame
height. The change is presentation-only: scanner behavior, matching, lock-in,
audio behavior, review/remove behavior, public contracts, and backend paths are
unchanged. Authority: DEC-090, REQ-068.

## Actions taken

- [x] Verified Slice A overlay-placement acceptance criteria against implementation and tests
- [x] Verified Slice B exit-row acceptance criteria against implementation and tests
- [x] Verified Slice C responsive-frame acceptance criteria against implementation and tests
- [x] Confirmed DEC-090, its decision-router entry, and REQ-068 are promoted as durable product truth
- [x] Trimmed DEC-090's pre-change context so it no longer describes obsolete source as current
- [x] Confirmed no public-contract or scanner-behavior change and no secret-like content in scoped files
- [x] Updated the already-shipped Scan UX system-map entry with the responsive-layout outcome and DEC-090/REQ-068 references
- [x] Wrote this receipt before applying the system-map gate and deleting the work package
- [x] Deleted `PRD/work/mobile-scan-layout/`

## Files created

- `PRD/instructions/receipts/mobile-scan-layout-2026-07-03.md`

## Files updated

- `apps/frontend/src/components/ScanCameraSurface.tsx` — centered the debug toggle, anchored mute and watermark to the guide, and added bounded `dvh` frame sizing
- `apps/frontend/src/components/ScanCameraSurface.test.tsx` — covered responsive sizing and guide-relative, non-overlapping control anchors
- `apps/frontend/src/components/ZoneCardPicker.tsx` — moved `Exit scan` into a normal-flow row above the camera frame
- `apps/frontend/src/components/ZoneCardPicker.test.tsx` — covered exit-row placement and preserved exit behavior
- `PRD/sections/decisions.md` — added the DEC-090 router entry
- `PRD/sections/decisions/scanning.md` — added DEC-090 and promoted its context to shipped-state wording
- `PRD/sections/functional-requirements.md` — added REQ-068
- `PRD/sections/system-map.md` — recorded the responsive scan-layout closeout under the shipped Scan UX entry

## Files deleted

- `PRD/work/mobile-scan-layout/README.md`
- `PRD/work/mobile-scan-layout/IDEA.md`
- `PRD/work/mobile-scan-layout/DESIGN-BRIEF.md`
- `PRD/work/mobile-scan-layout/GAMEPLAN.md`
- `PRD/work/mobile-scan-layout/slice-a-overlay-controls.md`
- `PRD/work/mobile-scan-layout/slice-b-exit-control-row.md`
- `PRD/work/mobile-scan-layout/slice-c-responsive-frame.md`

## Verification

- `npm --workspace apps/frontend run test -- ScanCameraSurface ZoneCardPicker` → 73 passed across 2 files
- `npm run quality:check` → passed: typecheck, lint, formatting, frontend coverage (591 tests), and backend coverage (223 tests)
- Static acceptance review → valid debug centering; mute and watermark are guide-relative at 90% opacity; exit is outside the feed overlay; video uses bounded `clamp(...100dvh...)`, preserves `object-cover`, and no longer uses `aspect-[3/4]`
- Scope review → only scan presentation components/tests changed; detector, recipe, hash artifact, identify, stabilizer, auto-add, audio preference, review/remove, request schemas, prompt assembly, backend, and endpoint paths are unchanged
- Secret scan over scoped files → no common key or private-key signatures found
