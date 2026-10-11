# Findings: a Magic-trained search model (session 4, 2026-10-11)

Free and local. No paid or model calls. Scripts and outputs are in `runs/search-trained-embedder/`:
- `export-training.mjs` builds the training pairs and folds;
- `train.py` trains and exports;
- `score-trained.mjs` scores through the production-matching hybrid (a) and the card-wording stack (b);
- `leak-check.mjs` splits the gain by seen rules and by closest training question;
- `latency-q8check.mjs` measures speed and q8-vs-fp32 agreement.

The headline numbers are in `score-all-q8.out.txt`. Practice-suite detail is local only.

Models, training pairs and checkpoints (about 2.6 GB) are in `.worktrees/probe-pft/output/models-probe/train/`, which is git-ignored. The final 100% model is `onnx/trained/F-foldall/` (q8 23.0 MB, fp32 90.4 MB).

## The answer

**Yes. A Magic-trained copy of today's small search model is the biggest search lever found.** It has the same size and speed as today's model: 23.0 MB, and 2.8 ms against 2.7 ms per query.

Every question below was scored by a model that never trained on it (5-fold cross-validation).
- **Today's search with the trained model:**
  - suite 473 → 786 deciding-rule citations in the top 10, out of 2,469;
  - check half 223 → 400.
- **With the card-wording stack:**
  - suite 608 → 843, and check half 293 → 437;
  - every deciding rule present: 190 → 270 questions;
  - hard 25: 8 → 17 of 59.
- **Necropotence:** all three deciding rules (514.1, 514.2, 514.3a) land in the top 10 in both versions, for the first time.
- **The unrelated-cards guard improves too:** 120 → 122–130.
- **A missing deciding rule now ranks around 83rd–109th,** against about 450th today.

Shipping it means rebuilding the committed rule vectors with the new model. It needs no runtime change.

## Results

| Arm · pipeline · weight | Suite all (of 2,469) | Tuning / check | Every-rule | Hard 25 | Corpus cites / every | Bench (of 156) | Necro 514.1/514.2/514.3a, Quick · In-Depth | Meaning recall@100 | Miss median rank |
|---|---|---|---|---|---|---|---|---|---|
| Today · hybrid · 0.6 | 473 | 250 / 223 | 159 | 5 | 351 / 305 | 120 | 3/30/14 · 3/49/17 | 31.3% | 450 |
| Today · card-wording · 0.6 | 608 | 315 / 293 | 190 | 8 | 388 / 338 | 113 | 8/28/13 · 25/16/6 | — | 288 |
| Corpus + examples · hybrid · 0.6 | 538 | 266 / 272 | 175 | 7 | 401 / 348 | 130 | 6/11/9 · 28/29/7 | 38.3% | 278 |
| Corpus + examples · card-wording · 0.6 | 655 | 326 / 329 | 203 | 7 | 414 / 360 | 126 | 12/13/4 · 43/8/2 | — | 187 |
| Full · hybrid · 0.6 | 786 | 386 / 400 | 252 | 18 | 403 / 346 | 129 | 1/11/8 · 1/8/4 | 62.9% | 109 |
| Full · hybrid · 0.8 (re-tuned) | 811 | 393 / 418 | 259 | 16 | 404 / 346 | 130 | 2/6/5 · 2/6/3 | 62.9% | 112 |
| **Full · card-wording · 0.6** | **843** | **406 / 437** | **270** | 17 | 420 / 358 | 122 | 1/8/4 · 4/5/1 | — | 83 |
| Full · card-wording · 0.7 (re-tuned) | 860 | 425 / 435 | 278 | 16 | 421 / 360 | 126 | 2/7/3 · 6/3/2 | — | 82 |

