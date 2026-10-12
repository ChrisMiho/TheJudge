# Fix experiments for the two parked search checks (free, local, counts only)

Measured 2026-10-11 on branch `thejudge-auto/right-rules-in-order-work` at `1a556f1b`, with the trained search model (`rule-search-ed14e631c046`) and the shipped search code. Nothing was retrained. Every variant is an opt-in option, off by default; with it off the scorer reproduced the build's recorded numbers exactly, and all 707 backend tests passed unchanged. The code is saved, git-ignored, at `output/rule-search-eval/fix-experiments.patch`.

## The answer

Ship **keyword sets beside the ten (1B)** together with **a relevance cutoff of 0.6 and a cap of 15**.

When a card has a keyword like deathtouch, the player's answer now always gets that keyword's full rule. The search also stops padding the list with weak matches on easy questions, and adds up to five more rules when several score close to the top. It is the only variant that passes all 14 labelled search checks. On the honest cross-validated numbers it gets 75 more deciding-rule citations into the check half and loses nothing anywhere.

The cost is longer prompts on practice-style questions: rule text goes up 59% there (4,220 to 6,707 characters on average). On the worked-solutions corpus it goes up only 4%. Answer quality with the longer prompt has not been measured; that would need a paid run.

## What each fix does

- **1A, keyword set inside the ten.** Each attached card's keyword rule (matched by the rule's title, for example 702.2 Deathtouch, using the card's Scryfall keywords) takes slots inside the cap of ten. It goes ahead of the two per-card slots and pushes out the lowest main-list rules. At least four main slots stay; a set that does not fit is cut short at that floor.
- **1B, keyword set beside the ten.** The ten are chosen exactly as today. Whole keyword sets are then added on top, skipping pieces already shown, under a 6,000-character budget. A set that would go over the budget is skipped whole.
- **Fix 2, relevance cutoff r.** A main-list rule is dropped when its blended score is below r times the top rule's score. The comparison uses the score before rule-number boosts, and a rule the question cites by number always stays. The per-card slots are unchanged. Each r was measured with the cap at 10 and at 15.

## Results: 5-fold cross-validated (`--cv`)

Each question was scored by a model that never trained on it. A citation counts when the deciding rule reaches the prompt anywhere, including keyword-set rules added past the tenth slot (1B variants). "Excerpts" and "chars" are averages per practice question, counting search excerpts plus any keyword-set rules. "Hits/100" is the precision proxy: deciding rules found by search per 100 excerpts shown (curated topic rules excluded).

| Variant | Check cites | Tuning cites | Every-rule check | Every-rule tuning | Hard 25 (of 59) | Corpus cites (of 494) | Corpus every-rule (of 415) | bench@5 (of 156) | Excerpts | Chars | Hits/100 | Corpus excerpts | Corpus chars |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Baseline (shipped) | 445 | 435 | 144 | 142 | 19 | 423 | 366 | 131 | 10.00 | 4,220 | 6.34 | 10.00 | 3,949 |
| 1A inside (floor 4) | 418 | 404 | 132 | 136 | 16 | 420 | 366 | 126 | 10.00 | 3,842 | 5.85 | 10.00 | 3,774 |
| 1B beside | 470 | 460 | 152 | 148 | 19 | 426 | 369 | 131 | 13.22 | 4,979 | 5.12 | 11.79 | 4,409 |
| cut 0.5, cap 10 | 445 | 435 | 144 | 142 | 19 | 423 | 366 | 131 | 9.93 | 4,196 | 6.39 | 8.20 | 3,309 |
| cut 0.6, cap 10 | 444 | 433 | 143 | 141 | 19 | 421 | 364 | 131 | 9.74 | 4,120 | 6.48 | 6.93 | 2,807 |
| cut 0.7, cap 10 | 439 | 426 | 141 | 139 | 19 | 415 | 358 | 129 | 9.33 | 3,939 | 6.66 | 5.53 | 2,210 |
| cut 0.8, cap 10 | 418 | 392 | 130 | 127 | 14 | 394 | 342 | 127 | 8.14 | 3,457 | 7.06 | 4.11 | 1,617 |
| cut 0.5, cap 15 | 500 | 491 | 162 | 161 | 24 | 436 | 373 | 131 | 14.77 | 6,167 | 4.93 | 11.33 | 4,564 |
| **cut 0.6, cap 15** | 498 | 488 | 161 | 159 | 24 | 434 | 371 | 131 | 14.29 | 5,978 | 5.07 | 9.00 | 3,656 |
| cut 0.7, cap 15 | 488 | 474 | 156 | 155 | 23 | 428 | 365 | 129 | 13.24 | 5,536 | 5.31 | 6.71 | 2,705 |
| cut 0.8, cap 15 | 448 | 416 | 137 | 131 | 15 | 403 | 347 | 127 | 10.42 | 4,401 | 5.96 | 4.60 | 1,819 |
| **1B + cut 0.6, cap 15** | 520 | 511 | 169 | 165 | 24 | 435 | 372 | 131 | 17.38 | 6,707 | 4.38 | 10.82 | 4,125 |

