# Slice C — judge-and-rubric

## Status: done

## Goal

Score an answer the way the owner finalized: free deterministic checks first,
then a reference-grounded judge that scores each answer alone, then a blind
side-by-side rank across every answer to the same question — with the judge
always stronger than every contestant and never one of them.

## Requirements

1. A committed rubric (`apps/backend/src/eval/answer-quality/rubric.ts` or
   `.json`) defines four axes — Correctness, Grounding, Calibration,
   Readability — each 0–2 with its criteria text, plus a revision identifier.
   No axis is ever combined into a weighted composite. No WotC-ruling axis
   exists yet (added only once a case that turns on a ruling enters the set —
   out of scope here).
2. Deterministic assertions (`apps/backend/src/eval/answer-quality/assertions.ts`)
   compute, needing no model call: `namesGoldRuleId` (does the answer mention
   the gold case's rule id), non-empty, and character length.
3. A lone judge pass (`apps/backend/src/eval/answer-quality/judge.ts`) takes
   one call per answer: the question, the attached rule ids, the answer, the
   case's `workedSolution` as the reference answer, and the rubric; it
   returns the four axis scores and a one-paragraph rationale, or an explicit
   `undetermined` when it cannot decide. The judge is never told which model
   or excerpt cap produced the answer.
4. A blind side-by-side ranking pass, for each gold case at each excerpt cap,
   once every answer has been scored alone: one further judge call sees all
   answers to that question together, model labels hidden and order shuffled
   per case, with the reference answer and the rubric, and ranks them by
   agreement with the reference.
5. The judge model is selected by its own setting, `ANSWER_QUALITY_JUDGE_MODEL`,
   defaulting to `gpt-5` when unset — never to `OPENAI_MODEL` and never to an
   answer model. The run flags (in the artifact-facing data it returns) any
   run whose judge model id matches a lineup model id.
6. The judge call never uses `AskAiProvider`, never builds an `AskAiRequest`,
   and touches no product code path — it is eval-only tooling using the
   already-present `openai` dependency, with an injectable client so tests
   never make a network call.
7. A judge failure (provider error, malformed response) is recorded as
   `undetermined`, never counted as a pass or a fail; the run continues.
8. Apply `GATE-QUESTIONS.md`'s **REQ-186** and **REQ-187** blocks to
   `PRD/sections/functional-requirements.md` by intent, together with this
   slice's code.

## Acceptance criteria

- [x] C1. The rubric module exports the four axes, their 0/1/2 text, and a
      revision identifier; a test asserts no code path combines the axes into
      a single weighted score.
- [x] C2. `assertions.test.ts` asserts `namesGoldRuleId` correctly detects
      presence/absence of the gold rule id in sample answer text, and that
      non-empty/length are computed correctly.
- [x] C3. `judge.test.ts` asserts the lone-judge function sends the question,
      rule ids, answer, `workedSolution`, and rubric text to an injected fake
      client and parses back four axis scores plus a rationale, with no real
      network call.
- [x] C4. The same test asserts a malformed or erroring fake-client response
      is recorded as `undetermined`, never as a numeric score.
- [x] C5. `judge.test.ts` asserts the blind-ranking function hides model
      identity and shuffles order before the call, and maps the returned rank
      back to the correct model afterward (order is recoverable by the
      harness, never disclosed to the judge).
- [x] C6. A test asserts the judge model defaults to `gpt-5` when
      `ANSWER_QUALITY_JUDGE_MODEL` is unset, honors the env var when set, and
      that a mismatch (judge id equals a lineup model id) is flagged.
- [x] C7. `npm run test:scripts` and the backend test suite covering these new
      files both pass, with zero live provider calls made by any test (proven
      by the fake client never receiving a real API key or making an HTTP
      call — enforced by using an injected client with no network access in
      the test harness).
- [x] C8. `PRD/sections/functional-requirements.md` carries `### REQ-186` and
      `### REQ-187` entries matching the finalized `GATE-QUESTIONS.md` blocks,
      re-derived against current truth.

## Verification

```bash
npm run test:scripts
npm --prefix apps/backend run test
```

## Files touched

- `apps/backend/src/eval/answer-quality/rubric.ts` (new)
- `apps/backend/src/eval/answer-quality/rubric.test.ts` (new)
- `apps/backend/src/eval/answer-quality/assertions.ts` (new)
- `apps/backend/src/eval/answer-quality/assertions.test.ts` (new)
- `apps/backend/src/eval/answer-quality/judge.ts` (new)
- `apps/backend/src/eval/answer-quality/judge.test.ts` (new)
- `PRD/sections/functional-requirements.md` (REQ-186, REQ-187, new entries)

## Notes

C6's "flagged by the module's returned metadata" is implemented as a
standalone pure function, `judgeMatchesAnswerModel(judgeModel, lineupModelIds)`,
rather than a field attached to every judge call's return value — Slice E's
wiring calls the equivalent inline check once per run (`buildRunArtifact`'s
`models.includes(judgeModel)`) to compute the artifact's mismatch flag, the
natural place for a run-level fact like this to live. `DEFAULT_JUDGE_MODEL` /
`resolveJudgeModel` deliberately exist in both `scripts/eval-answer-quality.mjs`
(a plain `.mjs` script, so its dry-run path can resolve the judge model
synchronously under plain `node --test`, with no TypeScript loader) and
`apps/backend/src/eval/answer-quality/judge.ts` (this slice, same value,
independently testable, used by the real per-call judge functions). Slice E
does not consolidate these into one import: the module boundary here is
plain-JS-vs-TypeScript, not an ordinary reuse-before-creating case, and
forcing the dry-run path through a TypeScript dynamic import would break its
"no loader needed" property (the same constraint `measurePromptChars`
already documents). Both copies carry an identical comment cross-referencing
the other.
