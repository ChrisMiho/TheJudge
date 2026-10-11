# Findings: proper word scoring and the full search stack (session 4, 2026-10-11)

Free and local. No model was called. Scripts and outputs are in `runs/search-bm25-stack/`. Run `bm25-stack-probe.mjs` with `--plan repro|part1|part1b|part2|diag-stem`; outputs are in `*.out.txt`.

The harness reproduced today exactly (473 / 159 / 5 / 351 / 305, bench 120, production's top 10 on all 1,596 questions). It also reproduced the card-wording best (315 / 293, corpus 388 / 338, bench 113).

Tuning was on the tuning half; the check half is the honest number.

## The answer

**Proper word scoring beats today.** BM25 counts how often a word appears in a rule, with diminishing returns, and corrects for rule length. It adds about 20 deciding-rule citations on the check half:
- on today's search, 223 → 244;
- on top of S1+S5, 252 → 272.

The gain is a broad plateau, not one lucky setting: every k1 / b pair at a meaning weight of 0.5–0.6 scores 263–273.

**Every search win stacked together reaches 316 of 1,210 on the check half.** That's against 223 today and 293 for the card-wording best.
- Questions with every deciding rule present: 75 → 91 of 580.
- Corpus guard: 351 / 305 → 390 / 339.
- The three-unrelated-cards benchmark slips 120 → 111, mostly from the concept map.
- **Necropotence's 514.3a reaches the top 10 in both versions:** rank 6 in Quick Lookup, rank 2 in In-Depth.
- The median rank of a missing deciding rule improves from 450 to 228.

## Results

Ranks are shown Quick Lookup · In-Depth. **Miss rank** is the median rank of deciding rules that miss the top 10, across the whole suite.

| Variant | Suite tuning | Suite check | Every-rule t/c | Hard 25 | Corpus cites / every | Bench | 514.1/514.2/514.3a | Long-rule share | Miss rank |
|---|---|---|---|---|---|---|---|---|---|
| Today | 250 | 223 | 84/75 | 5 | 351/305 | 120 | 3/30/14 · 3/49/17 | 26.0% | 450 |
| Today + BM25 (k1 1.5, b 0.25) | 265 | 244 | 89/76 | 6 | 352/307 | 121 | 4/29/12 · 3/63/13 | 18.5% | 461 |
| S1+S5, today's scoring | 275 | 252 | 89/78 | 6 | 382/336 | 118 | 3/35/18 · 3/38/22 | 22.5% | 436 |
| S1+S5 + BM25 (1.2 / 0.25) | 290 | 272 | 98/81 | 7 | 385/338 | 124 | 3/34/14 · 3/38/17 | 16.7% | 452 |
| … + six verbs dropped (S12) | 296 | 275 | 100/81 | 7 | 386/339 | 123 | same | 18.5% | 463 |
| … + Porter stem + negation, α 0.5 | 303 | 283 | 103/90 | 8 | 386/341 | 117 | 2/27/19 · 3/35/15 | 18.9% | 435 |
| Rank fusion instead (best) | 285 | 259 | 94/83 | 6 | 380/335 | 110 | 10/37/14 · 18/31/13 | 16.8% | 442 |
| + concept map | 321 | 301 | 106/93 | 8 | 392/341 | 109 | 7/24/17 · 18/23/10 | 24.3% | 241 |
| + per-card search, 2 slots | 334 | 310 | 109/94 | 9 | 387/337 | 109 | 7/26/19 · 20/25/12 | 23.6% | 244 |
| + variant C vectors | 334 | 315 | 110/91 | 8 | 385/335 | 107 | 5/35/12 · 21/30/3 | 22.0% | 218 |
| **Full stack, α 0.55, no negation (recommended)** | **341** | **316** | **113/91** | 8 | 390/339 | 111 | 7/35/6 · 23/30/2 | 20.6% | 228 |
| Same stack without stemming, α 0.5 | 320 | 309 | 102/84 | 11 | 396/343 | 106 | 6/32/5 · 19/24/1 | 20.8% | 230 |

Rule text per prompt falls from 7,472 to about 7,140 characters.

## What each piece adds

Each figure is the check-half change when that piece is removed from the full stack.

- **Clear wins:** S1 +20, concept map +18, per-card search +18, BM25 +9.
- **Small wins:** dropping the six everyday verbs +7, stemming +6.
- **Near zero:**
  - Variant C vectors: +5, and they cost 5 on the benchmark. Without stemming they lose 11 on the tuning half. Their sure value is Necropotence's 514.3a.
  - S5: +3.
- **No effect:** "can't" → "cannot" negation handling.
- **Stops helping:** a third per-card slot adds nothing over two. Concept terms at ×1 or ×3 are no better than ×2.
- **Rank fusion loses** to score blending everywhere, by 13–34 on check.

## Why stemming costs the corpus

Stemming merges a rare word form with a common one, so the word stops being distinctive. "blocker" goes from 7 rules to 56, and "attach" from 11 to 55. It also turns "triggers" and "triggered" into the ×6 keyword "trigger", which is why it pairs with dropping the six verbs.

Most corpus losses are rank 7–10 sliding to 11–14. The three big drops:
- 702.3a: 3 → 79 (defender-ageless-sentinels);
- 113.7a: 1 → 13 (sensei-top);
- 615.12: 9 → 30 (unpreventable-damage-hydra).

A plural-only stemmer breaks even on the corpus but gains less on the suite.

## Watch

- **514.1 In-Depth drops out of the top 10** (3 → 23) once the concept map is in. Its content also arrives through 703.4n, but check this on the built prompt.
- **Latency:** BM25, stemming and the verb trim cost nothing at runtime; word counts and lengths are built ahead of time. Per-card search costs one local embedding per card, about 4.5 ms per question here. It is still untimed on Lambda.

## Recommended search recipe

- **Word scoring:** BM25, k1 1.2, b 0.25.
  - IDF is ln(1 + (N − df + 0.5) / (df + 0.5)).
  - Term frequency is counted per rule piece; rule length is its token count over the rule book's average.
  - Word weights: question ×3, card signal ×1, concept terms ×2, keyword ×6.
- **Tokens:**
  - Strip sentence dots (S5).
  - Porter-stem every token with no digit or dot, on both the query and the rule side.
  - Drop counter, destroy, exile, sacrifice, trigger and replacement from the keyword list, leaving 14 words.
  - Count each card's Scryfall keywords as keywords (S1).
  - No negation mapping.
- **Blend:** 0.55 meaning / 0.45 words, divide-by-max.
- **Concept map:** ×2 in word match, and appended to the embedding text.
- **Per-card search:** 2 reserved slots.
- **Vectors:** variant C labelled-piece vectors (optional).
