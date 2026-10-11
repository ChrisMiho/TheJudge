# Findings: card wording as search terms (session 4, 2026-10-11)

Free and local. No model was called. Scripts and outputs are in `runs/search-card-wording/`:
- `card-wording-probe.mjs`, run with `--set suite|hard25|corpus|necro|bench`, `--half tuning|check` and `--only <regex>`;
- `concept-map.mjs`, about 80 general phrase-to-concept entries.

The probe's copy of today's ranking matches production's top 10 on every question. The suite is split into a tuning half and a check half (`pft-split-1`). Variants were designed and tuned on the tuning half; the check half is the honest number. Practice-suite detail is local only.

## The answer

**Yes: card wording moves deciding-rule reach by about a sixth over the fixes already headed for build.** It doesn't hurt the corpus.

- **Check half:** deciding-rule citations go from 223 today, to 252 with the S1+S5 fixes, to **293 with the best variant** (of 1,210). Questions with every deciding rule present go 75 → 78 → **86** (of 580).
- **The gain holds out of sample.** The tuning half moved the same amount (+40 over S1+S5) as the check half (+41).
- **Corpus guard:** 382 citations / 336 every-rule with S1+S5, against 388 / 338 with the best variant. No regression.
- **Necropotence Quick Lookup is not fixed.** 514.3a moves from rank 18 to 13 and stays out of the top 10. The case has two failures:
  - *Search:* 514.3a never arrives.
  - *Prompt building:* the rule ending Silence's effect (703.4p) arrives out of order, with no step summary (audit P1/P2).

  Ranking alone can't guarantee 514.3a. Delivering a lead-in's list with it can: audit fix #3. 514.3, "subject to the following exception:", already ranks 2nd.

The best variant has three parts:
1. **A concept map:** card phrases become rule-concept terms (for example "this turn" → cleanup step, until end of turn effects end). The terms go into both halves of the search, at twice the weight of card-signal words. The map was written once, from rule-book vocabulary, before any result was seen. Only weights and slot counts were tuned.
2. **Per-card search:** each card's rules text is searched on its own, and its top 2 hits get 2 of the 10 slots.
3. Both run on top of S1+S5: card keywords weighted as keywords, and sentence-ending dots stripped.

**REQ-178's concern still holds.** That requirement removed raw card text from the search because it drowned the question. The re-test confirms it: on the benchmark that attaches three unrelated cards to 156 questions, top-5 hits fall from 118 to 96 with raw card text in the embedding, and to 72 with the full pre-REQ-178 query. Raw card text at low weight in word match is harmless but useless (+5 on check). The concept map costs 5 of 156 on that benchmark.

## Results

How to read the table:
- **Δ** is the change against today + S1+S5.
- **Every-rule** counts questions with every deciding rule present, shown tuning / check.
- **Benchmark** counts top-5 hits with three unrelated cards attached, of 156.
- **514.3a rank** is shown Quick Lookup / In-Depth.
- **Size / latency** is rule characters per question against today, then latency added per question.

| Variant | Suite tuning (of 1,259) | Suite check (of 1,210) | Every-rule | Hard 25 (of 59) | Corpus cites / every-rule | Benchmark | 514.3a rank | Size / latency |
|---|---|---|---|---|---|---|---|---|
| Today | 250 | 223 | 84 / 75 | 5 | 351 / 305 | 120 | 14 / 17 | — |
| Today + S1+S5 | 275 | 252 | 89 / 78 | 6 | 382 / 336 | 118 | 18 / 22 | −573 / 0 |
| + concept map (word match only) | 281 | 270 | 95 / 81 | 6 | 385 / 338 | 117 | 12 / 15 | +151 / 0 |
| + concept map (word match + embedding) | 301 | 273 (Δ+21) | 101 / 81 | 7 | 387 / 336 | 113 | 11 / 6 | +378 / 0 |
| + per-card search, 2 slots | 298 | 273 (Δ+21) | 97 / 78 | 7 | 384 / 339 | 118 | 20 / 24 | −606 / +20 ms |
| **+ concept map + per-card search** | **315** | **293 (Δ+41)** | **104 / 86** | 8 | 388 / 338 | 113 | 13 / 6 | +115 / +20 ms |
| + concept map + turn step (In-Depth) | 301 | 273 | 101 / 81 | 7 | 388 / 336 | 113 | 11 / **5** | +378 / 0 |
| + card text at ×0.25, word match only | 275 | 257 | 91 / 80 | 6 | 384 / 336 | 118 | 17 / 19 | −223 / 0 |
| + card text in embedding | 298 | 266 | 98 / 79 | 7 | 385 / 338 | **96** | 22 / 33 | +37 / 0 |
| Full pre-REQ-178 query | 296 | 256 | 96 / 72 | 8 | 385 / 338 | **72** | 25 / 34 | +1,109 / 0 |

On today's search, without S1+S5, the best variant scores 282 on check against 223.

## Other observations

- **Necropotence In-Depth:** the concept terms lift 514.3a into the top 10 (rank 6) but push 514.1 out (3 → about 23). With the turn step added, 2 of the 3 deciding rules arrive instead of 1.
- **Gating per-card picks didn't help.** Keeping them only when the main search ranks them in its top 50, 100 or 200 made no difference.
- **Latency:** the +20 ms is one local embedding per card. It grows with board size, and it hasn't been timed on Lambda.

## Recommendation (from the test)

1. **Build the concept map with S1+S5.** No added latency, and about half the gain (+21 on check).
2. **Add per-card search with 2 reserved slots once it's timed on Lambda.** That doubles the gain (+41).
3. **Keep REQ-178's ban on raw card text in the embedding.**
