# Slice A — Measure

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

## Status: planned

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
