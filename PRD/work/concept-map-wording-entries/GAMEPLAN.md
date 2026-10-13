# Gameplan — concept-map-wording-entries

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

Branch: `thejudge-auto/concept-map-wording-entries-work`. Read `DESIGN-BRIEF.md` first; it is the source for every step, number and stop condition below.

## What a player gets

Cards worded with "whenever", "rather than pay its mana cost", "gain control of", "gets -2/-2", "Sacrifice this creature:" or "Choose two -" bring the deciding rule to Luna more often. Six new patterns in the concept map add rule-book words before rule search runs. The rule-search model is retrained once on the new queries (REQ-236).

## Slices

| Slice | Goal | Depends on | Commits code? |
| --- | --- | --- | --- |
| A — Measure | Preconditions, baseline folds, set re-check, two one-entry re-measures. Numbers only. | none | no (numbers kept in git-ignored `output/`, restated in B and C) |
| B — Map change | Six entries, narrowing, header, tests, goldens, REQ-234 applied | A | yes |
| C — Retrain | Re-export, train, vectors, manifest, upload doc, single re-baseline, REQ-236 applied, m-3/m-4/m-5, numbers in PR body | B | yes |

Sequential: B needs A's keep/drop decisions on the `attached` tweak and the type-setting narrowing; C needs B's committed map. If the map change alone fails the rules gate on the current model, B and C land as one slice (C absorbs B's commit; the single re-baseline follows the retrain).

## Data flow

Card text -> concept map patterns -> added rule-book terms -> search query -> rule-search model (ranks rules) -> rules in the prompt. The map is a committed table; no AI writes terms at request time.

## Cross-slice rules

- Measurement harness: the patch at `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch` is read by absolute path and applied with `git apply` in this worktree only. It is reverted with `git checkout` on the touched files before every commit, confirmed by `git diff --stat`. Never committed, never copied under `PRD/work/`. If missing or not applying, make the same switch by hand as a temporary local edit (never committed). Candidate names in table order: `TRIGGER_HANDLING_R`, `ALT_COST`, `LAYER_TITLE_D`, `MINUS_TOUGHNESS_R`, `SAC_SELF_COST`, `CASTING_TITLE_R`.
- Park points (stop and report to the owner with the numbers, never route around): brief steps 2, 4, 7 and 8, quoted in the slice that runs each.
- Never drop or narrow an entry without the owner.
- Product truth: REQ-234 and REQ-236 in `PRD/sections/functional-requirements.md` are applied by intent, from the finalized `GATE-QUESTIONS.md` (REQ-234 with the owner's edit, REQ-236 accepted), in the slice that lands the matching code (B for REQ-234, C for REQ-236). The owner's REQ-234 edit: record curated-topic rule characters per In-Depth corpus case, before -> after, recorded only, no bar.
- Privacy: practice-suite counts only in every committed file, PR body and comment; never the suite's source name; run `node scripts/privacy-scan.mjs` before every commit.
- Git: short separate calls from the worktree; `git add <explicit paths>`, `git commit`, `git push`. Never `git add -A` or `git add .`.
- Nothing the build keeps may live under `PRD/work/` (close deletes it). Raw results stay git-ignored under `output/`.
- Nothing uploads, deploys or spends. The owner uploads the model.

## Deliverables (from the brief)

| Deliverable | Lands in | Slice |
| --- | --- | --- |
| Six entries, `attached` tweak if kept, narrowing if kept, header | `apps/backend/src/gameRulesConceptMap.ts` | B |
| Entry tests and updated pins (78 -> 84 entries; 163 -> 165 words over 83 -> 89 entries; Ephemeral Hydra example) | `apps/backend/src/gameRulesConceptMap.test.ts` | B |
| Re-recorded example prompts | `apps/backend/src/eval/fixtures/*.golden.*` (`UPDATE_CONTEXT_EVAL_FIXTURES=1`) | B |
| New model identity | `apps/backend/data/embeddingModel.manifest.json` | C |
| Rebuilt vectors | `apps/backend/data/gameRulesRuleEmbeddings.json`, `apps/backend/src/eval/fixtures/frozen-query-embeddings.json`, `apps/backend/src/eval/frozen-card-vectors.json`, `apps/backend/src/eval/rules-gate/frozen-query-vectors.json`, `apps/backend/src/prompt/preparation.crossReferenceQueryEmbedding.json` | C |
| Rules-gate re-baseline | `apps/backend/src/eval/rules-gate/baseline.json` | C |
| Upload instructions | `docs/aws/model-upload.md` | C |
| Product truth | REQ-234 (B), REQ-236 (C) in `PRD/sections/functional-requirements.md` | B, C |
| Measured numbers | REQ-234 and REQ-236 notes; PR body and git-ignored `output/rule-search-eval/` log; `close` writes the receipt (`PRD/instructions/receipts/<slug>-<date>.md`) from the PR body, the build does not | B, C |
| Weights, pairs, fold models, per-question results | git-ignored `output/rule-search-model/`, `output/rule-search-eval/`; upload copy staged by `scripts/package-embedding-model.mjs` under `output/rule-search-model/upload/<id>` | A, C |
| Measurement harness | never committed | A |

## Verification checklist

- [ ] Slice A: baseline within 5 of REQ-236 figures; set re-check meets the bar; both one-entry re-measures reported
- [ ] Slice B: 84 entries, tests green, goldens reviewed, REQ-234 applied
- [ ] Slice C: floors met, check half >= 522, vectors/manifest consistent, one re-baseline, REQ-236 applied, numbers in the PR body (no builder receipt)
- [ ] `npm run quality:check`, `npm test`, `node scripts/privacy-scan.mjs` green at the end of each committing slice
- [ ] No harness patch in any commit; nothing kept under `PRD/work/`
