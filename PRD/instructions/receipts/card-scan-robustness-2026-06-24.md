# Receipt — card-scan-robustness

- **Date:** 2026-06-24
- **Slug:** card-scan-robustness
- **Status:** shipped

Makes the webcam scan vote lock reliably under real capture conditions
(glare/gloss, uneven/dim lighting, handheld shake, finger occlusion) by feeding
the **unchanged** matching engine a cleaner, better-chosen query image plus
condition-aware feedback — never by loosening the lock gate. Realizes REQ-043 /
DEC-062 (refines DEC-052/055/056/057/059/060; supersedes none). Frontend-only,
query-only. Three levers across four slices: (A) extended query-only
conditioning, (B) frame-quality scoring + best-frame selection, (C)
condition-aware searching hints + debug quality metrics, (D) validation.

## Actions taken

- [x] Slice A — query-only conditioning pipeline in `identify.ts` (full
      auto-contrast + glare suppression + white-balance), constants in
      `tuning.ts`; identify/conditioning fixtures regenerated (verified done)
- [x] Slice B — pure `frameQuality.ts` scoring + `frameSelection.ts` best-frame
      selector; poor frames abstain (no identify call, no auto-add); threaded
      through `useScanCapture.ts` (verified done)
- [x] Slice C — cause-aware searching hint in `ScanCameraSurface` (searching
      only; locking copy unchanged); glare%/sharpness/quality/reason rows in
      `ScanDebugOverlay` (verified done, this session)
- [x] Slice D — `VALIDATION.md` written with automated evidence + qualitative
      Mac-webcam owner acceptance; no tuning changes; gate held (verified)
- [x] Parity-by-construction confirmed: empty diff over `recipe.ts`,
      `scripts/build-card-hashes.mjs`, `apps/frontend/public/data/cardhashes.bin`
- [x] Lock gate held: `lockDistance === 78`, `marginMin === 14` unchanged
- [x] System-map promotion gate applied: `Scan robustness conditioning`
      `planned` → `shipped`; `Lives in` corrected to shipped reality
- [x] Receipt written
- [x] `PRD/work/card-scan-robustness/` deleted

No edits to `DEC-062` (stays `confirmed`) or `REQ-043` (stays as shipped
acceptance truth); both already matched shipped behavior, and the doc-lifecycle
gate forbids using `Status:` to express shipped-vs-planned. FLOW-006 step 2 +
edge cases already carried the shipped condition-hint / cleaner-query wording.

## Device validation

Product owner ran the live scanner on a built-in Mac webcam (2026-06-24) and
confirmed cards lock noticeably more reliably without hunting for an angle to
dodge glare/lighting; signed off on shipping. Qualitative owner acceptance, not a
counted per-condition before/after table (left optional per sign-off). Full
evidence was in the now-deleted `PRD/work/card-scan-robustness/VALIDATION.md`;
summary preserved here.

## Files created (product code, on this branch)

- `apps/frontend/src/lib/scan/frameQuality.ts`
- `apps/frontend/src/lib/scan/frameQuality.test.ts`
- `apps/frontend/src/lib/scan/frameSelection.ts`
- `apps/frontend/src/lib/scan/frameSelection.test.ts`
- `PRD/instructions/receipts/card-scan-robustness-2026-06-24.md`

## Files updated

- `PRD/sections/system-map.md` — `Scan robustness conditioning` status
  `planned` → `shipped`; `Lives in` corrected (added `frameQuality.ts`,
  `frameSelection.ts`; dropped `recipe.ts` and `stabilizer.ts`, both
  intentionally unchanged by this feature)
- (product code updated during slice implementation, on this branch:)
  - `apps/frontend/src/lib/scan/identify.ts` (query-only conditioning)
  - `apps/frontend/src/lib/scan/tuning.ts` (conditioning + frame-quality
    constants; gate constants unchanged)
  - `apps/frontend/src/hooks/useScanCapture.ts` (frame selection + view-models
    carrying condition hint / quality metrics)
  - `apps/frontend/src/components/ScanCameraSurface.tsx` (searching-state hint)
  - `apps/frontend/src/components/ScanDebugOverlay.tsx` (quality metric rows)
  - tests: `identify.test.ts`, `useScanCapture.test.ts`,
    `ScanCameraSurface.test.tsx`, `ScanDebugOverlay.test.tsx`,
    `ZoneCardPicker.test.tsx`, `App.zoneFlow.test.tsx`
  - fixtures (intentional conditioning change): `__fixtures__/vectors.json`
    (identify-path distances only; canonical pHash entries byte-identical),
    `__fixtures__/autolevels_out.rgb.bin`

DEC-062 / REQ-043 / FLOW-006 were authored at refinement and already matched
shipped behavior; no prose edits were required at cleanup.

## Files deleted

- `PRD/work/card-scan-robustness/` (entire folder):
  - `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `README.md`, `VALIDATION.md`,
    `slice-a-query-conditioning-pipeline.md`,
    `slice-b-frame-quality-and-best-frame-selection.md`,
    `slice-c-condition-aware-scan-feedback.md`,
    `slice-d-outcome-validation-and-ship-readiness.md`

## Verification results

- `npm run quality:check` → **exit 0** (tsc, eslint, prettier; frontend 36
  files / 329 tests, backend 21 files / 218 tests)
- Slice C list (`useScanCapture`, `ScanCameraSurface`, `ScanDebugOverlay`,
  `ZoneCardPicker`) → **39 passed**
- Slice D list (identify, recipe, loadHashDb, dbformat, frameQuality,
  frameSelection, useScanCapture, ScanCameraSurface, ScanDebugOverlay) →
  **57 passed**
- `npm run data:scan-vectors` → idempotent; reports identify top-1
  `{"card_id":"card_10","distance":2}` `matched=true`; local source decode only,
  no network
- `git diff --stat -- apps/frontend/src/lib/scan/recipe.ts scripts/build-card-hashes.mjs apps/frontend/public/data/cardhashes.bin`
  → empty (DB / recipe / build path untouched)
- `grep -nE "lockDistance|marginMin" apps/frontend/src/lib/scan/tuning.ts`
  → `lockDistance: 78`, `marginMin: 14`
