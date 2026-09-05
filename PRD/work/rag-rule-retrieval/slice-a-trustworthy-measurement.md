# Slice A — Make the recall ruler trustworthy

## Status: done

## Goal

Fix the two tools that measure whether Ask AI found the right rule so they
agree with each other, and commit the 156-question benchmark every later
slice is measured against. No retrieval behavior changes.

## Requirements

1. `apps/backend/src/eval/retrievalReportInputs.ts` resolves each fixture's
   card-intrinsic fields through the same `cardDetailIndex` path the eval
   harness uses (`cardDetailIndexFromRequest` in
   `apps/backend/src/eval/contextEvaluationHarness.test.ts`), for both the
   game-mode and lookup-mode paths, so the report builds the same System 3
   query as production for the same fixture.
2. Add an automated test that asserts the relevance report and the eval
   harness return the same per-scenario System 3 recall verdict for every
   fixture carrying an `expected` block, failing the pull request when they
   diverge. Wire it into `quality:check`.
3. Commit the 156-pair labelled benchmark (150 synthetic + 6 gold
   worked-solution cases) as an offline, deterministic harness — no live AI
   or embedding call — that scores recall@5 and MRR under a clean query and
   under a query polluted with attached-card text, and writes a
   machine-readable result file. Source the corpus and scoring approach from
   `origin/explore/semantic-rule-retrieval`
   (`PRD/work/combo-context-validation/harness/rag/`, a throwaway branch —
   read it for structure, do not depend on it existing).
4. Record the benchmark's current lexical result as the committed Step 1
   baseline that later steps' relative gates are measured against.
5. Apply this step's `PRD/sections/` amendments by intent against current
   live text (never edit `DESIGN-BRIEF.md` or `GATE-QUESTIONS.md`): the new
   `REQ-177` entry (`functional-requirements.md`, append after REQ-176); the
   report/harness-parity and committed-benchmark bullets on `REQ-032`'s
   acceptance criteria (leave the semantic-eval bullet and its REQ-181
   dependency for Slice E); the `system-map.md` "Retrieval relevance report"
   block (:493); the two dangling-citation repoints — `REQ-168`'s first note
   in `functional-requirements.md` (~L3874) and `NFR-018`'s note in
   `non-functional-requirements.md` (~L286) — both currently point at the
   deleted `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`. Exact
   accepted wording for every one of these is in `GATE-QUESTIONS.md` under
   `## REQ-177`, `## REQ-032`, `## system-map.md`, `## REQ-168`, `## NFR-018`.

## Acceptance criteria

- [x] A1 — `npm run retrieval:report` and
      `npm --workspace apps/backend run test:eval` return the same
      per-scenario recall verdict for all 9 labelled fixtures (today they
      disagree on 3: `counterspell-stack`, `quick-lookup-card`,
      `quick-lookup-multi-card`)
- [x] A2 — an automated parity test exists and runs in `quality:check`,
      failing if the report and the harness diverge on any labelled fixture
- [x] A3 — a committed benchmark harness scores the 156-pair corpus for
      recall@5 and MRR under clean and card-polluted queries, runs offline
      with no live AI or embedding call, and writes a machine-readable
      result file
- [x] A4 — the benchmark's current lexical clean/multi-card recall@5 is
      recorded as the committed Step 1 baseline (a file Slice B's gate reads)
- [x] A5 — the prompt text produced for every existing labelled fixture is
      byte-identical before and after (measurement-only; no retrieval
      behavior changed)
- [x] A6 — `functional-requirements.md` carries the new `REQ-177` entry and
      the Slice-A portion of `REQ-032`'s amendment, matching
      `GATE-QUESTIONS.md`'s accepted text
- [x] A7 — `system-map.md`'s "Retrieval relevance report" block and the
      `REQ-168`/`NFR-018` dangling-citation repoints match
      `GATE-QUESTIONS.md`'s accepted text
- [x] A8 — `npm run quality:check` is green

## Manual observations

2026-09-05 A3 — ran `npm run benchmark:rag-retrieval -- --record-baseline`;
`apps/backend/src/eval/ragRetrievalBenchmark.ts` scores all 156 committed
pairs (`benchmark/rag-retrieval-benchmark.json`) for recall@5 and MRR under
clean and card-polluted queries using only the in-process production lexical
retriever and the already-committed `cardDetailByOracleId.json` for
pollution text — no live AI call, no live embedding call, no network. Wrote
`apps/backend/src/eval/benchmark/results.json`. `ragRetrievalBenchmark.test.ts`
asserts two runs are byte-identical (determinism).

2026-09-05 A4 — `apps/backend/src/eval/benchmark/step1-baseline.json` records
the Step 1 lexical baseline: clean recall@5 0.5769230769230769 (mrr
0.41292735042735057), polluted (multi-card) recall@5 0.40384615384615385
(mrr 0.27019230769230773), n=156, method lexical-idf. Slice B's gate reads
this file.

## Verification

```bash
npm run retrieval:report
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/eval/retrievalReportInputs.ts`
- `apps/backend/src/eval/retrievalReportInputs.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- a new committed benchmark corpus + scorer (path is an implementation
  choice; keep it under `apps/backend/src/eval/` or `scripts/`, offline, no
  network dependency)
- `PRD/sections/functional-requirements.md` (REQ-177 new; REQ-032 partial;
  REQ-168 note)
- `PRD/sections/non-functional-requirements.md` (NFR-018 note)
- `PRD/sections/system-map.md` (:493 block)
