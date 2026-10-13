# Graph run — concept-map-wording-entries

- Run ID: `graph-20261013-054503` (build half from build attempt 2; `graph-20261013-042008` ran the claim through build attempt 1; spec-forming half was `graph-20261013-034606`)
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261013-034606/`
- Current node: `review` (attempt 2)
- Next action: `/graph-implement PRD/work/concept-map-wording-entries/`

## Node ledger

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
| 6 | build | sonnet | ok | `0 → 30` | attempt 4 (review loop 1 fixes): commit `2e98f872` pushed (`origin` tip `2e98f872`), only `PRD/sections/functional-requirements.md` (2 lines): REQ-234 note adds `3 of 372 card matches removed` (372 on origin/main, 369 on branch, counted over `cardDetailByOracleId.json.br` with name replacement); REQ-236 note adds `median 2.6 ms per query (stock q8 2.7 ms)` from `scripts/latency-q8check.mjs`; PR #302 body below-previous sentence names the 100% model's 471 vs 472 and 392 vs 395, marker still first line; `gameRulesConceptMap.test.ts` 101/101, privacy 0, `format:check` ok; return-side: launch porcelain identical, writes inside the build worktree | 2026-10-13 |## Open gate`) | slice A parked at brief step 2: baseline folds check 539 / tuning 529 vs REQ-236 522 / 511 (tolerance 5); commit `3e0ff920` pushed (slice A status `blocked` with handoff); slices B and C not started; no PR (no code changed); harness patch only `git apply --check`ed, never applied; return-side: launch checkout `git status --porcelain` identical before and after, every reported path inside `.worktrees/implement-concept-map-wording-entries/`; privacy scan 0 matches | 2026-10-13 |

## Open gate

**RESOLVED 2026-10-13** (build attempt 2 park) — the owner follows the recommendation: ship the six as measured; the build resumes at slice A step 5, and the step 7 and step 8 retrain gates still bind. The owner also asked for an overnight investigation of where the update gains and where it loses (per-question winners and losers by category), run after this build as a separate measurement-only probe, not part of this package.

- Terminal state (historical): PARKED at `owner-action`, node `build` attempt 2 (run `graph-20261013-054503`), slice A, brief step 4: the six entries as a set miss the step 3 bar.
- Question: ship the six as measured, or narrow entries 79 (triggered abilities) and 81 (layer wording) first and re-measure?
- Evidence (counts only; `output/rule-search-eval/set-cv.log` and `alone-*.log` in the build worktree, git-ignored; local embedder, query side only, adopted folds `F-fold0..4`). Baseline → set: check 539 → 558 (+19), tuning 529 → 536 (+7), every-rule check 185 → 182 (−3) and tuning 171 → 176 (+5), whole-suite every-rule 356 → 358 (+2), hard 25 20 → 19 of 59 (−1), corpus 438 → 441 citations and 372 → 374 cases, bench@5 128 → 127 (−1). Each entry alone (check / tuning, every-rule check / tuning, hard 25, corpus, bench@5): 79 553 / 532, 184 / 174, 20, 438 / 372, 127; 80 540 / 528, 185 / 171, 20, 438 / 372, 128; 81 542 / 531, 182 / 174, 20, 441 / 374, 128; 82 540 / 529, 185 / 171, 20, 438 / 372, 128; 83 538 / 528, 184 / 171, 20, 438 / 372, 128; 84 540 / 530, 185 / 171, 20, 438 / 372, 128. Step 5 re-measures, the 14 labelled checks and the built-prompt checks did not run.
- Driver reading: the bench@5 point is entry 79's (it matches about 40% of cards, so the benchmark's unrelated cards add its term), the same mechanism the brief recorded for 79 with mana value. The every-rule check −3 is offset by tuning +5 (whole suite +2). The hard-25 −1 appears only for the set, not for any entry alone. Every loss is one question or rule against a gain of 26 suite citations; the probe's own folds showed no drop, so the losses are fold-specific at this size.
- Recommendation: ship the six as measured and continue (step 5, slices B and C). The retrain gates still bind: step 7 (REQ-236 floors, retrained check half not below 522) and step 8 (deciding rules reaching the prompts must not fall). Narrowing 79 means new patterns the owner has not reviewed, likely gives back part of its +14 check gain to recover one benchmark question, and needs another gate round.
- Resume: answer the question, then `/graph-implement PRD/work/concept-map-wording-entries/`; the build resumes at slice A step 5 on the same folds.

**RESOLVED 2026-10-13** (build attempt 1 park) — the owner adopted the recommendation: the fresh fold models `F-fold0..4` (check 539 / tuning 529) are the baseline for the set re-check; the step 7 retrain park (check half below 522) stays as written. The owner removed the lock and run-state by hand; guardrail fix PR https://github.com/ChrisMiho/TheJudge/pull/301. The build resumes at slice A step 3.

Run ID rotated 2026-10-13 05:45Z: after #301 merged, the driver re-took the lock under `graph-20261013-042008` and its run-state writes were refused by `denied-command-retry`, which keys a file write on its path and still held the pre-fix `build-write-outside-worktree` denial of `.worktrees/.graph-run-state.json`. The driver wrote `.worktrees/.graph-run-release.json` as `PROMPTED` for that run id, removed the lock and the run-state file (both allowed under the #301 exemption), and re-took the lock as `graph-20261013-054503`. Follow-up, not fixed here: `build-write-outside-worktree` depends on the current node, so like `run-lock-removal` it arguably belongs in `REMEDIABLE_RULES`.

