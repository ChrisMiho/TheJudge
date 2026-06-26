# Slice D — On-device validation, PRD promotion, ship gates

## Status: done

## Goal

Close the package against DEC-074's **outcome-based** validation gate (DEC-052/DEC-055/DEC-059/DEC-062 precedent): a fresh owner on-device pass, not a synthetic/automated pass. Record evidence, then prepare PRD promotion and ship gates for cleanup. Lesson carried from the prior package: an automated pass is necessary-but-not-sufficient; the on-device outcome is the gate.

## Depends on

Slices A, B, C.

## Requirements

1. Run the full automated gate green (`npm run quality:check`).
2. Owner on-device pass, recorded in an evidence note (`evidence-<YYYY-MM-DD>.md`):
   - A **DB-registered** card locks across a **broader distance/light range** than before — no longer a narrow sweet spot.
   - **No new false auto-adds** (the DEC-059 lock gate / `marginMin` precision guard still holds).
   - An exported frame reports **native resolution above 640×480** on a supporting device (confirms Slice A took effect).
   - The positive in-zone cue appears when the frame is lockable (Slice B), and the recalibrated thresholds (Slice C) do not regress locking.
3. Confirm the frozen boundary held: `recipe.ts`, `CARDHSH1`/`cardhashes.bin`, `identify.ts`, and the DEC-059 lock gate unchanged (DEC-051/REQ-034 pHash + DB-load parity intact).
4. If the on-device pass fails in a way that genuinely needs a recipe/DB/identify/lock-gate change, **do not fold it in** — flag and record it as a separate recipe + full-DB-rebuild escalation (DEC-069/DEC-072 precedent).

## Acceptance criteria

- [x] `npm run quality:check` green.
- [x] Evidence note records the on-device outcome (wider lock window, no new false adds, exported frame > 640x480 capture path).
- [x] Frozen-boundary files confirmed unedited (`git diff --name-only` against the frozen list).

## PRD promotion checklist (executed in cleanup)

- [ ] DEC-074 confirmed in `sections/decisions/scanning.md`; router index line in `sections/decisions.md`.
- [ ] REQ-053 / REQ-054 confirmed in `sections/functional-requirements.md`.
- [ ] FLOW-006 edge case (higher-res capture + positive in-zone cue) confirmed in `sections/user-flows.md`.
- [ ] `sections/system-map.md` scan-capture entry flipped to `shipped` (code wired in **and** receipt written).
- [ ] Calibration constants (resolution ceiling, focus mode, window 5→3, `FRAME_QUALITY_*`) recorded as outcome-validated, not open questions.
- [ ] Cleanup receipt at `PRD/instructions/receipts/scan-capture-quality-<YYYY-MM-DD>.md`; `PRD/work/scan-capture-quality/` deleted.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/scan-capture-quality/` ready to delete

## Verification

```bash
npm run quality:check
git diff --name-only   # confirm no frozen-boundary file edited
```

## Files touched

- `PRD/work/scan-capture-quality/evidence-<YYYY-MM-DD>.md` — on-device pass record (ephemeral; promoted at cleanup)
- No product code (validation + promotion prep only)
