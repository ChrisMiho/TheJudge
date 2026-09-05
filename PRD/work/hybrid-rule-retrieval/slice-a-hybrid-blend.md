# Slice A — hybrid blend

## Status: blocked

### Handoff

- Done: the hybrid blend (REQ-182, A1/A3/A4/A8) and the benchmark's loud-failure
  guard (REQ-177, A9) are implemented and unit-tested in
  `apps/backend/src/gameRulesRetrieval.ts` and
  `apps/backend/src/eval/ragRetrievalBenchmark(.test).ts` — all 57+5 relevant
  tests pass, typecheck is clean, and the mock/lexical path is measured
  byte-identical to the pre-hybrid baseline (A4). Benchmark recall@5 at
  `HYBRID_BLEND_ALPHA = 0.6` clears A6 (clean 0.8974 ≥ 0.8526, polluted 0.8910
  ≥ 0.8333). `slice-a.criteria.json` reflects this: A1/A3/A4/A6/A8/A9 are `true`
  with real evidence; A2/A5/A7/A10 are left `false` — see `## Blocker` below.
  No `PRD/sections/` edit has been made (A10 not applied) and nothing has been
  committed.
- Next: an owner decision on the REQ-182/A5 conflict below, then resume this
  slice — pick a final `alpha`, apply the six documentation blocks (A10) with
  REQ-182's Notes carrying the real full-candidate-list sweep (not the
  depth-15 probe's numbers) and the MRR figures (A7), and finish Slices B/C/E
  which depend on this one being `done`.
- Stopped because: a measured, unresolvable conflict between two of REQ-182's
  own accepted acceptance criteria (A2's alpha band and A5's 12/12 fixture
  gate) — see `## Blocker` below. This is a product decision, not an
  implementation bug.

## Blocker

**What this decides:** REQ-182 (accepted) requires both (a) `alpha` inside
`[0.50, 0.70]`, and (b) all 12 labelled fixture checks passing under the
semantic path. Measured against the actual full-candidate-list hybrid
implementation the requirement itself mandates (A3 — never a truncated top-N),
these two accepted requirements cannot both hold at once. One of them has to
give, and that's an owner call, not mine.

