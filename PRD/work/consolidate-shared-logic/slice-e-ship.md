# Slice E — Ship gates + promotion prep

## Status: planned

## Blocked by: Slices B + C + D (and transitively A)

## Goal

Verify every prior slice meets its acceptance criteria, run the full repo quality gate, add the durable instructions-rule change, and hand off to cleanup. Verification + one durable doc edit only.

## Requirements

1. Confirm Slice A, B, C, D acceptance criteria all pass via their verification commands.
2. Add the **reuse-before-create** bullet to `PRD/instructions/technical-design-rules.md` under a behavior heading (verbatim from the DESIGN-BRIEF):
   > **Reuse before creating.** Before writing a new constant, helper, or type, search for an existing one and reuse or extend it rather than re-implementing. Shared logic must have a single authoritative definition imported wherever needed — duplicated constants/functions across files or the FE↔BE boundary are a defect, not a style preference.
3. Run `npm run quality:check` from the repo root (typecheck + lint + format:check + test + coverage:check, both apps) and confirm it exits 0.
4. Confirm no new public exports, API/HTTP contract changes, or prompt-text changes were introduced across all slices.
5. Confirm Slice C audit findings are recorded in `slice-c-frontend-extraction.md`.

## Acceptance criteria

- [ ] Slice A/B/C/D verification commands all pass
- [ ] `technical-design-rules.md` contains the reuse-before-create bullet
- [ ] `npm run quality:check` exits 0
- [ ] `grep -rn "truncateWithSuffix\|resolveRulingsForPromptWithDebug\|orderedPlayerLabels\|PLAYER_LABEL_ORDER" apps/backend/src` returns nothing
- [ ] `grep -n "function parseManaSpent\|function formatContextTarget\|function hasOwnerControl" apps/frontend/src/components/EnrichmentStep.tsx` returns nothing
- [ ] Slice C audit section is filled in

## Verification

```bash
# Cross-slice symbol sweeps
grep -rn "truncateWithSuffix\|resolveRulingsForPromptWithDebug\|orderedPlayerLabels\|PLAYER_LABEL_ORDER" apps/backend/src
grep -n "function parseManaSpent\|function formatContextTarget\|function hasOwnerControl" apps/frontend/src/components/EnrichmentStep.tsx

# Full quality gate
npm run quality:check
```

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged — no API, HTTP, or prompt-format changes (DEC-013, DEC-020, DEC-021, DEC-042 intact)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/consolidate-shared-logic/` ready to delete

## PRD promotion checklist

_(Execution in `thejudge-cleanup`.)_

- [ ] `PRD/instructions/technical-design-rules.md` — reuse-before-create bullet present and kept (durable)
- [ ] No new `DEC-###` / `REQ-###` / FLOW entries — entirely within existing decisions
- [ ] `sections/decisions.md` DEC-013, DEC-020, DEC-021, DEC-042 unchanged
- [ ] `sections/system-map.md` — no catalog flip required (pure refactor, no new shipped feature surface); confirm at cleanup
- [ ] Write receipt at `PRD/instructions/receipts/consolidate-shared-logic-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/consolidate-shared-logic/` after receipt is written