How to read it:
- **Full** = practice questions + corpus + rule-book examples. **Corpus + examples** leaves the practice questions out.
- **Bench** is the guard with three unrelated cards attached (top-5 hits), spread across the fold models.
- **Re-tuned weights** were picked on the tuning half, so only the check half is untouched by the choice. The corpus + examples arm's best weight stayed at 0.6.
- **Meaning recall@10** (the meaning half alone) is 16.1% today, 17.9% for corpus + examples, and 31.1% for the full arm.
- **Hybrid recall@100:** 37.8% → 64.2% for today's hybrid, and 46.4% → 69.6% for the card-wording stack.

## What the practice questions add

- **Almost all of the suite gain.** Without them, the suite rises to 538 (check 272), and to 655 with the card-wording stack. With them, it reaches 786 and 843.
- **Almost none of the corpus gain.** On the project's own corpus the two arms tie: 401 against 403 citations. The corpus gain comes from corpus cases and rule-book examples.

## Caveats

1. **Most of the gain is on deciding rules the model saw while training.**
   - 88% of suite citations are such rules, and they go from 422 to 713 found.
   - Rules it never saw improve less: 51 to 73.
   - Folds split questions, not rules, so a held-out question's deciding rule was often seen through other questions. Real questions cluster on the same common rules, so this partly reflects real use, but it overstates how well the model handles a rarely-asked rule.
2. **It isn't near-duplicate leakage.** 1,139 of 1,181 suite questions have no training question closer than cosine 0.7. On those questions the count still goes from 465 to 748.
3. **There is no fully outside test set.** The corpus was in training for both arms (cross-validated). The paid answer run is the real check.

## Checks

- **Fidelity:** the harness reproduces production's top 10 on every question (473 / 159 / 5 / 351 / 305).
- **Export:**
  - An export of the untrained model scores 469 against 473, so the export adds about 4 citations of noise.
  - The int8 step must be per-channel with reduced range, as in the bundled model. A per-tensor export lost 23 citations.
- **q8 against fp32:**
  - full arm 786 against 784 on the suite;
  - mean cosine 0.996;
  - 93% overlap in the meaning top 10.
- **Recipe selection:** three recipes were compared on fold 1 while training on folds 2–4, so there is a small selection effect (`recipe-dev.out.txt`).

## Recommended training recipe

- **Base:** `sentence-transformers/all-MiniLM-L6-v2`.
- **Data:** practice questions + corpus + rule-book examples. Remove each example from its rule's text during training. The no-practice arm is the fallback if the practice questions can't be used.
- **Training:**
  - cached MultipleNegativesRankingLoss, batch 32 (mini-batch 16), no-duplicates batching;
  - learning rate 5e-5, 4 epochs, 10% warmup, max length 512;
  - one hard negative per pair, drawn from today's top 40 with the deciding rule's family removed.
- **Export:** ONNX opset 14, then dynamic int8, per-channel, reduced range.
- **Blend weight:** keep 0.6 with the card-wording stack, because 0.7 doesn't hold on the check half (435 against 437). Today's hybrid alone prefers 0.8 (+18 on check).
- **Time:** about 6 min per model on the Apple GPU. The 100% model took 7.7 min.
- **Retrain** whenever the rule book or the training material changes. Rule vectors must always be rebuilt with the same model that embeds the questions.

## Combined with the full search stack

Script and output: `runs/search-full-stack-trained/full-stack-trained-probe.mjs` and `full-stack-trained.out.txt`. Caches are in `.worktrees/probe-pft/output/models-probe/full-stack-trained/`.

Both fidelity checks pass:
- production's top 10 matches on 1,596 of 1,596 questions;
- the BM25 probe's full-stack row (341 / 316) and the "Full · card-wording · 0.6" row above (406 / 437) are reproduced exactly.

Every question, card search and rule vector uses the fold model that did not train on that question.

