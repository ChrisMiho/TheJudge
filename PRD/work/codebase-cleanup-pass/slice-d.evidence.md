# Slice D evidence

## Baseline (tip after slice C, 2026-10-18)

- `npm --workspace apps/backend run build` exits 0; `find apps/backend/dist -type f | sort` lists 124 files (scratch copy `dist-before.txt`).
- Practice-suite default path: `scripts/privacy-scan.mjs` and `scripts/score-rule-search.mjs` both hard-coded `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`, the same string whether run from the main checkout or from this worktree.
- Reference grep before removal: `grep -rn "exampleoutput\|purple-gold-handoff"` over the repo (excluding `node_modules`, `.git`, scratch) hit only this package's own documents (`PRD/work/codebase-cleanup-pass/`: the brief, slice doc, criteria, quality report, graph log, intake). No code, config, workflow or other doc references either name. `git ls-files` showed `exampleoutput.txt` and three files under `purple-gold-handoff/` tracked.

## Changes

- K-08/T-10: `apps/backend/tsconfig.build.json` extends `tsconfig.json` and excludes `src/**/*.test.ts`, `src/test-utils/**`, `src/eval/**`; backend `build` uses it; typecheck keeps `tsconfig.json`. Import check first: no non-eval, non-test module under `apps/backend/src` imports from `eval/` or `test-utils/` (the grep for `from "...eval/"` outside `src/eval` and `*.test.ts` printed nothing), so `eval` is excluded in full. `scripts/package-lambda.sh` only copies `apps/backend/dist` whole; `lambda-package-budget` passes. A scan of every relative import in the new `dist` found 0 unresolved.
- T-11: `quality-check.yml` loses the `master` push trigger and the `nproc` step; the deploy job's "Build project" runs `npm --workspace apps/backend run build` (`scripts/aws-deploy.sh` runs `npm --workspace apps/frontend run build` itself, line 121). `PRD/instructions/ci.md` line 6 now says "every push to `main`". Node versions unchanged.
- T-17: `git rm exampleoutput.txt`, `git rm -r purple-gold-handoff`. No backup copy.
- T-15: `scripts/lib/fs-helpers.mjs` (`ensureParentDirectory`, `writeWhole`, `escapeRegExp`, three-tier `formatBytes`) with `scripts/lib/fs-helpers.test.mjs`. Eight copies of `ensureParentDirectory` (build-rule-embeddings, build-commander-spellbook-combos, build-card-rulings, build-game-rules, build-card-scan-map, build-card-detail-by-oracle-id, build-card-metadata, refresh-scryfall-data), three `formatBytes`, two `escapeRegExp` (build-game-rules, lib/rule-availability) and two `writeWhole` (practice-suite-import, practice-suite-convert) now import it. `refresh-scryfall-data.mjs` keeps its own four-tier `formatBytes`. The backend's three `escapeRegExp` copies in `apps/backend/src` are out of scope (not scripts).
- T-12: `mainCheckoutSuiteDir()` in `scripts/lib/practice-suite.mjs` (via `resolveMainCheckoutRoot` from `local-openai-env.mjs`); `privacy-scan.mjs` and `score-rule-search.mjs` use it. `SUITE_DIR` and `export-rule-search-training.mjs` unchanged. New test in `practice-suite.test.mjs` (fake main checkout and worktree give the same folder).
- T-13: `resolveRunEnv` and `NO_LOCAL_ENV_VARIABLE` moved to `scripts/lib/run-env.mjs`; `sumOf` (identical copies in `eval-answer-quality.mjs` and `lib/experiment-run.mjs`) moved to `scripts/lib/answer-quality-run.mjs`. `eval-answer-quality.mjs` re-exports `resolveRunEnv` and `NO_LOCAL_ENV_VARIABLE`, so its tests are unchanged; `score-rule-search.mjs` and `export-rule-search-training.mjs` import `run-env.mjs` directly instead of loading the 1,687-line CLI.

## After

- Backend `dist`: 52 files. `diff` against the base list: 72 lines removed, 0 added; every removed path matches `.test.`, `test-utils/` or `/eval/`.
- `npm run test:scripts`: 1066 passed (1061 base plus 4 fs-helpers tests plus 1 practice-suite test), 0 failed; `lambda-package-budget` and `ci-workflow-parity` pass (7 tests).
- `npm --workspace apps/frontend run test -- deploymentPipeline`: 4 passed. `npm --workspace apps/backend run test`: 55 files, 891 tests passed. Backend typecheck exits 0. `npm run lint` (with `--max-warnings 0`) and `npm run format:check` exit 0. `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
- Practice-suite path after, three resolutions: from the main checkout root, from this worktree root, and the module default in this worktree all print `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite`.

## Dated observations (manual criteria)

2026-10-18 D6 — resolved practice-suite path, before: `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite` from the main checkout and from this worktree (a hard-coded string in both scripts); after: `mainCheckoutSuiteDir()` printed `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite` for the main checkout root and for this worktree root. All four equal.

## Reverted findings

None.
