# Slice E — Eval fixtures and goldens

## Status: done

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

- [x] Seven `commander-spellbook-*` fixture trios exist and the harness runs them
- [x] The complete/no-intent golden contains the combo section; the lookup
      unrelated-card golden and the degraded golden do not
- [x] The partial/explicit golden names its missing ingredients
- [x] The wrong-zone golden shows the ingredient as present-but-incompatible and
      the candidate as partial
- [x] The unresolved-template golden shows the template as unresolved and the
      candidate as never complete
- [x] No golden contains the standalone word "complete" in a rendered
      classification
- [x] `checklist-report.golden.txt` regenerated; `git diff` on goldens shows only
      combo-attributable changes
- [x] Goldens are stable across two consecutive runs
- [x] Refreshing the production corpus does not alter any golden (eval catalog is
      independent) — verified by pointing the harness at a modified copy of the
      production artifact and observing no golden diff
- [x] `npm run quality:check` green

## Verification evidence

Recorded 2026-08-11 on the implementation worktree.

- `npm --workspace apps/backend run test -- eval` — 5/5 pass across
  `contextEvaluationHarness.test.ts` and `relevanceReport.test.ts`.
- `npm run quality:check` — green.
- All seven new scenarios score full marks in `checklist-report.golden.txt`:
  five game-mode scenarios at `16/16` and two lookup scenarios at `14/14`.

### No unrelated golden drift

`git diff origin/feature/enhancement-bangers...HEAD -- apps/backend/src/eval/fixtures/`
touches only `commander-spellbook-*` files, `README.md`, and
`checklist-report.golden.txt`. The checklist diff is purely **additive** — seven
new rows, no existing row modified. No pre-existing `.prompt.golden.txt` or
`.context.golden.json` changed.

### Production-corpus independence, verified by experiment

Not merely asserted by construction. A variant keyed on `eval-oracle-a` — a card
the eval fixtures genuinely submit — was injected into the production artifact
`apps/backend/data/commanderSpellbookCombos.json` with popularity 9999, which
would have ranked first had the harness read it. The eval suite was re-run and
`git diff` on the fixtures directory was empty; the production artifact was then
restored. The harness reads only `commander-spellbook-eval-catalog.json`.

### Two harness changes were required

1. `EvaluationFixture` gains an optional `disableComboEnrichment` flag. The
   degraded scenario has to be evaluated with **no** catalog, which no
   fixture-level field could otherwise express, since the harness applies one
   catalog to every fixture.
2. `resolveGameComboCandidates` is now exported from `prompt/preparation.ts`. The
   harness's game path calls `buildPromptText` directly rather than
   `preparePromptInput` (switching it would have churned unrelated goldens by
   adding rulings and history), so it needs the production instance-collection
   logic rather than a reimplementation of it.

`buildEvalComboCatalog` derives oracle membership from the fixture's `variants`
array instead of storing a second hand-maintained index, so the eval catalog
cannot drift out of sync with itself.

### One fixture-data addition

`fixtureRulings` in the harness test gained an entry for `eval-oracle-b`. The
pre-existing `lookup-card-enrichment` check requires an `OFFICIAL RULINGS` section
for any attached lookup card, so the two lookup combo fixtures failed that check
until their attached card had a ruling. It is a new key, so no existing fixture's
golden was affected.

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
