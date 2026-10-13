# Slice A — Measure

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

## Status: done

### Handoff (attempt 3): steps 5 and 6 (counts only)

Same adopted baseline folds, local embedder, six entries on in every row. The set was re-scored once more and reproduced exactly (558 / 536 / 182 / 176 / 19 / 441 / 374 / 127); its per-question file is saved git-ignored as `output/rule-search-eval/percase-cv-set.json`.

| Run | check | tuning | every-rule | hard 25 | corpus | bench@5 |
|---|---|---|---|---|---|---|
| The six (set), accepted | 558 | 536 | 182 / 176 | 19 | 441 / 374 | 127 |
| Set + `attached` skipped in entry 81 | 558 | 536 | 182 / 176 | 19 | 441 / 374 | 127 |
| Set + type-setting narrowing (m-1: skip `except` wording and counter-subject wording) | 558 | 536 | 182 / 176 | 19 | 441 / 374 | 127 |

No figure drops for either tweak, so keep both (slice B applies them). The narrowing moves rule characters per practice question 7,205 to 7,204 (it fires). Harness reverted with `git checkout`; `git diff --stat` empty. The 14 labelled checks and built-prompt checks run in slices B and C against the committed code and vectors. Raw logs: git-ignored `output/rule-search-eval/set-cv2.log`, `tweak-attached-cv.log`, `tweak-typesetting-cv.log`.

Owner decision 2026-10-13 (step 4 park): ship the six entries as measured, unchanged. The set result below (check 558, tuning 536, every-rule 182 / 176, hard 25 19, corpus 441 / 374, bench@5 127) is accepted; do not narrow or drop any entry. Resume at step 5 (the two one-entry re-measures against the same baseline folds), then step 6, then slices B and C. Slice C's step 7 and step 8 retrain parks still bind.

### Handoff (attempt 2): step 3 and step 4 numbers (counts only)

Same adopted baseline folds (F-fold0..4), local embedder, harness patch applied then reverted (`git diff --stat` empty). Order: check / tuning, every-rule check / tuning, hard 25 (of 59), corpus citations / every-rule cases, bench@5 (of 156).

| Run | check | tuning | every-rule | hard 25 | corpus | bench@5 |
|---|---|---|---|---|---|---|
| Baseline | 539 | 529 | 185 / 171 | 20 | 438 / 372 | 128 |
| The six (set) | 558 (+19) | 536 (+7) | 182 (-3) / 176 (+5) | 19 (-1) | 441 (+3) / 374 (+2) | 127 (-1) |
| 79 triggered alone | 553 (+14) | 532 (+3) | 184 (-1) / 174 (+3) | 20 | 438 / 372 | 127 (-1) |
| 80 alternative cost alone | 540 (+1) | 528 (-1) | 185 / 171 | 20 | 438 / 372 | 128 |
| 81 layer wording alone | 542 (+3) | 531 (+2) | 182 (-3) / 174 (+3) | 20 | 441 (+3) / 374 (+2) | 128 |
| 82 -N/-N alone | 540 (+1) | 529 | 185 / 171 | 20 | 438 / 372 | 128 |
| 83 sacrifice cost alone | 538 (-1) | 528 (-1) | 184 (-1) / 171 | 20 | 438 / 372 | 128 |
| 84 casting choices alone | 540 (+1) | 530 (+1) | 185 / 171 | 20 | 438 / 372 | 128 |

Check half rises (+19), but three other figures fall on the set: every-rule check -3, hard 25 -1, bench@5 -1. Entry 79 alone costs one bench@5 point and one every-rule check; entry 81 alone costs three every-rule check; entries 80 and 83 each lose one tuning citation alone. The probe measured the set without any drop on its own baseline (522 / 511 / 175 / 166 / 21 / 442 / 377 / 130), so the adopted folds differ in detail from the probe's. Brief step 4 fires: park for the owner. Nothing dropped or narrowed. Steps 5 and 6 (one-entry `attached` and type-setting re-measures) were not run. The 14 labelled checks and built-prompt checks were not run (the bar already fails). Raw logs: git-ignored `output/rule-search-eval/set-cv.log`, `alone-*.log`, `baseline-cv.keep.log`.

Owner choices: accept the set as is (every-rule check -3, hard 25 -1, bench@5 -1 against +19 check half), or apply the probe's narrowing lead on entry 79 ("dies / leaves the battlefield" -> 603.10, two or more trigger sources -> 603.3b) and entry 81, then re-measure.

Owner decision 2026-10-13: the step 2 park is resolved. The fresh fold models `output/rule-search-model/onnx/F-fold0..4` (check 539 / tuning 529) are the baseline for steps 3-5; do not retrain them. Every bar in step 3 compares against these baseline figures. The step 7 retrain park (check half below 522) in slice C stays as written. Resume at step 3.

