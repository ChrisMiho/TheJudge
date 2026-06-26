# Receipt: scan-detector-foil-robustness — 2026-06-25

- **Slug:** scan-detector-foil-robustness
- **Status:** partial (detector recall + guide prior shipped; on-device detect-then-lock validation reassigned to `scan-capture-quality` / DEC-074)
- **Closeout choice (owner):** Option 1 — clean up now with handoff framing. The detector work (Slices A–D) is shipped and green; the unmet Slice E on-device **lock** gate was diagnosed as a capture-quality problem (640×480 source, borderline Region A quality 0.451–0.501 at the 0.45 threshold), which is now owned by the `scan-capture-quality` package. The lock gate was reassigned, not dropped — recorded explicitly here and in `system-map.md` rather than marked passed.

## Actions taken

- [x] Compared each slice's acceptance criteria against the codebase: A–D done, E blocked on the on-device lock gate.
- [x] Confirmed durable decisions already promoted during refinement: DEC-072 / DEC-073 / DEC-074 `confirmed` in `sections/decisions/scanning.md` with router index lines in `sections/decisions.md`; REQ-050 / REQ-051 / REQ-052 in `sections/functional-requirements.md`; FLOW-006 edge cases in `sections/user-flows.md`.
- [x] Verified the detector code landed (`detector.ts` +114 lines; clutter-resistant selection, `median*1.15` cap removed, `detectCard({ guide })` prior; `ScanCameraSurface.tsx` guide rect + coaching copy).
- [x] Verified the frozen boundary held (empty diff for `recipe.ts`, `identify.ts`, `tuning.ts`, `cardhashes.bin`, `cardScanMap.json`).
- [x] Ran focused test suites green (76 tests).
- [x] Updated the `system-map.md` "Camera capture & detector" entry: shipped detector-robustness note + reassigned-validation note (DEC-074); added DEC-072/073, REQ-050/051/052 to Backed-by.
- [x] Wrote this receipt and deleted `PRD/work/scan-detector-foil-robustness/`.

## Files created

- `PRD/instructions/receipts/scan-detector-foil-robustness-2026-06-25.md` (this receipt)

## Files updated

- `PRD/sections/system-map.md` — "Camera capture & detector" entry: clutter-resistant + guide-biased selection in Summary; shipped detector-robustness note; reassigned on-device lock gate to `scan-capture-quality` (DEC-074); Backed-by extended.

(DEC-072/073/074, REQ-050/051/052, FLOW-006 were promoted earlier during refinement and are unchanged here. Product code under `apps/frontend/src/lib/scan/` + `components/ScanCameraSurface.tsx` was landed by Slices A–D, tracked in git, not by this cleanup.)

## Files deleted

- `PRD/work/scan-detector-foil-robustness/` (entire folder): `README.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `evidence-2026-06-25.md`, `slice-a-real-frame-fixtures.md`, `slice-b-regression-hunt-recall.md`, `slice-c-guide-prior.md`, `slice-d-guidance-copy.md`, `slice-e-validation-and-ship-gates.md`.

## Verification

- `npm --workspace apps/frontend run test -- src/lib/scan/detector.test.ts src/lib/scan/detectorFixtures.test.ts src/components/ScanCameraSurface.test.tsx src/hooks/useScanCapture.test.ts src/lib/scan/stabilizer.test.ts` → **76 passed**.
- Frozen-boundary diff `git diff --stat HEAD -- recipe.ts identify.ts tuning.ts cardhashes.bin cardScanMap.json` → empty.
- Synthetic detector corpus 5/5; committed real frames 2/2 detector-only (necessary-but-not-sufficient; on-device detect-then-**lock** remained the unmet gate, now reassigned).

## Notes

- The on-device **detect-then-lock** outcome (DB-registered card locks across a wider distance/light range, no new false auto-adds) is the acceptance gate for `scan-capture-quality` (DEC-074), not this package. Detector recall is shipped and is not reopened by that work.
- Root-cause lineage preserved in `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md` (the prior detector escalation) and now this receipt.
- If a future on-device failure proves a card is unfindable without a Region A geometry / `CARDHSH1` change, that remains a separate recipe + full-DB-rebuild escalation (DEC-069/DEC-072 precedent), never folded in.