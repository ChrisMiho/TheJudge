# Slice A evidence

Runs made on Node v26.0.0 (local). Each run used its own empty `TMPDIR` inside the worktree's gitignored `.tmp/` so the leak count is exact. The two entries `node-compile-cache` and `tsx-501` in that folder are tool caches, not test leaks; they appear in every run.

## Baseline (tip before editing, 2026-10-18)

- Backend: 55 files, 891 tests passed, wall time 8.0 s (`vitest` reported 7.28 s).
- Scripts: 1061 tests passed.
- `TMPDIR` entries after one full backend run: 58. After backend plus scripts: 217 (215 leaked test folders plus the 2 caches).

## After

- Backend: 55 files, 891 tests passed (same), wall time 5.5 s (`vitest` 5.17 s). Lower than 8.0 s.
- Scripts: 1061 tests passed (same).
- `TMPDIR` entries after backend plus scripts: 2 (the two caches). Before: 217. Did not grow.
- `npm --workspace apps/backend run typecheck` exits 0; `npm --workspace apps/frontend run typecheck` exits 0; `npx eslint .` clean; `npm run format:check` clean; full `npm run quality:check` exited 0 (backend and frontend coverage runs included).
- `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
- `grep -rn mkdtemp apps scripts --include="*.test.*"` prints nothing. Remaining `mkdtemp` calls are only inside the three helpers (`apps/backend/src/test-utils/tempDir.ts`, `apps/frontend/src/test/tempDir.ts`, `scripts/lib/temp-dir.mjs`) and the non-test `scripts/build-card-hashes.mjs`.

## What changed

- T-01: `rulesGate.test.ts` runs the committed-corpus gate once (`runCorpusGate`) for both tests; `matcher.test.ts` writes the at-scale catalog files once in `beforeAll` and each of its three tests loads a fresh catalog; `ragRetrievalBenchmark.test.ts` baseline test reuses the determinism test's first scoring (the determinism test still scores twice).
- T-02: one `makeTempDir` helper per runner (backend vitest, frontend vitest, `node:test`), each removing its folders in an after-all hook. All 40 test files that called `mkdtemp` now use it. Three files had a local wrapper named `makeTempDir`; the wrapper stays and calls the shared helper (imported under another name). `scripts/lib/fake-embedding-model.mjs` now gets its folder from the helper, so it is removed too.
- The frontend pair (`deploymentPipeline.test.ts`, `hashLibBuild.test.ts`) already removed their folders after each test; they now use the frontend helper so the grep is empty.

## Dated observations (manual criteria)

2026-10-18 A9 — isolated TMPDIR entries after a full backend plus scripts run: 217 before, 2 after (the 2 are `node-compile-cache` and `tsx-501`, tool caches). Did not grow.

2026-10-18 A10 — backend wall time: 8.0 s before, 5.5 s after. After is lower.

## Reverted findings

None.
