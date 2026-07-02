# Receipt: scan-capture-quality — 2026-06-26

- **Slug:** scan-capture-quality
- **Status:** shipped

## Actions taken

- [x] Compared each slice's acceptance criteria against the codebase: A–D shipped.
- [x] Confirmed durable product truth was already promoted: DEC-074 in `sections/decisions/scanning.md`, router line in `sections/decisions.md`, REQ-053 / REQ-054 in `sections/functional-requirements.md`, and FLOW-006 edge case in `sections/user-flows.md`.
- [x] Verified Slice A implementation: `ScanCameraSurface.openCamera` requests ideal 1920x1080 environment-facing capture with no `exact` constraints, gracefully handles lower returned modes, and applies continuous focus only when the opened track reports support.
- [x] Verified Slice B implementation: `ScanConvergence.inZone` is additive, defaults false, is true for acceptable not-yet-locked frames, and renders the positive "Good — hold steady" cue only while searching with negative hints taking precedence.
- [x] Verified Slice C implementation: `FRAME_SELECTOR_WINDOW_SIZE` is 3 and `tuning.ts` records the outcome-validated frame-quality calibration without changing frame-selection or frame-quality logic.
- [x] Verified the frozen matching boundary held: no diff for `recipe.ts`, `identify.ts`, `stabilizer.ts`, `detector.ts`, `cardhashes.bin`, or `cardScanMap.json`.
- [x] Confirmed owner on-device evidence recorded a PASS on 2026-06-26: broader lock window, no new false auto-adds, positive cue present in the validated scan flow, and no frozen-boundary escalation. The handoff did not capture the specific observed native resolution, but the validation note marks the higher-resolution capture path pass and automated tests cover the requested constraints/fallback.
- [x] Ran the full project quality gate green.
- [x] Wrote this receipt before applying the system-map promotion gate, per `doc-lifecycle.md`.
- [x] Deleted `PRD/work/scan-capture-quality/`.

## Files created

- `PRD/instructions/receipts/scan-capture-quality-2026-06-26.md` (this receipt)

## Files updated

- `PRD/sections/system-map.md` — close out the reassigned DEC-074 capture-quality validation as shipped; record higher-resolution capture, continuous-focus fallback, positive in-zone cue, and 3-frame/calibration outcome.

(DEC-074, REQ-053, REQ-054, and FLOW-006 were promoted before cleanup and are unchanged here. Product code was landed before this cleanup and is verified here, not edited here.)

## Files deleted

- `PRD/work/scan-capture-quality/` (entire folder): `README.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `evidence-2026-06-25.md`, `evidence-2026-06-26.md`, `slice-a-capture-resolution-prior.md`, `slice-b-positive-in-zone-cue.md`, `slice-c-window-and-recalibration.md`, `slice-d-validation-and-ship-gates.md`.

## Verification

- `npm run quality:check` → **PASS**: typecheck, lint, format, tests, and coverage all green. Test counts: frontend 49 files / 501 tests; backend 21 files / 218 tests.
- Frozen-boundary diff:
  `git diff --name-only -- apps/frontend/src/lib/scan/recipe.ts apps/frontend/src/lib/scan/identify.ts apps/frontend/src/lib/scan/stabilizer.ts apps/frontend/src/lib/scan/detector.ts apps/frontend/public/data/cardhashes.bin apps/frontend/public/data/cardScanMap.json` → empty.
- On-device evidence: `PRD/work/scan-capture-quality/evidence-2026-06-26.md` recorded **PASS** and no recipe/bin/identify/lock-gate escalation.

## Notes

- The implementation applies continuous autofocus after stream acquisition through `track.applyConstraints({ advanced: [{ focusMode: "continuous" }] })` only when the track advertises support. This differs from the initial slice wording that suggested putting a focus hint directly inside `getUserMedia`, but satisfies DEC-074 / REQ-053's supported-device, graceful-fallback intent.
- If future evidence shows a remaining lock failure requires Region A geometry, `CARDHSH1`, bin, identify, or lock-gate changes, that remains a separate recipe + full-DB-rebuild escalation, not part of this shipped capture-quality package.
