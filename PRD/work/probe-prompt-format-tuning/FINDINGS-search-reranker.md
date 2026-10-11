# Findings: local reranker over the search shortlist (session 4, 2026-10-11)

Free and local. No model was called; public weights were downloaded. Scripts and outputs are in `runs/search-reranker/`:
- `rerank-candidates.mjs`: matches production's top 10 on 1,181 + 415 questions;
- `rerank-probe.mjs`: stages `score`, `info`, `eval`, `show`, `sanity`;
- `rerank-eval.out.txt` and `rerank-info.out.txt`.

Model weights and score caches (3.8 GB) are in `.worktrees/probe-pft/output/models-probe/`, which is now ignored by git. Blend weights were tuned on the tuning half only.

## The answer

**A local reranker helps a little. It is not the big lever.**
- **The best result:** bge-reranker-base over today's top 30, blended with today's score, gets 241 on the check half against 223 (+18, about 18% → 20% of deciding rules).
- **The cost:** a 279 MB model (more than ten times today's embedder), and about 2–3 s per question on this Mac. Lambda's Graviton CPU will be slower.
- **The hard 25 barely move** (5 → 5–6).
- **514.3a never reaches the top 10 in both versions.**

S1, the card-keyword fix, gives more (+58 across the suite) at zero runtime cost.

The other rerankers fall short:
- Small rerankers (23–38 MB) give +5 to +30 on check, within noise. jina-turbo gained 7 on tuning but 31 on check. Both jina models lower the corpus score.
- Most get worse as the shortlist grows from 30 to 100, because more long, on-topic rules that don't decide the case get in.
- Web-search-trained rerankers favour rules *about* the topic, not the rule that *decides* it.

## Results

Today: suite 250 tuning / 223 check, every-rule 159, hard 25 = 5, corpus 351 / 305, 514.3a rank 17 In-Depth / 14 Quick Lookup, long-rule share 26%.

Ceilings, meaning deciding rules anywhere in the top N (tuning / check): N=30 348 / 320, N=50 383 / 359, N=100 473 / 460.

How to read the table:
- **Every-rule** counts questions with every deciding rule present, across the whole suite unless marked.
- **514.3a rank** is shown In-Depth · Quick Lookup.
- **Latency** is at 4 threads with other probes loading the CPU, so it is inflated.
- **–** means not scored.

| Reranker × N × variant | Suite tuning | Suite check | Every-rule | Hard 25 | Corpus cites / every | 514.3a rank | Long-rule share | MB | ms/question |
|---|---|---|---|---|---|---|---|---|---|
| bge-reranker-base N30, rerank only | 256 | **242** | 159 | 6 | 335 / 289 | 7 · 11 | 22% | 279 | 2,227 |
| bge-reranker-base N30, linear blend w=0.6 | **273** | 241 | **171** | 5 | **360 / 314** | 12 · 11 | 25% | 279 | 2,227 |
| bge-reranker-base N30, rank-fusion blend | 270 | 235 | 169 | 6 | 360 / 315 | 11 · 13 | 25% | 279 | 2,227 |
| bge-reranker-base N50, blend | 270 | – | 181 (tuning only) | – | – | – | 25% | 279 | 3,349 |
| bge-base N30 fp32, blend | 274 | – | – | – | – | – | 24% | ~1,100 | slower |
| bge-base N30, labelled rule text, blend | 267 | – | – | – | – | – | 27% | 279 | |
| bge-base N30, question only, blend | 268 | – | – | – | – | – | 22% | 279 | |
| bge-reranker-v2-m3 N30, blend | 268 | – | – | – | – | – | 18% | 571 | 6,679 |
| jina-turbo N30, linear blend | 257 | 254 | 169 | 5 | 342 / 294 | 14 · 18 | 12% | 38 | 936 |
| jina-turbo N50, linear blend | 260 | 252 | 168 | 5 | 344 / 296 | 17 · 18 | 10% | 38 | 1,278 |
| MiniLM-L6 N30, rank-fusion blend | 254 | 236 | 157 | 4 | 352 / 304 | 13 · 10 | 20% | 23 | 761 |
| MiniLM-L6 N100, rank-fusion blend | 258 | – | – | – | – | – | 21% | 23 | 2,321 |
| MiniLM-L12 N100, blend | 258 | – | – | – | – | – | 18% | 34 | 4,278 |
| mxbai-base N30, blend | 261 | – | – | – | – | – | 25% | 244 | 4,239 |
| mxbai-xsmall N30, blend | 257 | – | – | – | – | – | 25% | 87 | 2,486 |
| jina-tiny N30, rank-fusion blend | 250 | – | – | – | – | – | 11% | 33 | 591 |

Also measured:
- **Necropotence:** bge-base reranking on its own lifts 514.3a to 7 (In-Depth) and 11 (Quick Lookup). 514.2 moves from 30 to 15 in Quick Lookup but stays 49th, outside the top 30, in In-Depth.
- **Neither labelled rule text nor a question-only query** moves results by more than ±6.
- **Quantization:** fp32 and q8 scores are within 1–3 citations.
- **Truncation at 512 tokens:** 5–10 long rules get cut once a median query is added.
- **Latency at 2 threads, lighter load, N=30:** L6 738 ms, jina-turbo 796 ms, bge-base 3,318 ms.

## Recommendation (from the test)

1. **Don't build a reranker now.** Fix search words first (S1, stemming) and link card wording to rules. Those reach deciding rules ranked around 450th, which no reranker over the top 30–100 can.
2. **If revisited,** test bge-reranker-base blended over the top 30 after S1 lands, to see whether the gains stack. It needs a container-image Lambda or a model download at cold start, plus about 3 s or more of the answer budget.
