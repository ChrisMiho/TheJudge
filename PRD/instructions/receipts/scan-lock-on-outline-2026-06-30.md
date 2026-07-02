# Cleanup receipt — scan-lock-on-outline

- Date: 2026-06-30
- Slug: `scan-lock-on-outline`
- Status: shipped

## Actions taken

- [x] Audited Slice A (shared `ScanCardOutline` renderer + `ScanDebugOverlay` refactor) and Slice B (always-on locking outline wiring in `ScanCameraSurface`) against their acceptance criteria — both fully satisfied.
- [x] Confirmed the outline is gated purely on the existing `locking` state (DEC-057) with no new threshold and no match-acceptance change.
- [x] Confirmed corner capture is additive (`onCorners` on every detected frame via a ref) and only enters React state — triggering a render — while `convergence.phase === "locking"`, so scanning with the debug overlay off and phase `searching` adds zero re-renders.
- [x] Confirmed the outline clears on the transition out of `locking` (drop to `searching` and lock-complete/auto-add) and after `closeScan`, and degrades to no outline (text indicator unaffected) when a `locking` frame has no captured corners.
- [x] Confirmed the debug overlay (`ScanDebugOverlay`) is unchanged in behavior — default-off, still draws its sky outline (now via the shared `ScanCardOutline` `debug` variant), pink read region, and full metrics panel — with its existing test suite passing unmodified.
- [x] Confirmed no diff to `recipe.ts`, `identify.ts`, `cardhashes.bin`, the stabilizer lock gate (`lockDistance`/`marginMin`), the DEC-051/REQ-034 parity gates, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, or the provider boundary.
- [x] Confirmed no new scan-screen control/toggle/setting/mode was added, and the outline (`pointer-events-none`, full-viewfinder SVG) does not intercept the top-right scanned-cards review/remove hit area (DEC-065).
- [x] Confirmed DEC-083, REQ-062, and FLOW-006 step 3 already describe shipped reality (written pre-emptively as evergreen product truth during refinement) — no edits needed.
- [x] Promoted the "Scan lock-in control layer" system-map entry from `Planned (REQ-062 / DEC-083, refined)` to a shipped closeout note, and added `ScanCardOutline.tsx` to its and the "Scanner debug overlay" entry's `Lives in` lists.
- [x] Scanned changed/new files for secrets — none found.
- [x] Removed the completed ephemeral work package after writing this receipt.

## Files created

- `PRD/instructions/receipts/scan-lock-on-outline-2026-06-30.md`
- `apps/frontend/src/components/ScanCardOutline.tsx`
- `apps/frontend/src/components/ScanCardOutline.test.tsx`

## Files updated

- `PRD/sections/system-map.md`
- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/src/components/ScanDebugOverlay.tsx`

## Files deleted

- `PRD/work/scan-lock-on-outline/DESIGN-BRIEF.md`
- `PRD/work/scan-lock-on-outline/GAMEPLAN.md`
- `PRD/work/scan-lock-on-outline/IDEA.md`
- `PRD/work/scan-lock-on-outline/README.md`
- `PRD/work/scan-lock-on-outline/slice-a-outline-renderer.md`
- `PRD/work/scan-lock-on-outline/slice-b-locking-outline-wiring.md`

## Verification results

- `npm --workspace apps/frontend run test -- src/components/ScanCardOutline src/components/ScanDebugOverlay src/components/ScanCameraSurface` — PASS: 3 files, 61 tests.
- `npm --workspace apps/frontend run typecheck` — PASS.
- `npm run quality:check` (full suite) — 1 pre-existing failure in `src/App.test.tsx` (`Caster for Opt` label assertions), reproduced identically on a stash of this work's diff (i.e. present on `feature/next-refinement` before this slice's changes) — unrelated to scan-lock-on-outline and out of scope for this closeout. All 61 tests in the touched scan-outline area pass; 579/582 tests pass overall.
- Boundary audit — PASS: no diff to `recipe.ts`, `identify.ts`, `cardhashes.bin`, the stabilizer lock gate, `detector.ts`, `useScanCapture.ts`, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, or the provider boundary.
- Frozen debug-overlay behavior — PASS: `ScanDebugOverlay.test.tsx` (9 tests) passes unmodified against the refactor.
