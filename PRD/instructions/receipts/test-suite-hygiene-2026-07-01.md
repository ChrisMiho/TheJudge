# Receipt — test-suite-hygiene

- Date: 2026-07-01
- Slug: test-suite-hygiene
- Status: shipped
- Backed by: NFR-012, DEC-086 (deps NFR-005, NFR-009)

## Summary

Sped up the CI test gate and reorganized the growing Vitest suite as an assertion-preserving refactor. `quality:check` now runs the suite once (coverage-mode as the single regression + coverage gate) instead of twice; oversized/duplicated test files were split, deduplicated, and grouped. No product source, coverage threshold, or eval golden gate changed.

## Actions taken

- [x] Slice A — collapsed `quality:check` to a single suite run (dropped standalone `test`, kept `coverage:check` as canonical gate)
- [x] Slice B — split `App.test.tsx` (85 cases) into behavior-focused sibling files; original removed
- [x] Slice C — extracted shared EnrichmentStep fixtures/render helper to a single test-only module
- [x] Slice D — grouped `src/lib/scan/*.test.ts` by pipeline stage into subdirectories
- [x] Confirmed NFR-012 + DEC-086 already reflect shipped reality (no wording change needed)
- [x] Confirmed no `system-map.md` entry (test/CI tooling — DEC-044/063/064 precedent)
- [x] Wrote this receipt
- [x] Deleted `PRD/work/test-suite-hygiene/`

## Verification

- `quality:check` green end to end — exit 0; frontend 582 tests / 65 files, backend 218 tests / 21 files; coverage thresholds all met (suite executed once).
- Slice A: `quality:check` = `typecheck && lint && format:check && coverage:check` — no standalone `test` chained.
- Slice B: five split files sum to **85** cases; `App.zoneFlow.test.tsx` (8 cases) pre-dates this branch (commit 685dd81) and is excluded from the count; `App.test.tsx` removed.
- Slice C: EnrichmentStep trio = **12** cases; shared helper at `apps/frontend/src/test/enrichmentStep.tsx`.
- Slice D: scan lib = **128** cases across `acquisition/`, `detection/`, `identification/`, `persistence/` subdirs; component scan suites unchanged (ScanDebugOverlay 9, ScanCardOutline 6, ScanCameraSurface 46, ScanReviewBubble 8).
- Guardrails: `git diff` on both `vitest.config.ts` empty; `test:eval` untouched; no non-test product source changed vs `main`.

## Files updated (durable — pre-promoted during refinement)

- `PRD/sections/non-functional-requirements.md` — NFR-012
- `PRD/sections/decisions/doc-process.md` — DEC-086
- `PRD/sections/decisions.md` — DEC-086 router index line

## Files created

- `PRD/instructions/receipts/test-suite-hygiene-2026-07-01.md` (this receipt)
- Test files: `apps/frontend/src/App.{interaction-flows,answered-state,game-setup-zones,theming,layout-density}.test.tsx`; `apps/frontend/src/test/enrichmentStep.tsx`; scan-suite files relocated under `apps/frontend/src/lib/scan/{acquisition,detection,identification,persistence}/`

## Files deleted

- `apps/frontend/src/App.test.tsx` (content relocated)
- `PRD/work/test-suite-hygiene/` (entire folder — ephemeral)
