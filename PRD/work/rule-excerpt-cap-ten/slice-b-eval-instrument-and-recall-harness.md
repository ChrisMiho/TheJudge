# Slice B — Point the eval instrument and recall harness at the new cap

## Status: done

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

- [x] B1. `DEFAULT_EXCERPT_CAPS` is `[10, 15]` in `eval-answer-quality.mjs`.
- [x] B2. `contextEvaluationHarness.ts`'s System 3 recall-check text says
      "top-10", not "top-5", in the `EvaluationFixtureExpected` doc comments,
      the two check functions' `details` strings, and the relevance-report
      header/doc comment.
- [x] B3. The REQ-032 and REQ-190 `GATE-QUESTIONS.md` blocks are applied to
      `PRD/sections/functional-requirements.md`, before-text byte-verified
      against current truth before editing.
- [x] B4. `npm run test:eval` was run from `apps/backend`, and its exact
      pass/fail result — including any forbidden-rule-at-rank-6–10 finding —
      is recorded verbatim in this slice's evidence log, not suppressed by
      relaxing the check or the fixture.
- [x] B5. `npm run quality:check` (or its `test:scripts` leg) passes.

## Evidence log

- `cd apps/backend && npm run test:eval` (`contextEvaluationHarness.test.ts`)
  — **PASS**, all 9 labelled fixtures, semantic path, at the new cap of 10:
  `cascade-keyword` 2/2, `combat-deathtouch` 2/2, `counterspell-stack` 1/1,
  `quick-lookup-card` 1/1, `quick-lookup-multi-card` 1/1,
  `quick-lookup-multi-keyword-card` 2/2, `quick-lookup-no-card` 1/1,
  `state-based-actions` 2/2, `upkeep-trigger` 2/2. The brief's recorded risk
  — a forbidden rule already ranking 6–10 in an existing fixture — did
  **not** materialize; `system3-noise-excluded` passed on every fixture with
  no fixture edited and no check relaxed.
- `npm run quality:check` — initially failed 3 tests in
  `src/eval/relevanceReport.test.ts` (unit tests asserting the exact
  `buildRelevanceReport` output text, which still hardcoded `"System 3
  top-5:"`). Updated those 3 literal assertions to `"System 3 top-10:"` to
  match B2's wording change, then re-ran: 575/575 script tests, typecheck,
  lint, format:check, coverage:check, test:scripts all green. Also updated
  two non-gated doc references to the same recall-check wording for
  consistency (`apps/backend/src/eval/fixtures/README.md`'s check table,
  `scripts/retrieval-relevance-report.mjs`'s header doc comment) — neither
  is under a golden or snapshot assertion, so this did not affect the
  quality:check result.

## Verification

```bash
cd apps/backend && npm run test:eval
npm run quality:check
```

## Files touched

- `scripts/eval-answer-quality.mjs`
- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `PRD/sections/functional-requirements.md` (REQ-032, REQ-190)
- `apps/backend/src/eval/relevanceReport.test.ts` (3 literal assertions
  updated to match the B2 wording change)
- `apps/backend/src/eval/fixtures/README.md` (check-table wording, for
  consistency)
- `scripts/retrieval-relevance-report.mjs` (doc comment wording, for
  consistency)

## PRD promotion checklist

Durable outcomes are promoted at build, across slices A and B, not deferred
to cleanup. Cleanup should find every line below already present and promote
nothing new:

- [x] `PRD/sections/functional-requirements.md` — REQ-022, REQ-032, REQ-178,
      REQ-181, REQ-182, REQ-185, REQ-188, REQ-190 (slice A: REQ-022, REQ-178,
      REQ-181, REQ-182, REQ-185, REQ-188; slice B: REQ-032, REQ-190)
- [x] `PRD/sections/non-functional-requirements.md` — NFR-018 (slice A)
- [x] `PRD/sections/system-map.md` — System 3 supplemental rule retrieval,
      retrieval relevance report, answer-quality baseline entries (slice A)
- [x] `PRD/sections/integrations-and-data.md` — prompt contents list (slice A)
- [x] `PRD/sections/in-depth/README.md` — Built (supplemental rules), prompt
      contents summary (slice A)
- [x] `PRD/sections/quick-lookup/README.md` — Retrieval (slice A)
- [x] `PRD/sections/system-map/game-rules-retrieval.md` — System 3
      walkthrough, retrieval return, deduplication rationale, invariants
      (slice A)
- [x] Code: `apps/backend/src/prompt/preparation.ts`
      (`DEFAULT_SUPPLEMENTAL_RULE_CAP = 10`), `apps/backend/src/prompt/preparation.test.ts`
      (slice A); `scripts/eval-answer-quality.mjs`
      (`DEFAULT_EXCERPT_CAPS = [10, 15]`), `apps/backend/src/eval/contextEvaluationHarness.ts`
      (slice B)
- [x] Any `npm run test:eval` finding from B4 above is either resolved or
      explicitly carried into the receipt as a known, recorded gap — never
      silently dropped. No finding: `test:eval` passed clean, the recorded
      risk did not materialize.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/rule-excerpt-cap-ten/` ready to
      delete
