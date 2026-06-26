# Slice E - Validation And PRD Promotion

## Status: planned

## Goal

Record validation against the DEC-077 matrix, prepare durable PRD promotion, and run final ship gates before cleanup.

## Requirements

1. Record validation evidence in `PRD/work/scan-lock-acquisition-tuning/evidence-YYYY-MM-DD.md`.
2. Mac-webcam baseline evidence must include:
   - DB-registered card used
   - built-in Mac webcam condition
   - whether first reliable vote and lock occurred without repeated distance/lighting hunting
   - diagnostic stage responsible for any miss or slow acquisition
3. Stand-assisted controlled setup evidence must include the same fields when available. If unavailable, mark it explicitly as pending validation rather than treating Mac-only evidence as the ideal pass.
4. Confirm the final shipped behavior is still one scanner behavior path with no product-facing scanner modes and no scan-stand dependency.
5. Prepare the cleanup promotion checklist for `thejudge-cleanup`:
   - update DEC-077 notes only if shipped evidence changes durable decision wording
   - update REQ-057 acceptance notes if diagnostics/validation outcomes need durable clarification
   - flip `system-map.md` Scan acquisition diagnostics from `planned` to `shipped` only during cleanup when product code is wired and the receipt is written
   - write cleanup receipt at `PRD/instructions/receipts/scan-lock-acquisition-tuning-YYYY-MM-DD.md`
   - delete `PRD/work/scan-lock-acquisition-tuning/` during cleanup after promotion
6. Run final verification and record outcomes in this slice before handoff.

## Tests

- Run the focused scanner test set for every touched frontend scanner module.
- Run `npm run quality:check` before cleanup handoff.
- Perform manual Mac-webcam baseline validation and stand-assisted validation or pending-validation recording.

## Acceptance criteria

- [ ] Mac-webcam baseline evidence records pass/fail plus diagnostic stage attribution.
- [ ] Stand-assisted validation records pass/fail or is explicitly marked pending with date/reason.
- [ ] `git diff --name-only` confirms frozen recipe/bin/identify/API/backend surfaces are untouched.
- [ ] Focused frontend tests for touched scanner files pass.
- [ ] `npm run quality:check` passes before cleanup handoff, or any failure is recorded with exact failing command and reason.
- [ ] Cleanup promotion checklist is complete and ready for `thejudge-cleanup`.

## Verification

```bash
npm --workspace apps/frontend run test -- acquisitionDiagnostics ScanCameraSurface ScanDebugOverlay useScanCapture frameSelection stabilizer detector
npm run quality:check
git diff --name-only
```

## Files touched

- `PRD/work/scan-lock-acquisition-tuning/evidence-YYYY-MM-DD.md`
- `PRD/work/scan-lock-acquisition-tuning/README.md`
- PRD durable files only during cleanup/promotion, not during this map-out slice unless implementation discovers a required doc correction

## PRD promotion checklist

- [ ] Promote durable outcomes into `PRD/sections/decisions/scanning.md` only if DEC-077 wording needs shipped evidence updates.
- [ ] Promote durable requirement outcome notes into `PRD/sections/functional-requirements.md` only if REQ-057 needs clarification.
- [ ] Update `PRD/sections/system-map.md` Scan acquisition diagnostics status to `shipped` during cleanup only after code is wired and receipt exists.
- [ ] Keep `PRD/sections/decisions.md` router index aligned if any decision wording changes.
- [ ] Write `PRD/instructions/receipts/scan-lock-acquisition-tuning-YYYY-MM-DD.md`.
- [ ] Delete `PRD/work/scan-lock-acquisition-tuning/` during `thejudge-cleanup`.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scan-lock-acquisition-tuning/` ready to delete