### Handoff (attempt 1)
- Done: preconditions (split.json, hard25.json, local models copied; Python toolchain and base model set up). Training pairs re-exported (suite 1181, corpus 415, 277 rule-book example pairs). Five baseline fold models trained with the unchanged recipe and scored with `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv`. Baseline figures (counts only): check half 539, tuning half 529, every-rule check 185 and tuning 171, hard 25 20 of 59, corpus 438 citations and 372 cases with every deciding rule, bench@5 128 of 156, rule characters 7,171 per practice question and 4,313 per corpus question. REQ-236 recorded 522 / 511 / 175 / 21, corpus 442 / 377, bench@5 130.
- Next: owner decision. Check half is +17, tuning half +18 against REQ-236 (corpus citations -4 is inside the limit). The brief's step 2 stop condition says more than 5 on any of check half, tuning half or corpus citations means the split, the hard-25 list or the recipe is not the one REQ-236 measured. Nothing in steps 3-5 has run. Options for the owner: confirm these fold models as the new baseline and let the set re-check run against them, or find what differs from the 2026-10-12 build (the training run was on CPU/MPS with the pinned requirements; the suite counts match the export log).
- Stopped because: brief step 2 park point (baseline outside the 5-citation tolerance). Full log: git-ignored `output/rule-search-eval/baseline-cv.log` in this worktree.

## Goal

Prove the six entries beat the bar on freshly trained baseline folds, and decide whether the `attached` tweak and the type-setting narrowing stay. No committed code.

## Requirements

1. Preconditions (brief step 1). Copy `/Users/chrismiho/Coding/Projects/TheJudge/output/rule-search-eval/split.json` and `hard25.json` read-only into this worktree's `output/rule-search-eval/`. Park if either is missing. Linked worktrees lack git-ignored caches, so also copy `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/` read-only into this worktree's `apps/backend/data/models/` (the local embedder and previous model `rule-search-d2c2e500a4c6`); without it local scoring silently falls back. Set up the pinned Python toolchain in `output/rule-search-model/venv` per `scripts/train-rule-search-model.py`'s header (one-time download, no spend).
2. Baseline folds (step 2). On unchanged code, `node scripts/export-rule-search-training.mjs --suite /Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`, train the five fold models with the unchanged recipe, score with `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv`. Compare with REQ-236: 522 / 511 / 175 / 21, corpus 442 / 377, bench@5 130. PARK STOP CONDITION (brief step 2): "If any of check half, tuning half or corpus citations differs by more than 5, park: the split, the hard-25 list or the recipe is not the one REQ-236 measured."
3. Set re-check (step 3). Apply the harness patch (cross-slice rules in `GAMEPLAN.md`), turn on all six with `CONCEPT_CANDIDATES`, score the same baseline folds. Bar: check half up; no other figure (tuning, every-rule check and tuning, hard 25, corpus citations and every-rule cases, bench@5) down; 14 of 14 labelled checks; built-prompt checks pass.
4. PARK STOP CONDITION (brief step 4): "If the set misses the bar: measure each entry alone and park for the owner with the numbers. Never drop or narrow an entry without the owner. If entry 79 is the cause, the probe's narrowing lead is 'dies / leaves the battlefield' triggers -> 603.10, and two or more trigger sources -> 603.3b."
5. One-entry re-measures (step 5) on the same folds: the `attached` tweak to entry 81 (add `attached` to its skipped words), and the type-setting narrowing (m-1: skip `except` wording and counter-subject wording). Keep each only if no figure drops; report each either way.
6. Revert the harness and any temporary edits with `git checkout`, confirm with `git diff --stat` that nothing is left, and record the figures (counts only) in the git-ignored `output/rule-search-eval/` log for slices B and C to quote.
7. Privacy: counts only anywhere written; never the suite's source name; `node scripts/privacy-scan.mjs` before any commit (this slice's only commit is the status update).

## Acceptance criteria

- [ ] `output/rule-search-eval/split.json` and `hard25.json` are present in the worktree, copied from the launch checkout (launch checkout untouched)
- [ ] `apps/backend/data/models/` (local embedder and `rule-search-d2c2e500a4c6`) is present in the worktree, copied read-only from the launch checkout
- [ ] Baseline folds trained and scored; check half, tuning half and corpus citations each within 5 of 522 / 511 / 442, with all baseline figures recorded; otherwise the slice is parked, not passed
- [ ] Set re-check recorded: check half up, no other figure down, 14 of 14 labelled checks, built-prompt checks pass; or each entry measured alone and parked for the owner with the numbers
- [ ] `attached` tweak and type-setting narrowing re-measured on the same folds; keep/drop decision and figures recorded for each
- [ ] Harness patch reverted: `git diff --stat` shows no harness edit and no tracked change outside `PRD/work/concept-map-wording-entries/`
- [ ] The harness patch file is not copied under `PRD/work/` and nothing from this slice is stored under `PRD/work/` except status text
- [ ] `node scripts/privacy-scan.mjs` passes before the status commit

## Verification

```bash
EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv
git diff --stat
node scripts/privacy-scan.mjs
```

## Files touched

- `output/rule-search-eval/split.json`, `output/rule-search-eval/hard25.json` (git-ignored copies)
- `apps/backend/data/models/` (git-ignored copy)
- `output/rule-search-model/` (git-ignored fold models, venv)
- `PRD/work/concept-map-wording-entries/slice-a-measure.md`, `slice-a.criteria.json` (status only)
