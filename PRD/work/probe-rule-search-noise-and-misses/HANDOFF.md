# Handoff: rule search after the six concept-map entries (2026-10-13)

## Start here

**The open decision:** what to do with PR #302 (six new card-wording entries plus a retrained search model). The recommendation is to keep the six entries but ship them on today's search model, `rule-search-d2c2e500a4c6`, without the retrain. Retraining erases the entries' gain.

**What a player gets:** when a card says "whenever", "rather than pay its mana cost", "gain control of", "gets −2/−2", "Sacrifice this creature:" or "Choose two —", rule search also looks for the rule-book chapter that decides that kind of question: triggered abilities (603), alternative costs (118.9), layers (613), toughness and lethal damage (704.5f/g), activated-ability costs (602), and casting (601). More of the rules that decide the answer reach Luna's prompt.

**The bigger question the owner asked:** can search be trained to always pull the right rules? No, not by training alone. Measured answer below, under "What is left to win".

The detailed numbers and method are in `PROBE.md` next to this file. This file is the map: what happened, where everything is, and what to do next.

## Terms

- **Deciding rule:** a rule the practice-suite question or corpus case cites as deciding the answer.
- **Citation reached:** a deciding rule appears in the up-to-15 rule passages search hands Luna (plus keyword sets).
- **Practice suite:** the owner's local set of 1,181 scoreable questions, split into a fixed **check half** and **tuning half**. Local only, never committed; committed files carry counts only.
- **Corpus:** the 415 committed test cases. **Bench@5:** a 156-question benchmark with three unrelated cards attached; counts top-five hits.
- **Every-rule:** questions where every deciding rule reached the prompt. **Hard 25:** 25 hard questions carrying 59 deciding rules.
- **Fold models / cross-validation (CV):** five models, each scoring only questions it never trained on. **Seed:** a training run's random starting point.
- **Query side only:** the same model, with only the search words changed. A paired comparison, so no training noise enters it.

## What happened, in order

1. **Spec approved.** Docs PR #300 merged: REQ-234 (concept map grows to 84 entries, a written rule for what words an entry may use, and the owner's edit to record In-Depth curated-topic characters) and REQ-236 (retrain plus one rules-gate re-baseline per retrain).
2. **Build stop 1: the baseline didn't reproduce.** The fresh retrain of today's map scored check 539 / tuning 529, against REQ-236's recorded 522 / 511 (tolerance 5). Diagnosis: training on the Mac GPU (MPS) isn't repeatable even with seed 13; the inputs were unchanged and there was no leakage. The owner adopted the fresh folds as the baseline.
3. **Guardrail fix.** The boundary hook's new rule (from #298) blocked the driver's own run-state and lock files after a build node. Fixed in **#301 (merged)**. A second trap remains: `denied-command-retry` keys a file write on its path alone, so a stale denial blocked the run ID. Recovered by releasing the lock and re-taking it under a new run ID.
4. **Build stop 2: the six missed a strict bar by one question.** Query side, on the adopted folds: check +19, tuning +7, corpus +3, but every-rule check −3 (whole suite +2), hard 25 −1 and bench@5 −1. The bench point is entry 79's (triggered abilities): "whenever" is on about 40% of cards, so unrelated benchmark cards pull in its rules. The owner shipped as measured.
5. **Build finished: PR #302 is open.** Review passed on the second loop, after two missing figures were added to the REQ notes. CI is green. Receipt: `PRD/instructions/receipts/concept-map-wording-entries-2026-10-13.md` (on the PR branch). New model: `rule-search-adfcdcb59aef`. After the retrain, the gain mostly vanished: check 538 against the 539 baseline.
6. **Overnight probe.** Retrain noise, winners and losers, and remaining misses. Findings below; the full write-up is `PROBE.md`.

## Key numbers (counts only)

Figures are check / tuning, every-rule check / tuning, hard 25 (of 59), corpus citations / cases, bench@5.

