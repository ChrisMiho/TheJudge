# Slice E — Evidence and Ship Gates

## Status: planned

## Depends on: A, B, C, D

## Goal

Record outcome evidence, verify the frozen boundaries held, and prepare the package for cleanup/promotion.

## Requirements

1. Record before/after detect-then-lock rate across the committed detector fixture corpus.
2. Record owner/on-device validation for the previously-failing ornate/etched-foil Japanese `Akroma's Will` and the plain English centered-card failure — or explicitly mark any unavailable owner capture as pending manual evidence.
3. Confirm no new false auto-adds under the unchanged DEC-059 stabilizer gate.
4. Confirm scan-time behavior remains frontend-only and zero-network.
5. Confirm no changes to the frozen recipe/bin/matching/provider/backend surfaces.
6. Prepare cleanup-time promotion notes for durable PRD truth and work-folder deletion.

## Acceptance criteria

- [ ] Fixture eval evidence is recorded (work-folder note or cleanup-ready evidence note) with before/after detect rate and any known misses.
- [ ] Manual/on-device evidence is recorded with date, device/context, and outcome for the known failing cards, or explicitly listed as a remaining manual-validation item.
- [ ] `npm run quality:check` is green after all slices.
- [ ] `git diff -- apps/frontend/src/lib/scan/recipe.ts apps/frontend/src/lib/scan/identify.ts apps/frontend/src/lib/scan/tuning.ts apps/frontend/public/data/cardhashes.bin apps/frontend/public/data/cardScanMap.json` shows no forbidden detection-lever changes (call out any unrelated pre-existing work).
- [ ] The PRD promotion checklist below is ready for `thejudge-cleanup`.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
npm --workspace apps/frontend run test -- src/hooks/useScanCapture.test.ts
npm run quality:check
```

## Files touched

- `PRD/work/scan-detector-foil-robustness/README.md`
- `PRD/work/scan-detector-foil-robustness/GAMEPLAN.md`
- Detector evidence note in `PRD/work/scan-detector-foil-robustness/` if needed by implementation
- Cleanup-time durable PRD files (only when executing `thejudge-cleanup`):
  - `PRD/sections/decisions/scanning.md`
  - `PRD/sections/decisions.md`
  - `PRD/sections/functional-requirements.md`
  - `PRD/sections/user-flows.md`
  - `PRD/sections/system-map.md`
  - `PRD/instructions/receipts/scan-detector-foil-robustness-<YYYY-MM-DD>.md`

## PRD promotion checklist

- [ ] Promote shipped detector behavior and outcome evidence to durable PRD truth.
- [ ] Remove or update the existing detector known-limitation note in `PRD/sections/system-map.md` based on the shipped outcome.
- [ ] Keep DEC/REQ `Status:` fields unchanged unless lifecycle rules require a tombstone; shipped/planned status belongs in system-map catalog entries (doc-lifecycle promotion gate).
- [ ] Write cleanup receipt at `PRD/instructions/receipts/scan-detector-foil-robustness-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/scan-detector-foil-robustness/` during cleanup after durable promotion.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scan-detector-foil-robustness/` ready to delete
