# Slice D — First training, cross-validation, vectors, gates

## Status: done

## Goal

Train the Magic search model locally, prove it with 5-fold cross-validation, ship its manifest and rebuilt rule vectors, and re-baseline the rules gate once.

## Requirements

1. Reproduce the probe's hard-25 selection from local material (assumption 4). Its ids stay git-ignored; committed text gives count and level only. If it cannot be reproduced, park that one gate for the owner. Do not substitute a different set.
2. Run 5-fold cross-validation with the shipped recipe through `uv` (Python 3.12) using the base model under `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/models-probe/`. Each question is scored by a model that never trained on it. Targets (target 2): check half >= 430 citations, tuning half >= 410, every-rule check >= 140, hard 25 >= 15. A miss parks the build for the owner (stop condition); no recipe tuning to chase a floor beyond the recorded recipe.
3. Train the final model on 100% of the data. Run the leak check and the latency/quantization check. Final-model targets (target 3): corpus >= 410 citations and >= 355 cases with every deciding rule; bench@5 (156 questions, three unrelated cards) >= 118; Necropotence (`necropotence-silence-borne-upon-a-wind-cleanup`) has 514.1, 514.2 and 514.3a in the top ten in both versions. Misses park the build.
4. Package: write `embeddingModel.manifest.json`, record the model id in every committed vector file (rule vectors, frozen query vectors, frozen per-card vectors, rules-gate vectors), and rebuild them with the trained model (offline, via the model folder placed in the git-ignored path). Record the upload commands in a committed doc for the PR body (for example `docs/`), not in `PRD/work/`.
5. Standing gates (target 6) on the trained model: benchmark hybrid recall@5 at or above 0.8526 clean and 0.8333 polluted; the 12 labelled checks. Misses park the build.
6. Rules gate re-baseline (REQ-236, REQ-222): once, with `--allow-regressions`, every lost hit listed in the PR-body draft and the evidence log (corpus case ids only), and net hits must rise. Use `scripts/raise-rules-gate-baseline.mjs`.
7. Record the ranks of 702.3a, 113.7a and 615.12 again (target 10), plus rule characters per prompt for the search excerpts (about 4.9k expected against 7.5k).
8. Per-question results, pairs, checkpoints and the model folder stay under git-ignored folders; commit counts only.
9. Apply the rest of REQ-236 and REQ-182 verification text by intent. No upload, no deploy.

## Acceptance criteria

- [x] Hard-25 reproduced from local material with ids only in a git-ignored path (or the build parked)
- [x] 5-fold CV meets check >= 430, tuning >= 410, every-rule check >= 140, hard 25 >= 15; counts recorded in the evidence log
- [x] Final model meets corpus >= 410, >= 355 cases with every rule, bench@5 >= 118, Necropotence ids 514.1/514.2/514.3a in the top ten in both versions
- [x] Leak check and latency/quantization check run and their counts are recorded
- [x] The manifest is committed with correct hashes and every committed vector file records the trained model id
- [x] Benchmark floors (0.8526 / 0.8333) and the 12 labelled checks pass on the trained model
- [x] Rules gate re-baselined once with every lost hit listed and net hits up
- [x] `git ls-files` lists no weight files and `scripts/privacy-scan.mjs` reports 0 matches
- [x] Stemming-case ranks and rule characters per prompt are recorded
- [x] The upload commands doc is committed outside `PRD/work/`
- [x] `npm run quality:check` passes

## Verification

```bash
node scripts/score-rule-search.mjs --cv 5
node scripts/score-rule-search.mjs --final
node scripts/rag-retrieval-benchmark.mjs
node scripts/privacy-scan.mjs
npm run quality:check
```

## Files touched

- `apps/backend/data/embeddingModel.manifest.json`, `gameRulesRuleEmbeddings.json`, frozen query and per-card vector files, rules-gate vectors and baseline
- `scripts/score-rule-search.mjs` (modes), `scripts/raise-rules-gate-baseline.mjs` use
- `docs/` model upload note
- `PRD/sections/functional-requirements.md` (REQ-236, 182)
