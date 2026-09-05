# Graph-run brief — semantic rule retrieval + combo over-assertion fix

Self-contained intake for `graph-run`. The investigate-first question that held
this work is **resolved with data** (below), so refinement can go straight to a
DESIGN-BRIEF. This brief stands alone — every decision and number refinement
needs is inlined here, because the full evidence lives on the `explore/
semantic-rule-retrieval` branch, not on the base graph-run branches from.

## What the player gets

Better answers to rules and combo questions. Two coupled changes:

- **(A) Sharper rule excerpts in the prompt.** System 3 — the "additional
  relevant Comprehensive Rules excerpts" block — today picks rules by keyword
  (lexical TF-IDF) and often grabs the wrong ones. Switch it to semantic
  retrieval so it finds the rule that actually answers the question, especially
  on multi-card / combo questions where keyword matching collapses.
- **(B) No more fabricated combos.** In lookup mode (no board), the model
  sometimes claims a working combo from cards that don't actually combo. Stop
  that: only assert an assembled combo when every ingredient is an attached card;
  otherwise name the missing role and say the cards don't combo as-is.

## Why (measured — do not re-derive)

Benchmark: 156 labeled question→rule pairs (150 synthetic + 6 gold),
recall@5 / MRR.

| Retrieval | clean recall@5 | multi-card recall@5 |
| --- | --- | --- |
| lexical TF-IDF (today) | 0.577 | 0.026 |
| semantic — local all-MiniLM-L6-v2 | 0.865 | **0.763** |
| semantic — OpenAI text-embedding-3-small | 0.885 | 0.603 |

Lexical finds the right rule ~58% of the time on clean questions and **collapses
to ~3%** when attached-card oracle text pollutes the query (the combo case).
Semantic fixes both. Combo over-assertion: in the 500-case combo suite the only
hard errors were the model inventing a combo from non-comboing cards.

## THE decision that was open is now made: local embedding, not OpenAI

The runtime *query* embedding runs **in-process with a bundled local model**, not
via an OpenAI call. Decided by measuring both on the benchmark above plus a cost
model. Pick: **`all-MiniLM-L6-v2`, 384-dim, bundled in the answer Lambda,
quantized (q8) to control bundle size.**

