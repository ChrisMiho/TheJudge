# Cleanup receipt — card-scan lock-in fix + card-detection closeout

- **Date:** 2026-06-22
- **Slugs:** `card-scan-lockin-fix` and `cardomancer-card-detection-summary` (closed out together)
- **Status:** shipped
- **Verification:** `npm run quality:check` green — frontend 269/269, backend 218/218; typecheck + lint + format:check + coverage all pass (EXIT_CODE=0)

## Summary

Closes out the on-device card scanner end to end. The full scanner (`cardomancer-card-detection`,
slices A–E) was code-complete with the fingerprint library built; the `card-scan-lockin-fix`
follow-up added the temporal lock-in control layer that fixed the "never hones in" defect, and
card-back detection was descoped (no canonical reference asset). Reporter validated end-to-end on a
laptop camera. Both work folders are now promoted and deleted; `system-map.md` Card scanning flipped
to `shipped`.

## Actions taken

- [x] Verified all slice acceptance criteria against the codebase; ran the ship checklist
- [x] Confirmed `quality:check` green for touched areas; no secrets committed; public API/prompt contract unchanged
- [x] Promoted durable outcomes to `sections/` (new DEC-055; updated REQ-037/038, user-flows, integrations)
- [x] Wrote this receipt
- [x] Applied the system-map promotion gate — flipped Card scanning subsystem + sub-entries to `shipped`
- [x] Deleted both `PRD/work/` folders

## Durable outcome promoted

- **DEC-055 (new, confirmed):** live scanner converges via a temporal lock-in control layer
  (vote top-1 oracle identity across a rolling window, confidence + margin gated; pause + one-tap
  Add + Rescan; detection downscale; knobs isolated in `tuning.ts`). Card-back detection descoped
  from the shipped UX; engine `isCardBack()` + build-side `_card_back` support kept dormant for
  later re-enable. Refines DEC-052; does not supersede it.

## Files created

- `PRD/instructions/receipts/card-scan-lockin-fix-2026-06-22.md` (this receipt)

## Files updated

Durable PRD docs:
- `PRD/sections/decisions.md` — added DEC-055
- `PRD/sections/functional-requirements.md` — REQ-037 / REQ-038 card-back clauses updated (descope + lock-in)
- `PRD/sections/user-flows.md` — FLOW-006 main flow + edge cases (lock-in; card-back descoped)
- `PRD/sections/integrations-and-data.md` — bin has no `_card_back`; dormant card-back method; lock-in control layer
- `PRD/sections/system-map.md` — Card scanning subsystem + sub-entries flipped `planned` → `shipped`; added "Scan lock-in control layer" entry; locations made concrete

Product code (card-back descope — `card-scan-lockin-fix` follow-up):
- `apps/frontend/src/hooks/useScanCapture.ts` — removed `isCardBack` state/call/return; dropped `isCardBack` from the identifier interface type
- `apps/frontend/src/components/ZoneCardPicker.tsx` — removed `isCardBack` prop + "Flip the card over" UI
- `apps/frontend/src/components/ZoneCollectionStep.tsx` — removed `isCardBack` wiring
- `apps/frontend/src/hooks/useScanCapture.test.ts` — removed card-back test + mock plumbing
- `apps/frontend/src/App.zoneFlow.test.tsx` — removed `isCardBack` mock + clear

(Lock-in control-layer code — `stabilizer.ts`, `tuning.ts`, `detector.ts` downscale, `useScanCapture`,
`ScanCameraSurface`, `ZoneCardPicker` — landed under `card-scan-lockin-fix` prior to this cleanup.)

## Files deleted

- `PRD/work/card-scan-lockin-fix/` (`GAMEPLAN.md`, `ANALYSIS.md`)
- `PRD/work/cardomancer-card-detection-summary/` (`README.md`, `GAMEPLAN.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `SOURCE-ANALYSIS.md`, `slice-a..e-*.md`)

## Remaining (tracked, not blockers)

- Formal NFR-010 device metrics (bin size, first-scan lazy-load, memory, match latency) not separately recorded
- Card-back detection re-enable requires a canonical 745×1040 `card_back_reference.png` + `data:scan-fingerprints` re-run + UI rewire (DEC-055)
- Scan UX refinement → continues under `feature/scan-refinement`