- Terminal state (historical): PARKED at `owner-action`, node `build` attempt 1, slice A, brief step 2 (the earlier `define` gate was resolved 2026-10-13; see `## Gate verdicts`).
- Question: the freshly trained baseline folds score above REQ-236's recorded figures by more than the brief's 5-citation tolerance. Should these fold models become the baseline the six entries are re-checked against?
- Evidence (counts only; `output/rule-search-eval/baseline-cv.log` in the build worktree, git-ignored): retrained on unchanged code with the unchanged recipe, scored with `EMBEDDING_PROVIDER=local` (no fallback warning). Check half 539 vs 522 (+17), tuning half 529 vs 511 (+18), every-rule check / tuning 185 / 171 vs 175 / 166, hard 25 20 vs 21 of 59, corpus 438 / 372 vs 442 / 377 (−4, inside tolerance), bench@5 128 vs 130; rule characters per question 7,171 practice / 4,313 corpus vs 7,478 / 4,412.
- Driver diagnosis: (1) no leakage — the trainer and `scripts/score-rule-search.mjs --cv` read the same `fold` from `output/rule-search-model/data/cases.jsonl`; (2) the split file is not the cause — a wrong split moves citations between the halves, but both halves rose together (total 1,068 vs 1,033); (3) the suite is unchanged — 0 files in `output/practice-suite/cases` newer than the 2026-10-12 receipt; (4) the trainer runs on `mps` (`scripts/train-rule-search-model.py:62`), which is not bit-reproducible under seed 13, and REQ-236's own record shows retrain swings of this size (previous model 530 / 526 → 522 / 511 after one entry). Conclusion: training noise exceeds the tolerance the brief assumed (assumption A4); the inputs are the ones REQ-236 measured.
- Recommendation: adopt these fold models as the baseline. The set re-check (step 3) scores the six entries on these same fold models, query side only, so the comparison stays like-for-like; the step 7 retrain park (check half below 522) stays as written.
- Resume: answer the question above, then `/graph-implement PRD/work/concept-map-wording-entries/`. The build resumes at slice A step 3 on the existing fold models in `.worktrees/implement-concept-map-wording-entries/output/rule-search-model/onnx/F-fold0..4`.
- Lock not released (guardrail gap): the hook's `build-write-outside-worktree` rule (`scripts/lib/boundary-rules.mjs`, added in #298) denies every absolute write outside the build worktree while the run state names `build`, including the driver's own `.worktrees/.graph-run-state.json` flip and the `.worktrees/.graph-run-release.json` record the lock removal needs. The driver did not route around it. Owner step: `rm .worktrees/.graph-run-state.json .worktrees/.graph-run.lock` from the launch root.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-234` | edit | "Accept the six entries, the type-setting clean-up and the added-words rule as written. One addition to the last `measured at build` note: after the curated-topics count, also record the curated-topic rule characters per In-Depth corpus case, before → after. Five of the six terms pull extra In-Depth topics for about 3,000 cards, and nothing else in this change measures how much longer those prompts get. In-Depth answers already run close to the 30-second budget. Record it only; no new bar, because there is no measurement to set one from." |
| `REQ-236` | accept | — |

Applied inside `GATE-QUESTIONS.md`: the last `measured at build` note of REQ-234 now ends with the curated-topic rule characters per In-Depth corpus case, before → after, recorded only with no bar.

### Brief reconciliation

- grep: `grep -nE 'curated|In-Depth topic|gain a topic|topic additions|topics in all' DESIGN-BRIEF.md README.md`
- `DESIGN-BRIEF.md:72` (side effects, In-Depth curated topics) — said the build records how many corpus cases gain a topic → now also records curated-topic rule characters per In-Depth corpus case, before → after, no bar (REQ-234 edit)
- `DESIGN-BRIEF.md:74` (side effects, prompt size) — said the build records In-Depth topic additions → now includes the same characters figure (REQ-234 edit)
- `DESIGN-BRIEF.md:94` (build step 9) — listed In-Depth topic additions on the corpus → now adds the characters before → after, recorded only (REQ-234 edit)
- `README.md` pointer — no passage contradicts the verdict; `intake/` states no superseded behaviour (the edit adds a measurement); no supersession note needed
- Re-run of the grep: remaining hits (`DESIGN-BRIEF.md:38, 67, 133, 141`) state design facts the edit does not contradict; the assumption row A6 stays valid (new topic picks recorded, not blocked)

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261013-034606`. Run the `graph-preflight` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md` and follow its Procedure exactly). Copy the Working directory line above, unchanged, into any prompt you write.

Inputs:
- --branch thejudge-auto/concept-map-wording-entries
- --slug concept-map-wording-entries
- --run-id graph-20261013-034606
- --pid 27897

Steps:
1. From the launch root (run `pwd` first in the same call to confirm it is /Users/chrismiho/Coding/Projects/TheJudge): `npm run graph:preflight -- --branch thejudge-auto/concept-map-wording-entries --slug concept-map-wording-entries --run-id graph-20261013-034606 --pid 27897 --dry-run`
2. If it exits 1 or 2, stop and report its message verbatim. Do not hand-resolve anything.
3. Otherwise run the identical command without `--dry-run`.
4. Confirm the end state: the lock file exists at the absolute path /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock (cat it); `git -C` is not allowed, so use `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries && git branch --show-current`; `git ls-remote --heads origin thejudge-auto/concept-map-wording-entries`; and at the launch root `git branch --show-current` must still be `main`.
5. Issue the script's printed CANARY_COMMAND as its own Bash call and require a deny. Then issue the printed GRAPH_CANARY_COMMAND as its own Bash call and require a deny (the lock is held now). Do not retry a denied call. If either canary is allowed, stop and report BLOCKED with what came back.

Rules: change no files by hand; run git as short separate calls; spawn no subagents; never commit, stash, or switch the launch checkout; never force-push; never delete anything.

Report back, as plain lines: shape:, base:, worktree:, branch pushed (yes/no with ls-remote output), launch branch, lock record contents, Profile line, canary result with the deny reason text, graph canary result with the deny reason text, and the exit codes.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries

You are node 2 (`shape`) of graph run `graph-20261013-034606`. Run the `thejudge-kickoff` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries/.claude/skills/thejudge-kickoff/SKILL.md` and its reference files) in graph mode. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Package slug (use verbatim): `concept-map-wording-entries`. Branch: `thejudge-auto/concept-map-wording-entries` (already checked out in the worktree).

The owner's request: Six more card-wording entries in the concept map so rule search reaches triggered-ability, cost, casting, layer and toughness rules, with a model retrain.