The other 1B + cutoff pairs, as check / tuning / every-rule check / hard 25 / corpus / bench / excerpts / chars:

- 1B + cut 0.5, cap 10: 470 / 460 / 152 / 19 / 426 / 131 / 13.15 / 4,955
- 1B + cut 0.5, cap 15: 522 / 514 / 170 / 24 / 437 / 131 / 17.85 / 6,893
- 1B + cut 0.6, cap 10: 469 / 458 / 151 / 19 / 424 / 131 / 12.97 / 4,881
- 1B + cut 0.7, cap 10: 465 / 453 / 149 / 19 / 421 / 129 / 12.60 / 4,709
- 1B + cut 0.7, cap 15: 511 / 499 / 164 / 23 / 432 / 129 / 16.40 / 6,279
- 1B + cut 0.8, cap 10: 445 / 425 / 138 / 14 / 407 / 127 / 11.54 / 4,256
- 1B + cut 0.8, cap 15: 474 / 448 / 145 / 15 / 414 / 127 / 13.76 / 5,182

**Controls: the same search with a fixed larger cap and no cutoff.** These were measured to tell what the cutoff adds beyond simply showing more rules:

| Fixed cap | Check | Tuning | Every-rule check | Hard 25 | Corpus | bench@5 | Chars | Corpus chars |
|---|---|---|---|---|---|---|---|---|
| 11 | 455 | 441 | 148 | 19 | 427 | 131 | 4,635 | 4,361 |
| 12 | 470 | 458 | 153 | 20 | 429 | 131 | 5,047 | 4,743 |
| 13 | 478 | 474 | 154 | 22 | 430 | 131 | 5,468 | 5,098 |
| 14 | 487 | 485 | 158 | 23 | 434 | 131 | 5,864 | 5,468 |
| 15 | 500 | 492 | 162 | 24 | 436 | 131 | 6,253 | 5,855 |
| 1B + cap 15 | 522 | 515 | 170 | 24 | 437 | 131 | 6,978 | 6,273 |

**Fix 1 counts:**

- 778 of the 1,181 practice questions, and 304 of the 415 corpus cases, have at least one attached card whose keyword names a keyword rule.
- 1B adds 3.2 keyword-rule pieces per practice question on average. The 6,000-character budget skipped a set on 13 of those 778 questions, and on none of the corpus cases.
- 1A pushes out 1.77 of today's ten rules per practice question (1.13 per corpus case). Its four-slot floor cut a set short on 372 of the 778 questions.
- Changing 1A's floor does not help. With a floor of 2 it got check 404, bench 107. With a floor of 6 it got check 425, bench 131. Both are below the baseline.

## Results: model trained on all the data (`--final`)

This model saw these questions in training, so these are not honest generalisation numbers.

