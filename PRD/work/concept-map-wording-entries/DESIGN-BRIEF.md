# Design brief — six card-wording entries for rule search

**Ask: Decide.** Two gate questions in `GATE-QUESTIONS.md`: REQ-234 (the six new entries, a clean-up of the type-setting entry, and the rule for what words an entry may use) and REQ-236 (ship a retrained search model and re-check the rules once per retrain). Before the build starts, the owner also supplies two local files the measurements need (see "Before the build").

## What the player gets

A player asks about a card that says "whenever", "rather than pay its mana cost", "gain control of", "gets −2/−2", "Sacrifice this creature:" or "Choose two —". Today Luna often does not get the rule that decides that kind of question, because the card's wording does not look like the rule book's wording. After this change she gets them more often: triggered abilities (rule 603), alternative costs (118.9), layers (613), the toughness and lethal-damage checks (704.5f/g), activated-ability costs (602) and casting (601).

How it works, in one sentence: before searching the rule book, the app reads each card's text through a fixed list of patterns, the concept map (REQ-234), and adds rule-book words for every pattern that matches. Six new patterns add six new sets of rule-book words. No AI writes search words at request time; the map is a committed table.

The rule-search model (REQ-236: a small model trained on Magic rules questions that ranks rules by meaning) learned from queries the map builds, so it is retrained once after the map changes.

## Measured gain (the probe's, cited, not re-derived here)

From `intake/GRAPH-BRIEF.md`, measured 2026-10-12 by 5-fold cross-validation on the local practice suite (every question scored by a model that never trained on it), query side only, on model `rule-search-d2c2e500a4c6`. Counts only.

| | check half | tuning half | every-rule check / tuning | hard 25 | corpus citations / every-rule cases | bench@5 | rule characters per practice question |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Today | 522 | 511 | 175 / 166 | 21 | 442 / 377 | 130 | 7,478 |
| With the six | 536 (+14) | 522 (+11) | 177 / 171 | 22 | 444 / 377 | 130 | 7,524 |

"Check half" and "tuning half" are the two fixed halves of the practice suite; a "citation" is a deciding rule that reaches the prompt. Bench@5 is the 156-question benchmark with three unrelated cards attached, top-five hits. Nothing drops. The probe also reports the 14 labelled search checks and the built-prompt checks pass with the six on.

## Current state checked at define (2026-10-12, worktree at `0135580e`)

Current state wins where it differs from the intake.

