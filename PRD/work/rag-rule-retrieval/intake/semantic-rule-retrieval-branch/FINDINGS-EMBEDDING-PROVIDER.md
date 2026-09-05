# Findings — local embedding model vs OpenAI for System 3 query embedding

Resolves THE OPEN QUESTION in `HANDOFF.md`: where the runtime *query* embedding
runs — a local model bundled in the Lambda, or an OpenAI call. Decided by
measurement on the existing 156-item RAG benchmark, plus a cost model across
volume. No product truth changed; this feeds the DESIGN-BRIEF's provider pick.

## Headline

**Recommend `all-MiniLM-L6-v2`, local and bundled in the answer Lambda.**
It ties OpenAI on clean questions, **beats** OpenAI on the hard multi-card case,
runs ~100x faster per query, costs nothing meaningful, and works in mock/offline
mode where OpenAI can't. Cost is a non-factor at this scale — that was the thing
to rule out, and it's ruled out.

## What ran

- `harness/rag/score-local.mjs` — embeds the 3,432-rule corpus + all 156 benchmark
  queries (clean and multi-card-polluted) with two local ONNX models via
  transformers.js, scores recall@5 / MRR with the same cosine + rank logic as the
  committed OpenAI run, and times per-query latency. Output: `local-scores.json`.
- `harness/rag/cost-model.mjs` — marginal $/query and $/month across 1k / 50k /
  500k live queries. Output: `cost-model.json`.
- Baselines reused verbatim from the prior OpenAI run (`retrieval-scores.json`).

## Retrieval quality (recall@5 / MRR, n=156)

| Provider | dims | clean r@5 | clean MRR | multi-card r@5 | multi-card MRR |
| --- | --- | --- | --- | --- | --- |
| **local all-MiniLM-L6-v2** | 384 | **0.865** | 0.708 | **0.763** | 0.631 |
| local bge-small-en-v1.5 | 384 | 0.846 | 0.674 | 0.365 | 0.265 |
| OpenAI text-embedding-3-small | 1536 | 0.885 | 0.733 | 0.603 | 0.453 |
| lexical TF-IDF (today) | — | 0.577 | 0.413 | 0.026 | 0.017 |

Reads:
- **On clean questions all three semantic models are within 4 points** (0.885 /
  0.865 / 0.846) and all crush lexical (0.577). The clean case is the production
  case once the query-construction fix lands.
- **MiniLM is the most robust to query pollution** — 0.763 on the multi-card
  condition vs OpenAI's 0.603 and bge's 0.365. That pollution case is the safety
  margin if the query-construction fix is imperfect; MiniLM has the most margin.
- **bge underperforms under pollution** despite its retrieval instruction prefix —
  it's the wrong pick here.

## Latency (per query, warm model)

| Provider | p50 | p95 |
| --- | --- | --- |
| local all-MiniLM-L6-v2 | 2ms | 3ms |
| local bge-small-en-v1.5 | 4ms | 5ms |
| OpenAI | ~250ms (network round-trip) | — |

Local is ~100x faster per query. Against the multi-second answer call this barely
moves NFR-002 (<3s) either way, but local removes a network hop that can time out.

## Cost — the thing to rule out, ruled out

Only the query embeds at request time (corpus is embedded once offline, bundled).
Local embedding is **not a separate hosted service** — it runs in-process in the
answer Lambda that already exists, so its marginal cost is a sliver of added
GB-seconds, not always-on infra.

| Provider | $/query | 1k/mo | 50k/mo | 500k/mo |
| --- | --- | --- | --- | --- |
| local MiniLM | $4e-8 | $0.00 | $0.00 | $0.02 |
| local bge | $8e-8 | $0.00 | $0.00 | $0.04 |
| OpenAI | $1.2e-6 | $0.00 | $0.06 | $0.60 |

Local is ~15–30x cheaper per query, but **the honest takeaway is that both are
free at this scale** — OpenAI tops out at $0.60/month at half a million queries.
Cost does not decide this. Dedicated always-on hosting (SageMaker/ECS) would flip
that — hundreds of dollars/month idle — which is exactly why the design already
rejected it in favor of in-process. Don't host it separately.

## The one real local cost: bundle size + cold start

- Bundled model adds to the deploy artifact: **~96MB fp32** (MiniLM) or **~23MB
  quantized (q8)**, which transformers.js loads with a dtype flag at a small
  quality cost. Lambda's 250MB unzipped limit fits fp32 today but is tight with
  everything else — ship quantized, or use a container image (10GB limit).
- **Warm-cache model load is 0.1s** (measured, cache warm). The 37.5s seen on the
  first run was the one-time HuggingFace *download* — that does not happen in
  production because the model is bundled. Cold-start impact is a fraction of a
  second, not tens of seconds.
- Bonus: the 384-dim local corpus is **~5.3MB** bundled vs OpenAI's 1536-dim
  **~21MB** — the local corpus blob is 4x smaller.

## Why local wins beyond cost

1. **Works in mock/offline mode** — no external call, so it satisfies DEC-017/033
   and NFR-009 (mock is default and must work with no model access) and REQ-032's
   no-external-call constraint. OpenAI only helps in live mode; mock/offline would
   stay stuck on lexical.
2. **No new external failure surface** — keeps System 3's current "no per-request
   external call" posture (the handoff flagged reversing it as needing `define`-
   gate approval). Local means that posture doesn't change.
3. **Best robustness + best latency**, per the tables above.

The swappable embedding-provider seam still ships regardless, so a future switch
to OpenAI (or a bigger model) is a config change, not a rewrite — this pick is
low-regret.

## Recommendation for the DESIGN-BRIEF

- **Provider: local `all-MiniLM-L6-v2`, bundled, quantized (q8) to control bundle
  size.** Ship behind the embedding-provider seam with lexical as mock default /
  exact-rule-id boost / failure fallback, exactly as the design direction says.
- Re-confirm the quantized model's recall before locking it (q8 may shave a point
  or two off the fp32 0.865 clean); if it drops materially, ship fp32 via a
  container image instead.
- OpenAI stays a seam-selectable option for anyone who wants the 1536-dim model in
  live mode, but it is not the default.

## Reproduce

```
node PRD/work/combo-context-validation/harness/rag/score-local.mjs   # -> local-scores.json
node PRD/work/combo-context-validation/harness/rag/cost-model.mjs     # -> cost-model.json
```

transformers.js (`@huggingface/transformers`) installed with `--no-save` (lives in
gitignored `node_modules`; not added to the repo's package.json). Models download
from HuggingFace on first run, then cache.