Intake: one file, staged at the absolute path `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261013-034606/GRAPH-BRIEF.md`. Copy it byte for byte to `PRD/work/concept-map-wording-entries/intake/GRAPH-BRIEF.md` and confirm with `cmp`. Intake is evidence, never authority. It originally lived in the untracked probe folder `PRD/work/probe-concept-map-wording/` of the launch checkout; the sibling files it cites there (`concept-map-proposals.md`, `concept-map-candidates.patch`, `HANDOFF.md`) are citations: record their launch-checkout paths only, never open them.

Do:
1. Create `PRD/work/concept-map-wording-entries/` with `IDEA.md`, `README.md`, and exactly one marker `STATUS.ideation`, per the skill.
2. Grep `PRD/instructions/receipts/` for prior runs on the same ground (concept map, rule search, rule-search model retrain) and write one `## Prior run` line per match into `IDEA.md`.
3. Add the board row to `PRD/work/STATUS.md` under ideation.
4. Commit and push in the worktree as short separate calls: `cd <worktree> && git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`. Spawn no subagents. Do not edit `PRD/sections/`, code, or any skill. No paid or network calls other than `git push`. Stay well under 60 tool calls.

Report back: the files created, the `cmp` result, the prior-run matches, the commit sha, and the push result. If the request cannot become a package, return `NO ACTIONABLE PACKAGE` with the reason.

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries

You are node 3 (`define`) of graph run `graph-20261013-034606`. Run the `thejudge-refinement` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries/.claude/skills/thejudge-refinement/SKILL.md` and its reference files) in graph mode on the package `PRD/work/concept-map-wording-entries/`. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close`, `## The two runs`, `## Intake is evidence, never authority`, and `### No pre-authorization of product decisions`, and `PRD/instructions/plain-language-standard.md`.

The request: Six more card-wording entries in the concept map so rule search reaches triggered-ability, cost, casting, layer and toughness rules, with a model retrain. The package's `intake/GRAPH-BRIEF.md` carries the probe's measurements, the six entry patterns, and the proposed build steps. Intake is evidence, never authority: every product-truth change it implies is proposed for the owner in `GATE-QUESTIONS.md`, not decided here. Its cited sibling files live untracked in the launch checkout at `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/`; record those paths as citations only and never open them.

Produce:
1. `DESIGN-BRIEF.md` in the package, per the skill, player-facing outcome first.
2. When product truth changes, `GATE-QUESTIONS.md` in the package: one `## <STABLE-ID>` block per new or amended stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no), then that ID's complete proposed diff against the current `PRD/sections/` text (never a summary), then `- Verdict:` and `- Reason:` left blank. A trailing `## Blocker questions` section only for a genuine decision blocker under the three-condition test in `PRD/instructions/preparation-contract.md`.
3. Set `STATUS.refined` as the only marker when done, and move the `PRD/work/STATUS.md` board row fully (remove from ideation, add under refined).

Ground rules:
- Verify current state against the code and `PRD/sections/` before restating any number the intake gives: the concept map entry count in `apps/backend/src/gameRulesConceptMap.ts`, the pinned counts in its test, the current model id in REQ-236 and the model manifest, and whether the follow-ups build (PR #297) changed anything the intake assumes. Where the intake and current state differ, current state wins and the brief says so.
- The decision log is retired: never add a `DEC-` entry; amend `REQ`/`FLOW` text in place. New stable IDs, if any, start at REQ-248 (REQ-247 is the highest in use).
- Enumerate every `PRD/sections/` passage the change touches with one quoted line-level grep (for example the entry count, the model id, REQ-234, REQ-236), and record a disposition row per hit in `PRD/work/concept-map-wording-entries/evidence/amendment-grep.md`.
- Name where every build deliverable lands. Nothing the build must keep may live under `PRD/work/`, which close deletes. The intake's measurement harness patch is untracked in the launch checkout only; the brief must say how the build reaches it.
- Practice-suite privacy: counts only, no question, answer, card list, id, or per-question result in any file; never write the suite's source name. Run `node scripts/privacy-scan.mjs` before committing.
- Do not retrain, run fold scoring, or run any long measurement; no paid, network, or data-refresh calls. Cheap reads, greps, and quick unit-test runs are fine. The intake's measurements are the probe's; the brief cites them and states the re-check the build makes.
- Do not edit `PRD/sections/`, code, tests, data, or any skill.
- Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Spawn no subagents. Stay well under 150 tool calls.

Report back: the brief's path and line count, the stable IDs proposed (new and amended) with slot count, any blocker questions, the amendment-grep hit count and dispositions, the marker, the commit sha, and the push result.

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261013-034606`. Run the `thejudge-quality-check` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-concept-map-wording-entries/.claude/skills/thejudge-quality-check/SKILL.md` and any reference files beside it) in graph mode on `PRD/work/concept-map-wording-entries/DESIGN-BRIEF.md`, together with the package's `GATE-QUESTIONS.md`, `evidence/amendment-grep.md`, `intake/GRAPH-BRIEF.md`, and `README.md`. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Check, among the skill's own criteria:
- every `-` and context line in each `GATE-QUESTIONS.md` diff matches current `PRD/sections/` text exactly, and each block opens with the three plain-language lines and has blank `- Verdict:` and `- Reason:` slots;
- every stable ID the brief changes has a slot, and no new ID collides with one in use on `origin/main`;
- the amendment grep, re-run as recorded, yields the recorded hit count with one disposition row per hit;
- the brief's stated current-state numbers (concept map entry count, pinned test counts, model id) match the code;
- no build deliverable lands under `PRD/work/`;
- `node scripts/privacy-scan.mjs` reports 0 matches.

Write the verdict to `PRD/work/concept-map-wording-entries/QUALITY-CHECK.md` as PASS or FAIL with the complete findings list. On FAIL set `STATUS.refining` as the only marker and move the board row fully; on PASS leave `STATUS.refined`. Do not write the README `## Preparation gate` section; the driver owns it.

Rules: verify directly with reads, greps, and quick commands; spawn no subagents or forks; no sleeping or polling; no retrain, fold scoring, long measurement, paid, network, or data-refresh calls. Do not edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, tests, data, or any skill. Change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Stay well under 60 tool calls.

