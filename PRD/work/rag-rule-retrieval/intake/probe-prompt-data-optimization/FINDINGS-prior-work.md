# Findings — prior semantic rule-retrieval work (recovered from remote branches)

Read-only recovery via `git show`. Nothing here was re-run. Paths below are
branch-relative; read them with
`git show origin/explore/semantic-rule-retrieval:<path>` unless the auto branch
is named.

## 1. What exists

**`origin/explore/semantic-rule-retrieval` @ `1d8d33f`** — the evidence branch.
Five commits ahead of main: the `combo-context-validation` investigation (done:
500-case combo suite at 97.6% correct, plus a 156-item rule-retrieval benchmark
comparing lexical vs OpenAI embeddings; `PRD/work/combo-context-validation/FINDINGS.md`),
then a follow-on package `PRD/work/semantic-rule-retrieval/` at `STATUS.ideation`
holding `IDEA.md`, `HANDOFF.md`, `FINDINGS-EMBEDDING-PROVIDER.md` (local ONNX
models measured on the same benchmark, `d4942ee`), and `GRAPH-BRIEF.md` (graph-run
intake with the provider decided, `1d8d33f`). The reusable harness lives at
`PRD/work/combo-context-validation/harness/rag/` (12 files: `embed-rules.mjs`,
`build-benchmark.mjs`, `score-retrieval.mjs`, `score-local.mjs`, `score-gold.mjs`,
`cost-model.mjs`, `lib.mjs`, `benchmark.json`, `retrieval-scores.json`,
`local-scores.json`, `cost-model.json`, `.benchmark-cache.json`). The
`rule-embeddings.json` blob is gitignored and must be rebuilt.

**`origin/thejudge-auto/semantic-rule-retrieval` @ `d64ab1c`** — the graph-run
branch, based on the explore branch (+3 commits). A graph run
(`graph-20260901-044411`) took the brief through `define` twice and `gate-qc`
to PASS, then parked at `owner-action` (`STATUS.owner-action`). It adds
`DESIGN-BRIEF.md` (193 lines), `GATE-QUESTIONS.md` (533 lines, 9 verdict slots
awaiting the owner), `GRAPH-RUN.md` (ledger), and a proposed `PRD/sections/`
diff: new REQ-170, amended REQ-022/032/095/167, `system-map/game-rules-retrieval.md`,
`integrations-and-data.md`, `quick-lookup/README.md`, `in-depth/README.md`.
Docs-only PR #154 into main is open (`GRAPH-RUN.md`). No code has been written on
either branch — the harness is throwaway scripts, not product code.

Diff between the branches (`git diff --stat`): 11 files, +1044/−41, all PRD docs.
The explore branch is a strict ancestor; the auto branch carries everything plus
the design record.

## 2. Measured numbers

Benchmark: n=156 question→rule pairs (6 gold worked-solution cases + 150
synthetic), top-5, rule-id stem match (`701.19b` counts as hit for `701.19`).
"multi-card" = question + 3 fixed random cards' `oracleText typeLine` appended
(`score-retrieval.mjs`, `score-local.mjs`). All embeddings fp32.

| Method | Query | recall@5 | MRR | Source file |
| --- | --- | --- | --- | --- |
| lexical TF-IDF (production) | clean | 0.577 | 0.413 | `harness/rag/retrieval-scores.json` |
| lexical TF-IDF (production) | multi-card | 0.026 | 0.017 | `harness/rag/retrieval-scores.json` |
| OpenAI text-embedding-3-small (1536d) | clean | 0.885 | 0.733 | `harness/rag/retrieval-scores.json` |
| OpenAI text-embedding-3-small (1536d) | multi-card | 0.603 | 0.453 | `harness/rag/retrieval-scores.json` |
| local all-MiniLM-L6-v2 (384d) | clean | 0.865 | 0.708 | `harness/rag/local-scores.json` |
| local all-MiniLM-L6-v2 (384d) | multi-card | 0.763 | 0.631 | `harness/rag/local-scores.json` |
| local bge-small-en-v1.5 (384d, query prefix) | clean | 0.846 | 0.674 | `harness/rag/local-scores.json` |
| local bge-small-en-v1.5 (384d, query prefix) | multi-card | 0.365 | 0.265 | `harness/rag/local-scores.json` |

No hybrid (lexical + semantic fusion) number was measured anywhere. The
per-item ranks in `retrieval-scores.json` show semantic does miss items lexical
catches (gold `613.9`: lexical rank 1, semantic rank 5 clean / 0 polluted), which
is the stated reason for the exact-rule-id boost.

Latency and size (`local-scores.json`, `FINDINGS-EMBEDDING-PROVIDER.md`):

