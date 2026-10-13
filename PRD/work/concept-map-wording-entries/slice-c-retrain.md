# Slice C — Retrain

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

## Status: planned

## Goal

Retrain the rule-search model on the new queries, rebuild every vector file, re-baseline the rules gate once, and apply REQ-236. This is the final slice; it carries the PRD promotion checklist and the ship gates.

## Requirements

1. Retrain (brief Scope 6) with the unchanged recipe on the committed map from slice B: re-export training pairs from the shipped query builder (`node scripts/export-rule-search-training.mjs --suite /Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`), train the five fold models and the 100% model. No harness patch in this slice.
2. Acceptance (brief step 7): REQ-236's floors (check >= 430, tuning >= 410, every-rule check >= 140, hard 25 >= 15; 100% model corpus >= 410 and >= 355, bench@5 >= 118, Necropotence rules in the top ten in both modes); 14 of 14 labelled checks; benchmark recall@5 floors. PARK STOP CONDITION (brief step 7): "Park if the retrained check half falls below today's 522, so the shipped search is never left worse than today; report any other figure that falls below the previous model's."
3. Rebuild every vector file that names the model id (the five files in the deliverable table of `GAMEPLAN.md`), update `apps/backend/data/embeddingModel.manifest.json` (`embeddingModel.test.ts` pins all five to the manifest's id) and `docs/aws/model-upload.md` (new id and size). Stage the upload copy with `scripts/package-embedding-model.mjs` under `output/rule-search-model/upload/<id>` (git-ignored). The owner uploads; nothing uploads, deploys or spends here.
4. Re-baseline the rules gate once: `npm run eval:rules-gate:baseline -- --allow-regressions`. List every lost hit by case and rule in the PR body and the receipt. PARK STOP CONDITION (brief step 8): "Park if the total of deciding rules reaching the prompts falls."
5. Numbers (m-3, m-4, m-5): rule characters per prompt for the new model, backfilling the previous model's (7,478 practice, 4,412 corpus, from PR #293's build log as recorded in its receipt); built-prompt corpus sizes from the built-prompt check, for the PR body; re-run `node scripts/leak-check.mjs` on the retrained model. Confirm `inDepthTopicGuard.test.ts` is still at or above 17 of 30.
6. Apply REQ-236 by intent from the finalized `GATE-QUESTIONS.md` into `PRD/sections/functional-requirements.md`: re-baseline once per retrain, previous model's rule-character figures backfilled, build note with the new model's numbers, leak check and built-prompt sizes. REQ-236 only.
7. Receipt under `PRD/instructions/receipts/` carrying measured numbers, lost hits, upload step, and the In-Depth topic additions figures from slice B. Counts only for the practice suite; never its source name; `node scripts/privacy-scan.mjs` before every commit.
8. Model weights, training pairs, fold models and per-question results stay git-ignored under `output/`. Nothing kept lives under `PRD/work/`.
9. PRD promotion checklist (executed in cleanup): REQ-234 and REQ-236 already applied by intent in B and C; cleanup confirms and deletes `PRD/work/concept-map-wording-entries/`.

## Acceptance criteria

- [ ] Training pairs re-exported and the five fold models plus the 100% model trained with the unchanged recipe on the committed map
- [ ] Retrained check half is at least 522 and every REQ-236 floor is met (check >= 430, tuning >= 410, every-rule check >= 140, hard 25 >= 15; 100% model corpus >= 410 and >= 355, bench@5 >= 118, Necropotence top ten in both modes); any figure below the previous model's is reported
- [ ] 14 of 14 labelled checks and the benchmark recall@5 floors pass on the retrained model
- [ ] All five vector files and `embeddingModel.manifest.json` name the new model id and `embeddingModel.test.ts` passes
- [ ] `docs/aws/model-upload.md` names the new id and size; the upload copy is staged under `output/rule-search-model/upload/<id>` and not committed
- [ ] The rules gate is re-baselined exactly once in `apps/backend/src/eval/rules-gate/baseline.json`, with the total of deciding rules reaching the prompts not lower, and every lost hit listed by case and rule in the PR body and receipt
- [ ] Rule characters per prompt recorded for the new model and backfilled for the previous model (7,478 practice, 4,412 corpus); built-prompt corpus sizes recorded; leak check re-run and passing on the retrained model
- [ ] REQ-236 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block; no other REQ changed in this slice
- [ ] The receipt exists under `PRD/instructions/receipts/` with counts only
- [ ] `inDepthTopicGuard.test.ts` still at or above 17 of 30
- [ ] `npm run quality:check` and `npm test` are green and `node scripts/privacy-scan.mjs` passes
- [ ] No weights, pairs, fold models or per-question results are tracked, and nothing kept lives under `PRD/work/`

## Verification

```bash
EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --cv
node scripts/leak-check.mjs
npm run eval:rules-gate:baseline -- --allow-regressions
npm run quality:check
npm test
node scripts/privacy-scan.mjs
git status --short
```

## Files touched

- `apps/backend/data/embeddingModel.manifest.json`
- `apps/backend/data/gameRulesRuleEmbeddings.json`
- `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`
- `apps/backend/src/eval/frozen-card-vectors.json`
- `apps/backend/src/eval/rules-gate/frozen-query-vectors.json`
- `apps/backend/src/prompt/preparation.crossReferenceQueryEmbedding.json`
- `apps/backend/src/eval/rules-gate/baseline.json`
- `docs/aws/model-upload.md`
- `PRD/sections/functional-requirements.md` (REQ-236 only)
- `PRD/instructions/receipts/` (new receipt)
- `output/rule-search-model/`, `output/rule-search-eval/` (git-ignored)
- `PRD/work/concept-map-wording-entries/slice-c-retrain.md`, `slice-c.criteria.json` (status only)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/concept-map-wording-entries/` ready to delete
