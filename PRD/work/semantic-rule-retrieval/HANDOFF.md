# Handoff — semantic-rule-retrieval (DESIGN + BUILD, start fresh)

You are picking this up in a fresh session on branch `explore/semantic-rule-retrieval`.
Read this whole file before acting. The prior investigation is **done and
committed**; this package is the follow-on design/build. The immediate job is a
deeper dive on **how the RAG retrieval is embedded** (local model vs OpenAI),
resolved with measurement, before finalizing a DESIGN-BRIEF.

## Mission

Upgrade System 3 supplemental rule retrieval (the "which Comprehensive Rules
excerpts go in the prompt" step) from lexical TF-IDF to **semantic embedding
retrieval (RAG)**, and fix the **combo over-assertion** failure. This is a build,
but it starts investigate-first: resolve the embedding-provider question with data.

## Why (measured evidence — do not re-derive)

Full record: `PRD/work/combo-context-validation/FINDINGS.md`. Headlines:
- Current lexical System 3 retrieval finds the right rule only **0.58 recall@5**
  on clean questions and **collapses to 0.03** when attached-card oracle text is
  in the query (the multi-card/combo case). Semantic (OpenAI `text-embedding-3-small`):
  **0.89 / 0.60**. Benchmark = 156 labeled Q→rule pairs (150 synthetic + 6 gold).
- Two levers: (A) semantic retrieval, and (B) fix query construction — even
  semantic drops 0.89→0.60 under the multi-card query because raw card oracle text
  pollutes it. Both are part of this work.
- Combo over-assertion: the 500-case suite's only hard errors (2/50 unrelated) were
  the model fabricating a combo from cards that don't combo (Kiki-Jiki + Voltaic
  Construct — Kiki isn't an artifact). Prompt/answer-contract fix.

## THE OPEN QUESTION to resolve first (why this got its own branch)

**Where does the query embedding run — a local model in the Lambda, or OpenAI?**
The corpus is pre-built either way; only the *query* (the player's live question)
must be embedded at request time, and that can run locally OR via OpenAI. Trade:

- **OpenAI `text-embedding-3-small`** — best quality (the 0.89 number), zero infra,
  but a per-request external call. Only helps in live mode (mock/offline keeps
  lexical). Production already depends on OpenAI for the answer, so no new
  dependency *category*.
- **Local bundled model** (e.g. ONNX MiniLM / bge-small) — no external call, works
  in mock/offline mode too, self-contained; but +~90MB bundle, CPU inference, and
  **unmeasured** recall (likely between 0.58 and 0.89).

**Next action:** measure a local embedding model on the *exact same* benchmark
(`harness/rag/`) — recall@5 / MRR, clean and multi-card-polluted — and compare to
OpenAI (0.89/0.60) and lexical (0.58/0.03). No OpenAI needed for the local run.
Then the owner picks on real numbers. The owner leans "whatever makes sense long
term" as the app scales and deferred features get scoped in — a swappable
embedding-provider seam (below) satisfies that regardless of which wins.

## Decisions already made with the owner (do not re-litigate)

- **Combo fix = strengthen the instruction** (not a structured status contract).
  In lookup mode (no board), the model must not claim a working/assembled combo
  unless every ingredient is an attached card; when a required piece isn't
  attached, name the missing role and say the cards don't combo as-is. Partials
  name the missing piece's role explicitly.
- **Eval gate = commit frozen query embeddings** so the retrieval eval stays
  offline/deterministic (honors REQ-032's no-external-call constraint) while still
  measuring semantic retrieval.
- **No vector database.** 3,432 rule vectors (~21MB float32) live in-process,
  cosine search, bundled like the rule index. A hosted store is only justified if
  RAG later spans cards/combos/rulings (150k+ vectors) — out of scope.
- **RAG scope = rules only.** Cards/combos/rulings are keyed lookups, not search.

## Design direction (converged, pending the embedding-provider call)

- New offline artifact: rule embeddings, built alongside `gameRulesRuleIndex.json`,
  bundled in the Lambda, rebuilt only on CR refresh.
- New **embedding-provider seam** mirroring the existing `ASK_AI_PROVIDER` boundary
  (mock/openai). Ship one provider behind it; swap later without rework.
- Runtime: the async route handler embeds the query and injects the vector into
  `preparePromptInput` as an option (keeps `preparePromptInput` **synchronous**);
  cosine over bundled vectors fills System 3's existing top-5 slot.
- **Lexical retained** as: mock/offline default, exact-rule-id boost merged with
  semantic (semantic won't catch a cited "rule 613.9"), and fallback on embedding
  failure — so it's never worse than today.
- Query-construction fix: build the retrieval query from the question (+ keyword
  signal), not raw concatenated card oracle text.

## Current-state PRD truth to amend (from a sweep of PRD/sections/)

- **REQ-022** — System 3 enrichment acceptance (add semantic path + fallback).
- **REQ-032** — retrieval relevance eval (`system3-expected-recall` /
  `system3-noise-excluded`, top-5, human-labeled, no live calls). Extend to measure
  semantic via committed query embeddings.
- **`system-map/game-rules-retrieval.md`** — the retrieval narrative (DEC-046
  scoring). Backed by DEC-029/030/032/045/046/047, REQ-022/032.
- **`integrations-and-data.md`** — add embedding provider + rule-embeddings artifact.
- **REQ-095 / REQ-167** — combo prompt instruction (over-assertion fix). Note
  REQ-095 already says "verify pieces before asserting" but it's board-oriented; the
  no-board lookup case slips through — that's the gap to close.
- **Q-001** (open) — System 3 keyword-vocabulary derivation. Semantic retrieval
  reduces reliance on the hand-derived vocabulary; flag the interaction, don't
  silently resolve it here.
- **Decision-log note:** the decision log is retired — no new `DEC-###`; edit the
  feature specs in place, add new `REQ-###`.

## Constraints learned (don't rediscover)

- **Mock provider is the default and must work with NO model access** (DEC-017/033,
  NFR-009). So lexical retrieval cannot be removed; semantic layers on top.
- System 3 today has **no per-request external call** (REQ-022 constraint). Adding
  the query embedding reverses that posture — a material product-truth change the
  `define` gate must approve.
- The parked "RAG" item (`PRD/work/prompt-context-refinement/RAG-DEFERRED.md`) is a
  **different** feature — injecting a *new* mechanic-definition corpus. This work
  improves selection over the *existing* rule index. Related (shared embedding
  machinery, Q-001) but distinct; don't conflate.
- NFR-002 latency target <3s; a query embedding adds ~100–200ms — negligible next
  to the multi-second answer call.

## Reusable tooling (all committed under combo-context-validation/harness/)

- `harness/rag/` — `embed-rules.mjs` (embed corpus), `build-benchmark.mjs`
  (156 labeled Q→rule pairs, in `benchmark.json`), `score-gold.mjs`,
  `score-retrieval.mjs` (lexical vs semantic, clean vs polluted), `lib.mjs`
  (env load, cosine, production lexical retriever). `retrieval-scores.json` has the
  OpenAI results. `rule-embeddings.json` is gitignored — rebuild with `embed-rules.mjs --confirm`.
- `harness/select-suite.mjs` + `run-live.mjs` — the 500-case combo eval (5 families),
  reusable for regression-testing the combo fix. `run-live.mjs` is sequential +
  cached + `--confirm-live-calls` gated.
- **OpenAI live-call limits:** gpt-4.1 org cap is 30k TPM — run live batches
  sequential + cached, print a dry-run cost estimate first. See the project memory.

## To turn a local-model measurement into the design decision

1. Pick a small local embedder (bge-small-en / all-MiniLM-L6). Run it on the 3,432
   rules AND the 156 benchmark questions (Node: onnxruntime or transformers.js; or
   a one-off Python venv — no OpenAI).
2. Score recall@5 / MRR clean + polluted with `score-retrieval.mjs`'s logic (swap
   the embedding source). Compare to OpenAI 0.89/0.60 and lexical 0.58/0.03.
3. Report the table; owner picks provider. Then resume `thejudge-refinement` to
   write the DESIGN-BRIEF (it was paused at exactly this decision — no PRD artifacts
   were written yet).

## Constraints

- Investigation/design first — do NOT edit `PRD/sections/` product truth until the
  DESIGN-BRIEF is approved at the `define` gate. Local commits only; never push,
  never open a PR to main without the owner. Never commit secrets or the 96MB
  embeddings blob.
- Reuse the harness; don't reinvent it.
