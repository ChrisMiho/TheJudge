# Receipt — concept-map-wording-entries — 2026-10-13

**What happened:** Luna's rule search now recognizes six more kinds of card
wording ("whenever", "rather than pay its mana cost", "gain control of", "gets
-2/-2", "Sacrifice this creature:", "Choose two -") and pulls in the matching
rule-book rules more often: triggered abilities (603), alternative costs
(118.9), layers (613), the toughness checks (704.5f/g), activated-ability costs
(602) and casting (601). The search model was retrained once on the new
queries. Code PR: https://github.com/ChrisMiho/TheJudge/pull/302 (open, not yet
merged).

**What it means for you:** Before you merge, upload the new search model, or
the deploy refuses. Then merge PR #302 and cards with those six kinds of
wording bring their deciding rules in more often. In-Depth prompts do not get
longer, and Quick Lookup prompts are unchanged in curated-topic size.

- Date: 2026-10-13
- Slug: `concept-map-wording-entries`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/302 (`thejudge-auto/concept-map-wording-entries-work` into `main`, open at close; marker `<!-- thejudge-auto:v1:registered:concept-map-wording-entries -->`)

## Owner step before merge

Upload the staged model `rule-search-adfcdcb59aef` per `docs/aws/model-upload.md`: set `AWS_PROFILE=thejudge-admin`, then `aws s3 cp` the staged folder `output/rule-search-model/upload/rule-search-adfcdcb59aef` (4 files, 23.7 MB) to `s3://thejudge-lambda-artifacts-$ACCOUNT/models/rule-search-adfcdcb59aef/` and `aws s3 ls` it to check. The staged copy lives in the build worktree `.worktrees/implement-concept-map-wording-entries/` (git-ignored); the weights are not in the PR. Nothing was uploaded, deployed or spent by the run.

## Actions taken

- Slice A (measure, no code): done. Slices B (map change) and C (retrain) landed together in one commit, because the map change alone cannot pass `npm test` (changed queries leave their frozen vectors awaiting a re-freeze).
- Concept map goes from 78 to 84 entries (REQ-234); the search-model requirement (REQ-236) says the rules gate is re-baselined once per retrain, with the previous model's rule-text sizes filled in. Both were applied at build; cleanup confirmed both present in `PRD/sections/functional-requirements.md` and promoted nothing. `PRD/sections/system-map.md` "Supplemental retrieval (System 3)" already reads `shipped` and already lists REQ-234 and REQ-236, so no flip was needed.
- Cleanup: this receipt written, `PRD/work/concept-map-wording-entries/` removed with `git rm -r`, its row stripped from `PRD/work/STATUS.md`.

## Files

- Created: this receipt.
- Updated at build (in the PR): `apps/backend/src/gameRulesConceptMap.ts` (entries 79-84, exclusions, header), its test file (101 tests; pins 84 entries and 165 words over 89), `gameRulesSearchFixes.test.ts`, re-recorded goldens, the five vector files and `embeddingModel.manifest.json` (new model id), `rules-gate/baseline.json`, `benchmark/semantic-results.json`, `docs/aws/model-upload.md`, REQ-234 and REQ-236 in `PRD/sections/functional-requirements.md`.
- Updated at close: `PRD/work/STATUS.md`.
- Deleted at close: everything under `PRD/work/concept-map-wording-entries/`.

## Verification

`npm run quality:check`, `npm test` and `node scripts/privacy-scan.mjs` passed at build. Review approved at loop 2 on head `43deda49`. Every criterion in `slice-a.criteria.json`, `slice-b.criteria.json` and `slice-c.criteria.json` was `true` at close. Close checks: branch `thejudge-auto/concept-map-wording-entries-work`, `HEAD` equal to its origin tip `c7e6c888`, PR #302 open with base `main`.

## Measured numbers (counts only)

Adopted baseline: the five fold models trained fresh on 2026-10-13 with the unchanged recipe, because the folds REQ-236 measured no longer exist. They differ in detail from REQ-236's figures, and the owner adopted them as the baseline. Baseline (check / tuning, every-rule check / tuning, hard 25 of 59, corpus citations / every-rule cases, bench@5 of 156): 539 / 529, 185 / 171, 20, 438 / 372, 128. REQ-236 had 522 / 511, 175 / 166, 21, 442 / 377, 130.

The six on, same folds, query side only (the set the owner accepted on 2026-10-13): 558 / 536, 182 / 176, 19, 441 / 374, 127. Gains: check +19, tuning +7, every-rule tuning +5, corpus +3 citations and +2 cases. Accepted losses, one question each: every-rule check 185 to 182 (3), hard 25 20 to 19 (1), bench@5 128 to 127 (1). Run alone, entry 79 cost one every-rule check and one bench@5; entry 81 cost three every-rule check; entries 80 and 83 lost one tuning citation each; no entry was dropped or narrowed.

