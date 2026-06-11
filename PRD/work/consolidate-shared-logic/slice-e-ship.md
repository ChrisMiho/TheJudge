# Slice E — Ship gates

## Status: planned

## Goal

Verify all prior slices pass their acceptance criteria, run the full quality gate, and
prepare the work folder for cleanup.

## Requirements

1. All slice acceptance criteria for A, B, C, D satisfied and verified by their respective
   verification commands.
2. `npm run quality:check` exits 0 from the repo root (typecheck + lint + format:check +
   test + coverage:check for both apps).
3. No new exports, API shapes, HTTP contract changes, or prompt text changes introduced.
4. Audit finding from Slice C documented in `slice-c-frontend-extraction.md`.

## Acceptance criteria

- [ ] Slice A verification commands all exit 0 / return 0 lines where expected
- [ ] Slice B verification commands all exit 0 / return 0 lines where expected
- [ ] Slice C verification commands all exit 0 / return 0 lines where expected; audit note recorded
- [ ] Slice D verification commands all exit 0 / return 0 lines where expected
- [ ] `npm run quality:check` exits 0
- [ ] No remaining `truncateWithSuffix` anywhere in `apps/backend/src/`
- [ ] No remaining `resolveRulingsForPromptWithDebug` anywhere in `apps/backend/src/`
- [ ] `parseManaSpent` and `formatContextTarget` not defined in `EnrichmentStep.tsx`
- [ ] `orderedPlayerLabels` defined only in `apps/backend/src/constants.ts`

## Verification

```bash
# Cross-slice grep checks
grep -r "truncateWithSuffix" apps/backend/src/
grep -r "resolveRulingsForPromptWithDebug" apps/backend/src/
grep -n "function parseManaSpent\|function formatContextTarget" apps/frontend/src/components/EnrichmentStep.tsx
grep -rn "orderedPlayerLabels" apps/backend/src/ | grep -v "constants.ts"

# Full quality gate
npm run quality:check
```

## Files touched

No new files. Verification only.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged — no API, HTTP, or prompt format changes
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/consolidate-shared-logic/` ready to delete

## PRD promotion checklist

_(Execution in cleanup skill)_

- [ ] No new `DEC-###` or `REQ-###` entries required — this work package is within existing decisions
- [ ] `PRD/sections/technical-design-rules.md` — no updates needed (refactor follows existing rules)
- [ ] Confirm `sections/decisions.md` DEC-013, DEC-020, DEC-021 remain unchanged
- [ ] Delete `PRD/work/consolidate-shared-logic/` after receipt is written
