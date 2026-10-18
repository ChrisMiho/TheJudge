# Slice D — Ship only what runs; scripts share helpers

## Status: planned

Depends on: A (A edits `scripts/lib/fake-embedding-model.mjs` first). Findings: K-08/T-10, T-11, T-12 (preserving part), T-13 (the move only), T-15, T-17.

## Goal

The Lambda package ships only runtime code, CI stops building the frontend twice, scripts share small helpers, and two personal files leave the repo. No paid run, no data rebuild.

## Requirements

1. Before editing, record on the base: the backend `dist` file list (`npm --workspace apps/backend run build`, then `find apps/backend/dist -type f | sort > <scratch>/dist-before.txt`), and the resolved practice-suite path from the main checkout and from this worktree (print what `scripts/privacy-scan.mjs` and `scripts/score-rule-search.mjs` default to). Write to `slice-d.evidence.md`.
2. **K-08 / T-10.** Add `apps/backend/tsconfig.build.json` that extends `tsconfig.json` and excludes `**/*.test.ts`, `src/test-utils/**` and `src/eval/**`; point the backend `build` script at it. Typecheck keeps the full config. **First** grep that no non-eval, non-test module imports from `eval/` (`grep -rn "from \"\(\.\./\)*eval/" apps/backend/src --include="*.ts"` excluding `src/eval` and `*.test.ts`); if one does, exclude only the tests and `test-utils` and record why. Check `scripts/package-lambda.sh` and `scripts/lambda-package-budget.test.mjs` for assumptions about `dist` contents.
3. **T-11.** In `.github/workflows/quality-check.yml`: the deploy job's "Build project" step (about `:255-256`) becomes the backend-only build (`scripts/aws-deploy.sh` rebuilds the frontend itself; confirm by reading it); drop the unused `nproc` step (about `:48`) and the `master` push trigger (about `:7`). Node versions stay. In the same commit change `PRD/instructions/ci.md` line 6 from "every push to `main`/`master`" to "every push to `main`".
4. **T-17.** Grep the repo for `exampleoutput` and `purple-gold-handoff` first (expect no references outside the files themselves; record hits). Then `git rm exampleoutput.txt` and `git rm -r purple-gold-handoff`. No backup copy.
5. **T-15.** Add `scripts/lib/fs-helpers.mjs` exporting `ensureParentDirectory` (replacing 8 copies), `writeWhole`, `escapeRegExp` and the three-tier `formatBytes`. Re-grep to find the copies. `scripts/refresh-scryfall-data.mjs` keeps its own four-tier `formatBytes` so no log text changes. Add a small `node:test` file for the helpers.
6. **T-12.** `scripts/privacy-scan.mjs` (about `:14`) and `scripts/score-rule-search.mjs` (about `:36`) hard-code the owner's main-checkout practice-suite path. Replace both defaults with one helper in `scripts/lib/practice-suite.mjs` that resolves the main checkout through the git common directory, as `scripts/lib/local-openai-env.mjs` does. `SUITE_DIR` and `export-rule-search-training.mjs` keep their repo-relative default.
7. **T-13.** Move `resolveRunEnv` and the duplicated `sumOf` out of `eval-answer-quality.mjs` into `scripts/lib`; `eval-answer-quality.mjs` re-exports them so its tests do not change; `score-rule-search.mjs` and `export-rule-search-training.mjs` import from the new module. Do not split the large eval functions.
8. Never run `data:refresh`, a data rebuild, a paid eval, or a deploy. Do not touch `scripts/graph-boundary-hook.mjs` or `scripts/lib/boundary-rules.mjs`.

## Acceptance criteria

- [ ] D1. `apps/backend/tsconfig.build.json` exists, extends `tsconfig.json`, excludes tests, `test-utils` and (unless the grep found an importer) `eval`; the backend `build` script uses it.
- [ ] D2. The backend `dist` file list differs from the base only by test, `test-utils` and `eval` files disappearing (diff in the evidence log).
- [ ] D3. `quality-check.yml` deploy job builds backend only, has no `nproc` step and no `master` trigger; `PRD/instructions/ci.md` says "every push to `main`".
- [ ] D4. `exampleoutput.txt` and `purple-gold-handoff/` are removed from the tree and the pre-removal grep result is in the evidence log.
- [ ] D5. `scripts/lib/fs-helpers.mjs` exists with its test; no script keeps a private copy of `ensureParentDirectory`; `refresh-scryfall-data.mjs` keeps its own `formatBytes`.
- [ ] D6. `scripts/lib/practice-suite.mjs` exists and both scripts use it; resolved path printed from the main checkout and from this worktree, before and after: all four equal (in the evidence log).
- [ ] D7. `resolveRunEnv` and `sumOf` live in `scripts/lib`; `eval-answer-quality.mjs` re-exports them.
- [ ] D8. `npm run test:scripts` is green (includes `lambda-package-budget` and `ci-workflow-parity`).
- [ ] D9. `npm --workspace apps/frontend run test -- deploymentPipeline` is green.
- [ ] D10. `npm --workspace apps/backend run test` and `npm --workspace apps/backend run typecheck` are green/exit 0.
- [ ] D11. `npm run lint` and `npm run format:check` exit 0.

## Verification

```bash
npm --workspace apps/backend run build
find apps/backend/dist -type f | sort
npm run test:scripts
npm --workspace apps/frontend run test -- deploymentPipeline
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
npm run lint
npm run format:check
grep -rn "exampleoutput\|purple-gold-handoff" . --include="*" --exclude-dir=node_modules --exclude-dir=.git
```

## Reverted findings

None yet.

## Files touched

- `apps/backend/tsconfig.build.json` (new), `apps/backend/package.json`
- `.github/workflows/quality-check.yml`, `PRD/instructions/ci.md`
- `exampleoutput.txt`, `purple-gold-handoff/` (delete)
- `scripts/lib/fs-helpers.mjs` (new) and the scripts that copied its helpers
- `scripts/lib/practice-suite.mjs` (new), `scripts/privacy-scan.mjs`, `scripts/score-rule-search.mjs`
- `scripts/lib/` run-env module (new), `scripts/eval-answer-quality.mjs`, `scripts/export-rule-search-training.mjs`