| Intake says | Current state | Agrees? |
| --- | --- | --- |
| 78 oracle-text entries, 5 type-line entries | `CONCEPT_MAP` 78, `TYPE_MAP` 5; `gameRulesConceptMap.test.ts` passes (25 tests) pinning 78 + 5 | yes |
| 163 distinct term words; 165 with the six | test pins 163; a define-time count of the six terms over today's words gives 165 (new words: `handling`, `interaction`) | yes |
| Model `rule-search-d2c2e500a4c6` | REQ-236's build note, `embeddingModel.manifest.json`, and all five vector files name it | yes |
| Baseline 522 / 511 / 175 / 21, corpus 442 / 377, bench@5 130 | REQ-236's build note records exactly these | yes |
| Run after the follow-ups build (PR #297) | #297 is merged. It changed only which question a follow-up searches with (the opening question, REQ-246); a single question builds the same query as before (`retrievalInputFromPromptContext` and `selectGameRulesTopics` gained a parameter that defaults to the question). It did not touch the concept map, the scorer, the training export or the model | yes — #297 cannot move the probe's numbers |
| Card matches 15,360 / 148 / 968 / 491 / 1,017 / 1,023 | re-counted at define over the committed card data with name replacement: 15,360 / 148 / 968 / 491 / 1,018 / 1,023; type-setting 372 | yes (one card apart on sacrifice, from the name source) |
| "Like the type-setting entry's 7 / 7" tests | the type-setting entry has 6 match and 11 non-match tests | no — the build copies the real shape: at least 6 match and 6 non-match tests per entry |
| Re-check the six "on the then-current model's folds" | those five fold models no longer exist locally (not in the launch checkout, the worktrees or `TheJudge-backups`); PR #293's cleanup removed them | no — the build retrains baseline folds first (step 2) |
| Not mentioned | five of the six terms carry In-Depth topic trigger words, so In-Depth adds some curated topics for these cards (side effects, below) | new — surfaced in the REQ-234 gate block |
| Not mentioned | the scorer and the training export read two git-ignored files, `output/rule-search-eval/split.json` (the fixed tuning/check split) and `output/rule-search-eval/hard25.json` (the hard-25 list). Neither exists in any local place searched at define | new — see "Before the build" |

## Scope

1. **Six concept-map entries**, patterns and terms exactly as the intake measured them:

   | # | Card wording | Pattern | Term | Term source |
   | --- | --- | --- | --- | --- |
   | 79 | triggered abilities | `/(?<!\([^)]*)(?:\bwhenever\b\|\bwhen\b\|\bat the beginning of\b)/` | `handling triggered abilities` | rule 603's section title |
   | 80 | alternative cost | `/rather than pay(?:ing)? [^.]*?mana cost/` | `alternative cost casting` | an existing entry's words |
   | 81 | layer wording | `/(?<!\([^)]*)(?:\bbecomes? (?:an? )?(?:(?!(?:blocked\|target\|the target\|tapped\|untapped\|day\|night\|equal)\b)[\w-]+ )*?(?:creature\|artifact\|land\|enchantment\|planeswalker)\b\|gains? control\|exchange control\|\blose all abilities\|\bloses all abilities\|in addition to (?:its\|their) other)/` | `interaction of continuous effects` | rule 613's section title |
   | 82 | −N/−N | `/(?<!\([^)]*)\bgets? -(?:\d+\|x)\/-(?:[1-9]\d*\|x)\b/` | `toughness state-based action` | existing entries' words |
   | 83 | sacrifice as a cost | `/(?:^\|\n)[^"\n:]*\bsacrifice (?:~\|this (?:creature\|artifact\|enchantment\|permanent\|land))[^"\n:]*:/` | `activated ability cost` | existing entries' words |
   | 84 | casting choices | `/as an additional cost to cast\|(?:^\|\n)choose (?:one\|two\|three\|one or more\|one or both\|any number)\b\|rather than pay(?:ing)? [^.]*?mana cost/` | `casting spells` | rule 601's section title |

   (`\|` above is a table escape; the source uses a bare `|`.) Section titles verified at define in `gameRulesRuleIndex.json`: 601 "Casting Spells", 603 "Handling Triggered Abilities", 613 "Interaction of Continuous Effects".
2. **Layer-entry tweak (intake step 3).** Add `attached` to entry 81's skipped words so "becomes attached to a creature" (Equipment and Auras; 8 of 968 matches by a define-time count, the probe said about 12) stops matching. Keep it only if its one-entry re-measure drops no figure.
3. **Type-setting narrowing (PR #293 review finding m-1).** The 78th entry also skips `except` wording ("except the copy is an artifact", "except their power is half that creature's power") and wording whose subject is a counter, not a permanent (Un-card text such as "each +1/+1 counter on a creature you control is also a Food"). Re-measure that entry; keep the narrowing only if no figure drops.
4. **Tests.** Match and non-match tests for each new entry (at least 6 of each, the type-setting entry's shape), the narrowed type-setting cases added to its non-match list, and the three pinned numbers updated: 78 → 84 entries, 163 → 165 words over 83 → 89 entries, and the Ephemeral Hydra upkeep example also gets `handling triggered abilities`.
5. **File header (m-2).** `gameRulesConceptMap.ts`'s header stops saying every entry was ported verbatim: 77 ported, the 78th and 79th–84th owner-reviewed additions.
6. **Retrain (REQ-236)** after the map change, with the unchanged recipe: re-export training pairs from the shipped query builder, train the five fold models and the 100% model, rebuild every vector file that names the model id, re-baseline the rules gate once.
7. **Re-record saved example prompts** (eval goldens) that change, and review each diff.
8. **Numbers (m-3, m-4, m-5).** Record rule characters per prompt for the new model and backfill the previous model's (7,478 practice, 4,412 corpus, from PR #293's build log as recorded in its receipt); report built-prompt corpus sizes from the built-prompt check in the PR body; re-run the leak check (`scripts/leak-check.mjs`) on the retrained model.

## Non-goals

- No change to the other 77 entries, the type-line entries, retrieval caps, weights, the prompt layout or the training recipe.
- Mana value (rule 202) is out: measured with the triggered-abilities entry it dropped bench@5 to 129. It stays in the probe.
- No new REQ. No new In-Depth trigger words, no new curated topics.
- Nothing uploads, deploys or spends. The owner uploads the model.

## Side effects the owner should know

- **In-Depth curated topics.** REQ-242 picks In-Depth's curated rule topics when a card's concept terms share a word with a topic's trigger words. Checked at define by running the new terms through the shipped trigger table: `alternative cost casting` and `casting spells` select the "spell-casting choices" and "spell-casting costs" topics; `activated ability cost` selects "spell-casting costs"; `interaction of continuous effects` selects "layers order" and "layer timestamps and dependencies"; `toughness state-based action` selects "layers power and toughness"; `handling triggered abilities` selects none. For many of these cards an existing entry already selects the same topic (for example −N/−N wording already brings the layers topics). This is the designed path (REQ-234 already says concept terms feed REQ-242), so REQ-242's text does not change; the build measures and records how many corpus cases gain a topic.
- **Quick Lookup step summaries (REQ-238)** are unchanged: none of the six terms names a turn step (checked at define with `namedTurnSteps`).
- **Prompt size.** The probe measured System 3 rule text per practice question 7,478 → 7,524 characters (+0.6%). In-Depth topic additions are on top; the build records them.
- **Breadth of entry 79.** It matches 15,360 cards, about 40% of all cards, adding `handling triggered abilities` to most creature questions. The probe measured it as the largest single gain (+5 check half, +1 hard 25), and it is the entry that, combined with mana value, cost a bench@5 point.

## Before the build (owner)

1. **Supply `split.json` and `hard25.json`.** The scorer reads the fixed tuning/check split from `output/rule-search-eval/split.json` and the hard-25 list from `output/rule-search-eval/hard25.json`; the training export reads `hard25.json` too. Both are git-ignored and were not found at define in the launch checkout, `.worktrees/probe-pft`, or `TheJudge-backups`. Without `split.json` the split silently falls back to a hash of today's renamed ids, which is a different split than the one REQ-236's numbers were taken on; without `hard25.json` the hard-25 figure is empty. Put both files under the launch checkout's `output/rule-search-eval/`, or tell the build where they are. If the build cannot find them, it parks at step 1 rather than score on a different split.
2. Nothing else. The practice suite stays where it is, in the launch checkout's `output/practice-suite/`.

## Build steps and stop conditions

Every measurement is local and free. Every committed file carries counts only.

1. **Preconditions.** Find `split.json` and `hard25.json` (above); copy them read-only into the build worktree's `output/rule-search-eval/`. Park if missing. Set up the pinned Python toolchain in `output/rule-search-model/venv` per `scripts/train-rule-search-model.py`'s header (a one-time package download; the base model comes from the local Hugging Face cache or downloads once; no spend).
2. **Baseline folds.** On unchanged `main` code, export training pairs (`node scripts/export-rule-search-training.mjs --suite /Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`) and train the five fold models with the unchanged recipe. Score with `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv`. Record the result against REQ-236's figures (522 / 511 / 175 / 21, 442 / 377, 130). If any of check half, tuning half or corpus citations differs by more than 5, park: the split, the hard-25 list or the recipe is not the one REQ-236 measured.
3. **Set re-check.** With the measurement harness on (below), turn on the six and score the same baseline folds. Bar: check half up; no other figure (tuning, every-rule check and tuning, hard 25, corpus citations and every-rule cases, bench@5) down; 14 of 14 labelled checks; built-prompt checks pass.
4. **If the set misses the bar:** measure each entry alone and park for the owner with the numbers. Never drop or narrow an entry without the owner. If entry 79 is the cause, the probe's narrowing lead is "dies / leaves the battlefield" triggers → 603.10, and two or more trigger sources → 603.3b (cited from the probe's handoff file, not opened here).
5. **One-entry re-measures** on the same folds: the `attached` tweak to entry 81, and the type-setting narrowing (m-1). Keep each only if no figure drops; report each either way.
6. **Land the map change**: entries, tests, header (m-2), re-recorded goldens.
7. **Retrain** (step 6 of Scope). Acceptance: REQ-236's floors (check ≥ 430, tuning ≥ 410, every-rule check ≥ 140, hard 25 ≥ 15; 100% model corpus ≥ 410 and ≥ 355, bench@5 ≥ 118, Necropotence rules in the top ten in both modes); 14 of 14 labelled checks; benchmark recall@5 floors. **Park** if the retrained check half falls below today's 522, so the shipped search is never left worse than today; report any other figure that falls below the previous model's.
8. **Rebuild every vector file** that names the model id, update the manifest and `docs/aws/model-upload.md`, re-baseline the rules gate once with `npm run eval:rules-gate:baseline -- --allow-regressions`, list every lost hit by case and rule in the PR body and the receipt. Park if the total of deciding rules reaching the prompts falls.
9. **Numbers and checks**: m-3, m-4, m-5 (Scope 8); In-Depth topic additions on the corpus; `inDepthTopicGuard.test.ts` still at or above REQ-242's 17 of 30; `npm run quality:check`, `npm test`, `node scripts/privacy-scan.mjs`.

Each slice ends green (`npm run quality:check` and `npm test`). The rules gate runs inside `npm test` against the committed vectors, so if the map change alone fails it on the current model, the map change and the retrain land in one slice and the single re-baseline follows the retrain.

## Where every deliverable lands

Nothing the build keeps lives under `PRD/work/`, which close deletes.

| Deliverable | Lands in |
| --- | --- |
| Six entries, `attached` tweak if kept, type-setting narrowing if kept, header | `apps/backend/src/gameRulesConceptMap.ts` |
| Entry tests and updated pins | `apps/backend/src/gameRulesConceptMap.test.ts` |
| Re-recorded example prompts | `apps/backend/src/eval/fixtures/*.golden.*` (re-record with `UPDATE_CONTEXT_EVAL_FIXTURES=1`, per that folder's README) |
| New model identity | `apps/backend/data/embeddingModel.manifest.json` |
| Rebuilt vectors | `apps/backend/data/gameRulesRuleEmbeddings.json`, `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`, `apps/backend/src/eval/frozen-card-vectors.json`, `apps/backend/src/eval/rules-gate/frozen-query-vectors.json`, `apps/backend/src/prompt/preparation.crossReferenceQueryEmbedding.json` (`embeddingModel.test.ts` pins all five to the manifest's id) |
| Rules-gate re-baseline | `apps/backend/src/eval/rules-gate/baseline.json` |
| Upload instructions | `docs/aws/model-upload.md` (new id and size) |
| Product truth | REQ-234 and REQ-236 in `PRD/sections/functional-requirements.md`, applied by intent at build from `GATE-QUESTIONS.md` |
| Measured numbers | REQ-234 and REQ-236 notes; PR body (lost hits, built-prompt sizes, upload step); the receipt under `PRD/instructions/receipts/` |
| Model weights, training pairs, fold models, per-question results | git-ignored only: `output/rule-search-model/`, `output/rule-search-eval/`; the upload copy is staged by `scripts/package-embedding-model.mjs` under `output/rule-search-model/upload/<id>` |
| Measurement harness | never committed (below) |

## How the build reaches the measurement harness

The probe's harness is a patch that lets an environment variable (`CONCEPT_CANDIDATES=NAME,NAME`) switch candidate entries on. It lives untracked in the launch checkout only, at `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch` (cited, not opened at define). The six candidate names, in table order, are `TRIGGER_HANDLING_R`, `ALT_COST`, `LAYER_TITLE_D`, `MINUS_TOUGHNESS_R`, `SAC_SELF_COST`, `CASTING_TITLE_R`.

The build reads the patch by that absolute path and applies it to its own worktree with `git apply` (read-only on the launch checkout; never copied into `PRD/work/`). It is reverted with `git checkout` on the touched files before any commit, and a pre-commit `git diff --stat` confirms it is gone. If the patch is missing or no longer applies, the build makes the same switch by hand as a temporary local edit from the six patterns above (they are in `intake/GRAPH-BRIEF.md` and this brief), with the same never-commit rule. The other probe files are citations only: `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-proposals.md` (per-entry write-up, also posted on PR #293) and `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/HANDOFF.md` (mana value and the narrowing lead).

The previous model's weights, if a step needs them, are in the launch checkout's git-ignored `apps/backend/data/models/rule-search-d2c2e500a4c6/`; the build copies them read-only into its worktree's same folder.

## Assumptions (conservative ladder, `preparation-contract.md`)

| # | Assumption | Evidence | Ladder rung |
| --- | --- | --- | --- |
| A1 | The six patterns and terms ship exactly as measured; the owner's review of them is the REQ-234 gate slot, not the intake's statement that he approved them on 2026-10-12 | REQ-234: "any change to the map is a separate, owner-reviewed edit"; intake is evidence, never authority | 1 |
| A2 | A new term may be words existing entries already use or a rule-book section title copied word for word; this is written into REQ-234 because three of the six add words (`handling`, `interaction`) that today's "no added terms" line forbids | REQ-234 constraint text; define-time word count | 1 |
| A3 | PR #297 does not change single-question search, so the probe's numbers still describe today's search | code diff of #297 (default parameters) | 2 |
| A4 | Retraining baseline folds with the unchanged recipe reproduces REQ-236's numbers closely enough to re-check the set; more than 5 citations off on a main figure means the inputs differ, so the build parks | REQ-236 recipe (seed 13); fold models gone | 4 |
| A5 | The retrained model must not score below today's 522 check-half citations | REQ-236's previous retrain fell 8 after an entry was added; never leave the shipped search worse (preserve behavior) | 5 |
| A6 | REQ-242's In-Depth topic selection by concept terms is designed behavior; new topic picks are recorded, not blocked | REQ-234 "concept terms also feed … In-Depth curated-topic choice (REQ-242)" | 1 |
| A7 | The m-1 narrowing covers `except` wording and counter-subject wording only; the build does not widen it | PR #293 receipt m-1; define-time scan of type-setting matches | 4 |
| A8 | The rules-gate re-baseline becomes a once-per-retrain rule rather than a one-time line | intake; REQ-236's criterion names only "this change" | 1, proposed at the gate |

## Product truth proposed

Two amended IDs, no new ID, two gate slots. Full diffs in `GATE-QUESTIONS.md`.

- **REQ-234** — 84 entries; the six entries described; the type-setting narrowing; the term rule; match/non-match tests for every added entry; intake and build notes (including the In-Depth topic effect).
- **REQ-236** — the rules gate is re-baselined once per retrain; the previous model's rule-character figures backfilled; a build note for the new model's numbers, leak check and built-prompt sizes.

Line-level enumeration of every `PRD/sections/` passage the change touches: `evidence/amendment-grep.md` (75 hits; 5 amended, 70 no change).

## Privacy

Practice-suite counts only, in every committed file, PR body and comment: no question, answer, card list, id or per-question result, and never the suite's source name. `node scripts/privacy-scan.mjs` before every commit.

## Suggested slices (map-out decides)

- **A — Measure.** Preconditions, baseline folds, set re-check, the two one-entry re-measures. No committed code; numbers carried to the REQ notes and PR body.
- **B — Map change.** Entries, tests, narrowing, header, goldens, REQ-234 applied.
- **C — Retrain.** Re-export, train, vectors, manifest, upload doc, single re-baseline, REQ-236 applied, m-3/m-4/m-5.

Merge B and C if the map change alone fails the rules gate on the current model.