Report back: PASS or FAIL, the complete findings list, the marker, the commit sha, and the push result.

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are the gate-resolution step of graph run `graph-20261013-042008` (the build half). Run the `graph-gate-review` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/graph-gate-review/SKILL.md` and follow it) on `PRD/work/concept-map-wording-entries/`. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree, on branch `thejudge-auto/concept-map-wording-entries-work`; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

The owner answered both slots in `GATE-QUESTIONS.md` and merged docs PR #300: REQ-234 `edit`, REQ-236 `accept`. Apply each verdict exactly as written in its `- Reason:` line to the proposed diff inside `GATE-QUESTIONS.md`. Reconcile `DESIGN-BRIEF.md` (and the README's intake pointer, if any passage contradicts a verdict) to the REQ-234 edit, so the brief and the finalized proposal state one rule; leave `intake/` verbatim. Write `## Gate verdicts` into `GRAPH-RUN.md`, resolve `## Open gate`, and restore `STATUS.refined` as the only marker with the `PRD/work/STATUS.md` board row moved fully (removed from its old section, added under refined).

Rules: do not edit `PRD/sections/`, code, tests, data, or any skill. Change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Spawn no subagents; no sleeping or polling. Stay well under 60 tool calls.

Report back: verdict counts (accept / edit / reject), the `### Brief reconciliation` list (each passage changed, or none), the marker, the commit sha, and the push result.

### gate-qc (re-grade after verdicts)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 4 (`gate-qc`), attempt 1 of the build half, graph run `graph-20261013-042008`. Run the `thejudge-quality-check` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-quality-check/SKILL.md` and any reference files beside it) in graph mode on `PRD/work/concept-map-wording-entries/DESIGN-BRIEF.md`, together with the package's finalized `GATE-QUESTIONS.md`, the `## Gate verdicts` section of `GRAPH-RUN.md`, `evidence/amendment-grep.md`, `intake/GRAPH-BRIEF.md`, and `README.md`. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree, on branch `thejudge-auto/concept-map-wording-entries-work`; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

This is a re-grade after the owner's verdicts (REQ-234 edit, REQ-236 accept) were applied. Check, among the skill's own criteria:
- the finalized REQ-234 diff carries the owner's edit (curated-topic rule characters per In-Depth corpus case, before → after, recorded only, no bar), and `DESIGN-BRIEF.md` states the same rule everywhere it touches the In-Depth measurement;
- every `-` and context line in each `GATE-QUESTIONS.md` diff still matches current `PRD/sections/` text on this branch exactly;
- no new stable ID collides with one in use on `origin/main`;
- the amendment grep, re-run as recorded, still yields the recorded hit count with one disposition row per hit;
- no build deliverable lands under `PRD/work/`;
- `node scripts/privacy-scan.mjs` reports 0 matches.

Write the verdict to `PRD/work/concept-map-wording-entries/QUALITY-CHECK.md` as PASS or FAIL with the complete findings list. On FAIL set `STATUS.refining` as the only marker and move the board row fully; on PASS leave `STATUS.refined`. Do not write the README `## Preparation gate` section; the driver owns it.