| Arm | Figures |
| --- | --- |
| Recorded 2026-10-12 (REQ-236, earlier training run) | 522 / 511, 175 / 166, 21, 442 / 377, 130 |
| Baseline map, retrained, mean of seeds 13–15 (min–max) | 545.3 (539–549) / 525.7 (521–529), 181.7 / 170.7, 21.3, 440.0 / 372.3, 129.3 |
| Six entries, query side only, mean of 3 models | 553.7 (550–558) / 535.3 (533–537), 180.7 / 174.7, 20.7, 441.7 / 373.3, 128.3 |
| Six entries, retrained, mean of seeds 13–15 | 546.7 (538–552) / 524.3 (523–525), 179.3 / 171.3, 21.3, 440.0 / 371.7, 128.3 |
| PR #302 shipped model, 100% trained | corpus 471 / 392 (previous 472 / 395), bench@5 128 (previous 126), q8 median about 2.6–2.7 ms, 23.0 MB |
| PR #302 rules gate (deciding rules reaching prompts) | 472 → 473, 6 hits lost and 7 gained (listed in the PR body) |

**What the noise means:**
- One retrain swings check by about 10 citations, so a single retrain can't detect a gain under about 15.
- The six entries gain on every model tested on the query side: +26, +16 and +12 citations.
- Retrained, the six-entry arm and the baseline arm both average 1,071 suite citations.

**Where the six help and hurt** (query side, three seeds summed):
- **Gains:** rule 603 +47 / −0, 613 +23, 118 +6, 702 +11.
- **Losses:** 704 −7, general 6xx −12, card types −6, combat −5.
- **Why retraining cancels it:** trigger words are in about 60% of training queries, so the model learns to ignore them. Trigger rules in the top 15 per question: 0.95 today, 1.43 with the entries, 1.01 after the retrain.
- **On every seed:** gains 118.9, 603.10 ×3, 603.12, 603.2c, 603.3b, 613.1, 613.1d, 613.1f and 613.8b; losses 305.7, 704.3 and 704.5a.

## What is left to win

About 1,460 deciding rules are still missed. Half rank below 100th: general principles the card text never names, such as 107.2 and 110.2.

| Lever | Measured misses recovered | Passages Luna reads per question (today 16.5) |
| --- | --- | --- |
| No cut-off, cap 30 | about 285 | 33.2 |
| Cap 30 | about 245 | 26.9 |
| No cut-off, cap 20 | 126–135 | 23.3 |
| Cut-off 0.5, cap 20 | 118–130 | 21.6 |
| Cap 20 | 104–115 | 20.2 |
| Six entries on today's model | 19 | no change |
| Cut-off only, at cap 15 | 8–12 | about the same |
| Training on rules the model never saw | about 0 | — |

- These count citations reaching the prompt, not better answers. An earlier paid answer check found answers flat from cap 10 to cap 15, so any cap change needs an answer check before it ships.
- About 8% of sampled misses are doubtful practice-suite labels.
- About 640 misses sit below rank 100 and under the cut-off, beyond any cap. Only curated topics, or Luna's own rules knowledge, reach those.

## Options for PR #302

1. **Amend: keep the entries, drop the retrain (recommended).**
   - Revert the model ID, the five vector files and the manifest to `rule-search-d2c2e500a4c6`.
   - Re-freeze the changed query vectors with that model. In the build, the map change alone failed `npm test` only because changed queries had no frozen vectors yet, so they fell back to words only, which pushed one built prompt over its size bound (8,552 against 7,500).
   - Re-baseline the rules gate once.
   - Re-check the 100% model with the entries (Necropotence ranks, labelled checks, benchmark floors).
   - Amend REQ-236's text: no retrain for this change, and why. That's a product-truth change, so the owner approves the wording.
   - Remove the upload step from `docs/aws/model-upload.md`, the PR body and the receipt.
2. **Merge as is.** Safe (CI green, every gate passed) but no measured gain. The owner must upload `output/rule-search-model/upload/rule-search-adfcdcb59aef` (in the implement worktree) per `docs/aws/model-upload.md` before merging, or the next deploy can't fetch the model.
3. **Close #302** and keep only the measurements.

## Where everything is

