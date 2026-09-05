# Slice A — hybrid blend

## Status: done

## Resolution (2026-09-05)

Slice A blocked once on a real conflict: built over the full candidate list
REQ-182 mandates (never a truncated top-15 sample), no `alpha` in the
accepted `[0.50, 0.70]` band got all 12 labelled fixture checks passing —
`state-based-actions` always lost `701.8b`, a rule that answers the question
only by citing another rule number (`704.5g`) inside its own text rather than
restating the cited number itself. Full math and the alpha sweep without a
fix are preserved in `GRAPH-RUN.md`'s `## Open gate` and in `GATE-QUESTIONS.md`
(REQ-182's Notes).

**Owner decision:** keep the 12/12 gate and the `[0.50, 0.70]` band; add a
cross-reference boost instead of relaxing either. A candidate rule whose own
text cites a rule number the question cites gets `SCORE_CROSS_REFERENCE = 10`
— on top of, never instead of, the existing exact-rule-id and parent-rule-id
boosts, and matched only against the question's own cited ids, never
oracle-sourced card text. Sized by measurement: the largest gap between
`701.8b`'s blended score and its closest full-pool competitor, across the
whole accepted alpha band, was 0.078 (at alpha 0.70); 10 clears that with a
wide margin while staying an order of magnitude below the exact-rule-id boost
(100) and half the parent-rule-id boost (20).

With the boost in place, all 12 fixture checks pass at every alpha from 0.50
through 0.70. `alpha = 0.60` is shipped: clean/polluted recall@5 0.8974/0.8910,
both above the accepted floors (0.8526/0.8333) with real headroom. Full sweep
recorded in REQ-182's Notes (`PRD/sections/functional-requirements.md`) and
`GATE-QUESTIONS.md`. `slice-a.criteria.json` is 10/10 `true`.

Applied to `PRD/sections/`: REQ-182 (new, with the amended text above), the
REQ-177/REQ-181/REQ-022 amendments, and the four current-state spec updates
(`system-map.md`, `system-map/game-rules-retrieval.md`, `in-depth/README.md`,
`system-map/prompt-layout-spec.md`). One deliberate deviation from the
originally-finalized `system-map.md` diff: its `Backed by:` list cited
`REQ-182, REQ-183, REQ-184`, but REQ-183 and REQ-184 do not exist as written
`PRD/sections/` truth until Slices C and E land (an id is never cited before
the slice that writes it — the same rule `GAMEPLAN.md` already applies to
`quick-lookup/README.md` and `integrations-and-data.md`). Applied `REQ-182`
only; **Slices C and E must append `REQ-183` and `REQ-184` respectively** to
`system-map.md`'s `Supplemental retrieval (System 3)` `Backed by:` list when
they land.

Committed `323931e` on `thejudge-auto/hybrid-rule-retrieval-work` (PR #197).

## Goal

Ship the hybrid lexical+semantic blend for System 3 rule ranking, stop the
retrieval benchmark from ever silently reporting a lexical result as semantic,
and correct the specs that still call the old either/or switch "the tracked
follow-up."

## Requirements

1. **REQ-182 — hybrid blend.** In `apps/backend/src/gameRulesRetrieval.ts`'s
   `scoreIndex`, replace the `useSemantic` either/or branch (currently
   `scoreEntrySemantic` **or** `scoreEntry` for the whole index) with one
   blended score per candidate, computed over the full candidate list (never a
   truncated top-N of either ranking):
   `blended = alpha * (cosine / max_cosine) + (1 - alpha) * (lexical / max_lexical)`,
   where `cosine`/`lexical` are each min-max normalised per query against that
   query's own highest component score, and the exact-rule-id/parent-rule-id
   boost is merged into the blended score exactly as it is merged into the
   semantic score today. `alpha` is a single named constant, tuned within the
   measured band `[0.50, 0.70]` against the gates below; record the chosen
   value and the full sweep in REQ-182's `PRD/sections/functional-requirements.md`
   entry. Under `EMBEDDING_PROVIDER=mock`, or on any embedding failure, scoring
   stays byte-identical to today's lexical-only path.
2. **REQ-177 — trustworthy semantic measurement.** In
   `apps/backend/src/eval/ragRetrievalBenchmark.ts`'s `scoreBenchmarkSemantic`
   (called from `scripts/rag-retrieval-benchmark.mjs --semantic`), fail loudly
   — thrown error, non-zero exit — when the embedder is unavailable (`embed()`
   returns `null`) instead of silently continuing to score lexically while the
   caller labels the run `method=semantic-local`. Mirror the eval harness's
   `usedSemantic` hard assertion (`contextEvaluationHarness.test.ts`).
3. Apply the six documentation blocks below to `PRD/sections/`, by intent
   against current truth, together with the code above:
   - `REQ-182` (new entry, inserted after `REQ-181`) in
     `functional-requirements.md`
   - `REQ-177` amendment (the loud-failure constraint + measurement-integrity
     Notes bullet) in `functional-requirements.md`
   - `REQ-181` amendment (retire the "tracked follow-up" / "two of eight"
     wording; the measured figure is three of eight, 9/12 checks) in
     `functional-requirements.md`
   - `REQ-022` amendment (same wording correction, in the requirement
     describing prompt contents) in `functional-requirements.md`
   - `system-map.md`, `## Supplemental retrieval (System 3)` — ranking summary
     and `Backed by:` list
   - `system-map/game-rules-retrieval.md` — the narrative and the invariants
     bullet
   - `in-depth/README.md` — the `ADDITIONAL RELEVANT RULE EXCERPTS` bullet and
     the DEC-032 closed-door entry
   - `system-map/prompt-layout-spec.md` — row 8 and the file's `Backed by:`
     list

## Acceptance criteria

- [x] A1 — under `EMBEDDING_PROVIDER=local`, each candidate's score is the
      normalised linear blend above, with the boost merged into the blended
      score
- [x] A2 — `alpha` is a single named constant in `[0.50, 0.70]`; the chosen
      value and the full sweep are recorded in REQ-182's Notes
- [x] A3 — the blend is scored over the full candidate list, never a truncated
      top-N of either ranking
- [x] A4 — under `mock`, and on any embedding failure, scoring is byte-identical
      to the prior lexical-only path: benchmark clean recall@5 0.5833 / MRR
      0.4249, polluted recall@5 0.5256 / MRR 0.3872
- [x] A5 — all 12 labelled fixture checks pass under the semantic path
      (`system3-expected-recall`, `system3-noise-excluded` across the eight
      labelled fixtures), against the 2026-09-05 baseline of 9/12
- [x] A6 — benchmark clean recall@5 ≥ 0.8526 and polluted recall@5 ≥ 0.8333
- [x] A7 — clean/polluted MRR are recorded in REQ-182's Notes alongside recall
      (reported, not gated)
- [x] A8 — System 3 stays capped at 5 excerpts, still deduplicated against the
      System 2 selection by rule-number prefix, prompt section placement
      unchanged
- [x] A9 — `scripts/rag-retrieval-benchmark.mjs --semantic` (via
      `scoreBenchmarkSemantic`) fails loudly rather than silently reporting a
      lexical result as semantic when the embedder is unavailable
- [x] A10 — the six documentation blocks in Requirement 3 are applied, byte-
      matching the finalized `GATE-QUESTIONS.md` diff by intent, across
      `functional-requirements.md`, `system-map.md`,
      `system-map/game-rules-retrieval.md`, `in-depth/README.md`, and
      `system-map/prompt-layout-spec.md`

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test -- gameRulesRetrieval
npm --workspace apps/backend run test -- ragRetrievalBenchmark
npm --workspace apps/backend run test:eval
npm run benchmark:rag-retrieval
npm run benchmark:rag-retrieval -- --semantic
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `apps/backend/src/eval/ragRetrievalBenchmark.ts`
- `apps/backend/src/eval/ragRetrievalBenchmark.test.ts`
- `scripts/rag-retrieval-benchmark.mjs`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/system-map/prompt-layout-spec.md`
