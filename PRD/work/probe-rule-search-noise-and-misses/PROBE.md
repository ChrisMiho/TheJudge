# Probe: rule-search retrain noise, and where the six concept-map entries help

Measurement only, 2026-10-13 overnight. Nothing here merges, deploys, uploads, spends money or changes the
product. The change under study is open PR #302 (six new concept-map entries plus a retrained search model).

## What this is · What you need to do · What it changes

**What you need to do:** Decide. Recommendation: keep the six new entries but ship them on today's
search model. Do not ship the model PR #302 retrained for them.

**What it means for a player.** When a player asks Luna a rules question, the rule search picks up to 15
rule-book passages for her to read. A "citation reached" means one of the rules that actually decides the
answer was among those passages. The six entries are word lists. When a card says "whenever", "becomes a
creature" or "choose one", the search also looks for the matching rule-book chapter: triggered abilities,
layers, casting a spell, and so on.

**Question 1: does a retrain swing the numbers on its own, and do the six entries help after
retraining?** Yes, a retrain swings them a lot. With the same recipe and the same data, three
training seeds (seed = the random starting point of a training run) span 10 citations on the check
half and 8 on the tuning half. Re-running the same seed moved the check half by 17 (522 to 539).
Once the model is retrained, the six entries help nothing. The six-entry model averages 1,071
practice citations, exactly the same as the baseline model. The entries do help when today's model
is kept. They add 26, 16 and 12 citations on three different models, about 18 on average, and
they never lose on the suite.

**Question 2: where does the change help, and where does it hurt?** It helps questions about
triggered abilities and layers. Triggered-ability rules (rule 603) gained 47 and lost 0 across three
seeds. Layer rules (rule 613) gained 27 and lost 4. Most of that comes from the triggered-ability
entry and the layer-wording entry. It hurts a little elsewhere. The new trigger and layer passages
take slots that held other rules: general spell and effect rules (6xx), state-based actions (704)
and card-type rules (2xx–3xx). Retraining cancels the gain because the trigger words are now in 60%
of training questions. The model learns those words say little and stops reacting to them. Trigger
rules in the top 15 go from 0.95 per question, to 1.43 with the entries, and back to 1.01 after
retraining.

**What is left to win?** About 1,460 deciding rules are still missed. Half of them rank below 100th,
and most of those fall under the search's relevance cut-off. Usually the deciding rule is a general
principle the card wording never mentions, such as "use 0 when a number can't be determined" or
"who controls a permanent". Raising the cap from 15 to 20 recovers about 104–115 rules, and about
126–135 if the cut-off is also removed. A cap of 30 recovers about 245, or 285 with no cut-off, but
that doubles the passages Luna reads. Training on more rules would not help: rules the model never
saw in training are found as often as rules it did see. No cap or cut-off change can recover the
roughly 640 far misses below the cut-off. In a sample, about 1 miss in 12 looks like a doubtful
citation in the practice suite itself.

**Recommended next step.** Amend PR #302 so it keeps the six entries on the current shipped model
(`rule-search-d2c2e500a4c6`).
Then re-check the shipped (100%-trained) model with the entries before merging. For any future change
to the search, compare against a fixed model or average at least three seeds. A single retrain
cannot detect a gain smaller than about 15 citations.

---

## Job 1: retrain noise

Every figure is the number of deciding-rule citations that reached the top 15. It is 5-fold
cross-validated, so each question is scored by a model that never trained on it. The practice suite
has 1,181 questions with fixed check and tuning halves. The committed corpus has 415 cases. The
bench@5 figure counts hits in the top five of the 156-question benchmark. The model recipe is the
same throughout (REQ-236: MiniLM fine-tune, 4 epochs, learning rate 5e-5, batch 32, one hard
negative, Apple MPS). Only the seed and the training pairs change.

