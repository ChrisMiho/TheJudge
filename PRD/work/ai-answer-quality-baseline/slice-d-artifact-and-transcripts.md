# Slice D — artifact-and-transcripts

## Status: done

## Goal

Write what a run leaves behind, split the way the repo already splits it: a
small committed, numbers-only scorecard, and full prose transcripts in a
gitignored folder — never asserted byte-for-byte against a stored answer.

## Requirements

1. `apps/backend/src/eval/answer-quality/results.json` (new, committed) is
   shaped after `apps/backend/src/eval/benchmark/results.json` — numeric and
   metadata only, no model prose. It carries: gold-set case ids/tiers/count,
   the answer-model lineup, judge model id, rubric revision, `ASK_AI_PROVIDER`,
   `EMBEDDING_PROVIDER`, git commit, UTC timestamp, total token usage and
   cost; per leg (one model × one excerpt cap) the model id, cap, and headline
   count of cases scoring Correctness 2; per case per leg the four axis
   scores, `namesGoldRuleId`, an `undetermined` flag, prompt characters, token
   usage, wall-clock latency in ms, and the blind rank.
2. Full transcripts — assembled prompt, model answer, reference worked
   solution, assertions, axis scores, judge rationale per case per leg, plus
   the side-by-side ranking rationale per case per cap — are written to
   `output/answer-quality/`, added to `.gitignore` alongside
   `output/prompt-preview/`, `output/retrieval-relevance-report.txt`, and
   `output/combo-answer-quality/`.
3. The writer replaces the committed file on each recorded run; it never
   appends. A dry run writes nothing.
4. No test ever asserts the committed file's values equal a previous run's
   values — only that it is readable, complete, and prose-free.
5. The run tooling reports two runs as **incomparable** when their gold set,
   judge model, rubric revision, or `EMBEDDING_PROVIDER` differ; two runs
   differing only in answer-model lineup report as a **model comparison**
   (shared models compared, unshared ones listed), never as incomparable.
6. Apply `GATE-QUESTIONS.md`'s **REQ-189** block to
   `PRD/sections/functional-requirements.md` by intent, together with this
   slice's code.

## Acceptance criteria

- [x] D1. A writer module (`apps/backend/src/eval/answer-quality/artifact.ts`)
      round-trips a constructed run record through `results.json` and a test
      asserts every required field listed in Requirement 1 is present after
      reading it back.
- [x] D2. The same test asserts the file contains no model prose (no answer
      text, no judge rationale, no prompt text) — only scores and metadata.
- [x] D3. A test asserts the writer places full transcripts (prompt, answer,
      reference, assertions, axis scores, rationale, ranking rationale) under
      `output/answer-quality/` and that a dry run writes nothing there or to
      the committed file.
- [x] D4. `.gitignore` gains an `output/answer-quality/` entry; a test asserts
      the pattern matches paths under that folder, proven both by
      `artifact.test.ts` (spawning `git check-ignore`) and directly at build.
- [x] D5. A test asserts two run records differing only in `EMBEDDING_PROVIDER`,
      gold-set case ids, judge model, or rubric revision are reported
      `incomparable`, and two run records differing only in answer-model
      lineup are reported a `modelComparison` naming the shared and unshared
      models — never `incomparable`.
- [x] D6. `npm run test:scripts` and the backend test suite pass.
- [x] D7. `PRD/sections/functional-requirements.md` carries a `### REQ-189`
      entry matching the finalized `GATE-QUESTIONS.md` block, re-derived
      against current truth.

## Verification

```bash
npm run test:scripts
npm --prefix apps/backend run test
git check-ignore -v output/answer-quality/example.json
```

## Files touched

- `apps/backend/src/eval/answer-quality/results.json` (new, committed —
  a structurally valid placeholder: empty gold set, empty lineup, zero
  totals, until Slice E's first live run replaces it wholesale)
- `apps/backend/src/eval/answer-quality/artifact.ts` (new)
- `apps/backend/src/eval/answer-quality/artifact.test.ts` (new)
- `.gitignore`
- `PRD/sections/functional-requirements.md` (REQ-189, new entry)