**In plain terms:** the design brief's alpha sweep (0.50–0.70 all clearing
12/12) was measured on a throwaway probe that could only fuse the top 15
candidates from each ranking — not the full ~2,870-rule pool the real code
scores. Built against the full pool, as REQ-182 requires, one of the three
`state-based-actions` fixture's expected rules (`701.8b`) never makes it into
the top 5 at any alpha from 0.50 up to 0.70: more real candidates compete for
the last two slots than the truncated probe saw, and two of them
(`704.5h`, `510.3a`, `702.2b` — depending on alpha) always outscore `701.8b`
in that band. The two rules explicitly cited by number or already dominant by
exact-id boost (`704.5g`, `120.5`) are never at risk; only this third,
indirectly-referenced rule is. Below alpha ≈ 0.48 (outside the accepted
`[0.50, 0.70]` band), `701.8b` would win — but that band was also an accepted,
measured decision (REQ-182's Notes), not something I can override.

**Evidence — the exact math.** At the fixture's frozen query embedding, over
the full non-curated-excluded candidate pool:

| rule | cosineRaw | cosineNorm | lexicalRaw | lexicalNorm |
| --- | --- | --- | --- | --- |
| 701.8b (expected, missing) | 0.3053 | 0.5226 | 55.908 | 0.7194 |
| 704.5h (crowds it out) | 0.5267 | 0.9016 | 31.671 | 0.4075 |
| 510.3a (crowds it out) | 0.4075 | 0.6974 | 44.358 | 0.5708 |
| 702.2b (crowds it out) | 0.4739 | 0.8112 | 35.314 | 0.4544 |

`blended = alpha*cosineNorm + (1-alpha)*lexicalNorm` (boost is 0 for all four —
none is cited by number). Solving for where 701.8b's blended score overtakes
its closest competitor (702.2b) gives `alpha ≈ 0.4787` — below the accepted
0.50 floor. Measured directly at the band's edges with the real
implementation (`npm run test:eval`, `contextEvaluationHarness.test.ts`):

| alpha | fixture checks | clean recall@5 / MRR | polluted recall@5 / MRR |
| --- | --- | --- | --- |
| 0.50 | 11/12 (state-based-actions) | 0.8526 / 0.6649 | 0.8205 / 0.6392 (below A6's 0.8333 floor) |
| 0.55 | 11/12 (state-based-actions) | 0.8782 / 0.6918 | 0.8718 / 0.6615 |
| 0.60 | 11/12 (state-based-actions) | 0.8974 / 0.7139 | 0.8910 / 0.6928 |
| 0.65 | 11/12 (state-based-actions) | 0.8974 / 0.7188 | 0.9038 / 0.7042 |
| 0.70 | 11/12 (state-based-actions) | 0.9167 / 0.7353 | 0.9038 / 0.7188 |

`state-based-actions` is the *only* failing fixture at every alpha tested —
`quick-lookup-card` and `quick-lookup-multi-card` (the two fixtures the
design brief specifically built the blend to fix) pass at every alpha from
0.50 through 0.70. This is a real, measured improvement over the semantic-only
9/12 baseline; it stops one rule short of REQ-182's accepted 12/12 gate.

**What happens if you say no (i.e. leave both requirements as accepted,
unresolved):** this slice — and Slices B, C, and E, which all depend on it —
stay blocked indefinitely, since no alpha in the accepted band satisfies A5.

**Options for the owner, not decided here:**
1. Accept 11/12 and amend REQ-182's acceptance criteria to record
   `state-based-actions`/`701.8b` as a known, accepted miss (the same pattern
   already used for the pre-hybrid semantic-only gap — see the comment above
   `"validates System 3 relevance under the semantic path"` in
   `contextEvaluationHarness.test.ts`), picking a final alpha from the sweep
   above (0.60 recommended: it's the first value where both clean and
   polluted recall clear A6 with real headroom, and MRR keeps climbing above
   it without further fixture cost).
2. Widen the accepted alpha band below 0.50 to let `701.8b` in, accepting the
   recall/MRR cost that comes with it (not measured here, since it wasn't in
   scope until this conflict surfaced).
3. Something else — e.g. revisit the fixture's ground truth or the embedding
   text, both explicitly out of scope for this slice per the existing code
   comments.

No PRD/sections/ edit has been made for REQ-182 (or the other five Slice A
documentation blocks) because REQ-182's own proposed text asserts "a blend
weighted 52% meaning / 48% words gets all 12 scenario checks right" — a claim
this measurement now contradicts. Applying it verbatim would write a false
number into durable product truth.

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

- [ ] A1 — under `EMBEDDING_PROVIDER=local`, each candidate's score is the
      normalised linear blend above, with the boost merged into the blended
      score
- [ ] A2 — `alpha` is a single named constant in `[0.50, 0.70]`; the chosen
      value and the full sweep are recorded in REQ-182's Notes
- [ ] A3 — the blend is scored over the full candidate list, never a truncated
      top-N of either ranking
- [ ] A4 — under `mock`, and on any embedding failure, scoring is byte-identical
      to the prior lexical-only path: benchmark clean recall@5 0.5833 / MRR
      0.4249, polluted recall@5 0.5256 / MRR 0.3872
- [ ] A5 — all 12 labelled fixture checks pass under the semantic path
      (`system3-expected-recall`, `system3-noise-excluded` across the eight
      labelled fixtures), against the 2026-09-05 baseline of 9/12
- [ ] A6 — benchmark clean recall@5 ≥ 0.8526 and polluted recall@5 ≥ 0.8333
- [ ] A7 — clean/polluted MRR are recorded in REQ-182's Notes alongside recall
      (reported, not gated)
- [ ] A8 — System 3 stays capped at 5 excerpts, still deduplicated against the
      System 2 selection by rule-number prefix, prompt section placement
      unchanged
- [ ] A9 — `scripts/rag-retrieval-benchmark.mjs --semantic` (via
      `scoreBenchmarkSemantic`) fails loudly rather than silently reporting a
      lexical result as semantic when the embedder is unavailable
- [ ] A10 — the six documentation blocks in Requirement 3 are applied, byte-
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
