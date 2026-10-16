# Receipt — ci-warnings-cleanup — 2026-10-16

**What happened:** The red-and-yellow warning list on the GitHub check run (the automatic test run on every change) is cleared. The check run now uses the current versions of its helper actions, which run on the Node 24 engine, and it names Ubuntu 24.04 outright instead of "latest". The 19 code-lint warnings (style notes from the code checker) are gone: 15 files that mixed components with helper code now keep helpers in their own small files, one scroll hook is fixed without changing scroll-to-latest, and three unused lint-disable comments are deleted. The game itself behaves the same. Code PR: https://github.com/ChrisMiho/TheJudge/pull/316 (open, not yet merged).

**What it means for you:** Merge PR #316 to ship it. Nothing changes for players. After the merge, do the post-merge reading under Follow-ups below to confirm the real deploy run is clean.

- Date: 2026-10-16
- Slug: `ci-warnings-cleanup`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/316
- Spec-forming half run: `graph-20261016-061526` (docs PR #315). Build half run: `graph-20261016-092729`.

## Actions taken

- Slice A: pinned `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `aws-actions/configure-aws-credentials@v6`; all six `runs-on` lines now `ubuntu-24.04`. Only `uses:` and `runs-on:` lines changed.
- Slice B: `npm run lint` from 19 warnings to 0 (15 fast-refresh in 9 files, one hook-deps warning in `ConversationThread.tsx`, 3 unused disables). Fast-refresh files were split into sibling modules, imports updated only.
- `PRD/sections/`: no change needed and none promoted. The package proposed no product truth (no `GATE-QUESTIONS.md`).
- `PRD/work/STATUS.md`: ship-ready row for `ci-warnings-cleanup` removed.
- `PRD/work/ci-warnings-cleanup/` deleted with `git rm -r`, after this receipt was written.

## Files

Created (code): `apps/frontend/src/components/ambientSceneFallback.ts`, `apps/frontend/src/components/frozenGameContextTriggerLabel.ts`, `apps/frontend/src/components/sheetCloseContext.ts`, `apps/frontend/src/lib/feedback/feedbackSeam.ts`, `apps/frontend/src/lib/portal/AssistantSeedProvider.tsx`, `apps/frontend/src/lib/portal/BrandTapProvider.tsx`, `apps/frontend/src/lib/portal/LeftEdgeDrawerProvider.tsx`, `apps/frontend/src/test/StatefulEnrichmentHarness.tsx`, `apps/frontend/src/test/enrichmentFixtures.ts`, and this receipt.

Updated: `.github/workflows/quality-check.yml`, `PRD/work/STATUS.md`, `apps/backend/src/eval/contextEvaluationHarness.test.ts`, `apps/frontend/src/App.tsx`, `apps/frontend/src/components/AmbientScene.test.tsx`, `AmbientScene.tsx`, `ConversationThread.tsx`, `EnrichmentStep.tsx`, `FrozenGameContextDetails.test.tsx`, `FrozenGameContextDetails.tsx`, `SheetShell.tsx` (all under `apps/frontend/src/components/`), `portal/FeaturePortalMenu.test.tsx`, `portal/MtgAssistantApp.tsx`, `portal/ThemeSection.tsx`, `portal/destinationRegistry.tsx`, `portal/life-tracker/GameSetupPanel.tsx`, `trade/TradeBalancer.tsx`, `apps/frontend/src/lib/feedback/FeedbackContextProvider.test.tsx`, `FeedbackContextProvider.tsx`, `apps/frontend/src/lib/portal/brandTapContext.tsx`, `leftEdgeDrawerContext.tsx`, `seedContext.test.tsx`, `seedContext.tsx`, `apps/frontend/src/test/enrichmentStep.tsx`.

Deleted: everything under `PRD/work/ci-warnings-cleanup/` (README, IDEA, DESIGN-BRIEF, GAMEPLAN, GRAPH-RUN, both slice docs and criteria files, `STATUS.ship-ready`, and `intake/ci-warnings-capture.md`).

## Verification

- Review (node 7): APPROVE, 16 of 16 criteria met (A1-A6, B1-B10), 0 Critical, 0 Important, 1 Minor.
- Reviewer re-ran `npm run lint` (0), `npm run typecheck` (0), `ci-workflow-parity` (5/5), 13 frontend test files (195 tests), `npm run quality:check` (0).
- A6: PR Quality Check run `38926832228` on head `2cfcfa43` succeeded, six jobs, zero annotations each.
- Close checks (PR-ready path): branch `thejudge-auto/ci-warnings-cleanup-work`, HEAD equals origin tip `b9c48682`; PR #316 open, base `main`; every criterion in both criteria files `true`.

## Follow-ups for the owner

1. Post-merge reading (a check, not a gate; `changes` and `deploy` never run on a PR): on the `main` run after merge, the `changes` and `deploy` jobs succeed with zero annotations, and one live question is answered with the embedder loaded (the local search model) with no lexical-fallback WARN in CloudWatch.
2. Make lint warnings fail CI: add `--max-warnings 0` so a new warning blocks a PR. A lint-policy change that needs its own product-truth entry.
3. Move to Ubuntu 26.04 on purpose: switch the PR-only jobs first, watch a few runs, then the deploy job with a post-deploy check.
4. Dependabot: a config that keeps action versions current automatically.
5. Reviewer's Minor note, no change needed: four formerly private helpers are now exported from `frozenGameContextTriggerLabel.ts` and `ambientSceneFallback.ts`, as the file split requires.

## Graph run

- Run ID: `graph-20261016-092729` (build half; spec-forming half `graph-20261016-061526`) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/316
- PR: https://github.com/ChrisMiho/TheJudge/pull/316

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/ci-warnings-cleanup` pushed (`git ls-remote` → `f0241ec4`) from `.worktrees/kickoff-ci-warnings-cleanup`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261016-061526` | 2026-10-16 |
| 2 | shape | sonnet | ok | `0 → 12` | `PRD/work/ci-warnings-cleanup/` (IDEA.md, README.md, STATUS.ideation, intake/ci-warnings-capture.md) and board row committed `c122658a`, pushed; local `npm run lint` = 0 errors, 19 warnings | 2026-10-16 |
| 3 | define | opus | ok | `0 → 56` | `DESIGN-BRIEF.md`, `STATUS.refined`, board row committed `3c484ba8`, pushed; no `GATE-QUESTIONS.md` (no product-truth change) → no gate; driver re-checked chosen majors via `gh api repos/<action>/contents/action.yml?ref=<tag>` → all `node24` | 2026-10-16 |
| 4 | gate-qc | sonnet | ok | `0 → 11` | Quality-check PASS, findings none; recorded in README `## Preparation gate`; run stops here — docs PR opened, park at `owner-action` (`STATUS.owner-action`, board row moved) | 2026-10-16 |
| 5 | gate-review | driver | ok | `degraded (no run state)` | build half run `graph-20261016-092729`: docs PR #315 merged (`origin/main` `d94b34e1`); kickoff worktree removed clean (`git worktree remove`); claim commit `c006c90c` on `thejudge-auto/ci-warnings-cleanup-work` cut from `origin/main` `d94b34e1`, pushed; lock taken from the launch root; graph canary `nohup true` denied; no `GATE-QUESTIONS.md` → nothing to apply, driver restored `STATUS.refined` (only marker), README status, board row under refined | 2026-10-16 |
| 4 | gate-qc (build half, attempt 1) | sonnet | ok | `0 → 10` | PASS, findings none; brief re-checked against `origin/main` `d94b34e1`: `npx eslint .` in the worktree → 19 warnings (15 fast-refresh in 9 files, `ConversationThread.tsx:173` hook deps, 3 unused-disable) = brief; six jobs in `.github/workflows/quality-check.yml` all `runs-on: ubuntu-latest`, pins checkout/setup-node/upload-artifact/download-artifact/configure-aws-credentials `@v4` as described; no `PRD/sections/` change (only mention `non-functional-requirements.md:206` stays true on `ubuntu-24.04`); no files written; README `## Preparation gate` PASS recorded by the driver; worktree and launch-checkout porcelain empty | 2026-10-16 |
| 5 | plan | sonnet | failed | `0 → 11` | commit `fbe4d000` (= origin tip): `GAMEPLAN.md`, `slice-a-workflow-pins.md` + `slice-a.criteria.json` (7, 2 manual), `slice-b-lint-fixes.md` + `slice-b.criteria.json` (10, 1 manual), `STATUS.active`, board row under active; pins match `DESIGN-BRIEF.md:101-103`. Driver check failed it: `slice-a.criteria.json` A7 is post-merge only (`changes`/`deploy` never run on a PR, `slice-a-workflow-pins.md:24`), so `build` cannot earn it before the owner's merge and could not report `ok` honestly; precedent `PRD/instructions/receipts/follow-ups-keep-their-rules-2026-10-12.md:104` keeps post-merge checks as an owner-run GAMEPLAN reading. Re-dispatched as attempt 2 to move A7 there | 2026-10-16 |
| 5 | plan (attempt 2) | sonnet | ok | `0 → 7` | commit `d36c13a8` (= origin tip): A7 removed from `slice-a.criteria.json` and the slice A checklist; full check from `DESIGN-BRIEF.md` criterion 5 now an owner-run `## Post-merge reading` at `GAMEPLAN.md:27`, pointer at `slice-a-workflow-pins.md:24`; slice A 6 criteria (1 manual, A6 — PR run annotations, earnable in `build`), slice B 10 (1 manual) unchanged, every `value` false; `STATUS.active` only marker; board row under active; worktree porcelain empty (published for `build`) | 2026-10-16 |
| 6 | build | sonnet | ok | `0 → 65` | PR https://github.com/ChrisMiho/TheJudge/pull/316 (open, base `main`); 12 commits `6a6cfcf5` (A) … `cfdad454` (A6 evidence, ship-ready) = origin tip; 16/16 criteria `value: true` (A 6, B 10); reported `npm run lint` 0 errors / 0 warnings (was 19), `npm run typecheck` pass, 6 targeted test files / 119 tests pass, `ci-workflow-parity` 5/5 and `deploymentPipeline` 4/4 unedited, `npm run quality:check` 0; A6: PR run `38926130654` six jobs passed, annotations API 0 per job (final docs-only push started run `38926614536`, pending at return); no `PRD/sections/` change; `STATUS.ship-ready`; return side: launch-checkout porcelain empty before and after (identical), `classifyBuildWrites` over 42 paths (`git diff --name-only origin/main HEAD` + `.tmp/pr-body.md`) → `ok`, 0 outside `.worktrees/implement-ci-warnings-cleanup/`; worktree porcelain empty | 2026-10-16 |
| 7 | review | opus | ok | `0 → 20` | APPROVE: 16/16 met (A1-A6, B1-B10), 0 Critical / 0 Important, 1 Minor (four formerly private helpers now exported from `frozenGameContextTriggerLabel.ts` and `ambientSceneFallback.ts`, required by the split; no change needed); `destinationRegistry` aliases were private constants on `origin/main`, exports unchanged; reviewer re-ran `npm run lint` 0, `npm run typecheck` 0, `ci-workflow-parity` 5/5, 13 frontend test files / 195 tests pass, `npm run quality:check` 0; A6 on head `2cfcfa43`: run `38926832228` (`pull_request`, success), six jobs 0 annotations each; launch and worktree porcelain empty (no reviewer writes) | 2026-10-16 |
| 8 | close | sonnet | ok | `0 → 18` | `thejudge-cleanup` commit `59621c23` (= origin tip): receipt `PRD/instructions/receipts/ci-warnings-cleanup-2026-10-16.md`, no `PRD/sections/` change (nothing promoted), board row removed from `PRD/work/STATUS.md`, `git rm -r PRD/work/ci-warnings-cleanup` (11 tracked paths); PR https://github.com/ChrisMiho/TheJudge/pull/316 open (`thejudge-auto:v1:registered:ci-warnings-cleanup` marker); launch and worktree porcelain empty | 2026-10-16 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| owner launch request (verbatim in IDEA.md): on the most recent GitHub Actions workflow there are 17 warnings about ubuntu and other aspects of the code, can we address these | answered-once | shape | — |

## Intake

- `intake/ci-warnings-capture.md` — captured by the graph driver from the check-run annotations of Quality Check run 38859813334 (the owner's launch request).