Rules: verify directly with reads, greps, and quick commands; spawn no subagents or forks; no sleeping or polling; no retrain, fold scoring, long measurement, paid, network, or data-refresh calls. Do not edit `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `PRD/sections/`, code, tests, data, or any skill. Change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Stay well under 60 tool calls.

Report back: PASS or FAIL, the complete findings list, the marker, the commit sha, and the push result.

### plan

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 5 (`plan`), attempt 1, of graph run `graph-20261013-042008`. Run the `thejudge-map-out` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md`) in graph mode on `PRD/work/concept-map-wording-entries/`. The README `## Preparation gate` records Quality-check PASS. Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree, on branch `thejudge-auto/concept-map-wording-entries-work`; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Inputs: `DESIGN-BRIEF.md` (its build steps, stop conditions, deliverable table and suggested slices A measure / B map change / C retrain), the finalized `GATE-QUESTIONS.md` (REQ-234 with the owner's edit, REQ-236 accepted), the `## Gate verdicts` section of `GRAPH-RUN.md`, and `README.md`.

Write `GAMEPLAN.md`, one `slice-<letter>.md` per slice, and one `slice-<letter>.criteria.json` per slice (every criterion `false`, each with an evidence block, per the map-out reference). Set `STATUS.active` as the only marker and move the `PRD/work/STATUS.md` board row fully (removed from refined, added under active).

Carry these facts from the brief into the slice docs so the builder does not rediscover them:
- Preconditions belong to the first slice: copy `output/rule-search-eval/split.json` and `hard25.json` read-only from the launch checkout (both exist there now) into the worktree's `output/rule-search-eval/`; park if either is missing. Linked worktrees lack git-ignored caches, so the first slice also copies `apps/backend/data/models/` read-only from the launch checkout into the worktree (the local embedder and the previous model `rule-search-d2c2e500a4c6`), or local scoring silently falls back.
- The measurement harness patch is read by absolute path from the launch checkout and applied in the worktree only, then reverted before every commit with a `git diff --stat` check; never committed, never copied under `PRD/work/`.
- The stop conditions in brief steps 2, 4, 7 and 8 are park points, quoted into the slice that runs them.
- The owner's REQ-234 edit: record curated-topic rule characters per In-Depth corpus case, before → after, recorded only with no bar.
- Product truth (REQ-234, REQ-236 in `PRD/sections/functional-requirements.md`) is applied by intent in the slice that lands the matching code.
- Every deliverable lands where the brief's deliverable table says. Nothing the build keeps may live under `PRD/work/`, which close deletes.
- Practice-suite privacy: counts only in every committed file, PR body and comment; never the suite's source name; `node scripts/privacy-scan.mjs` before every commit.

Rules: do not write code, tests, data, `PRD/sections/`, or any skill; this node plans only. No training, scoring, long measurement, paid, network, or data-refresh calls. Change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Spawn no subagents; no sleeping or polling. Stay well under 120 tool calls.

Report back: the slice list with one line each, the criteria count per slice, where every deliverable lands (confirm none under `PRD/work/`), the marker, the commit sha, and the push result.

### plan (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 5 (`plan`), attempt 2, of graph run `graph-20261013-042008`, in graph mode under the `thejudge-map-out` skill (`/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-map-out/SKILL.md`). Copy the Working directory line above, unchanged, into any prompt you write. Work only inside that worktree, on branch `thejudge-auto/concept-map-wording-entries-work`; never write to the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge.

Attempt 1 (commit `609071a7`) is sound except for one placement error. In a graph run the receipt under `PRD/instructions/receipts/` is written by `thejudge-cleanup` at the `close` node, at the same `<slug>-<date>.md` path, so the build must not write it. Make this bounded fix and nothing else:
- In `PRD/work/concept-map-wording-entries/slice-c-retrain.md`, the builder does not write a receipt. Every place the slice sends a figure or list to the receipt (requirement 4 lost hits, requirement 7, the matching acceptance criteria) sends it instead to the code PR body, and also to a git-ignored log under `output/rule-search-eval/`; state that `close` copies them from the PR body into the receipt. Remove `PRD/instructions/receipts/` from the slice's files touched.
- Update `slice-c.criteria.json` to match: the receipt criterion becomes one whose evidence is the PR body carrying the measured numbers, lost hits, upload step and slice B's In-Depth figures; keep every criterion `false`.
- Check `GAMEPLAN.md`, `slice-a-measure.md` and `slice-b-map-change.md` for the same instruction (any builder-written receipt) and fix it the same way; touch nothing else.

Rules: do not write code, tests, data, `PRD/sections/`, or any skill. Change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Run `node scripts/privacy-scan.mjs` before committing. Spawn no subagents; no sleeping or polling. Stay well under 40 tool calls.

Report back: each file changed with the passage changed, the criteria count per slice, the commit sha, and the push result.

### build

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 6 (`build`), attempt 1, of graph run `graph-20261013-042008`. Run the `thejudge-implement-all` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-implement-all/SKILL.md` and its reference files) in graph mode on `PRD/work/concept-map-wording-entries/`. Shared branch: `thejudge-auto/concept-map-wording-entries-work` (already checked out in the working directory; work in it in place, no second worktree, no contributor branch). Copy the Working directory line above, unchanged, into any prompt you write.

Implement slices A, B and C of `GAMEPLAN.md` in order, each against its own slice doc and `slice-<letter>.criteria.json`. Open the code PR `thejudge-auto/concept-map-wording-entries-work → main` with `gh pr create --base main --head thejudge-auto/concept-map-wording-entries-work`, titled `[THEJUDGE-AUTO][READY] Six concept-map wording entries and retrain (concept-map-wording-entries)` once ready, and post the registration marker the skill's reference names (`<!-- thejudge-auto:v1:registered:concept-map-wording-entries -->`). Never merge or close a PR. The PR body opens with the plain-language block from `PRD/instructions/plain-language-standard.md` and carries the measured numbers, lost hits, upload step and In-Depth figures (counts only) that `close` copies into the receipt; do not write a receipt yourself.

Apply product truth by intent: REQ-234 (in slice B, with the owner's edit) and REQ-236 (in slice C) in `PRD/sections/functional-requirements.md`, re-derived from the finalized `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` against current text, together with the code.

Write scope: every file you create or change lies inside the working directory above. Read-only sources in the launch checkout, by absolute path, are allowed: `/Users/chrismiho/Coding/Projects/TheJudge/output/rule-search-eval/` (split.json, hard25.json), `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite/`, `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/`, and the harness patch `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch`. Copy them into the worktree; never write, move or delete anything in the launch checkout. All package bookkeeping (slice status, criteria files, `STATUS.*` marker, `PRD/work/STATUS.md` board row) is written in the worktree's own `PRD/work/` copy, committed and pushed on the shared branch.

Park points: the stop conditions quoted in the slice docs (brief steps 2, 4, 7 and 8) are genuine owner gates. When one fires, stop building, record the numbers in the slice doc, commit and push, and report the park with its evidence. Never drop, narrow or re-tune an entry, change the recipe, or lower a bar on your own.

Long commands: training and cross-validation scoring take a while. Run them with the Bash tool's `run_in_background` option and wait for the completion notification, or with a foreground timeout up to 600000 ms; never `nohup`, a trailing `&`, sleep loops or polling. Check each scorer run used the local embedder and the intended model, not a silent lexical fallback, before trusting its numbers.

Privacy: practice-suite counts only in every committed file, PR body and comment; never the suite's source name; `node scripts/privacy-scan.mjs` before every commit.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Do not modify any skill, `.claude/settings*.json`, or `CLAUDE.md`. Do not upload, deploy, or spend; no data refresh.

Report back: per slice, status and criteria earned; the measured numbers; any park with its evidence; the PR URL; the final commit sha and push result; and the complete list of paths you wrote, as absolute paths.

### build (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 6 (`build`), attempt 2, of graph run `graph-20261013-054503`. Run the `thejudge-implement-all` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-implement-all/SKILL.md` and its reference files) in graph mode on `PRD/work/concept-map-wording-entries/`. Shared branch: `thejudge-auto/concept-map-wording-entries-work` (already checked out in the working directory; work in it in place, no second worktree, no contributor branch). Copy the Working directory line above, unchanged, into any prompt you write.

Resume, do not restart. Attempt 1 parked slice A at brief step 2; the owner has resolved it (see `## Open gate` in `GRAPH-RUN.md` and the note at the top of `slice-a-measure.md`): the five fold models already trained in `output/rule-search-model/onnx/F-fold0..4` are the baseline (check 539, tuning 529, every-rule check 185 / tuning 171, hard 25 20 of 59, corpus 438 / 372, bench@5 128; full log `output/rule-search-eval/baseline-cv.log`). Do not retrain them. Continue slice A at step 3 (set re-check on those folds, every bar compared against those baseline figures), then steps 4 to 6, then slices B and C in order. The step 7 retrain park in slice C (retrained check half below 522) stays exactly as written. The git-ignored inputs (split.json, hard25.json, `apps/backend/data/models/`, the venv and base model) are already in the worktree.

Criteria evidence is keyed by run id, and attempt 1 ran under `graph-20261013-042008`, so none of it carries over. Earn each criterion under this run by issuing its evidence command or path again where that is cheap (a copy, a file check, a scoring run on the existing folds). Never retrain a model only to earn evidence.

