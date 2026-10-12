# Slice B — Search

## Status: planned

## Goal

The right rules reach the top ten more often through word, concept and per-card search fixes, still on the stock model.

## Requirements

1. One in-repo Porter stemmer (`apps/backend/src/gameRulesStemmer.ts` or equivalent), shared by the rule-index build, the backend and the training export. No new npm dependency (REQ-233).
2. Token fixes (REQ-233, REQ-180): sentence dots stripped, "can't" kept whole, Porter stemming, every card keyword weighted (vocabulary word or the card's own Scryfall keyword), six everyday verbs dropped from the keyword list. Weights: question x3, card signal x1, concept term x2, keyword additionally x6.
3. Stray numbers (REQ-233): a bare three-digit number is a rule reference only after "rule", "rules", "CR" or "section"; a dotted id always counts.
4. Rule-book-order tie-break (REQ-233, REQ-181). Obsolete glossary terms: a question containing an obsolete glossary term adds that entry's definition words at concept weight, in the words and the embedded text.
5. Concept map `apps/backend/src/gameRulesConceptMap.ts` (REQ-234): 77 oracle-text plus 5 type-line entries, 82 total. Concept terms join the word query and the embedded text. Raw card oracle text never enters the main query or its embedding (REQ-178). Test (target 7): every distinct word of every concept term appears in the committed rule index (163 words over 82 entries).
6. In-Depth's current turn step name (for example "cleanup step") joins the word query at concept weight and the embedded text (REQ-178).
7. Per-card search (REQ-235, REQ-167, REQ-190): a separate cosine-only query per card over the committed rule vectors, using card oracle text as the card-detail artifact holds it; fills two of the ten slots; never merges into the main query; off under `mock` (all ten slots from the main list). Larger-cap test legs keep the two per-card slots. Offline gates use committed frozen per-card vectors; build them with `scripts/build-frozen-query-embeddings.mjs` extended, regenerated in slice D after the model swap.
8. Blend meaning 0.65 / words 0.35 (REQ-182), each normalised by its own maximum. The benchmark floors (hybrid recall@5 0.8526 clean, 0.8333 polluted) and the 12 labelled checks stay gates: a miss is a stop condition. Park the build for the owner; do not lower a floor.
9. Rebuild `gameRulesRuleIndex.json` search text, token stats, keyword vocabulary and `gameRulesRuleEmbeddings.json` with the stock model (record model id).
10. Record the ranks of 702.3a (`defender-ageless-sentinels`), 113.7a (`sensei-top`) and 615.12 (`unpreventable-damage-hydra`) before and after (target 10), reported not gated, in the evidence log (ids are corpus ids, committed-safe).
11. Apply by intent to `PRD/sections/`: REQ-233, 234, 235 (new), REQ-178, 180, 182, 167, 190, 220 (gate sits beside the new search), and the search rewrite of `system-map/game-rules-retrieval.md`. Copy the stock model into the worktree's git-ignored `apps/backend/data/models/` before any semantic run.

## Acceptance criteria

- [ ] Stemmer unit tests pass and no dependency is added to any `package.json`
- [ ] Token-fix tests cover dots, "can't", stemming, card keywords and the six dropped verbs
- [ ] Stray-number tests cover "rule 613", "CR 613", "613", "613.9"
- [ ] Concept-map test passes: every concept word is in the rule index (163 words, 82 entries: 77 oracle, 5 type-line)
- [ ] Query builder tests: raw oracle text never enters the main query; turn step and obsolete-term words do
- [ ] Per-card search tests: two reserved slots, separate query, off under `mock`, larger-cap legs keep them
- [ ] Meaning weight is 0.65 and the 12 labelled fixture checks pass
- [ ] Benchmark hybrid recall@5 is at or above 0.8526 clean and 0.8333 polluted; a miss parks the build (stop condition)
- [ ] The three stemming-case ranks are recorded before and after in the evidence log
- [ ] Gate slots REQ-233, 234, 235, 178, 180, 182, 167, 190, 220 and the retrieval doc rewrite are applied by intent
- [ ] `npm run quality:check` passes

## Verification

```bash
npm --workspace apps/backend run test
node scripts/rag-retrieval-benchmark.mjs
node scripts/score-rule-search.mjs
npm run test:scripts
npm run quality:check
```

## Files touched

- `apps/backend/src/gameRulesRetrieval.ts`, `gameRulesStemmer.ts` (new), `gameRulesConceptMap.ts` (new), their tests
- `scripts/build-game-rules.mjs`, `scripts/build-rule-embeddings.mjs`, `scripts/build-frozen-query-embeddings.mjs`
- `apps/backend/data/` index, vocabulary, token stats, embeddings, frozen vectors
- `PRD/sections/functional-requirements.md`, `PRD/sections/system-map/game-rules-retrieval.md`