The `attached` skip (entry 81) and the type-setting `except` / counter-subject exclusions were each re-measured with the six on: no figure moved either way, so both are kept.

Retrained model `rule-search-adfcdcb59aef`, cross-validated: check 538, tuning 525, every-rule 177 / 171, hard 25 21, corpus 440 / 373, bench@5 128. Floors (430 / 410 / 140 / 15) met; the park line (check half below 522) did not fire. Below the previous model's: corpus 440 vs 442, corpus cases 373 vs 377, bench@5 128 vs 130; the 100% model's corpus 471 vs 472 citations and 392 vs 395 cases. Against the query-side set, the retrained check half is 20 lower (538 vs 558): the query-side run keeps the old model's habits, the retrain learns the new queries. 100% model: corpus 471 of 494 and 392 of 415 cases (previous 472 / 395), bench@5 128 (floor 118; previous 126); Necropotence 514.1 / 514.2 / 514.3a at ranks 1 / 4 / 5 (Quick Lookup) and 2 / 4 / 3 (In-Depth); benchmark recall@5 0.9231 clean and 0.9167 polluted (floors 0.8526 / 0.8333). All 14 labelled checks pass.

Rule text per prompt: 7,174 characters per practice question and 4,262 per corpus question (previous model 7,478 and 4,412). Built-prompt corpus sizes: 415 Quick Lookup prompts average 8,529 curated-topic and 4,317 search-excerpt characters; 9 In-Depth prompts 14,831 and 8,587; In-Depth keeps 29 of 30 deciding rules (floor 17). In-Depth topic effect: 0 of 9 cases change curated topics, 0 topics added; curated-topic rule characters per In-Depth case 14,875 before and 14,875 after (recorded only, no bar).

Leak check (retrained folds against the baseline folds): rules seen in training 2,180 citations (951 to 944), never seen 289 (117 to 119), questions with a training question at cosine 0.9 or above: 4 with 12 citations (11 to 9). The gain is not near-copy leakage. q8 against fp32 mean cosine 0.996; model 23.0 MB. Type-setting narrowing removed 3 of 372 card matches (372 to 369); q8 latency about 2.6 to 2.7 ms per query.

### Rules gate re-baselined once, after the retrain

Deciding rules reaching the prompts: 472 to 473 across 415 cases (hits 438 to 439); the total did not fall. Lost hits (6), by case and rule:

- copies-null-profusion-and-isochron-scepter: 707.12
- copies-shattering-spree-replicate-countered: 707.10
- layers-humility-then-opalescence: 613.7
- replacement-damia-thought-reflection-draw: 614.1a
- resolution-intellect-devourer-leaves-before-resolving: 610.3b
- triggers-quagnoth-discard-and-yixlid-jailer: 113.6

Seven new hits: combat-ward-of-piety-redirected-damage 510.2; dfc-modal-double-faced-card-legality 712.8f; layers-hand-size-timestamp-praetors-counsel 613.7; layers-mycosynth-lattice-march-dependency 613.1d; replacement-byrke-and-branching-evolution 122.6; replacement-damia-thought-reflection-draw 614.11; triggers-apnap-blood-artists-at-one-life-in-depth 704.5a.

## Follow-ups (all Minor, none blocking)

- Review loop 1 Minor: the PR body's below-previous sentence omitted the 100% model's corpus 471 vs 472 and 392 vs 395. The PR body now carries it; this receipt does too. Nothing left to do.
- Review loop 2 Minor 1: the REQ-234 build note in `PRD/sections/functional-requirements.md` (about line 6229) uses branch-relative phrasing; reword it to stand on its own.
- Review loop 2 Minor 2: the REQ-236 build note (about line 6293) lists its fields in an awkward order; reorder them.

## Graph run