| Row | Tuning | Check | Every-rule t/c | Hard 25 | Corpus c/e | Bench@5 | 514.1/.2/.3a Q · ID | Long-rule share | Miss median | Rule chars/question | Hybrid r@100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Full stack, today's model, α 0.55 | 341 | 316 | 113/91 | 8 | 390/339 | 111 | 7/35/6 · 23/30/2 | 20.6% | 228 | 7,139 | 49.0% |
| + trained model, α 0.55 | 414 | 434 | 134/144 | 15 | 415/360 | 124 | 1/11/8 · 7/8/3 | 10.9% | 81 | 5,446 | 70.2% |
| + trained model, α 0.7 (tuning-picked) | 426 | **452** | 141/146 | 17 | 426/367 | 127 | 3/7/5 · 8/5/2 | 6.7% | 84 | 4,434 | 70.3% |
| **Same, without BM25 (today's sum scoring, same tokens), α 0.65 (tuning-picked)** | **433** | 449 | **145/151** | 18 | 419/361 | 125 | 1/8/5 · 6/5/2 | 9.3% | 86 | 4,912 | 70.1% |
| Trained, without concept map, α 0.7 | 407 | 432 | 138/130 | 14 | 413/358 | 129 | 1/12/5 · 2/11/4 | 5.6% | 102 | 3,870 | 66.6% |
| Trained, without per-card search, α 0.7 | 424 | 441 | 141/142 | 19 | 419/359 | 127 | 3/7/5 · 8/5/2 | 6.6% | 88 | 4,586 | 69.7% |
| Trained, without any word-side change (S1 kept), α 0.7 | 425 | 435 | 139/139 | 16 | 421/360 | 126 | 2/7/3 · 6/3/2 | 7.3% | 82 | 4,502 | 70.1% |
| Trained model on today's search alone, α 0.8 | 393 | 418 | 129/130 | 16 | 404/346 | 130 | 2/6/5 · 2/6/3 | 4.2% | 112 | 3,611 | 64.4% |
| Full stack + no-practice model, α 0.55 | 351 | 348 | 108/103 | 10 | 414/360 | 128 | 11/13/7 · 36/11/3 | 14.2% | 173 | 5,624 | 55.5% |
| Trained + variant C rule text, α 0.65 | 411 | 435 | 132/142 | 19 | 407/352 | 123 | 6/12/4 · 7/8/1 | 6.7% | 99 | 4,697 | 67.4% |

The 100% model (trained on everything, so not an honest number) scores 456 / 382 on the corpus against 426 / 367 for the 5-fold models.

**They stack, partly.**
- The trained model does most of the work: on its own it takes the check half from 223 to 418.
- The word-side stack adds about 30 more.
  - The concept map is the part still worth keeping: about +20 on check, and it holds the miss rank down.
  - Per-card search adds about +11 on check and nothing on tuning. Keep it only if it times well on Lambda.
- **BM25 becomes redundant.** Today's sum scoring, with stemming and the trimmed keyword list, ties or beats it: 449 against 452 on check, and better on tuning and every-rule.
- **Variant C labelled rule text loses** (−15 tuning, −17 check). Put labels in the prompt, not in the vectors.
- **The no-practice model gains far less** with the stack: 348 on check, against 452.

**Watch: prompts get shorter.** Rule text per question falls from about 7,100 to 4,400–4,900 characters, and the share of long rules from 21% to 7–9%. The trained model favours short, specific rule pieces. That is mostly less noise, but confirm on built prompts that long-but-deciding rules (layers, combat damage) still arrive.

## Recommended search recipe (final)

- **Model:** trained MiniLM (full arm), with rule vectors rebuilt from it.
- **Meaning weight:** 0.65.
- **Word scoring:** keep today's sum scoring, with these token fixes:
  - S1 (card keywords count as keywords);
  - S5 (strip sentence dots);
  - Porter stemming;
  - drop the six everyday verbs from the keyword list.
- **Concept map:** in both the word match and the embedding text.
- **Per-card search:** 2 slots, if Lambda timing allows.
- **No BM25, no variant C vectors.**
