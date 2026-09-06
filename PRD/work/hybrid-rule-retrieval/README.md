status: owner-action

# hybrid-rule-retrieval

See `IDEA.md` for the problem, outcome, non-goals, and the four items this
package covers. Created by graph run `graph-20260905-173655`, node 2
(`shape`), following on from `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`.
Mapped by graph run `graph-20260905-191535`, node 5 (`plan`); see
`GAMEPLAN.md` for the slices and `PRD/instructions/graph-workflow-contract.md`
for the process this run follows.

## Slices

| Slice | File | Goal | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | `slice-a-hybrid-blend.md` | Ship the hybrid lexical+semantic blend and stop the benchmark from silently mislabeling a lexical result as semantic | none | done |
| B | `slice-b-eval-gating.md` | Turn the two semantic eval checks from report-only into a hard `test:eval` gate, plus a multi-keyword-card fixture | A | done |
| C | `slice-c-lambda-vector-budget.md` | Re-encode the committed rule vectors in a compact format to relieve the Lambda data budget | A | done |
| D | `slice-d-cold-start-measurement.md` | Give "cold start with the model loaded" a definition and record what it costs | none | done |
| E | `slice-e-deploy-default.md` | Make `EMBEDDING_PROVIDER=local` the deployed default now that the blend and its gate make it safe | A, B, C | done |

## Implementation map

- `apps/backend/src/gameRulesRetrieval.ts` — Slices A (hybrid blend), C
  (int8-encoded vector loading)
- `apps/backend/src/eval/ragRetrievalBenchmark.ts`,
  `scripts/rag-retrieval-benchmark.mjs` — Slice A (loud failure on an
  unavailable embedder)
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`,
  `apps/backend/src/eval/fixtures/` — Slice B (hard gate, new fixture)
- `scripts/build-rule-embeddings.mjs`, `apps/backend/data/gameRulesRuleEmbeddings.json`,
  `scripts/lambda-package-budget.test.mjs` — Slice C (compact vector format)
- `PRD/sections/non-functional-requirements.md` (NFR-002) — Slice D
  (cold-start definition and measurement)
- `scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`,
  `scripts/package-lambda.test.mjs` — Slice E (deployed default)
- `PRD/sections/functional-requirements.md`,
  `PRD/sections/non-functional-requirements.md`, `PRD/sections/system-map.md`,
  `PRD/sections/system-map/game-rules-retrieval.md`,
  `PRD/sections/system-map/prompt-layout-spec.md`,
  `PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`,
  `PRD/sections/integrations-and-data.md` — all 15 `GATE-QUESTIONS.md`
  proposal blocks, one per slice per `GAMEPLAN.md`'s assignment table

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/hybrid-rule-retrieval

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (build-half re-check, 2026-09-05, after the owner's 14 accept + 1 edit verdicts were applied: 21 of 21 `Current:` excerpts byte-identical to live `PRD/sections/` on `main` at `c0aa52c`; REQ-182/183/184 unused and next free after REQ-181; 16-term amendment-set re-grep leaves no uncovered live assertion; the NFR-017 owner edit is consistent with the brief, the live NFR-017 text, and `scripts/package-lambda.sh` (`ONNXRUNTIME_NODE_INSTALL_CUDA=skip`, unzipped-size measurement); `test:eval` semantic 9/12 and lexical 12/12, Lambda data 118.095 MB of 120 MB reproduced; benchmark recall@5 lexical 0.5833 / semantic 0.8526/0.8333 reproduced at the spec-forming gate-qc attempt 2 on the same corpus). Spec-forming history: attempt 1 FAILed on one missed spec row (`system-map/prompt-layout-spec.md` row 8), corrected at define attempt 2; attempt 2 PASSed.