| Arm | Seed | check | tuning | every-rule check | every-rule tuning | hard 25 (of 59) | corpus citations | corpus cases | bench@5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline map, retrained | 13 | 539 | 529 | 185 | 171 | 20 | 438 | 372 | 128 |
| Baseline map, retrained | 14 | 549 | 521 | 183 | 172 | 22 | 439 | 371 | 131 |
| Baseline map, retrained | 15 | 548 | 527 | 177 | 169 | 22 | 443 | 374 | 129 |
| Six entries, query side only (the baseline-map model of each seed) | 13 | 558 | 536 | 182 | 176 | 19 | 441 | 374 | 127 |
| Six entries, query side only | 14 | 553 | 533 | 183 | 177 | 22 | 442 | 373 | 130 |
| Six entries, query side only | 15 | 550 | 537 | 177 | 171 | 21 | 442 | 373 | 128 |
| Six entries, retrained | 13 | 538 | 525 | 177 | 171 | 21 | 440 | 373 | 128 |
| Six entries, retrained | 14 | 552 | 523 | 183 | 176 | 21 | 442 | 372 | 126 |
| Six entries, retrained | 15 | 550 | 525 | 178 | 167 | 22 | 438 | 370 | 131 |
| Recorded 2026-10-12 (REQ-236), baseline map, seed 13, earlier run | 13 | 522 | 511 | 175 | 166 | 21 | 442 | 377 | 130 |

Mean and spread (min–max) of the three seeds:

| Arm | check | tuning | every-rule check | every-rule tuning | hard 25 | corpus citations | corpus cases | bench@5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline map, retrained | 545.3 (539–549) | 525.7 (521–529) | 181.7 (177–185) | 170.7 (169–172) | 21.3 (20–22) | 440.0 (438–443) | 372.3 (371–374) | 129.3 (128–131) |
| Six entries, query side only | 553.7 (550–558) | 535.3 (533–537) | 180.7 (177–183) | 174.7 (171–177) | 20.7 (19–22) | 441.7 (441–442) | 373.3 (373–374) | 128.3 (127–130) |
| Six entries, retrained | 546.7 (538–552) | 524.3 (523–525) | 179.3 (177–183) | 171.3 (167–176) | 21.3 (21–22) | 440.0 (438–442) | 371.7 (370–373) | 128.3 (126–131) |

Does the six-entry arm beat the baseline by more than the spread? The test: the difference of the
means against the larger of the two arms' min–max spreads.

| Figure | Query side only: mean diff / spread / paired diffs per seed (13, 14, 15) | Retrained: mean diff / spread / paired diffs |
| --- | --- | --- |
| check | +8.3 / 10 / +19, +4, +2 (within) | +1.3 / 14 / −1, +3, +2 (within) |
| tuning | +9.7 / 8 / +7, +12, +10 (**beats**) | −1.3 / 8 / −4, +2, −2 (within) |
| every-rule check | −1.0 / 8 / −3, 0, 0 (within) | −2.3 / 8 / −8, 0, +1 (within) |
| every-rule tuning | +4.0 / 6 / +5, +5, +2 (within) | +0.7 / 9 / 0, +4, −2 (within) |
| hard 25 | −0.7 / 3 / −1, 0, −1 (within) | 0.0 / 2 / +1, −1, 0 (within) |
| corpus citations | +1.7 / 5 / +3, +3, −1 (within) | 0.0 / 5 / +2, +3, −5 (within) |
| corpus cases | +1.0 / 3 / +2, +2, −1 (within) | −0.7 / 3 / +1, +1, −4 (within) |
| bench@5 | −1.0 / 3 / −1, −1, −1 (within) | −1.0 / 5 / 0, −5, +2 (within) |

How to read it:

- The retrained six-entry arm is indistinguishable from the baseline on every figure. The suite
  total (check plus tuning) is 1,071.0 for both.
- The query-side arm beats the spread only on the tuning half, and the check-half gain sits inside
  the spread. But the query-side test is paired: the same model, with only the search words
  changed. No training noise enters it. It gains suite citations on all three models (+26, +16,
  +12) and never loses on the suite total. Its cost is about −1 on bench@5 on every model.
