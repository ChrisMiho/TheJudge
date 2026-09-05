# GAMEPLAN: hybrid-rule-retrieval

Mapped by `thejudge-map-out`, graph run `graph-20260905-191535`, node 5 (`plan`),
`graph is controlling`. Quality-check PASS recorded in `README.md`.

## What ships

When a player asks Ask AI a rules question, System 3 picks the up-to-five
official rule excerpts it attaches by a blend of "which rule means the same
thing" and "which rule shares this question's rare words," instead of one or
the other. A short Quick Lookup question (card name, type line, one keyword)
keeps the exact rule it gets today; a long question keeps the meaning-search
gain measured in `DESIGN-BRIEF.md`. Once that blend is proven and gated, the
better mode becomes the deployed default, and the Lambda package that ships it
regains real headroom.

## Architecture / data flow

```
apps/backend/src/gameRulesRetrieval.ts
  scoreIndex()
    lexical path   : scoreEntry()            (mock / no vector / embed failure)
    semantic path  : scoreEntrySemantic()    <- REPLACED by one blended scorer
                      (Slice A: alpha*cosine_norm + (1-alpha)*lexical_norm,
                       full candidate list, exact-rule-id boost merged in)

apps/backend/data/gameRulesRuleEmbeddings.json   ("encoding" field)
  float32-base64 (today) -> int8 (Slice C)     read by loadGameRulesRuleEmbeddings()

apps/backend/src/eval/contextEvaluationHarness.test.ts
  "validates System 3 relevance under the semantic path"
    report-only (today) -> hard gate (Slice B), once Slice A's recall/fixture
    gates hold; +1 new multi-keyword-card labelled fixture

scripts/rag-retrieval-benchmark.mjs / ragRetrievalBenchmark.ts
  scoreBenchmarkSemantic()                    <- Slice A adds a loud failure
                                                  when the embedder is
                                                  unavailable (REQ-177), so a
                                                  cold model cache can never
                                                  again report a lexical
                                                  number under a semantic label

scripts/aws-deploy.sh / scripts/aws-bootstrap.sh
  --environment "Variables={...ASK_AI_PROVIDER=openai...}"
    gains EMBEDDING_PROVIDER=local (Slice E), once Slices A and B (the blend
    and its hard eval gate) and Slice C (the shrunk vectors) have landed
```

Every PRD/sections/ edit below is the finalized `GATE-QUESTIONS.md` diff,
applied by intent against current truth in the slice that lands the matching
code — nothing here is re-decided; `build` re-derives the edit against
whatever `PRD/sections/` says by the time that slice runs.

## Slices

| Slice | File | Goal | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-hybrid-blend.md` | Ship the hybrid lexical+semantic blend and stop the benchmark from silently mislabeling a lexical result as semantic | none (parallel-ready) |
| B | `slice-b-eval-gating.md` | Turn the two semantic eval checks from report-only into a hard `test:eval` gate, plus a multi-keyword-card fixture | A (needs the blend's gates passing before the checks can gate without going red on merge) |
| C | `slice-c-lambda-vector-budget.md` | Re-encode the committed rule vectors in a compact format to relieve the Lambda data budget | A (re-measures recall against the value REQ-182 records) |
| D | `slice-d-cold-start-measurement.md` | Give "cold start with the model loaded" a definition and record what it costs | none (parallel-ready) |
| E | `slice-e-deploy-default.md` | Make `EMBEDDING_PROVIDER=local` the deployed default, now that the blend and its gate make it safe | A, B, C |

## Proposal-block assignment (all 15 `GATE-QUESTIONS.md` blocks)

| Block | Target file | Slice |
| --- | --- | --- |
| REQ-182 | `PRD/sections/functional-requirements.md` (new, after REQ-181) | A |
| REQ-177 | `PRD/sections/functional-requirements.md` (amend) | A |
| REQ-181 | `PRD/sections/functional-requirements.md` (amend) | A |
| REQ-022 | `PRD/sections/functional-requirements.md` (amend) | A |
| system-map.md — Supplemental retrieval (System 3) | `PRD/sections/system-map.md` (amend) | A |
| system-map/game-rules-retrieval.md | `PRD/sections/system-map/game-rules-retrieval.md` (amend) | A |
| in-depth/README.md | `PRD/sections/in-depth/README.md` (amend) | A |
| system-map/prompt-layout-spec.md | `PRD/sections/system-map/prompt-layout-spec.md` (amend) | A |
| REQ-032 | `PRD/sections/functional-requirements.md` (amend) | B |
| REQ-183 | `PRD/sections/functional-requirements.md` (new, after REQ-182) | C |
| NFR-017 | `PRD/sections/non-functional-requirements.md` (amend, incl. owner's CI-CUDA edit) | C |
| NFR-002 | `PRD/sections/non-functional-requirements.md` (amend) | D |
| REQ-184 | `PRD/sections/functional-requirements.md` (new, after REQ-183) | E |
| quick-lookup/README.md | `PRD/sections/quick-lookup/README.md` (amend) | E |
| integrations-and-data.md | `PRD/sections/integrations-and-data.md` (amend) | E |

`quick-lookup/README.md` and `integrations-and-data.md` land in Slice E rather
than Slice A because their accepted diffs cite `REQ-184` in their `Backed by:`
lists and (for `integrations-and-data.md`) the `REQ-183` vector encoding — both
of which do not exist as written `PRD/sections/` truth until Slice E runs. An
ID is never cited before the slice that writes it lands.

## Verification checklist (whole package, run at Slice E / Ship gates)

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
npm --workspace apps/backend run test:eval
npm run test:scripts
npm run lint
npm run format:check
```

Never run in this package: `npm run data:refresh`, any Scryfall refresh, or
`npm run benchmark:rag-retrieval` from this planning node — the recall/MRR
numbers it would print are already measured and recorded in
`DESIGN-BRIEF.md`. Slices A and C legitimately run it during implementation
(to prove the blend's and the re-encoded vectors' gates), which is a different
node's tool call under a different constraint.

## Next step

`/thejudge-implement PRD/work/hybrid-rule-retrieval/ slice A` — or, for one
unattended agent completing every remaining slice,
`/thejudge-implement-all PRD/work/hybrid-rule-retrieval/`.