- Run ID: `graph-20261013-054503` | Profile: `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/302

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/302

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | `npm run graph:preflight -- --branch thejudge-auto/concept-map-wording-entries --slug concept-map-wording-entries --run-id graph-20261013-034606 --pid 27897` exit 0 (dry run exit 0 first); shape root; base `origin/main` `bc41a92c`; branch pushed (`git ls-remote --heads origin thejudge-auto/concept-map-wording-entries` → `bc41a92c`) from `.worktrees/kickoff-concept-map-wording-entries`; launch checkout still on `main`, untouched; lock `.worktrees/.graph-run.lock` (pid 27897, 2026-10-13T03:46:28.552Z); canary and graph canary both denied | 2026-10-13 |
| 2 | shape | sonnet | ok | `0 → 13` | `PRD/work/concept-map-wording-entries/` (IDEA.md, README.md, STATUS.ideation, `intake/GRAPH-BRIEF.md` byte-identical to the staged copy, `cmp` clean); board row under ideation; commit `6ca6788b` pushed (`git ls-remote` → `6ca6788b`); 2 prior-run receipts in IDEA.md; driver added `## Autonomous metadata` to README; launch checkout porcelain unchanged | 2026-10-13 |
| 3 | define | opus | ok | `0 → 81` | `PRD/work/concept-map-wording-entries/DESIGN-BRIEF.md` (156 lines), `GATE-QUESTIONS.md` (2 slots, 2 blank verdicts: amended REQ-234, REQ-236; no new IDs; no blocker questions), `evidence/amendment-grep.md` (75 hits = 5 amend / 70 no change, plus one ungreppable REQ-236 line noted); `STATUS.refined` only marker, board row under refined; commit `9651e2f2` pushed (`git ls-remote` → `9651e2f2`); `git diff --stat 6ca6788b HEAD -- PRD/sections apps scripts docs .gitignore` empty; `node scripts/privacy-scan.mjs` 0 matches; owner precondition found: `output/rule-search-eval/split.json` and `hard25.json` absent locally (driver `find` under `~/Coding/Projects` also finds none) — brief parks the build at step 1 without them | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS attempt 1, findings none — `PRD/work/concept-map-wording-entries/QUALITY-CHECK.md`, commit `c7efc2c0` pushed; 61 removed/context diff lines exact over 2 slots; amendment grep re-run 75 hits = 75 rows; no new IDs (origin/main ends at REQ-247); privacy scan 0 matches; README `## Preparation gate` PASS written by the driver; parked `owner-action` (marker and board row moved, commit `72f7dd69`); docs PR https://github.com/ChrisMiho/TheJudge/pull/300 | 2026-10-13 |
| 5 | gate-review | sonnet | ok | `0 → 28` | build half run `graph-20261013-042008`: kickoff worktree removed clean (`git worktree remove`); claim commit `89f07d3f` on `thejudge-auto/concept-map-wording-entries-work` cut from `origin/main` `f9fefe0c` (docs PR #300 merge), pushed; lock taken from the launch root; universal canary `rm -rf .worktrees/.graph-canary-nonexistent` and graph canary `nohup true` both denied; `graph-gate-review` commit `f8c6980d` pushed (`git ls-remote` → `f8c6980d`): 1 accept / 1 edit / 0 reject, `### Brief reconciliation` 3 passages (`DESIGN-BRIEF.md:72, 74, 94`); `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree porcelain empty | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 13` | re-grade after verdicts, PASS attempt 1, findings none — `PRD/work/concept-map-wording-entries/QUALITY-CHECK.md`, commit `9439bb66` pushed (`git ls-remote` → `9439bb66`); REQ-234 edit carried in the diff and `DESIGN-BRIEF.md:72, 74, 94`; 61 removed/context lines exact; no new IDs; amendment grep 75 = 75 rows; privacy scan 0 matches; `STATUS.refined` only marker; README `## Preparation gate` PASS rewritten by the driver | 2026-10-13 |
| 5 | plan | sonnet | failed | `0 → 28` | attempt 1, failed by the driver's return-side check: commit `609071a7` pushed with `GAMEPLAN.md`, three slices (A measure 8 criteria, B map change 11, C retrain 12), `STATUS.active`, board row under active; but `slice-c-retrain.md` requirement 7 and its criterion have the builder write the receipt under `PRD/instructions/receipts/`, which `thejudge-cleanup` writes at `close` (same `<slug>-<date>.md` path) — placement fix, no product truth involved; re-dispatched as attempt 2 | 2026-10-13 |
| 5 | plan | sonnet | ok | `0 → 19` | attempt 2, commit `6893486a` pushed (`git ls-remote` → `6893486a`): `slice-c-retrain.md` requirements 4 and 7, two criteria, files touched, `slice-c.criteria.json` C6/C9 and three `GAMEPLAN.md` rows now send figures to the code PR body plus a git-ignored `output/rule-search-eval/` log, `close` writes the receipt; `grep -i receipt` over slices and GAMEPLAN shows no builder-written receipt; criteria A 8 / B 11 / C 12, all `false`; no deliverable under `PRD/work/`; `STATUS.active` only marker; board row under active; privacy scan 0 matches | 2026-10-13 |
| 6 | build | sonnet | parked | `0 → 59` (includes the driver's post-return checks: the hook denied the run-state flip, see `
| 6 | build | sonnet | parked | `0 → 20` | attempt 2, run `graph-20261013-054503`: slice A parked at brief step 4 (set misses the step 3 bar: check +19, tuning +7, corpus +3; every-rule check −3, hard 25 −1, bench@5 −1); each entry measured alone (`output/rule-search-eval/alone-*.log`); harness applied then reverted, `git diff --stat` empty; commit `aacc7aa9` pushed; no PR; return-side: launch checkout porcelain identical, every reported path inside `.worktrees/implement-concept-map-wording-entries/`; criteria not earned under this run; driver run-state flip after return allowed (#301 exemption live) | 2026-10-13 |
| 6 | build | sonnet | ok | `0 → 141` | attempt 3, run `graph-20261013-054503`: slices A, B and C done (B and C landed together: the map change alone fails `npm test` until the vectors are rebuilt); commits `9dc2fe88` (A) and `30e95ad9` (B+C), pushed (`origin` tip `30e95ad9`); PR https://github.com/ChrisMiho/TheJudge/pull/302 open into main, registration marker in the body; criteria A 8/8, B 11/11, C 12/12 `true`; `STATUS.ship-ready`, board row under ship-ready; step 5 tweaks both kept (no figure moved); retrained model `rule-search-adfcdcb59aef` CV 538 / 525, every-rule 177 / 171, hard 25 21, corpus 440 / 373, bench@5 128 (floors met, step 7 park not fired); rules gate 472 → 473, 6 lost hits listed in the PR (step 8 park not fired); `quality:check` and `npm test` green per the node; return-side: launch checkout porcelain identical, every reported path inside `.worktrees/implement-concept-map-wording-entries/` | 2026-10-13 |
| 7 | review | opus | failed | `0 → 47` | CHANGES REQUESTED, loop 1 of 2: no-write `Plan`-type reviewer on head `30e95ad9`; 2 Important — REQ-234 build note (`functional-requirements.md:6229`) lacks the type-setting narrowing's card-match count (`<n> of 372 card matches removed`, `GATE-QUESTIONS.md:55`); REQ-236 build note (`:6293`) lacks q8 latency (`<n> ms per query`, `GATE-QUESTIONS.md:109`; reviewer measured 2.7 ms read-only with `scripts/latency-q8check.mjs`); 1 Minor — PR body's below-previous sentence omits the 100% model's corpus 471 vs 472 and 392 vs 395; every other criterion met (tests, privacy, tracked files, model ids, upload hash, logs, rules gate, leak check re-run) | 2026-10-13 |
| 6 | build | sonnet | ok | `0 → 30` | attempt 4 (review loop 1 fixes): commit `2e98f872` pushed (`origin` tip `2e98f872`), only `PRD/sections/functional-requirements.md` (2 lines): REQ-234 note adds `3 of 372 card matches removed` (372 on origin/main, 369 on branch, counted over `cardDetailByOracleId.json.br` with name replacement); REQ-236 note adds `median 2.6 ms per query (stock q8 2.7 ms)` from `scripts/latency-q8check.mjs`; PR #302 body below-previous sentence names the 100% model's 471 vs 472 and 392 vs 395, marker still first line; `gameRulesConceptMap.test.ts` 101/101, privacy 0, `format:check` ok; return-side: launch porcelain identical, writes inside the build worktree | 2026-10-13 |
| 7 | review | opus | ok | `0 → 21` | APPROVE, loop 2: no-write `Plan`-type reviewer on head `43deda49`; both loop-1 Important findings closed by `2e98f872` (only the REQ-234 and REQ-236 notes changed); reviewer reproduced 372 → 369 type-setting matches over `cardDetailByOracleId.json.br` and q8 median 2.7 ms (note says 2.6; run-to-run); REQ-234 and REQ-236 match the finalized `GATE-QUESTIONS.md` blocks, no other REQ changed (7 hunks, all inside the two REQs); PR marker first line; privacy 0, `format:check` ok; 2 Minor wording notes (branch-relative phrasing at `functional-requirements.md:6229`, field order at `:6293`), no Critical or Important | 2026-10-13 |## Open gate`) | slice A parked at brief step 2: baseline folds check 539 / tuning 529 vs REQ-236 522 / 511 (tolerance 5); commit `3e0ff920` pushed (slice A status `blocked` with handoff); slices B and C not started; no PR (no code changed); harness patch only `git apply --check`ed, never applied; return-side: launch checkout `git status --porcelain` identical before and after, every reported path inside `.worktrees/implement-concept-map-wording-entries/`; privacy scan 0 matches | 2026-10-13 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Six more card-wording entries in the concept map so rule search reaches triggered-ability, cost, casting, layer and toughness rules, with a model retrain" | answered-once | shape | — |
| "fill in your suggestions, ask me for ones you truly cant answer" | answered-once | owner-action | — |
| "agreed, i follow your recommendation" | answered-once | build | — |
| "i want to follow your recommendations, but i also want to express that if the updates are fixing in some areas and not in others, then id like to investigate that overnight while i sleep" | answered-once | build | — |

## Intake

- `intake/GRAPH-BRIEF.md` — supplied path: the staged brief `.worktrees/.graph-intake/graph-20261013-034606/GRAPH-BRIEF.md`, handed over in the graph launch request