- Running the same seed twice does not reproduce. Seed 13 gave 522 / 511 on 2026-10-12 and
  539 / 529 tonight, on inputs recorded as unchanged. So the whole band seen so far is 522–549 on
  check (27 citations) and 511–529 on tuning (18). MPS training is not bit-for-bit repeatable.
- Per rule, a retrain alone flips about 130–150 deciding rules (baseline seed against baseline
  seed: +69/−65, +70/−56, +77/−67). The six-entry retrain flips about the same number
  (+66/−71, +77/−68, +61/−69). The query-side change flips only 60–90, and 98% of those are in
  questions where an entry fires.

## Job 2: where the change helps and where it hurts

Per deciding rule, baseline against the six-entry arm at the same seed, summed over seeds 13, 14 and
15. A rule counts only when the search must find it; rules that a curated topic already supplies are
excluded.

How often each entry fires: it newly fires on a practice question's cards in this many of 1,181
questions (corpus in brackets, of 415).

| Entry | Questions where it newly fires |
| --- | --- |
| 79 triggered abilities ("whenever", "when", "at the beginning of") | 705 (161) |
| 81 layer wording ("becomes a … creature", "gains control", "loses all abilities") | 184 (25) |
| 84 casting choices ("choose one", "as an additional cost to cast") | 88 (9) |
| 83 sacrifice-as-cost ("Sacrifice ~: …") | 46 (3) |
| 80 alternative cost ("rather than pay … mana cost") | 23 (1) |
| 82 −N/−N toughness | 22 (4) |
| Any of the six | 833 (192) |
| The narrowed type-setting entry (also in PR #302) stops firing | 1 (0) |

### (a) By the entry that fires on the question's cards

A rule in a question where two entries fire counts under both.

| Entry | Query side only: gained / lost | Net | Net per seed | Retrained: gained / lost | Net | Net per seed |
| --- | --- | --- | --- | --- | --- | --- |
| 79 triggered abilities | +110 / −62 | +48 | +25, +14, +9 | +121 / −125 | −4 | 0, +5, −9 |
| 81 layer wording | +46 / −23 | +23 | +7, +7, +9 | +43 / −35 | +8 | +5, +2, +1 |
| 84 casting choices | +15 / −6 | +9 | +3, +3, +3 | +35 / −13 | +22 | +7, +8, +7 |
| 80 alternative cost | +8 / −2 | +6 | +1, +3, +2 | +13 / −7 | +6 | 0, +5, +1 |
| 83 sacrifice-as-cost | +4 / −6 | −2 | −1, +1, −2 | +6 / −5 | +1 | 0, 0, +1 |
| 82 −N/−N toughness | +5 / −4 | +1 | +1, +1, −1 | +5 / −3 | +2 | +1, +1, 0 |
| No entry change on the cards | +1 / −2 | −1 | −1, +1, −1 | +40 / −61 | −21 | −14, 0, −7 |

The triggered-ability and layer entries carry the query-side gain, and the result is positive on
every seed. The casting-choices entry is the only one that also gains, every seed, after
retraining. After retraining, questions with no entry change lose 21 rules. That loss is the
retrain moving the whole model, not any entry.

### (b) By the deciding rule's family

| Family | Query side only: gained / lost | Net | Net per seed | Retrained: gained / lost | Net | Net per seed |
| --- | --- | --- | --- | --- | --- | --- |
| 603 triggered abilities | +47 / −0 | +47 | +15, +14, +18 | +29 / −14 | +15 | +8, +5, +2 |
| 613 layers | +27 / −4 | +23 | +11, +6, +6 | +19 / −8 | +11 | +6, +2, +3 |
| 601/602 casting and activating | +8 / −6 | +2 | +2, +3, −3 | +31 / −14 | +17 | +10, +1, +6 |
| 118 costs | +6 / −0 | +6 | +3, +1, +2 | +10 / −6 | +4 | 0, +4, 0 |
| 704 state-based actions | +4 / −11 | −7 | −3, −2, −2 | +10 / −18 | −8 | −7, +4, −5 |
| other | +45 / −58 | −13 | 0, −2, −11 | +105 / −148 | −43 | −22, −7, −14 |

The "other" row, split:

| Other family | Query side only: net (gained / lost) | Retrained: net (gained / lost) |
| --- | --- | --- |
| 6xx spells, abilities, effects (not 601–603, 613) | −12 (+9 / −21) | −27 (+28 / −55) |
| 2xx–3xx card parts and types | −6 (+1 / −7) | +5 (+13 / −8) |
| 500–514 turn and combat | −5 (+2 / −7) | +3 (+20 / −17) |
| 1xx game concepts | −2 (+9 / −11) | −6 (+22 / −28) |
| 702 keyword abilities | +11 (+14 / −3) | −3 (+2 / −5) |
| 701 keyword actions | +1 (+3 / −2) | −8 (+7 / −15) |
| 7xx additional rules | 0 (+6 / −6) | −8 (+9 / −17) |
| 4xx zones | +1 (+1 / −0) | +1 (+2 / −1) |
| 8xx–9xx multiplayer and variants | −1 (+0 / −1) | 0 (+2 / −2) |

### (c) For losses: what took the slot

These are the rules that entered the top 15 when a deciding rule fell out. Each loss gives a weight
of 1, shared across its newcomers. Summed over three seeds.

| Family entering the top 15 | Query side only | Retrained |
| --- | --- | --- |
| 603 triggered abilities | 21.8 | 9.9 |
| 613 layers | 14.7 | 7.3 |
| 1xx game concepts | 10.3 | 38.2 |
| 6xx spells, abilities, effects | 7.0 | 28.9 |
| 500–514 turn and combat | 5.8 | 20.8 |
| 601/602 casting and activating | 4.4 | 11.0 |
| 8xx–9xx multiplayer and variants | 3.5 | 7.7 |
| 704 state-based actions | 3.0 | 4.2 |
| 2xx–3xx card parts and types | 2.0 | 22.3 |
| 7xx additional rules | 1.5 | 20.7 |
| 4xx zones | 1.8 | 5.3 |
| 702 / 701 keywords | 1.9 | 22.4 |
| 118 costs | 0.3 | 7.2 |

With the query side only, the entries' own chapters (triggers and layers) take 46% of the freed
slots. That is a direct trade: a new trigger or layer passage pushes out a borderline rule. After
retraining, the newcomers are spread across every family, which is what retraining noise looks
like. Losses where another deciding rule of the same question took the slot: 4 of 79 (query side),
12 of 208 (retrained).

### Why it works on the query side and not after retraining

The test: in the 705 practice questions where the trigger entry fires, count the rules from that
entry's chapter in the top 15, and the deciding rules found, averaged over three seeds. The same
test is repeated for the layer and casting entries.

| Questions where this entry fires | Measure | Baseline | Query side only | Retrained |
| --- | --- | --- | --- | --- |
| Trigger entry (705) | 603 rules in the top 15, per question | 0.95 | 1.43 | 1.01 |
| | deciding 603 rules found (seeds 13/14/15) | 39 / 39 / 36 | 54 / 53 / 54 | 48 / 45 / 40 |
| | other deciding rules found | 489 / 485 / 498 | 499 / 485 / 491 | 477 / 483 / 489 |
| Layer entry (184) | 613 rules in the top 15, per question | 1.99 | 2.91 | 2.48 |
| | deciding 613 rules found | 47 / 49 / 47 | 55 / 52 / 52 | 54 / 51 / 52 |
| Casting entry (88) | 601 rules in the top 15, per question | 1.18 | 1.41 | 1.42 |
| | deciding 601 rules found | 5 / 7 / 5 | 6 / 9 / 5 | 11 / 8 / 10 |
| No entry change (348) | other deciding rules found | 277 / 281 / 279 | same | 267 / 279 / 276 |

The baseline model has never seen the phrase "handling triggered abilities" in a question. It
matches the phrase straight to the rule-book chapter of that name. Retraining puts the phrase in 60%
of training questions, and most of those questions are not decided by a 603 rule. So the model
learns the phrase is not a useful signal, and the pull to the trigger chapter mostly disappears.
The layer pull survives in part, and the casting-choices entry gains more after retraining. This
explanation is inferred from the measurements above, not proven.

### Effects that hold on all three seeds, and effects that flip

| Arm | Gained on all three seeds | Lost on all three seeds | Changed on only some seeds |
| --- | --- | --- | --- |
| Query side only | 11 (rules 118.9, 603.10 ×3, 603.12, 603.2c, 603.3b, 613.1, 613.1d, 613.1f, 613.8b) | 3 (305.7, 704.3, 704.5a) | 140 (85 up, 55 down) |
| Retrained | 5 (118.9, 303.4f, 601.2b, 603.10 ×2) | 4 (305.7, 603.12, 614.6, 704.5a) | 248 (124 up, 124 down) |

The query-side gain is concentrated and repeatable: every rule gained on all three seeds is a
trigger, layer or cost rule. Retraining turns it into 248 rules that move with the seed and cancel
out.

## Job 3: what is left to win

Every deciding rule still missing at the 15-passage cap is counted below. Its rank is its position
in the search's full ranking. The relevance floor (relevance cut-off) drops any candidate scoring
under 60% of the best match before the cap applies. Each figure is the mean (min–max) of three
seeds, across the suite, corpus and bench.

| Measure | Baseline map (3 seeds) | Six entries, retrained (3 seeds) | Six entries, query side only (3 models) |
| --- | --- | --- | --- |
| Missed deciding rules | 1,463 (1,455–1,469) | 1,464 (1,456–1,474) | 1,444 (1,441–1,445) |
| rank 1–15 but cut (a reserved per-card slot or the floor took it) | 44 | 53 | 44 |
| rank 16–20 | 110 (105–118) | 106 (101–112) | 109 (103–115) |
| rank 21–40 | 235 (230–242) | 242 (233–249) | 237 (222–255) |
| rank 41–100 | 357 (338–373) | 359 (353–365) | 352 (332–363) |
| rank beyond 100 | 714 (709–718) | 703 (696–713) | 699 (693–703) |
| never scored at all (rules 613.5 and 310.8d; 310.8d is not in the current rule book) | 2 | 2 | 2 |
| under the relevance floor | 836 (825–848) | 809 (800–818) | 803 (797–814) |
| beyond 100 and under the floor | 647 (639–661) | 636 (631–638) | 624 (615–636) |
| the rule was never in that fold's training pairs | 188 | 189 | 187 |
| a sibling or parent sub-rule (same number, other letter) is in the top 15 | 291 | 290 | 294 |
| nothing from the rule's section is in the top 15 | 804 | 791 | 781 |
| the question cites 4 or more deciding rules | 383 | 382 | 381 |

The missed rules by family (six entries retrained, mean of three seeds): 6xx spells, abilities and
effects 331; 1xx game concepts 247; 2xx–3xx card types 123; 613 layers 112; 603 triggers 109; 7xx
additional rules 104; 601/602 casting 104; 704 state-based actions 86; 500–514 turn and combat 81;
118 costs 47; 702 keyword abilities 38; 701 keyword actions 35; 4xx zones 28; 8xx–9xx 20.

### Levers, ranked by measured misses recovered

Each lever was measured by re-running the shipped selection code with the setting changed. A
patched copy was used for the floor; at the shipped settings it reproduces production exactly (0
mismatches). Raising the cap or lowering the floor never lost a rule that was already found. Each
only adds passages.

| Lever | Misses recovered (baseline / six entries retrained) | Passages Luna reads per question (today 16.5, incl. keyword sets) |
| --- | --- | --- |
| Pull in every sibling sub-rule of each chosen rule | 291 / 290 | about +35 (impractical) |
| No floor, cap 30 | 285 / 287 | 33.2 |
| Cap 30 | 245 / 245 | 26.9 |
| No floor, cap 20 | 126 / 135 | 23.3 |
| Floor 0.5, cap 20 | 118 / 130 | 21.6 |
| Cap 20 | 104 / 115 | 20.2 |
| Six entries, query side, today's model | 19 (1,463 → 1,444) | 16.5 (no change) |
| No floor, cap 15 | 12 / 12 | 18.4 |
| Floor 0.5, cap 15 | 8 / 10 | 17.4 |
| Train on the rules the model never saw | about 0: in the practice suite, unseen rules are found 40% of the time against 39% for seen rules | no change |

These count citations reaching the prompt, not better answers. An earlier paid answer check found
answers flat between caps (cap-15 answer check: 124–125 of 126 at cap 15 against 125 at cap 10).
So any cap lever still has to pass an answer check before it ships.

### Misses no search change can recover

- **Doubtful citations in the suite.** Of 25 sampled misses (15 ranked beyond 100, 10 ranked
  16–100), 23 cite a rule that does decide the ruling. 2 look doubtful: in one the cited rule does
  not apply to the cards involved, and in the other it is at best supporting. That is about 8%.
  Scaled to all misses, roughly 100–120 may be label problems, a wide estimate from a small sample.
  The suite was not edited.
- **Rules that cannot be scored:** 2. One cited rule is not in the current rule book.
- **About 640 misses rank beyond 100 and sit under the floor.** No cap or floor setting reaches
  them. In the sample, these are mostly general principles the card text never names, such as 107.2
  (use 0 when a number can't be determined), 110.2 (owner and controller), 208.5 (no power value
  means 0), 614.1a (what makes a replacement effect), 305.2b (land plays) and 800.4a (leaving a
  multiplayer game). The search reads the question and the cards, and neither mentions the
  principle. Recovering them needs a different kind of help, for example curated topics that
  attach general principles to common situations, or Luna answering from her own rules knowledge.
  A better ranking alone will not do it.

## Method

- **Models.** Four new 5-fold sets were trained one at a time on Apple MPS: baseline-map pairs with
  seeds 14 and 15 (`B14-`, `B15-`) and six-entry pairs (`data-retrain`) with seeds 14 and 15
  (`S14-`, `S15-`). The trainer was `scripts/train-rule-search-model.py --cv --export --seed <n>`,
  with the implement worktree's venv and Hugging Face cache, run offline. Each fold took about 6
  minutes. The existing `F-` (baseline, seed 13) and `R-` (six entries, seed 13) folds were reused.
  Fold assignment is identical in both training-pair files (1,596 rows, 0 differences); only the
  query text differs, in 1,025 rows.
- **Scoring.** Each set was scored with `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs
  --cv --fold-prefix <prefix> --cases <matching cases.jsonl>`. Baseline-map models were scored from
  this probe worktree (main's concept map). Six-entry models were scored from the PR #302 worktree,
  with the model folders linked into its git-ignored `output/`. The query-side arm is the
  baseline-map models scored from the PR #302 worktree. The scorer refuses to run unless the embedder
  is local. Every run also took the trained model's semantic path on all 1,752 questions (0 lexical
  fallbacks).
- **Per-rule detail** came from a probe-only copy of the scorer, kept git-ignored. It records, per
  deciding rule, hits at caps 15, 20 and 30, the full-ranking position, floor status, top-15 slot
  sources, and which concept-map entries fire on each branch. Its cap-15 results match the official
  scorer per question exactly on all nine runs checked, including tonight's three recorded
  per-question files.
- **Families** come from the rule number: 603, 613, 601/602, 118 and 704, with everything else
  split by rule-book section.
- **Privacy.** This file holds counts, rule ids and categories only. Per-question results stay
  git-ignored under the probe worktree's `output/rule-search-eval/` and `.tmp/`.