Open the code PR `thejudge-auto/concept-map-wording-entries-work → main` with `gh pr create --base main --head thejudge-auto/concept-map-wording-entries-work`, titled `[THEJUDGE-AUTO][READY] Six concept-map wording entries and retrain (concept-map-wording-entries)` once ready, and post the registration marker the skill's reference names (`<!-- thejudge-auto:v1:registered:concept-map-wording-entries -->`). Never merge or close a PR. The PR body opens with the plain-language block from `PRD/instructions/plain-language-standard.md` and carries the measured numbers (including the adopted baseline and why), lost hits, upload step and In-Depth figures (counts only) that `close` copies into the receipt; do not write a receipt yourself.

Apply product truth by intent: REQ-234 (in slice B, with the owner's edit) and REQ-236 (in slice C) in `PRD/sections/functional-requirements.md`, re-derived from the finalized `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` against current text, together with the code.

Write scope: every file you create or change lies inside the working directory above. Read-only sources in the launch checkout, by absolute path, are allowed: `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite/` and the harness patch `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch`. Never write, move or delete anything in the launch checkout. All package bookkeeping (slice status, criteria files, `STATUS.*` marker, `PRD/work/STATUS.md` board row) is written in the worktree's own `PRD/work/` copy, committed and pushed on the shared branch.

Park points: the remaining stop conditions quoted in the slice docs (brief steps 4, 7 and 8) are genuine owner gates. When one fires, stop building, record the numbers in the slice doc, commit and push, and report the park with its evidence. Never drop, narrow or re-tune an entry, change the recipe, or lower a bar on your own.

Long commands: training and cross-validation scoring take a while. Run them with the Bash tool's `run_in_background` option and wait for the completion notification, or with a foreground timeout up to 600000 ms; never `nohup`, a trailing `&`, sleep loops or polling. Check each scorer run used the local embedder and the intended model, not a silent lexical fallback, before trusting its numbers. Do not end your turn while a background command of yours is still running.

Privacy: practice-suite counts only in every committed file, PR body and comment; never the suite's source name; `node scripts/privacy-scan.mjs` before every commit.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Do not modify any skill, `.claude/settings*.json`, or `CLAUDE.md`. Do not upload, deploy, or spend; no data refresh.

Report back: per slice, status and criteria earned; the measured numbers; any park with its evidence; the PR URL; the final commit sha and push result; and the complete list of paths you wrote, as absolute paths.

### build (attempt 3)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 6 (`build`), attempt 3, of graph run `graph-20261013-054503`. Run the `thejudge-implement-all` skill (read `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-implement-all/SKILL.md` and its reference files) in graph mode on `PRD/work/concept-map-wording-entries/`. Shared branch: `thejudge-auto/concept-map-wording-entries-work` (already checked out in the working directory; work in it in place, no second worktree, no contributor branch). Copy the Working directory line above, unchanged, into any prompt you write.

Resume, do not restart. Attempt 2 parked slice A at brief step 4; the owner has resolved it (see `## Open gate` in `GRAPH-RUN.md` and the note at the top of `slice-a-measure.md`): ship the six entries as measured, unchanged; never narrow or drop one. The adopted baseline folds `output/rule-search-model/onnx/F-fold0..4` stay; do not retrain them. Continue at slice A step 5, then step 6, then slices B and C in order.

Step 5: re-measure the `attached` tweak to entry 81 and the type-setting narrowing (m-1) one at a time on the same folds, each with the six on, and compare against the accepted set result (check 558, tuning 536, every-rule check 182 / tuning 176, hard 25 19, corpus 441 / 372 → 374, bench@5 127). Keep a tweak only if no figure drops against that set result; report each either way. This is a keep-or-drop rule, not a park.

Keep per-question results for the overnight analysis that follows this build, git-ignored only: before reverting the harness, run the set scoring once more and save its per-question file as `output/rule-search-eval/percase-cv-set.json` (the baseline's is already `percase-cv-baseline.json`). After slice C's retrain, keep the retrained model's cross-validated per-question file as `output/rule-search-eval/percase-cv-retrained.json`. Never commit these.

Criteria evidence is keyed by run id; earlier attempts' evidence may not carry over. Earn each criterion under this run by issuing its evidence command or path again where that is cheap. Never retrain a model only to earn evidence.

Open the code PR `thejudge-auto/concept-map-wording-entries-work → main` with `gh pr create --base main --head thejudge-auto/concept-map-wording-entries-work`, titled `[THEJUDGE-AUTO][READY] Six concept-map wording entries and retrain (concept-map-wording-entries)` once ready, and post the registration marker the skill's reference names (`<!-- thejudge-auto:v1:registered:concept-map-wording-entries -->`). Never merge or close a PR. The PR body opens with the plain-language block from `PRD/instructions/plain-language-standard.md` and carries the measured numbers (the adopted baseline and why, the set result the owner accepted and its one-question losses, the retrain figures), lost hits, upload step and In-Depth figures (counts only) that `close` copies into the receipt; do not write a receipt yourself.

Apply product truth by intent: REQ-234 (in slice B, with the owner's edit) and REQ-236 (in slice C) in `PRD/sections/functional-requirements.md`, re-derived from the finalized `GATE-QUESTIONS.md` and `DESIGN-BRIEF.md` against current text, together with the code. Record the measured numbers truthfully, including the accepted losses.

Write scope: every file you create or change lies inside the working directory above. Read-only sources in the launch checkout, by absolute path, are allowed: `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite/` and the harness patch `/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-concept-map-wording/concept-map-candidates.patch`. Never write, move or delete anything in the launch checkout. All package bookkeeping (slice status, criteria files, `STATUS.*` marker, `PRD/work/STATUS.md` board row) is written in the worktree's own `PRD/work/` copy, committed and pushed on the shared branch.

Park points: the remaining stop conditions in slice C (brief steps 7 and 8) are genuine owner gates. When one fires, stop building, record the numbers in the slice doc, commit and push, and report the park with its evidence. Never change the recipe or lower a bar on your own.

Long commands: training and cross-validation scoring take a while. Run them with the Bash tool's `run_in_background` option and wait for the completion notification, or with a foreground timeout up to 600000 ms; never `nohup`, a trailing `&`, sleep loops or polling. Check each scorer run used the local embedder and the intended model, not a silent lexical fallback, before trusting its numbers. Do not end your turn while a background command of yours is still running.

Privacy: practice-suite counts only in every committed file, PR body and comment; never the suite's source name; `node scripts/privacy-scan.mjs` before every commit.

Mechanics: change files with the Write and Edit tools only; no heredocs, no `sed -i`. Run git as short separate calls from the worktree: `git add <explicit paths>`, then `git commit -m ...`, then `git push`. Never `git add -A` or `git add .`. Do not modify any skill, `.claude/settings*.json`, or `CLAUDE.md`. Do not upload, deploy, or spend; no data refresh.

Report back: per slice, status and criteria earned; the measured numbers; any park with its evidence; the PR URL; the final commit sha and push result; and the complete list of paths you wrote, as absolute paths.

### review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 7 (`review`), attempt 1, of graph run `graph-20261013-054503`: a fresh-context, no-write reviewer. You have no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Copy the Working directory line above, unchanged, into any prompt you write. Spawn no subagents; no sleeping or polling; stay well under 120 tool calls.

What to review: the code PR https://github.com/ChrisMiho/TheJudge/pull/302 (`thejudge-auto/concept-map-wording-entries-work` into `main`, head `30e95ad9`). Read the diff with `git diff origin/main...HEAD` from the working directory, the PR body with `gh pr view 302`, and the package artifacts in `PRD/work/concept-map-wording-entries/`: `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md`, `GAMEPLAN.md`, the three slice docs and their `.criteria.json` files, and `GRAPH-RUN.md` (its `## Open gate` records two owner decisions: the fresh baseline folds were adopted as the baseline, and the six entries ship as measured despite one-question losses; criteria whose park branch the owner resolved count as satisfied by that decision). Git-ignored logs under `output/rule-search-eval/` and `output/rule-search-model/` are evidence you may read.

Rubric: the slices' own acceptance criteria, quoted here, and nothing else.

Slice A:
- `output/rule-search-eval/split.json` and `hard25.json` are present in the worktree, copied from the launch checkout (launch checkout untouched)
- `apps/backend/data/models/` (local embedder and `rule-search-d2c2e500a4c6`) is present in the worktree, copied read-only from the launch checkout
- Baseline folds trained and scored; check half, tuning half and corpus citations each within 5 of 522 / 511 / 442, with all baseline figures recorded; otherwise the slice is parked, not passed
- Set re-check recorded: check half up, no other figure down, 14 of 14 labelled checks, built-prompt checks pass; or each entry measured alone and parked for the owner with the numbers
- `attached` tweak and type-setting narrowing re-measured on the same folds; keep/drop decision and figures recorded for each
- Harness patch reverted: `git diff --stat` shows no harness edit and no tracked change outside `PRD/work/concept-map-wording-entries/`
- The harness patch file is not copied under `PRD/work/` and nothing from this slice is stored under `PRD/work/` except status text
- `node scripts/privacy-scan.mjs` passes before the status commit
Slice B:
- `gameRulesConceptMap.ts` has 84 oracle-text entries whose patterns and terms match the brief's table, with no harness code or `CONCEPT_CANDIDATES` reference
- `attached` tweak and type-setting narrowing are applied exactly when slice A recorded keep, and not otherwise
- `gameRulesConceptMap.test.ts` has at least 6 match and 6 non-match tests for each of the six entries and passes with pins 84 entries and 165 words over 89 entries
- The Ephemeral Hydra upkeep example expects `handling triggered abilities`
- The file header says 77 ported, the 78th and 79th-84th owner-reviewed additions
- Changed eval goldens are re-recorded under `apps/backend/src/eval/fixtures/` and each diff reviewed as an expected concept-term or topic change
- In-Depth topic additions on the corpus and curated-topic rule characters per In-Depth corpus case, before -> after, are recorded in the REQ-234 build note (counts only, no bar)
- `inDepthTopicGuard.test.ts` passes at or above 17 of 30
- REQ-234 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block including the owner's edit; no other REQ changed
- `npm run quality:check` and `npm test` are green (or, if the rules gate fails on the current model, the slice is merged with C per requirement 6)
- `git diff --stat` before commit shows no harness change; `node scripts/privacy-scan.mjs` passes; nothing kept lives under `PRD/work/`
Slice C:
- Training pairs re-exported and the five fold models plus the 100% model trained with the unchanged recipe on the committed map
- Retrained check half is at least 522 and every REQ-236 floor is met (check >= 430, tuning >= 410, every-rule check >= 140, hard 25 >= 15; 100% model corpus >= 410 and >= 355, bench@5 >= 118, Necropotence top ten in both modes); any figure below the previous model's is reported
- 14 of 14 labelled checks and the benchmark recall@5 floors pass on the retrained model
- All five vector files and `embeddingModel.manifest.json` name the new model id and `embeddingModel.test.ts` passes
- `docs/aws/model-upload.md` names the new id and size; the upload copy is staged under `output/rule-search-model/upload/<id>` and not committed
- The rules gate is re-baselined exactly once in `apps/backend/src/eval/rules-gate/baseline.json`, with the total of deciding rules reaching the prompts not lower, and every lost hit listed by case and rule in the PR body and the git-ignored log under `output/rule-search-eval/`
- Rule characters per prompt recorded for the new model and backfilled for the previous model (7,478 practice, 4,412 corpus); built-prompt corpus sizes recorded; leak check re-run and passing on the retrained model
- REQ-236 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block; no other REQ changed in this slice
- The code PR body carries the measured numbers, lost hits, upload step and slice B's In-Depth figures, counts only, for `close` to copy into the receipt (no receipt written by the build)
- `inDepthTopicGuard.test.ts` still at or above 17 of 30
- `npm run quality:check` and `npm test` are green and `node scripts/privacy-scan.mjs` passes
- No weights, pairs, fold models or per-question results are tracked, and nothing kept lives under `PRD/work/`

Check each criterion against the diff and the evidence, not against the builder's narration. Run cheap read-only checks where useful (for example `npx vitest run apps/backend/src/gameRulesConceptMap.test.ts` from `apps/backend`, `node scripts/privacy-scan.mjs`, `git ls-files output`, grep of the REQ-234 and REQ-236 text against `GATE-QUESTIONS.md`); do not retrain or run long scoring.

Severity: Critical or Important only for a gap against a quoted criterion or a correctness defect in the changed code or product truth. A preference, a style note, or an improvement outside these criteria is never Critical or Important and must be rated Minor. Do not manufacture findings.

Report back: APPROVE or CHANGES REQUESTED; then findings, each with severity (Critical / Important / Minor), the criterion it maps to, file and line, and the evidence; then one line per criterion with met or not met.

### build (attempt 4, review loop 1)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 6 (`build`), attempt 4, of graph run `graph-20261013-054503`, in graph mode under the `thejudge-implement-all` skill (`/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries/.claude/skills/thejudge-implement-all/SKILL.md`). Shared branch: `thejudge-auto/concept-map-wording-entries-work`, PR https://github.com/ChrisMiho/TheJudge/pull/302. Copy the Working directory line above, unchanged, into any prompt you write. This is a bounded fix after review loop 1; change nothing beyond these three items.

1. REQ-234 build note (`PRD/sections/functional-requirements.md`, the `measured at build, 2026-10-13` line under REQ-234, near line 6229). The finalized `GATE-QUESTIONS.md` (line 55) requires the type-setting exclusions part to read `kept (<figures>, <n> of 372 card matches removed)`. Count it: over the committed card data with the card's own name replaced, the same way define counted 372, count the cards the 78th entry (type-setting) matches with the pattern as it is on `origin/main`, and the cards it matches with the pattern on this branch. Removed = the first count minus the second. Write `<removed> of <first count> card matches removed` into that part of the note, keeping the existing figures. If the first count is not 372, write the count you measured and say so in your report; never write a number you did not measure.
2. REQ-236 build note (same file, near line 6293). Replace `(latency not re-measured)` with the measured latency. Measure it yourself: `npx tsx scripts/latency-q8check.mjs --model output/rule-search-model/onnx/R-foldall --data output/rule-search-model/data-retrain` from the working directory; record the median ms per query it prints (the reviewer saw 2.7 ms) next to the mean cosine and size already there.
3. PR body: the sentence listing figures below the previous model's also names the 100% model's corpus 471 vs 472 citations and 392 vs 395 cases. Edit it with `gh pr edit 302 --body-file <file>` from a file under the worktree's `.tmp/`; keep the registration marker as the first line and everything else unchanged.

Then run `npx vitest run src/gameRulesConceptMap.test.ts` from `apps/backend`, `node scripts/privacy-scan.mjs`, and `npm run format:check`; commit only `PRD/sections/functional-requirements.md` with an explicit `git add`; push. Do not retrain, re-score, or touch any other file. Write scope: inside the working directory only. Mechanics: Write and Edit tools only for file changes, no heredocs, no `sed -i`; git as short separate calls; never `git add -A` or `git add .`. Spawn no subagents; no sleeping or polling; stay well under 60 tool calls.

Report back: the two counts and the removed figure, the latency figure, the exact new text of both note fragments, the PR body edit, test and scan results, the commit sha and push result, and every path you wrote, as absolute paths.

### review (attempt 2)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-concept-map-wording-entries

You are node 7 (`review`), attempt 2, of graph run `graph-20261013-054503`: a fresh-context, no-write reviewer. You have no Write, Edit or NotebookEdit tool and must not change any file, commit, push, or comment on the PR. Copy the Working directory line above, unchanged, into any prompt you write. Spawn no subagents; no sleeping or polling; stay well under 60 tool calls.

Review loop 1 on head `30e95ad9` of PR https://github.com/ChrisMiho/TheJudge/pull/302 found every acceptance criterion met except two, both Important, both in `PRD/sections/functional-requirements.md`:
- Slice B criterion: REQ-234 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block including the owner's edit; no other REQ changed. Gap: the REQ-234 build note lacked the type-setting exclusions' `<n> of 372 card matches removed` that `PRD/work/concept-map-wording-entries/GATE-QUESTIONS.md` line 55 requires.
- Slice C criterion: REQ-236 in `PRD/sections/functional-requirements.md` matches the finalized `GATE-QUESTIONS.md` block; no other REQ changed in this slice. Gap: the REQ-236 build note lacked the q8 latency `<n> ms per query` that `GATE-QUESTIONS.md` line 109 requires.
A Minor note asked the PR body to name the 100% model's corpus 471 vs 472 and 392 vs 395 among figures below the previous model's.

The fix is commit `2e98f872`. Check, against ground truth rather than the commit message:
1. `git diff 30e95ad9 2e98f872` touches only those two notes, and each now carries a measured figure in the shape its `GATE-QUESTIONS.md` line requires. Verify the figures cheaply and read-only: the latency with `npx tsx scripts/latency-q8check.mjs --model output/rule-search-model/onnx/R-foldall --data output/rule-search-model/data-retrain`; the card-match counts by any read-only means you trust (the 78th concept-map entry's pattern on `origin/main` versus this branch, over the committed card data with each card's name replaced by `~`), or say plainly if you could not reproduce them.
2. REQ-234 and REQ-236 now match their finalized `GATE-QUESTIONS.md` blocks in full, and no other REQ changed.
3. `gh pr view 302` body still opens with the `thejudge-auto:v1:registered:concept-map-wording-entries` marker.
4. `node scripts/privacy-scan.mjs` reports 0 matches.

Severity: Critical or Important only for a gap against those two quoted criteria or a correctness defect the fix introduced. Anything else is Minor and never loops the build. Do not manufacture findings.

Report back: APPROVE or CHANGES REQUESTED; findings with severity, criterion, file and line, and evidence; and met or not met for the two criteria.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Six more card-wording entries in the concept map so rule search reaches triggered-ability, cost, casting, layer and toughness rules, with a model retrain" | answered-once | shape | — |
| "fill in your suggestions, ask me for ones you truly cant answer" | answered-once | owner-action | — |
| "agreed, i follow your recommendation" | answered-once | build | — |
| "i want to follow your recommendations, but i also want to express that if the updates are fixing in some areas and not in others, then id like to investigate that overnight while i sleep" | answered-once | build | — |
