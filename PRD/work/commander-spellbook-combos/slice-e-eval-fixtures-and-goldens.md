# Slice E — Eval fixtures and goldens

## Status: planned

## Goal

Cover every combo retrieval branch in the eval harness with committed fixtures
and goldens.

## Requirements

1. Add `commander-spellbook-*` fixtures to `apps/backend/src/eval/fixtures/`,
   each with the standard trio: `<id>.fixture.json`, `<id>.context.golden.json`,
   `<id>.prompt.golden.txt`.
2. Cover the seven scenarios REQ-095 names:
   - game mode, complete match, no combo intent
   - game mode, partial match, explicit combo intent
   - lookup mode, attached card, explicit combo intent
   - lookup mode, unrelated card question (no retrieval)
   - unresolved template present
   - incompatible zone (present but wrong zone)
   - no artifact / degraded (no combo section, request still answered)
3. Fixtures reference a small committed eval catalog rather than the production
   corpus, so goldens never churn when the real corpus is refreshed. Keep it
   beside the existing fixtures and document it in the fixtures README.
4. Update `checklist-report.golden.txt`, which changes as a consequence of adding
   scenarios. Goldens change only for the intentional combo-section addition —
   no unrelated golden drift in the same commit.
5. Extend `apps/backend/src/eval/fixtures/README.md` with the combo fixture
   naming and the eval-catalog pointer.

## Acceptance criteria

- [ ] Seven `commander-spellbook-*` fixture trios exist and the harness runs them
- [ ] The complete/no-intent golden contains the combo section; the lookup
      unrelated-card golden and the degraded golden do not
- [ ] The partial/explicit golden names its missing ingredients
- [ ] The wrong-zone golden shows the ingredient as present-but-incompatible and
      the candidate as partial
- [ ] The unresolved-template golden shows the template as unresolved and the
      candidate as never complete
- [ ] No golden contains the standalone word "complete" in a rendered
      classification
- [ ] `checklist-report.golden.txt` regenerated; `git diff` on goldens shows only
      combo-attributable changes
- [ ] Goldens are stable across two consecutive runs
- [ ] Refreshing the production corpus does not alter any golden (eval catalog is
      independent) — verified by pointing the harness at a modified copy of the
      production artifact and observing no golden diff
- [ ] `npm run quality:check` green

## Verification

```bash
npm --workspace apps/backend run test -- eval
npm run quality:check
```

Vitest outermost `describe("Backend - Eval", …)` for harness-level suites,
matching the existing `contextEvaluationHarness.test.ts`.

## Files touched

- `apps/backend/src/eval/fixtures/commander-spellbook-*.{fixture.json,context.golden.json,prompt.golden.txt}` (new, 7 trios)
- `apps/backend/src/eval/fixtures/commander-spellbook-eval-catalog.json` (new)
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt`
- `apps/backend/src/eval/fixtures/README.md`
- `apps/backend/src/eval/contextEvaluationHarness.ts` (catalog wiring only)
