# GAMEPLAN — rule-excerpt-cap-ten

## What ships

A player asking Ask AI a rules question gets ten official Comprehensive Rules
excerpts attached to the prompt instead of five. The five excerpts a question
already gets stay the same five, in the same order; five more are added
beneath them. No UI change, no slower answer (measured 3.4 → 3.5 s for the
deployed model, `gpt-4.1`).

One constant flips in the backend (`DEFAULT_SUPPLEMENTAL_RULE_CAP`, 5 → 10),
and every place `PRD/sections/` asserts the old cap of five for this
requirement moves to ten — 14 finalized `GATE-QUESTIONS.md` blocks, 32 lines
across 7 files, all `accept`. The offline answer-quality run's comparison legs
move from `[5, 10]` to `[10, 15]`, and the System 3 recall-harness checks
(`system3-expected-recall`, `system3-noise-excluded`) move from top-5 to
top-10, so both instruments keep describing what production actually attaches.

## Architecture / data flow

No new component. `preparePromptInput` (`apps/backend/src/prompt/preparation.ts`)
already threads one exported constant, `DEFAULT_SUPPLEMENTAL_RULE_CAP`, through
all four production call sites into `retrieveRulesForQueryWithDebug` /
`retrieveSupplementalRulesWithDebug`'s `max` parameter. Raising the constant
raises what every call site attaches; the ranking itself is untouched
(REQ-181/REQ-182). `retrieveRulesForQueryWithDebug` already returns
`runnerUp` as the ranks below the cap of the same scored list, so a larger
cap's leading excerpts are provably identical to the smaller cap's, and the
added slots are drawn from `runnerUp` — this is proven directly in
`preparation.test.ts`, not assumed.

The System 3 recall-harness checks (`apps/backend/src/eval/contextEvaluationHarness.ts`,
`system3-expected-recall` / `system3-noise-excluded`) consume whatever
`supplementalRules` list `preparePromptInput` returns — they hold no hardcoded
depth of their own, only "top-5" wording in doc comments and result-message
strings. Once `DEFAULT_SUPPLEMENTAL_RULE_CAP` is 10, the harness's real
retrieval depth is already 10; the checks' own wording is relabeled to match
so the message a reader sees is truthful.

The answer-quality run (`scripts/eval-answer-quality.mjs`) is a separate,
explicitly-invoked, confirmation-gated instrument with its own
`DEFAULT_EXCERPT_CAPS` constant, unrelated to what production attaches except
as the two values it compares. Moving it to `[10, 15]` keeps it pointed at the
open question (does an even larger cap help?) with production cap (10) as one
of the two legs.

## Slices

| Slice | Title | Dependencies |
| --- | --- | --- |
| A | Deploy the ten-excerpt cap | none |
| B | Point the eval instrument and recall harness at the new cap | A |

Slice B depends on A because the brief's recorded implementation risk — a
forbidden rule already sitting at ranks 6–10 in an existing eval fixture —
only surfaces once the recall harness is actually exercising a cap of 10
(i.e., once `DEFAULT_SUPPLEMENTAL_RULE_CAP` is 10). Running B first would test
the old top-5 depth and prove nothing about the new one. Both slices are
otherwise independent code changes; the dependency is about what B's
verification run needs to be true to be meaningful, not a file conflict (each
touches a disjoint set of `PRD/sections/` GATE-QUESTIONS blocks, though both
land lines in the shared `functional-requirements.md`).

## Verification checklist (both slices)

- `npm run quality:check` (typecheck, lint, format:check, coverage:check —
  which runs `apps/backend`'s `vitest run --coverage` and so exercises
  `preparation.test.ts` — and `test:scripts`, which exercises
  `eval-answer-quality.test.mjs`).
- `cd apps/backend && npm run test:eval` — runs
  `contextEvaluationHarness.test.ts`, where `system3-expected-recall` and
  `system3-noise-excluded` live. A failure from a forbidden rule surfacing at
  rank 6–10 is a genuine signal about what the deeper cap attaches. It is
  recorded in the slice evidence log, never suppressed by relaxing the check
  or loosening a fixture.
- No live provider call in either slice. The answer-quality run and
  `eval:worked-solutions` stay confirmation-gated and are not executed here.

## Risk carried forward from the brief

`GATE-QUESTIONS.md`'s REQ-032 block and `DESIGN-BRIEF.md`'s "recall harness
follows production to top-10" decision both name this risk explicitly: moving
the noise check from top-5 to top-10 makes it strictly harder to pass, and an
existing fixture's forbidden rule may already rank 6–10. If `npm run test:eval`
fails on that basis, slice B is **not** done by loosening the fixture or the
check — it is done by recording the exact failing fixture and rule id as a
finding for the owner, in the slice's evidence log and in the terminal report.

## PRD promotion checklist

Durable outcomes are promoted at build (slices A and B apply
`GATE-QUESTIONS.md`'s 14 accepted blocks directly to `PRD/sections/`), not
deferred to cleanup. Cleanup should find every line below already present and
promote nothing new:

- `PRD/sections/functional-requirements.md` — REQ-022, REQ-032, REQ-178,
  REQ-181, REQ-182, REQ-185, REQ-188, REQ-190
- `PRD/sections/non-functional-requirements.md` — NFR-018
- `PRD/sections/system-map.md` — System 3 supplemental rule retrieval,
  retrieval relevance report, answer-quality baseline entries
- `PRD/sections/integrations-and-data.md` — prompt contents list
- `PRD/sections/in-depth/README.md` — Built (supplemental rules), prompt
  contents summary
- `PRD/sections/quick-lookup/README.md` — Retrieval
- `PRD/sections/system-map/game-rules-retrieval.md` — System 3 walkthrough,
  retrieval return, deduplication rationale, invariants
- Code: `apps/backend/src/prompt/preparation.ts`
  (`DEFAULT_SUPPLEMENTAL_RULE_CAP = 10`), `apps/backend/src/prompt/preparation.test.ts`,
  `scripts/eval-answer-quality.mjs` (`DEFAULT_EXCERPT_CAPS = [10, 15]`),
  `apps/backend/src/eval/contextEvaluationHarness.ts`

Full checklist and Ship gates block: `slice-b-eval-instrument-and-recall-harness.md`.