| Thing | Location |
| --- | --- |
| Code PR | https://github.com/ChrisMiho/TheJudge/pull/302, branch `thejudge-auto/concept-map-wording-entries-work` |
| Build worktree (PR branch; models, venv, logs under git-ignored `output/`) | `.worktrees/implement-concept-map-wording-entries` |
| Fold models there | `output/rule-search-model/onnx/F-fold0..4` (baseline, seed 13), `R-fold0..4` and `R-foldall` (six entries, retrained), upload copy `output/rule-search-model/upload/rule-search-adfcdcb59aef` |
| Per-question results there | `output/rule-search-eval/percase-cv-baseline.json`, `percase-cv-set.json`, `percase-cv-retrained.json`, plus `*.log` for every scoring run |
| Probe branch and worktree | `probe/rule-search-noise-and-misses`, `.worktrees/probe-rule-search-noise` (`PROBE.md` and this file are committed; nothing else is) |
| Probe models and detail (git-ignored) | probe worktree `output/rule-search-model/onnx/B14-*`, `B15-*` (baseline seeds 14, 15), `S14-*`, `S15-*` (six entries, seeds 14, 15); `output/rule-search-eval/deep/` (per-question detail, nine runs), `analysis.txt`, `tables.md`, `misses-table.md` |
| Probe scripts | probe worktree `.tmp/`: `deep-score.mjs`, `analyze.py`, `levers.py`, `noise.py`, `misses_table.py`, `sample-misses.py`, and `patched-*/gameRulesRetrieval.ts` (exposes the full ranking and a cut-off setting; reproduces production at shipped settings) |
| Spec and brief (until #302 merges) | `PRD/work/concept-map-wording-entries/` on `main` |
| Product truth | REQ-234, REQ-236 in `PRD/sections/functional-requirements.md` (amended on the PR branch) |
| Earlier probe, harness patch | `PRD/work/probe-concept-map-wording/` (untracked, launch checkout), including `concept-map-candidates.patch` (`CONCEPT_CANDIDATES=NAME,...` switches candidate entries on) |
| Split and hard-25 files | `output/rule-search-eval/split.json`, `hard25.json` in the launch checkout (rebuilt from `.worktrees/probe-pft`) |
| Practice suite | `output/practice-suite/` in the launch checkout (local only) |

## Lessons for the next session

- **Judge search changes on a fixed model, or average at least three seeds.** Never trust one retrain.
- **Training commands:** `output/rule-search-model/venv/bin/python -I scripts/train-rule-search-model.py --cv --export --seed <n> --data-dir <abs> --work-dir <abs> --hf-home <abs>`. Score with `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv --fold-prefix <prefix>` from the checkout whose code matches the arm. About 30 minutes per fold set on MPS; run sets one at a time.
- **Copy git-ignored inputs into a fresh worktree** (`apps/backend/data/models/`, `split.json`, `hard25.json`), or local scoring silently falls back to words only.
- **Wait for long jobs with `run_in_background` notifications.** A shell loop like `while pgrep -f train-rule-search-model.py` matches its own command line and never ends; four of these were left running overnight and had to be killed.
- **Guardrail follow-up, not yet done:** `build-write-outside-worktree` depends on the current node, so like `run-lock-removal` it arguably belongs in `REMEDIABLE_RULES` in `scripts/lib/boundary-rules.mjs`.
- **Privacy:** never write practice-suite questions, answers, card lists, IDs or per-question results into committed files, and never the suite's source name. Run `node scripts/privacy-scan.mjs` before committing.

## Suggested next steps

1. Decide PR #302 (the options above). The recommendation is option 1.
2. If cap 20 looks worth it, design an answer check first. Measure whether Luna's answers improve, not only citations, against the earlier finding that answers were flat from cap 10 to cap 15.
3. Look at the roughly 640 deep misses by rule (107.x, 110.x and similar general principles): curated topics could carry them.
4. Review the doubtful practice-suite labels (about 8% of sampled misses) so scores stop counting them as misses.
5. After #302 merges or closes: run `npm run graph:prune` to clear the implement worktree and branches. Then remove `.worktrees/probe-pft`, `PRD/work/probe-concept-map-wording/` and this probe worktree once their data is no longer needed.

A fresh session can start with: "Read `PRD/work/probe-rule-search-noise-and-misses/HANDOFF.md` and `PROBE.md`, then help me decide PR #302."
