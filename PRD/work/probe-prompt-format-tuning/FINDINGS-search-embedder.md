# Findings: stronger local embedders and labelled rule pieces (session 4, 2026-10-11)

Free and local. No model was called; public model weights were downloaded. Scripts and outputs are in `runs/search-embedder/`:
- `search-embedder-probe.mjs`, run with `--models`, `--variants P,A,B,C,D,BD` and `--qmode question`;
- `lib-embed.mjs`;
- `check-models.mjs`.

The harness reproduced production's top 10 on all 1,596 questions: 473 / 159 / 5 / 351 / 305 with the committed vectors. The suite is split into a tuning half and a check half (`pft-split-1`). Weights were tuned on the tuning half. Model weights and vector caches (1.4 GB) are in the worktree, under `.worktrees/probe-pft/output/models-probe/embedder/`; it has its own `.gitignore`.

## The answer

**A stronger local embedder is not a real lever.**
- **Best gain on the check half:** +13 deciding-rule citations (236 against 223 of 1,210), about 1 point. Re-tuning MiniLM's blend weight alone gets 231, so the model itself adds about 5.
- **Every-rule-present doesn't move on the check half:** 73–74, against 75.
- **The cost:** 4–14× bigger on disk (111–338 MB against 24 MB) and 5–20× slower per query.
- **Reach barely moves.** The hybrid's top-100 reach goes from 38% to at most 39.5%. A deciding rule that misses still ranks around 450–550th. The wall is the link from card wording to the abstract rule, and no model in this class crosses it.

**Labelled pieces:** variant C labels each piece with its path plus its parent's lead-in sentence.
- Suite-wide, it's flat (226 against 223 on check) and the corpus is flat too (353 / 304).
- On Necropotence, it pulls 514.3a into the top 10 in both versions (14 → 6, and 17 → 4). In exchange 514.2 slips (30 → 40, and 49 → 79).
- The bare path label (B) and splitting the rule from its examples (D) do nothing.

## Results

How to read the table:
- **[weight]** is the meaning weight tuned on the tuning half; **mm** means a true min-max blend.
- **Every-rule** counts questions with every deciding rule present, shown tuning / check.
- **Recall@100** is the hybrid's, across the whole suite.
- **514.3a rank** is shown Quick Lookup / In-Depth.
- **Latency** is the median on one thread. It is rough, because other probes shared the CPU.

| Model × text variant | Suite tuning | Suite check | Every-rule | Recall@100 | Hard 25 | Corpus cites / every-rule | 514.3a rank | MB | ms/query |
|---|---|---|---|---|---|---|---|---|---|
| MiniLM, production (60/40) | 250 | 223 | 84/75 | 37.8% | 5 | 351/305 | 14 / 17 | 24 | 3.8 |
| MiniLM, production [0.7 mm] | 253 | 231 | 87/77 | 37.3% | 5 | 354/307 | 15 / 18 | 24 | 3.8 |
| MiniLM, C (60/40) | 246 | 226 | 83/72 | 38.5% | 6 | 353/304 | **6 / 4** | 24 | 3.8 |
| MiniLM, B (60/40) | 250 | 225 | 82/73 | 38.8% | 6 | 355/308 | 22 / 16 | 24 | 3.8 |
| MiniLM, D (60/40) | 251 | 222 | 86/75 | 37.7% | 5 | 351/305 | 15 / 18 | 24 | 3.8 |
| arctic-m-v1.5, A [0.7] | 261 | 232 | 86/74 | 39.5% | 8 | 359/311 | 15 / 7 | 111 | 47.5 |
| arctic-m-v1.5, C [0.7] | 251 | 234 | 85/74 | 38.7% | 8 | 357/308 | 11 / 6 | 111 | 47.5 |
| arctic-m-v2, A [0.8] | 243 | 236 | 77/74 | 36.5% | 7 | 357/309 | 18 / 21 | 328 | 76.7 |
| arctic-m-v2, C [0.8] | 248 | 236 | 83/73 | 36.6% | 8 | 368/317 | 9 / 6 | 328 | 76.7 |
| gte-base, A [0.8 mm] | 247 | 207 | 79/61 | 36.7% | 5 | 347/301 | 11 / 20 | 111 | 30.0 |
| arctic-s, A [0.7 mm] | 241 | 207 | 79/65 | 38.0% | 5 | 347/297 | 10 / 11 | 35 | 12.9 |
| bge-base, A [0.9] | 228 | 188 | 76/58 | 33.0% | 4 | 342/300 | 7 / 11 | 111 | 28.8 |
| mxbai-large, A [0.8 mm] | 243 | 208 | 76/58 | 34.2% | 4 | 360/316 | 21 / 99 | 338 | 249.5 |
| nomic-v1.5, A [0.8] | 220 | 186 | 71/58 | 34.5% | 5 | 331/286 | 15 / 13 | 138 | 72.8 |

Also measured:
- **bge-small and gte-small** are worse than MiniLM: 192 and 207 on check.
- **Embedding the question alone,** without card words, hurts every model by 9–22 on check.
- **Time to embed the whole rule book:** 24 s for MiniLM, 82 s for arctic-m-v1.5, 141 s for arctic-m-v2, 240 s for mxbai.

## Recommendation (from the test)

1. **Keep MiniLM.**
2. **Variant C is a free change at rebuild.** It needs new rule-book vectors, with no runtime cost. Ship it only together with the audit's prompt fix #2 (path labels and parent lead-ins in the excerpts), and watch the 514.2 slip.
3. **Embedder quality is not where the gap is.** Free effort is better spent on query and selection: card wording, a reranker, and the lead-in-plus-list fix.