| Item | Value |
| --- | --- |
| MiniLM query latency, warm | p50 2ms / p95 3ms / mean 2.2ms |
| bge query latency, warm | p50 4ms / p95 5ms |
| OpenAI query latency | ~250ms network round-trip (estimate, not measured) |
| Corpus embed time, local | MiniLM 27.1s; bge 51.4s (3,432 rules) |
| Model load, warm cache | 0.1s (first-run 37.5s was HF download) |
| Bundle size | MiniLM ~96MB fp32, ~23MB q8 |
| Corpus vectors bundled | 384d ≈ 5.3MB; 1536d ≈ 21MB |

Cost model (`harness/rag/cost-model.json`; assumptions: OpenAI $0.02/Mtok,
60 query tokens, Lambda ARM $0.0000133334/GB-s, $2e-7/request, 1.5GB memory):

| Provider | $/query | 1k/mo | 50k/mo | 500k/mo |
| --- | --- | --- | --- | --- |
| local MiniLM | 4.0e-8 | $0.00 | $0.00 | $0.02 |
| local bge | 8.0e-8 | $0.00 | $0.00 | $0.04 |
| OpenAI text-embedding-3-small | 1.2e-6 | $0.00 | $0.06 | $0.60 |

Combo-suite numbers that motivated change B (`combo-context-validation/FINDINGS.md`):
488/500 correct (97.6%); 2 WRONG, both combo over-assertion on unrelated cards;
0 misses tagged as missing rule/ruling. Pilot ablation: removing the combo
section dropped 20/20 → 12/20. Rulings absent for ~42% of pilot cards (genuine
absence in the Scryfall corpus, 19,542 of 33,399 cards). Total live spend ~$11.2.

## 3. Decisions already made vs still open

Decided with the owner (`HANDOFF.md` "Decisions already made", restated in
`GRAPH-BRIEF.md` and `DESIGN-BRIEF.md`):

- Combo fix = strengthen the prompt instruction, not a structured status contract.
- No vector database; 3,432 vectors in-process, cosine, bundled like the rule index.
- RAG scope = rules only; cards/combos/rulings stay keyed lookups.
- Eval stays offline: commit frozen query embeddings so REQ-032's no-live-call
  constraint holds.
- Lexical retained three ways: mock/offline default, exact-rule-id boost merged
  into ranking, fallback on embedding failure.
- Query-construction fix: build the retrieval query from the question + keyword
  signal, not raw concatenated card oracle text.

The one decision `HANDOFF.md` named open — local model vs OpenAI for the runtime
query embedding — was **closed by measurement** in `FINDINGS-EMBEDDING-PROVIDER.md`
(commit `d4942ee`): pick `all-MiniLM-L6-v2`, bundled in the answer Lambda,
q8-quantized. Evidence: `local-scores.json` (MiniLM ties OpenAI clean, beats it
multi-card 0.763 vs 0.603; bge loses at 0.365), `cost-model.json` (cost a
non-factor either way), and the offline-mode argument (local keeps System 3's
"no per-request external call" posture, so the define gate approves a mechanic,
not a new dependency). `GRAPH-BRIEF.md`: "Provider is decided — local MiniLM;
do not reopen it unless q8 recall re-confirmation fails."

Still open after both branches:

- **q8 recall re-confirmation.** All recall numbers are fp32; the q8 model was
  never scored. `GRAPH-BRIEF.md` carries it as a caveat; `DESIGN-BRIEF.md`
  writes it as a REQ-170 build-time gate, with fp32-via-container-image as the fallback.
- **Owner verdicts on 9 `GATE-QUESTIONS.md` slots** (auto branch). The run is
  parked at `owner-action`; nothing in `PRD/sections/` has been applied.
- **Real-user-question validation.** `combo-context-validation/FINDINGS.md`
  caveats: benchmark is synthetic, "validate on real user questions before
  shipping a retrieval change." Not done.
- **Q-001** (System 3 keyword-vocabulary derivation) — flagged as interacting,
  explicitly not resolved (`DESIGN-BRIEF.md` "Interaction with Q-001").
- **`EMBEDDING_PROVIDER` flag name and artifact path** — assumptions in
  `DESIGN-BRIEF.md` "Material assumptions" #1–2, awaiting gate review.

## 4. What the draft GRAPH-BRIEF / DESIGN-BRIEF already commits to