| Variant | Corpus cites (of 494) | Corpus every-rule (of 415) | bench@5 | Corpus excerpts | Corpus chars | Necropotence 514.1/514.2/514.3a, Quick / In-Depth |
|---|---|---|---|---|---|---|
| Baseline | 462 | 390 | 130 | 10.00 | 3,940 | 1/4/5, 1/4/3 |
| 1A | 455 | 383 | 127 | 10.00 | 3,769 | 1/4/5, 1/4/3 |
| 1B | 462 | 390 | 130 | 11.78 | 4,406 | 1/4/5, 1/4/3 |
| cut 0.6, cap 15 | 469 | 393 | 130 | 7.92 | 3,119 | 1/4/5, 1/4/3 |
| cut 0.7, cap 15 | 465 | 389 | 128 | 6.01 | 2,355 | 1/4/5, 1/4/3 |
| 1B + cut 0.6, cap 15 | 469 | 393 | 130 | 9.74 | 3,594 | 1/4/5, 1/4/3 |

The three Necropotence rules stay in the prompt, at the same positions, in both versions under every variant above. The same holds under cross-validation. The one exception is cut 0.8, which drops 514.2 from the Quick version.

**The labelled semantic check set** (`contextEvaluationHarness.test.ts`, 14 checks over 9 fixtures). This was run with the parked trained-model data and manifest applied and each variant switched on.

| Variant | Checks passed | Deathtouch question: 702.2b position (rules shown) | Upkeep question: 500.6 position (rules shown) |
|---|---|---|---|
| Baseline | 12 of 14 | not shown (10) | not shown (10) |
| 1A | 13 of 14 | 7th (10) | not shown (10) |
| 1B | 13 of 14 | 11th (12) | not shown (10) |
| cut 0.5 / 0.6 / 0.7, cap 15 | 13 of 14 | not shown (15 / 15 / 15) | 11th (15 / 15 / 13) |
| 1B + cut 0.6, cap 15 | **14 of 14** | 16th (17) | 11th (15) |

## Plain reading

- **Keyword set inside the ten (1A): do not ship.** It fixes the deathtouch question but costs the player more than it gives. A keyword set averages several pieces, so it pushes useful search results out of the ten. Check-half citations fall from 445 to 418, and bench@5 falls from 131 to 126.
- **Keyword set beside the ten (1B): worth having.** A card's keyword rule always reaches the answer whole, and nothing that reaches the prompt today is lost. It adds 25 check-half citations for about 760 more characters. Per character, that is about the same as raising the cap to 12. Its advantage is that it is predictable: if a card has a keyword, the player gets the keyword's rule.
- **The cutoff on its own at a cap of 10 adds nothing.** It can only remove rules. At 0.5 it removes almost two weak excerpts per corpus question without losing a single citation.
- **The cutoff with a cap of 15 makes "show more rules" cheaper.** Compare cut 0.6 at cap 15 with a fixed cap of 14, which uses about the same practice-question characters. The cutoff gets 498 check citations against 487, and the same 434 corpus citations with a third less corpus text (3,656 against 5,468 characters). 0.6 is the best setting: it loses nothing anywhere. At 0.7, bench@5 drops by 2. At 0.8, every number drops.
- **1B with cut 0.6 at cap 15 is the recommendation.** It is the only variant that passes all 14 labelled checks. It gets 75 more check citations, 25 more every-rule check questions, and 5 more citations on the hard 25, with corpus and bench@5 at or above today.
- **The trade-off is reading load.** On practice-style questions, rule text grows from about 4,200 to 6,700 characters. Deciding rules per 100 excerpts fall from 6.3 to 4.4, so the answering model reads more text that is off-topic. Corpus-style prompts stay close to today's size. Whether the extra text helps or distracts the answer is untested; that needs a paid answer-quality run.

## Notes for the build

- **Spec changes.** The recommended setting changes REQ-190's fixed cap of ten into "up to 15, cut at 0.6 of the top score." It also adds keyword sets past the search excerpts. Both need a spec amendment before they ship.
- **Keyword titles are not in the shipped data.** The shipped rule index has no title entries (702.2 itself is absent; only 702.2a–702.2f are present). The experiments read the titles from the git-ignored rule book text at `apps/backend/data/cr/source.txt`. The build must ship the titles, for example in the rule index or a small sidecar file.
- **Where the keyword rules appear.** 1B places keyword-set rules after the search excerpts, so the deciding rule can sit 11th–16th. Prompt-section ordering (slices E and F) decides how the model actually sees them.
