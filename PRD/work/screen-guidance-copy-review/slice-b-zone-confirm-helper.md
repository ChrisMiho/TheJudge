# Slice B — Zone-confirmation helper (+ package ship gates)

## Status: planned

## Goal

Replace the zone-confirmation helper with a direct, action-oriented single line;
drop the turn-phase-defaults clause. Carry the package-level ship gates.

## Requirements

1. In `apps/frontend/src/components/ZoneConfirmStep.tsx`, replace the helper text
   at the `text-sm text-zinc-400` `<p>` under `StagedStepHeader` (currently
   line 27):
   - Before: `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.`
   - After: `Select each zone at the top of the screen to add cards to it.`
2. Text-only: do not change the zone checkboxes, their `aria-label`s, the
   continue/back buttons, or any other line. No behavior change.
3. Add/extend a test in
   `apps/frontend/src/components/ZoneConfirmStep.test.tsx` asserting the new
   string renders and the old string is absent.

## Acceptance criteria

- [ ] Zone-confirmation helper renders exactly `Select each zone at the top of the screen to add cards to it.`
- [ ] The string `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.` no longer appears anywhere in `apps/frontend/src/`.
- [ ] Test asserts new string present and old string absent.
- [ ] No other guidance/helper text changed (guardrail grep below returns nothing).

## Verification

```bash
grep -n "Select each zone at the top of the screen to add cards to it." apps/frontend/src/components/ZoneConfirmStep.tsx
grep -rn "Select the zones relevant to your question\|2 players start at 20 life" apps/frontend/src/   # expect no matches
npm --workspace apps/frontend run test -- src/components/ZoneConfirmStep.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/components/ZoneConfirmStep.test.tsx`

## Ship gates (package-level — run after A and B merged)

- [ ] Both slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm --workspace apps/frontend run test` and `typecheck` green
- [ ] Public contract unchanged (no schema/prompt/route/flow diff) — copy only
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/screen-guidance-copy-review/` ready to delete

## PRD promotion checklist (executed at cleanup — `thejudge-cleanup`)

- [ ] DEC-092 (`sections/decisions/ui-presentation.md`) reflects shipped copy — no edits expected; confirm accuracy
- [ ] REQ-070 (`sections/functional-requirements.md`) acceptance criteria match shipped strings
- [ ] `sections/system-map.md` guidance-copy entry flipped to `shipped` (per doc-lifecycle gate)
- [ ] Write receipt `PRD/instructions/receipts/screen-guidance-copy-review-2026-07-03.md`
- [ ] Delete `PRD/work/screen-guidance-copy-review/`
