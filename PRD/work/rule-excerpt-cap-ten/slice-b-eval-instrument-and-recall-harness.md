# Slice B — Point the eval instrument and recall harness at the new cap

## Status: planned

## Goal

The two measurement tools that describe System 3's retrieval depth —
the offline answer-quality run's comparison legs and the System 3
recall-harness checks — describe the product this package ships (a
ten-excerpt cap), not the five-excerpt product it replaces. No live provider
call is made; the answer-quality run stays confirmation-gated and unexecuted.

## Requirements

1. In `scripts/eval-answer-quality.mjs`, move `DEFAULT_EXCERPT_CAPS` from
   `[5, 10]` to `[10, 15]` — the deployed cap plus the next value up, so the
   run always compares production against a larger candidate.
2. In `apps/backend/src/eval/contextEvaluationHarness.ts`, relabel the System
   3 recall-harness's "top-5" wording to "top-10": the
   `EvaluationFixtureExpected` doc comments (`expectedSupplementalRuleIds`,
   `forbiddenSupplementalRuleIds`), `checkSystem3ExpectedRecall`'s and
   `checkSystem3NoiseExcluded`'s passed/failed `details` strings, and the
   relevance-report's "System 3 top-5:" header and doc comment. These checks
   hold no hardcoded retrieval depth of their own — they consume whatever
   `supplementalRules` list `preparePromptInput` returns, which is already 10
   deep once slice A lands. This is a wording correction, not a behavior
   change.
3. Apply the finalized **REQ-032** and **REQ-190** `GATE-QUESTIONS.md` blocks
   to `PRD/sections/functional-requirements.md` by intent against current
   truth; a before-text mismatch is reported, not forced.
4. Run `cd apps/backend && npm run test:eval` (`contextEvaluationHarness.test.ts`,
   where `system3-expected-recall` and `system3-noise-excluded` live) and
   record the exact result in this slice's evidence log. **If a forbidden
   rule already sits at rank 6–10 in an existing fixture, the check now fails
   — that is the recorded implementation risk from `DESIGN-BRIEF.md`
   materializing, and it is a genuine finding to report, never something to
   fix by loosening the check or editing the fixture's expectation.** A
   passing result and a failing-with-a-named-fixture result are both valid
   outcomes for this criterion; silently editing a fixture's
   `forbiddenSupplementalRuleIds` to make a failure disappear is not.
5. `npm run quality:check` (or its `test:scripts` leg specifically) stays
   green — it exercises `eval-answer-quality.test.mjs`'s
   `DEFAULT_EXCERPT_CAPS`-driven assertions.

## Acceptance criteria

- [ ] B1. `DEFAULT_EXCERPT_CAPS` is `[10, 15]` in `eval-answer-quality.mjs`.
- [ ] B2. `contextEvaluationHarness.ts`'s System 3 recall-check text says
      "top-10", not "top-5", in the `EvaluationFixtureExpected` doc comments,
      the two check functions' `details` strings, and the relevance-report
      header/doc comment.
- [ ] B3. The REQ-032 and REQ-190 `GATE-QUESTIONS.md` blocks are applied to
      `PRD/sections/functional-requirements.md`, before-text byte-verified
      against current truth before editing.
- [ ] B4. `npm run test:eval` was run from `apps/backend`, and its exact
      pass/fail result — including any forbidden-rule-at-rank-6–10 finding —
      is recorded verbatim in this slice's evidence log, not suppressed by
      relaxing the check or the fixture.
- [ ] B5. `npm run quality:check` (or its `test:scripts` leg) passes.

## Verification

```bash
cd apps/backend && npm run test:eval
npm run quality:check
```

## Files touched

- `scripts/eval-answer-quality.mjs`
- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `PRD/sections/functional-requirements.md` (REQ-032, REQ-190)

## PRD promotion checklist

Durable outcomes are promoted at build, across slices A and B, not deferred
to cleanup. Cleanup should find every line below already present and promote
nothing new:

- [ ] `PRD/sections/functional-requirements.md` — REQ-022, REQ-032, REQ-178,
      REQ-181, REQ-182, REQ-185, REQ-188, REQ-190 (slice A: REQ-022, REQ-178,
      REQ-181, REQ-182, REQ-185, REQ-188; slice B: REQ-032, REQ-190)
- [ ] `PRD/sections/non-functional-requirements.md` — NFR-018 (slice A)
- [ ] `PRD/sections/system-map.md` — System 3 supplemental rule retrieval,
      retrieval relevance report, answer-quality baseline entries (slice A)
- [ ] `PRD/sections/integrations-and-data.md` — prompt contents list (slice A)
- [ ] `PRD/sections/in-depth/README.md` — Built (supplemental rules), prompt
      contents summary (slice A)
- [ ] `PRD/sections/quick-lookup/README.md` — Retrieval (slice A)
- [ ] `PRD/sections/system-map/game-rules-retrieval.md` — System 3
      walkthrough, retrieval return, deduplication rationale, invariants
      (slice A)
- [ ] Code: `apps/backend/src/prompt/preparation.ts`
      (`DEFAULT_SUPPLEMENTAL_RULE_CAP = 10`), `apps/backend/src/prompt/preparation.test.ts`
      (slice A); `scripts/eval-answer-quality.mjs`
      (`DEFAULT_EXCERPT_CAPS = [10, 15]`), `apps/backend/src/eval/contextEvaluationHarness.ts`
      (slice B)
- [ ] Any `npm run test:eval` finding from B4 above is either resolved or
      explicitly carried into the receipt as a known, recorded gap — never
      silently dropped

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/rule-excerpt-cap-ten/` ready to
      delete
