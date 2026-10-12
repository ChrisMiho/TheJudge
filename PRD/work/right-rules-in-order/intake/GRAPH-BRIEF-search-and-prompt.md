# Graph-run brief: Luna gets the right rules, in an order she can follow

Self-contained intake for `graph-kickoff`. The investigate-first questions are **resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

Probe: `PRD/work/probe-prompt-format-tuning/`, session 4 (2026-10-11). All measurement was free and local.

The owner approved every recommendation in this brief on 2026-10-11. That includes shipping a search model trained on the local practice suite.

## What the player gets

**Luna gets the rules that decide the ruling about twice as often.**
- On the held-out half of the practice suite, deciding-rule citations in her top 10 go from 223 to about 450.
- Questions where *every* deciding rule reaches her go from 75 to about 150 of 580.

**She reads those rules the way a judge would:**
- in rule-book order;
- labelled with where they sit ("Turn Structure › Cleanup Step › 514.3a");
- with the list a lead-in promises, never "subject to the following exception:" with the exception missing.

**Quick Lookup gets the short step-by-step summary of a turn step** when the question names one. In-Depth already gets it, and that summary is the main reason In-Depth answered the Necropotence corner case right 10 of 12 times against Quick Lookup's 6 of 12.

**A set of prompt bugs goes away:** wrong facts in the step summaries, instructions that describe sections Quick Lookup doesn't have, rule ids printed twice, two rules missing from the rule data, and others (full list below).

**Unrelated cards on the table pull search off course no more than today.** The guard benchmark holds or improves.

**Speed:** the search model is the same size and speed as today's. Per-card search adds one local embedding per card, about 4.5 ms each on a Mac.

## Why (measured; do not re-derive)

### How the numbers were measured

- **Practice suite:** 1,181 usable practice questions with 2,469 deciding-rule citations. The data is local-only (see Constraints).
  - It's split by a fixed seed (`pft-split-1`) into a **tuning half** (1,259 citations) and a **check half** (1,210 citations).
  - Every choice was made on the tuning half. The check half is the honest number.
- **Hard 25:** the 25 hardest practice questions (level 3 / Corner Case, each answer checked against the Comprehensive Rules), 59 citations.
- **Corpus:** the project's 415 committed rules-review cases. Counted as deciding-rule citations / cases with every deciding rule present.
- **Bench:** 156 questions with three unrelated cards attached, counted as top-5 hits. It guards REQ-178's concern that card text drowns the question.
- **Fidelity:** the probe harness reproduces production's top 10 on all 1,596 questions (473 / 159 / 5 / 351 / 305).
- **The trained model is scored 5-fold cross-validated.** Each question is scored by a model that never trained on it. Folds are grouped so that both versions of a corpus case, and practice questions sharing a card set, stay together.

### Search results

| Setup | Tuning | Check | Every-rule (tuning / check) | Hard 25 | Corpus cites / every | Bench@5 | Necropotence 514.1 / 514.2 / 514.3a rank, Quick · In-Depth | Rule chars per question |
|---|---|---|---|---|---|---|---|---|
| Today | 250 | 223 | 84 / 75 | 5 | 351 / 305 | 120 | 3/30/14 · 3/49/17 | 7,472 |
| Today + card-keyword fix (S1) + dot fix (S5) | 275 | 252 | 89 / 78 | 6 | 382 / 336 | 118 | 3/35/18 · 3/38/22 | — |
| Trained model on today's search, weight 0.8 | 393 | 418 | 129 / 130 | 16 | 404 / 346 | 130 | 2/6/5 · 2/6/3 | 3,611 |
| **Recipe below: trained model + token fixes + concept map + per-card search, weight 0.65** | **433** | **449** | **145 / 151** | **18** | **419 / 361** | **125** | **1/8/5 · 6/5/2** | **4,912** |
| Same, with BM25 word scoring, weight 0.7 | 426 | 452 | 141 / 146 | 17 | 426 / 367 | 127 | 3/7/5 · 8/5/2 | 4,434 |
| Recipe without the concept map | 407 | 432 | 138 / 130 | 14 | 413 / 358 | 129 | 1/12/5 · 2/11/4 | 3,870 |
| Recipe without per-card search | 424 | 441 | 141 / 142 | 19 | 419 / 359 | 127 | 3/7/5 · 8/5/2 | 4,586 |
| Recipe, trained without practice questions | 351 | 348 | 108 / 103 | 10 | 414 / 360 | 128 | 11/13/7 · 36/11/3 | 5,624 |