**Chunking.** One vector per rule entry in `gameRulesRuleIndex.json` — no
sub-rule splitting, no merging, no parent-context prepending. Embedded text is
`"<sectionTitle>: <text>".slice(0, 2000)` (`harness/rag/embed-rules.mjs` line
"Embed a readable form: `<sectionTitle>: <text>` — the concept, not just the
number."; identical in `score-local.mjs`). `DESIGN-BRIEF.md`: "one vector per
rule in `gameRulesRuleIndex.json` (~3,432 rules)".

**Query construction.** `GRAPH-BRIEF.md`: "build the retrieval query from the
question (+ keyword signal), not raw concatenated card oracle text (that
pollution is what tanks recall)." The harness never tested this cleaner query —
only "clean" (bare question) and "polluted" (question + 3 random cards). The
production-shape query (question + the *attached* cards' oracle text, via
`buildQueryTokensFromParts`) was not benchmarked; the pollution used random cards
unrelated to the question, which is a proxy for it.

**Fusion.** Semantic cosine fills "System 3's existing top-5 slot"; lexical
survives as the "exact-rule-id and parent-rule-id boost merged into ranking"
and as failure fallback (`DESIGN-BRIEF.md` "Lexical retained, three ways"). No
score-fusion formula (RRF, weighted sum) is specified or measured; "merged" is
undefined beyond the id boost.

**Storage format.** `DESIGN-BRIEF.md`: committed artifact
`apps/backend/data/gameRulesRuleEmbeddings.json` "or equivalent", 384-dim, ~5.3MB,
built alongside `build-game-rules.mjs`, rebuilt only on CR refresh. Harness
format is `{ model, ruleIds[], vectors[][] }` (`embed-rules.mjs`). Model files
bundled in the Lambda (~23MB q8); container image (10GB) is the fallback.

**Runtime.** `GRAPH-BRIEF.md`: "the async route handler embeds the query and
injects the vector into `preparePromptInput` as an option (keeps
`preparePromptInput` synchronous)". Provider seam `EMBEDDING_PROVIDER`
= `mock` | `local` | `openai`, default `mock` (`DESIGN-BRIEF.md` Change A).

**Eval changes.** REQ-032 extended: `system3-expected-recall` /
`system3-noise-excluded` run against committed frozen query embeddings, no live
embedding call. q8 re-confirmation as REQ-170 acceptance. Combo regression via
`harness/select-suite.mjs` + `run-live.mjs`.

**PRD amendments listed** (`DESIGN-BRIEF.md` "PRD/sections amendments"): REQ-170
new; REQ-022, REQ-032, REQ-095, REQ-167 amended; `system-map/game-rules-retrieval.md`,
`integrations-and-data.md`, `quick-lookup/README.md`, `in-depth/README.md`. No
new FLOW or DEC.

## 5. Gaps — what the prior work did not measure or decide

These are the openings a data-optimization probe should cover. None are
contradicted by the prior branches; they sit beside the retrieval-method decision.

- **System 2 (always-on curated rules) curation.** Untouched. Both branches
  scope to System 3 selection only; nothing measures how much of the prompt the
  curated block takes or whether it overlaps what System 3 retrieves.
- **Prompt token budget and per-section share.** No number anywhere for how many
  tokens the assembled prompt spends per section (card text, System 2, System 3,
  rulings, combos). The combo suite measured answer correctness, not prompt shape.
- **Rulings selection.** Only measured as coverage (~42% of cards have none,
  `combo-context-validation/FINDINGS.md` finding 4). Which rulings to include,
  how many, and whether they displace better content was not studied. Snapshot
  staleness (June 5) noted as low-value.
- **Card fields.** Which card fields enter the prompt and the query was not
  audited. The harness pollution used `oracleText + typeLine` only.
- **Retrieval query shape.** The proposed "question + keyword signal" query was
  never benchmarked; the only conditions were bare question and random-card
  pollution. The realistic case (attached cards *relevant* to the question)
  is unmeasured for both lexical and semantic.
- **Chunk granularity.** One rule = one chunk was assumed, not compared against
  alternatives (sub-rule split, parent-rule context, section-level chunks,
  glossary entries). Benchmark targets were filtered to leaf-ish rules with
  `text.length > 80` (`build-benchmark.mjs`), so short rules are under-tested.
- **Hybrid fusion.** No lexical+semantic fusion score exists; the id-boost merge
  is asserted, not measured. Per-item ranks in `retrieval-scores.json` would
  support computing an oracle upper bound cheaply.
- **k and noise.** k=5 was inherited from production; recall@k for other k, and
  the `system3-noise-excluded` (wrong-rule) side, were not measured for semantic.
- **Real user questions.** Benchmark is 150 gpt-4.1-mini-generated questions
  (seed 7) + 6 gold. Flagged as a caveat; no real-question set exists.
- **q8 quantized recall.** Deferred to build time.
- **Prompt caching / provider handoff.** How the prompt is sent to the provider
  (system vs user split, static-prefix ordering for cache hits) is not discussed
  on either branch.
- **The parked mechanic-definition corpus** (`prompt-context-refinement/RAG-DEFERRED.md`)
  is explicitly separate: it needs a new keyword/mechanic corpus, a relevance
  matcher, and a new prompt section, and depends on Q-001. The semantic-retrieval
  work reuses embedding machinery but does not build it.