Why local wins:
- **Quality:** ties OpenAI on clean questions, **beats** it on the multi-card
  case (0.763 vs 0.603). (bge-small-en-v1.5 was measured too and lost badly on
  the multi-card case — 0.365 — so it's out.)
- **Latency:** ~2ms/query in-process vs ~250ms OpenAI round-trip.
- **Cost is a non-factor either way** — both are under $1/month even at 500k
  queries/month; local piggybacks on the existing Lambda (no separate host). A
  dedicated always-on host (SageMaker/ECS) would cost hundreds idle — do not do
  that; run it in-process.
- **Works in mock/offline mode** with no external call, satisfying DEC-017/033
  and NFR-009 (mock is default and must run with no model access) and REQ-032's
  no-external-call constraint.
- **Keeps System 3's "no per-request external call" posture.** This is the big
  simplification vs the earlier plan: choosing local means the posture does *not*
  reverse, so the define gate approves a semantic-retrieval mechanic and a new
  bundled artifact — not a new external dependency.

One caveat to carry into the brief: recall above is fp32. Re-confirm the q8
quantized model's recall before locking it; if it drops materially, ship fp32 via
a container image (10GB limit) instead of the 250MB zipped Lambda limit.

## Decisions already made with the owner — do not re-litigate

- **Combo fix = strengthen the prompt instruction**, not a structured status
  contract. Lookup mode (no board): don't claim a working/assembled combo unless
  every ingredient is an attached card; when a required piece isn't attached, name
  the missing role and say the cards don't combo as-is. Partials name the missing
  piece's role explicitly.
- **No vector database.** 3,432 rule vectors live in-process (384-dim ≈ 5.3MB),
  cosine search, bundled like the rule index. A hosted store is only justified if
  RAG later spans cards/combos/rulings (150k+ vectors) — out of scope.
- **RAG scope = rules only.** Cards/combos/rulings are keyed lookups, not search.
- **Eval stays offline/deterministic** — commit frozen query embeddings so the
  retrieval eval honors REQ-032's no-external-call constraint while measuring
  semantic retrieval.
- **Lexical is retained**, never removed: mock/offline default, exact-rule-id
  boost merged with semantic (semantic won't catch a cited "rule 613.9"), and
  fallback on embedding failure — so it's never worse than today.
- **Query-construction fix:** build the retrieval query from the question
  (+ keyword signal), not raw concatenated card oracle text (that pollution is
  what tanks recall).

## Design direction (converged)

- New offline artifact: rule embeddings, built alongside
  `gameRulesRuleIndex.json`, bundled in the Lambda, rebuilt only on CR refresh.
- **Embedding-provider seam** mirroring the existing `ASK_AI_PROVIDER` boundary
  (mock / local / openai). Ship local behind it; OpenAI stays seam-selectable for
  live mode; swap later without rework.
- Runtime: the async route handler embeds the query and injects the vector into
  `preparePromptInput` as an option (keeps `preparePromptInput` synchronous);
  cosine over bundled vectors fills System 3's existing top-5 slot.

## Current-state PRD truth to amend (new REQ/FLOW, decisions are retired)

The decision log is retired — no new `DEC-###`. Edit feature specs in place and
add new `REQ-###`.

- **REQ-022** — System 3 enrichment acceptance: add the semantic path + lexical
  fallback. Note the "no per-request external call" constraint is **preserved**
  by the local-embedding choice.
- **REQ-032** — retrieval relevance eval: extend to measure semantic via
  committed query embeddings (`system3-expected-recall` / `system3-noise-excluded`,
  top-5, human-labeled, no live calls).
- **`system-map/game-rules-retrieval.md`** — the retrieval narrative.
- **`integrations-and-data.md`** — add the local embedding provider + the
  rule-embeddings artifact.
- **REQ-095 / REQ-167** — combo prompt instruction (over-assertion fix). REQ-095
  already says "verify pieces before asserting" but is board-oriented; the
  no-board lookup case slips through — that's the gap to close. REQ-167
  (no card-recommendation engine) is preserved.
- **Q-001** (open) — System 3 keyword-vocabulary derivation. Semantic retrieval
  reduces reliance on the hand-derived vocabulary; flag the interaction, don't
  silently resolve it here.

## Constraints (don't rediscover)

- Mock provider is the default and must work with **no model access**
  (DEC-017/033, NFR-009) — so lexical cannot be removed; semantic layers on top.
- NFR-002 latency target <3s; a local query embedding adds ~2ms — negligible.
- The parked "RAG" item (`prompt-context-refinement/RAG-DEFERRED.md`) is a
  **different** feature (injecting a new mechanic-definition corpus). Related
  (shared embedding machinery, Q-001) but distinct — don't conflate.
- Never commit secrets or the ~96MB embeddings blob.

## Evidence + reusable tooling (on `explore/semantic-rule-retrieval`)

- Full findings: `PRD/work/semantic-rule-retrieval/FINDINGS-EMBEDDING-PROVIDER.md`.
- Prior investigation: `PRD/work/combo-context-validation/FINDINGS.md`.
- RAG harness: `PRD/work/combo-context-validation/harness/rag/` —
  `score-local.mjs` (local models), `score-retrieval.mjs` (lexical vs OpenAI),
  `cost-model.mjs`, `build-benchmark.mjs`, `lib.mjs`; results in
  `local-scores.json`, `retrieval-scores.json`, `cost-model.json`.
- Combo eval: `harness/select-suite.mjs` + `run-live.mjs` (500-case, sequential +
  cached + `--confirm-live-calls` gated) — reuse to regression-test the combo fix.

## What the graph run should produce

A DESIGN-BRIEF for both changes, the REQ/FLOW amendments above, and slices that
implement: the offline embedding artifact + build step, the local-model provider
behind the seam, the runtime query-embed + cosine into System 3, the
query-construction fix, the retained lexical paths, the combo-instruction change,
and the extended offline eval. Provider is decided — local MiniLM; do not reopen
it unless q8 recall re-confirmation fails.

## How to hand this off

Fresh run, seeding with this brief as intake:

```
/graph-run "Upgrade System 3 rule retrieval to semantic (local-embedding RAG) and fix combo over-assertion" PRD/work/semantic-rule-retrieval/GRAPH-BRIEF.md
```