More measured results:
- **Hybrid recall@100** (a deciding rule anywhere in the top 100): 37.8% today, about 70% with the recipe.
- **When a deciding rule still misses the top 10,** its median rank improves from about 450 to about 86.
- **The 100% model,** trained on everything (so not an honest number), scores 456 / 382 on the corpus.

### Results that were tested and rejected

- **BM25:** redundant once the model is trained. It ties the recipe (452 against 449 on check) and is worse on tuning and every-rule.
- **Stronger off-the-shelf embedders:** at most +13 on check, at 4–14× the size. Keep MiniLM.
- **A local reranker:** +18 on check at 279 MB and about 3 s per question. Don't build it.
- **Labelled rule text inside the vectors** ("variant C"): −17 on check with the trained model. Labels go in the prompt, not the vectors.
- **Raw card text in the embedding:** the bench drops 118 → 96 (REQ-178's concern confirmed).

### Training-data caveats (known; accepted)

- **The gain concentrates on often-cited rules.** 88% of suite citations are rules the model saw while training. Those go from 422 to 713 found; never-seen rules go from 51 to 73.
- **It is not near-duplicate leakage.** On the 1,139 questions with no training question closer than cosine 0.7, the count goes from 465 to 748.
- **The practice questions provide almost all of the suite gain,** and almost none of the corpus gain. The corpus gain comes from the corpus cases and the rule-book examples.

### Why Quick Lookup trails In-Depth on Necropotence

Corpus case `necropotence-silence-borne-upon-a-wind-cleanup`. Measured on the saved prompts, which hash-match the paid runs.

- **The deciding fact is present, but out of order.** 703.4p ("this turn" effects end during cleanup) is in Quick Lookup's prompt as excerpt 5, after the priority rules.
  - Excerpts arrive in score order: 703.4n, 514.3, 514.1, 724.1f, 703.4p.
  - 514.3 ends "subject to the following exception:" without 514.3a.
  - 724.1f says "no priority".
- **In-Depth gets an ordered paragraph summarising the cleanup step.** Quick Lookup never gets phase guidance.
- **In 5 of 6 Quick Lookup misses, Luna found the priority window and still ruled that Silence applies.** The pooled p≈0.04 makes this a consistent mechanism, not yet proven. The paid run after this build is the proof.
- **Across the 9 corpus cases that exist in both versions,** In-Depth delivered 17 of 30 deciding rules against Quick Lookup's 6 of 30. Most of the difference comes from In-Depth's zone-triggered layer topics.

## Decisions already made (do not re-litigate)

1. **Ship a Magic-trained MiniLM, the full arm,** trained on practice questions + corpus cases + rule-book examples. Base model: `sentence-transformers/all-MiniLM-L6-v2`, 384 dims, same size and speed as today's.
2. **The trained model is never committed to git.** The repository is public. The model is stored in the existing private S3 bucket (see Design).
3. **No BM25, no reranker, no stronger off-the-shelf embedder, no labelled text in vectors.**
4. **Keep today's sum word scoring,** with four token fixes:
   - S1: every card keyword is weighted as a keyword;
   - S5: strip sentence dots;
   - Porter stemming;
   - drop the six everyday verbs from the keyword list.
5. **Meaning weight 0.65** (today 0.6). It was chosen on the tuning half.
6. **Concept map on:** card phrases become rule-concept terms, in both the word match and the embedding text, at ×2 word weight. REQ-178's ban on raw card text in the embedding stays.
7. **Per-card search on, with 2 reserved slots** of the 10.
8. **Excerpt cap stays 10** (REQ-095).
9. **Prompt order:** excerpts in rule-book order, grouped by family, each with a path label and its parent's lead-in. A lead-in is never delivered without its list.
10. **Quick Lookup gets the step summary when the question names a turn step,** and every step summary is corrected against the rules.
11. **Out of scope, tested later in a paid run:**
    - P5, "use only the provided context";
    - P13, the system/instructions channel.
    Leave both as they are.
12. **Out of scope, briefed separately:** S6 (the follow-up search query). Its brief, `PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md` (follow-ups keep their first-turn excerpts), owns it.
13. **One paid verification run, after merge,** launched by the owner (see Verification).

## Design direction (converged)

### A. Rule data (`scripts/build-game-rules.mjs`, committed rule index)

Fix the parser bugs, then rebuild:
- **D2:** part titles glued to the last rule of each part: 123.9, 213.1g, 315.7, 408.3, **514.3a**, **616.2**, 733.2, 811.5 (around `:200`).
- **D3:** 700.15 and 303.7 are dropped as headings because of a curly closing quote (around `:131-139`). Also, 702.163 and 702.179 are kept as empty pieces.
- **D4:** the id pattern allows only one letter, so 704.5aa merges into 704.5z.
- **D1/D13:** in word-match tokens, strip the trailing period, keep "can't" and "it's" whole, and normalise U+2028 / NBSP.
- **D10:** add the glossary (741 entries; 35 obsolete terms such as "mana burn"). It is used for query translation of obsolete terms. It is not delivered as excerpts.
- **D12:** store the rule-book edition and source hash with the index.

The index rebuilds byte-for-byte today from the 2026-09-25 rule book. After the fixes, only the listed pieces may change. Diff and assert that.

### B. Search (`apps/backend/src/gameRulesRetrieval.ts`, `prompt/preparation.ts`)

1. **S1:** card keywords from Scryfall `keywords` (REQ-180) get the ×6 keyword weight even when they're not on the 20-word vocabulary. Multi-word keywords match as one phrase.
   - Today, 975 of 1,514 suite card keywords (64%) get no weight: Enchant, Mill, Equip, First strike and others (`:396-398, 440`).
   - Measured +58 suite citations; corpus every-rule 305 → 336.
2. **Token fixes:**
   - S5 strips dots (`:359`).
   - Porter-stem every token that has no digit or dot, on both the query and the rule side. Rebuild `gameRulesTokenStats.json`.
   - Drop counter, destroy, exile, sacrifice, trigger and replacement from `gameRulesKeywordVocabulary.json`, leaving 14 words.
   - No "can't" → "cannot" mapping (measured zero).
3. **Concept map:**
   - About 80 general phrase-to-concept rules applied to each card's oracle text, with the card's own name replaced by "~", plus 5 type-line rules. Port it verbatim from the Appendix.
   - Add the terms to the word query at ×2, and append them to the text that gets embedded.
   - Weights in the word query: question ×3, card signal ×1, concept ×2, keyword ×6.
4. **Per-card search:** embed each card's oracle text on its own, rank rules against it, and reserve 2 of the 10 slots for the best per-card hits. Those are the top hit of the highest-scoring cards, de-duplicated against the main list.
5. **In-Depth turn step:** add the game's current turn step to the In-Depth search query (S2; amends REQ-178). Measured: Necropotence In-Depth 514.3a 17 → 8 on today's model.
6. **Blend:** meaning 0.65 / words 0.35, divide-by-max, as today.
7. **S7:** `EMBEDDING_PROVIDER=openai` silently falls back to word-only search (1,536 vs 384 dims, `openAiEmbeddingProvider.ts:4`, `gameRulesRetrieval.ts:671-675`). Make a dimension mismatch fail loudly.
8. **S8:** a stray 3-digit number must not count as a rule id (`:366`).
9. **S13:** replace the `parseFloat(ruleId)` tie-break with a rule-order comparator (`:755`).

### C. The trained model

1. **Training script, committed under `scripts/`.**
   - It reads the local-only practice suite from a folder passed as a flag, defaulting to the git-ignored `output/practice-suite/`. A build worktree doesn't have that folder, so point the flag at the main checkout's copy, `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite/` (1,245 selectable questions). It also reads the committed corpus and the rule index.
   - Every training pair must use the **shipped** query builder from B: production query text, concept terms, turn step. Train after A and B land. Rule-side text is the production embedding text, `${sectionTitle}: ${text}`, sliced to 2,000 characters.
   - Rule-book examples: each `Example:` passage is paired with its rule (277 pairs over 215 rules), with the example stripped from that rule's text during training.
   - Hard negatives: one per pair, from the current search's top 40, with the deciding rule's whole family removed.
   - A probe implementation exists to port (the paths are untracked on main until the probe folder is committed):
     - `PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/export-training.mjs`;
     - `PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/train.py`;
     - the scorer, `score-trained.mjs`.
2. **Recipe:**
   - sentence-transformers, cached MultipleNegativesRankingLoss;
   - batch 32 (mini-batch 16), no-duplicates batching;
   - learning rate 5e-5, 4 epochs, 10% warmup, max length 512, seed 13.
   - About 7–8 minutes for the 100% model on the Apple GPU.
   - Python 3.12 via `uv`. Run Python with `-I`.
3. **Export:**
   - ONNX opset 14, then dynamic int8, **per-channel, reduced range**, to match the bundled model's layout. A per-tensor export lost 23 citations.
   - Lay it out the way transformers.js loads it (`onnx/model_quantized.onnx` plus tokenizer and config).
   - Expected size is 23.0 MB.
4. **Cross-validation command:** the script can also train 5 fold models and print the honest suite numbers. The gate below uses those numbers. The shipped model is trained on 100%.
5. **Storage:**
   - Upload the 100% q8 model folder to the private, public-access-blocked bucket `thejudge-lambda-artifacts-<account>` under `models/<model-id>/`. The bucket is created by `scripts/aws-bootstrap.sh`.
   - Record `<model-id>` and a sha256 per file in a small committed manifest.
   - A fetch script fills `apps/backend/data/models/` (already git-ignored) from S3 and checks the hashes. It replaces the Hugging Face fetch in `scripts/warm-embedding-model-cache.mjs` for this model.
   - `scripts/package-lambda.sh` already refuses to package without the model (REQ-184). Keep that guard, pointed at the new model.
   - If the deploy role lacks `s3:GetObject` on that prefix, grant it through `scripts/aws-bootstrap.sh`. The owner runs bootstrap locally with profile `thejudge-admin`; CI can't provision.
6. **Model identity:**
   - `LOCAL_MODEL_ID` in `apps/backend/src/providers/localEmbeddingProvider.ts` becomes the trained model's id.
   - Rebuild every committed vector with it:
     - `apps/backend/data/gameRulesRuleEmbeddings.json`;
     - `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`;
     - `apps/backend/src/prompt/preparation.crossReferenceQueryEmbedding.json`.
   - The embeddings artifact records the model id and hash. At load, a mismatch with the runtime model must fail loudly, never silently.
7. **Retraining:** a local, owner-run step. Run it whenever the rule book, the corpus or the practice suite changes, and with every CR-moving data refresh. Add it to that refresh checklist.

### D. Prompt building

1. **P1 + P4: step summaries** (`apps/backend/src/prompt/phaseGuidance.ts`, `promptAssembly.ts:110-167`).
   - Quick Lookup includes the step summary when the question names a turn step or the concept map yields a step term. In-Depth keeps it.
   - Correct the facts against the CR:
     - cleanup must say "this turn" / "until end of turn" effects end (514.2) before priority, which happens only if something triggers (514.3a);
     - untap: triggers wait until upkeep (502.4); today's text says they resolve before upkeep;
     - declare blockers: remove the damage-assignment order, which is gone from the rules.
2. **P2, D5, D6, P10: excerpt order and labels** (`promptFormatting.ts:291-301`).
   - Sort excerpts in rule-book order and group them by family.
   - Each family gets a path label (part › section › family, from the rule-book titles; not "General").
   - Each piece gets its parent's lead-in sentence when the piece needs it to make sense: list items, "First/Second", "At this point", "this rule". Today 370 pieces (13%) are like this.
   - Print the rule id once (today `514.3a. 514.3a`).
3. **P3, D11: lead-ins with lists.** When a delivered piece ends in a list lead-in ("following rules:", "following exception:"), deliver its list items too.
   - This covers search excerpts and curated topics alike. Curated 117.3 dangles in 414 of 415 prompts, and 400.7 in 398.
   - Delivered list items don't count against the 10 slots, but cap them; refinement sets the cap from measured sizes.
   - Layer topics also lack 613.4d and 613.8b.
4. **P6: Wizards rulings.** Frame them as situation-specific rulings for that card ("rulings for this card; apply only when the situation matches"). Place each card's rulings directly under the card. In-Depth today puts the rules block between cards and rulings (`normalization.ts:9-11`, `promptFormatting.ts:280-285`).
5. **P7: In-Depth curated topics.** Choose them by card wording (the concept map) and the question, not by which zones hold cards (`gameRulesTopicSelection.ts:32-39, 134-136`).
   - Gate: on the 9 paired corpus cases, In-Depth keeps at least its 17 of 30 deciding rules present.
   - Quick Lookup may use the same card-wording topic selection.
6. **P8, P9, P14, P15, P17: instructions.**
   - One shared instruction list.
   - A per-mode reference block (`mtgReference.ts:7, 18`), so Quick Lookup isn't told about phase guidance, a scope note or a stack it doesn't have.
   - One stack-numbering convention (today 0-based at `promptFormatting.ts:15`, 1-based at `:225`).
   - Remove the dangling glossary pointer and its garbled sentence (`promptAssembly.ts:149`).
   - Rules framed as binding, not "shared vocabulary". Collapse the three near-identical "does not override" lines (`gameRules.ts:15-16`).
7. **D7, P18: "see rule X" pointers.** 73% point at text that isn't in the prompt. Attach the target's first sentence when X is a specific rule, or the section/family title when X is a section. Cap the total.
8. **P11, P12, P16: card data and topics.**
   - Add power/toughness/loyalty to card data (`cardDetail.ts:11-22`).
   - Keep oracle line breaks (`normalization.ts:15-16, 40-41`).
   - The "Delayed Triggered Abilities" topic must carry 603.7a–c, not 603.10 (`gameRulesByTopic.json`).

**Order of work:** A → B → C (training uses the shipped query builder and the fixed rule text) → D. D is independent of C and can run in parallel after A.

## Gates (free; measured by the build's own harness)

Measured values with a small margin. Run on the build's code and data, not the probe's.

1. **Search fidelity:** the harness reproduces production's top 10 before any change (473 / 159 / 5 / 351 / 305).
2. **Cross-validated suite, 5-fold, with the shipped recipe:**
   - check half ≥ 430 (measured 449), tuning ≥ 410;
   - every-rule check ≥ 140;
   - hard 25 ≥ 15.
3. **Final model:**
   - corpus ≥ 410 cites / ≥ 355 every-rule;
   - bench@5 ≥ 118;
   - Necropotence 514.1, 514.2 and 514.3a all in the top 10 in **both** versions, and in the built prompt.
4. **Built prompts, all 415 corpus cases in both modes:**
   - 0 lead-ins without their list;
   - 100% of excerpts in rule order;
   - 0 doubled ids;
   - 0 references to sections absent from that mode;
   - the step summary present in Quick Lookup whenever the question names a step;
   - long-but-deciding rules (layers 613.x, combat damage 510.x) still arrive where they are deciding.
5. **Size:** report rule characters per prompt; expect about 4.9k against 7.5k today. NFR-017's package budget still passes.
6. **Latency:** time a live Quick Lookup and In-Depth answer after deploy. Per-card search adds one embedding per card; the answer budget is 30 s (Lambda 40 s).
7. **Privacy:**
   - no file under git contains practice-suite question text, answers, card lists, ids or per-question results;
   - no model weights are committed;
   - training pairs stay in the git-ignored output folder.

## Verification after merge (paid; the owner launches with `!`)

One batch, Luna answering, judge gpt-6.1-sol, rubric as in `docs/eval/answer-quality-investigation/RUNBOOK.md`, `--max-cost-usd` ≤ 15 per run:
1. Necropotence ×10 per version. Bar: Quick Lookup ≥ 9/10, against 6/12 today.
2. The hard 25 and the 18 hard corpus cases. Bar: no regression against the recorded baseline.
3. The ordinary corpus regression set. Bar: no regression.
4. Then, as separate prompt-only arms: P5 (drop "use only the provided context") and P13 (instructions as a system message).

## Current-state PRD truth to amend

- `PRD/sections/system-map/game-rules-retrieval.md`: trained model, token fixes, concept map, per-card slots, weight 0.65, turn step in the In-Depth query, model identity check.
- `PRD/sections/system-map/prompt-layout-spec.md`:
  - excerpt order and labels;
  - lead-in lists;
  - step summary in Quick Lookup;
  - rulings framing and placement;
  - per-mode reference block;
  - stack numbering;
  - pointer resolution.
- `PRD/sections/quick-lookup/README.md` and `PRD/sections/in-depth/README.md`: what each mode now receives.
- `PRD/sections/functional-requirements.md`:
  - amend REQ-178 (concept terms and turn step are allowed; raw card text still banned);
  - amend REQ-179 (parser fixes, lead-in lists);
  - amend REQ-180 (every card keyword weighted);
  - amend REQ-181 and REQ-184 (trained model, S3 source, identity check);
  - new REQs for the concept map, per-card search, prompt ordering and labels, and model training.
- `PRD/sections/non-functional-requirements.md`, NFR-017 notes: the model source moves from Hugging Face to private S3; size is unchanged.
- `PRD/sections/integrations-and-data.md`: the model artifact, its manifest and the retraining step.
- The decision log is retired, so add no new DEC.

## Constraints (don't rediscover)

- **Practice-suite data is local-only.** It lives in the git-ignored `output/practice-suite/` and is never committed. That rules out question text, answers, card lists, ids and per-question results in tests, fixtures, receipts, PR bodies or PRD. Committed text uses counts, levels and rule ids only. Its answers are community-written, so they are never ground truth under REQ-185.
- **The repository is public,** so no model weights in git. Training pairs and checkpoints stay in git-ignored folders.
- **The mock default must still work:** an unset `EMBEDDING_PROVIDER` behaves as today with no model access, and CI quality checks need no AWS access.
- **Prod embedder native chain:** prod has fallen back to lexical twice (onnx, sharp). After deploy, verify with one request plus a CloudWatch tail that the semantic path is live.
- **Eval mirrors production:** assert request inputs and abort on any silent fallback flag before a paid run.
- **The concept map is a fixed, committed table.** It is ported verbatim from the Appendix, with no added, reworded or AI-generated terms. No model call ever produces search terms at request time. A committed test asserts that every concept-term word appears in the committed rule index; on 2026-10-11 all 163 distinct words across the 82 entries do. Any change to the map is a separate, owner-reviewed edit.
- **Concept-map entries stay general,** one per common templating, never per test case. They were written from rule-book vocabulary before any result was seen. Only weights and slot counts were tuned.
- **Stemming costs three corpus cases a few ranks:** 702.3a (defender-ageless-sentinels), 113.7a (sensei-top), 615.12 (unpreventable-damage-hydra). The trained model recovers most of this, so check them.

## Appendix: concept map (port verbatim)

Card oracle text is lower-cased, curly apostrophes become `'`, and the card's own name (each face of a `//` name) becomes `~`. Every matching entry adds its terms, de-duplicated.

```js
const EVERGREEN = "(?:flying|first strike|double strike|deathtouch|haste|hexproof|indestructible|lifelink|menace|reach|trample|vigilance|defender|shroud|protection|ward|flash)";
export const CONCEPT_MAP = [
  [/at the beginning of [^.]*?upkeep/, "upkeep step triggered ability"],
  [/at the beginning of [^.]*?draw step/, "draw step triggered ability"],
  [/at the beginning of [^.]*?(?:end step|end of turn)/, "end step triggered ability"],
  [/at the beginning of [^.]*?combat/, "beginning of combat step triggered ability"],
  [/at the beginning of [^.]*?main phase/, "main phase triggered ability"],
  [/at the beginning of (?:the |your |its controller's |that player's |each player's )?next|at end of combat|at the beginning of the end step|until your next turn/, "delayed triggered ability"],
  [/cleanup step/, "cleanup step"],
  [/until end of turn|this turn/, "cleanup step until end of turn effects end"],
  [/\bskips? (?:your |their |that player's |his or her |the |each )?(?:next )?(?:[\w-]+ )?(?:step|phase|turn)/, "skip step skipped replacement effect"],
  [/extra turn|additional turn/, "extra turns"],
  [/additional (?:combat|main|beginning|end)? ?(?:phase|step)/, "additional phase combat"],
  [/(?:doesn't|don't|do not) untap|untap during/, "untap step untap"],
  [/end the turn/, "ending the turn"],
  [/maximum hand size/, "maximum hand size cleanup"],
  [/\bwhenever\b|\bwhen\b/, "triggered ability trigger event"],
  [/\bwhen(?:ever)? [^.]*?\benters\b/, "enters battlefield triggered ability"],
  [/\bwhen(?:ever)? [^.]*?(?:\bdies\b|put into a graveyard from the battlefield|leaves the battlefield)/, "leaves-the-battlefield abilities look back in time dies"],
  [/\bwhenever [^.]*?\bdiscards?\b/, "discard triggered ability"],
  [/\bdiscards?\b/, "discard hand"],
  [/\bwhenever [^.]*?\bcasts?\b/, "cast triggered ability spell"],
  [/\bwhenever [^.]*?\bdraws?\b|if [^.]*would draw/, "draw card drawing"],
  [/\bdraws? (?:a|an|two|three|x|that many|\w+) cards?/, "draw card"],
  [/\binstead\b/, "replacement effect instead"],
  [/\bif [^.]*?\bwould\b/, "replacement effect"],
  [/\bas [^.]*?\benters\b|enters (?:the battlefield )?(?:tapped|with)|enters as/, "replacement effect enters battlefield"],
  [/twice that many|double the|that much damage plus/, "replacement effect"],
  [/\bprevent\b/, "prevention effect prevent damage"],
  [/can't be prevented/, "damage prevented"],
  [/the next time/, "prevention replacement next time"],
  [/\bbecomes? (?:an? )?(?:[\w-]+ )*?(?:creature|artifact|land|enchantment|planeswalker)\b/, "type-changing effects layer continuous effect"],
  [/\bgets? [+-]\d+\/[+-]\d+|\bgets? [+-]x\/[+-]x/, "power toughness layer 7c continuous effect"],
  [/base power and toughness|power and toughness are each equal|power is equal to|toughness is equal to/, "characteristic-defining set base power toughness layer 7b"],
  [/\bswitch [^.]*power and toughness/, "switch power toughness layer 7d"],
  [/\blose all abilities|\bloses all abilities/, "ability-removing effects layer"],
  [new RegExp(`\\b(?:gains?|has|have) [^.]*?${EVERGREEN}`), "ability-adding effects layer"],
  [/gains? control|exchange control|you control enchanted/, "control-changing effects layer"],
  [/\bis (?:white|blue|black|red|green|colorless)\b|becomes? (?:the color|white|blue|black|red|green|colorless)|color of your choice/, "color-changing effects layer"],
  [/\bfor as long as|\bas long as\b/, "continuous effect duration static ability"],
  [/until [^.]*leaves the battlefield/, "duration effect leaves the battlefield"],
  [/copy target (?:instant|sorcery|spell|activated|triggered)|copy (?:it|that spell|that ability)|copies? of (?:that|target) spell/, "copy spell copying objects stack"],
  [/\bcop(?:y|ies)\b/, "copy copiable values copying objects"],
  [/face down|\bmorph\b|\bmanifest\b|\bdisguise\b|\bcloak\b/, "face-down permanents"],
  [/\btransform|daybound|nightbound/, "transform double-faced"],
  [/without paying (?:its|their|that card's|the) mana cost/, "without paying mana cost alternative cost casting"],
  [/costs? (?:\{[^}]+\})+ (?:less|more)|costs? (?:\w+ )?(?:less|more) to (?:cast|activate)/, "cost increase reduction total cost"],
  [/as an additional cost/, "additional cost"],
  [/\{x\}/, "value of x"],
  [/\b(?:cast|play) [^.]*?from (?:your |a |their |its owner's |the top of )?(?:graveyard|exile|library|hand)/, "cast from zone permission"],
  [/can't cast|can't be cast|can't play/, "casting restriction cast spells"],
  [/as a sorcery|any time you could cast a sorcery/, "sorcery timing main phase stack empty"],
  [/as though (?:it|they) had flash|any time you could cast an instant/, "timing instant flash priority"],
  [/counter target|counter that|counter it/, "countered spell counter"],
  [/can't be countered/, "countered"],
  [/choose (?:one|two|three|one or more|one or both|any number)/, "modal spell modes"],
  [/spend (?:this )?mana|as though it were mana|mana of any type/, "spend mana"],
  [/\badd (?:\{|one|two|three|x |that much|an amount)/, "mana ability mana pool"],
  [/\{t\}(?:,|:)/, "tap symbol activated ability summoning sickness"],
  [/activate (?:only|this ability only)/, "activated ability restriction"],
  [/\bpay (?:\d+|x|that much|half) life/, "pay life cost"],
  [/can't block|can't be blocked|can block only|blocked except|can't attack/, "blocking restrictions attack restrictions"],
  [/attacks? each (?:combat|turn) if able|must be blocked|blocks each (?:combat|turn) if able/, "attack block requirements"],
  [/deals combat damage to (?:a player|an opponent|a planeswalker|one or more)/, "combat damage step triggered ability"],
  [/becomes blocked|\bblocks\b/, "declare blockers step blocked creature"],
  [/remove [^.]*from combat/, "removed from combat"],
  [/return [^.]*to the battlefield|exile [^.]*then return/, "zone change new object"],
  [/exile [^.]*until/, "exiled until linked ability duration"],
  [/\bshuffle/, "shuffle library"],
  [/search (?:your|their|target player's|its owner's) library/, "search library"],
  [/create [^.]*\btokens?\b/, "token create"],
  [/[+-]1\/[+-]1 counters?/, "+1/+1 counters -1/-1 counters state-based action"],
  [/\bcounters? on\b|\bput (?:a|an|one|two|three|x|that many) [\w/+-]+ counters?/, "counters placed"],
  [/lethal damage|damage marked|damage dealt to it this turn/, "lethal damage marked state-based action"],
  [/\bregenerate/, "regeneration shield"],
  [/can't lose the game|win the game|loses? the game/, "losing the game winning state-based action"],
  [/\bloyalty\b/, "loyalty abilities planeswalker"],
  [/lore counter|\bchapter\b/, "saga lore counters chapter"],
  [/play (?:an additional|additional|two additional) lands?|play lands? from/, "play land special action"]
];
export const TYPE_MAP = [
  [/\blegendary\b/, "legend rule"],
  [/\baura\b/, "aura attached enchant state-based action"],
  [/\bequipment\b/, "equipment attached equip"],
  [/\bsaga\b/, "saga lore counters chapter"],
  [/\bplaneswalker\b/, "loyalty abilities planeswalker"]
];
```
