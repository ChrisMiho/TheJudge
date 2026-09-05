# Slice B — eval gating

## Status: done

2026-09-05 B1 — observed Slice A `done` (10/10 criteria `true`, committed
`323931e` on `thejudge-auto/hybrid-rule-retrieval-work`), confirmed before
starting this slice's code.

## Goal

Turn `system3-expected-recall` and `system3-noise-excluded` from report-only
into a hard `npm run test:eval` gate on the semantic path, and add the
multi-keyword-card fixture no labelled fixture covers today.

## Requirements

1. Depends on Slice A: the semantic path scores 9/12 checks before the hybrid
   blend lands (2026-09-05 baseline) and 12/12 after — gating before Slice A
   merges would fail `test:eval` on every subsequent PR. Do not start this
   slice until Slice A's acceptance criteria are all `true`.
2. **REQ-032 amendment.** In
   `apps/backend/src/eval/contextEvaluationHarness.test.ts`, the test
   `"validates System 3 relevance under the semantic path (frozen query
   embeddings)"` currently reports per-fixture pass/fail via
   `console.log(checklistReport)` without failing the run (see the comment
   block directly above that test). Change it to assert
   `results.every((result) => result.passed)`, the same hard-gate pattern the
   golden-scenario test above it already uses.
3. Add one new labelled fixture under `apps/backend/src/eval/fixtures/` for a
   lookup-mode card whose real, committed Scryfall `keywords` list carries two
   or more entries (a shape no existing labelled fixture tests — see the note
   in `quick-lookup-card.fixture.json` and `quick-lookup-multi-card.fixture.json`
   explaining why a single-keyword card was used instead). Hand-label its
   `expectedSupplementalRuleIds`/`forbiddenSupplementalRuleIds`, then commit
   its frozen query embedding with `npm run eval:build-frozen-query-embeddings`.
4. Apply the REQ-032 documentation block to
   `PRD/sections/functional-requirements.md` by intent, together with the code
   above: the two amended `- Acceptance Criteria:` bullets, the new
   multi-keyword-card bullet, and the new `- Notes:` bullet recording the
   2026-09-05 pre-blend per-fixture scores.

## Acceptance criteria

- [x] B1 — Slice A is `done` before this slice's code lands
- [x] B2 — `system3-expected-recall` and `system3-noise-excluded` fail
      `npm run test:eval` on a genuine semantic-path regression (a failing
      check fails the run; no report-only `console.log`-only path remains for
      the labelled-fixture assertion)
- [x] B3 — one new labelled fixture exists for a multi-keyword card (two or
      more real Scryfall keywords), with hand-labelled expected/forbidden
      supplemental rule ids
- [x] B4 — the new fixture's frozen query embedding is committed via
      `npm run eval:build-frozen-query-embeddings`
- [x] B5 — `npm run test:eval` passes with the new fixture included and the
      checks gating
- [x] B6 — the REQ-032 documentation block is applied by intent, matching the
      finalized `GATE-QUESTIONS.md` diff, in
      `PRD/sections/functional-requirements.md`

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test -- contextEvaluationHarness
```

## Files touched

- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/fixtures/<new-multi-keyword-fixture>.fixture.json`
- `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`
- `PRD/sections/functional-requirements.md`
