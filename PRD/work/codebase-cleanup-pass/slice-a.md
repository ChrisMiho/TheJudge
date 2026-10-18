# Slice A — Backend tests run faster and clean up after themselves

## Status: planned

Depends on: none. Findings: T-01, T-02.

## Goal

Backend test suites stop rebuilding the same slow input and stop leaving temp folders behind. Same tests, same assertions.

## Requirements

1. Before editing, record on the base: pass count per suite (`npm --workspace apps/backend run test`, `npm run test:scripts`), backend wall time, and the count of entries in `$TMPDIR` (`ls "${TMPDIR:-/tmp}" | wc -l`). Write them to `slice-a.evidence.md`.
2. **T-01.** `apps/backend/src/eval/rules-gate/rulesGate.test.ts` calls `runGate()` twice on the full corpus (about `:114`, `:152`; spies set in `beforeAll` about `:59-67`). Memoize one result and assert both tests against it.
3. **T-01.** `apps/backend/src/commanderSpellbook/matcher.test.ts` builds the at-scale catalog three times (about `:729`, `:737`, `:762`). Write the files once in `beforeAll`; load a fresh catalog per test so each test keeps its own cache.
4. **T-01.** `apps/backend/src/eval/ragRetrievalBenchmark.test.ts` scores twice on purpose (about `:47-48`, a determinism check). The baseline test reuses `first`; the determinism test keeps both scorings.
5. **T-02.** About 20 test files create temp folders and never remove them. Find them with `grep -rln "mkdtemp" apps scripts --include="*.test.*"` (re-count; the brief counted 20). Add one `makeTempDir()` helper per runner: a vitest one (look in `apps/backend/src/test-utils/` for the right place) that registers removal in `afterAll`, and a `node:test` one (`scripts/lib/`, registers removal with `t.after`). Replace the bare `mkdtemp` calls with them.
6. **T-02.** Add the same cleanup to `scripts/lib/fake-embedding-model.mjs`.
7. Do not change any test title, assertion, or fixture. Do not touch tests whose subject a pending brief owns unless the file only needs the temp helper swap.

## Acceptance criteria

- [ ] A1. `rulesGate.test.ts` calls `runGate()` once and both tests assert against that result.
- [ ] A2. `matcher.test.ts` writes the at-scale catalog files once in `beforeAll` and loads a fresh catalog per test.
- [ ] A3. `ragRetrievalBenchmark.test.ts` baseline test reuses `first`; the determinism test still scores twice.
- [ ] A4. A vitest `makeTempDir()` helper and a `node:test` `makeTempDir()` helper exist and register removal; `grep -rn "mkdtemp" apps scripts --include="*.test.*"` shows no test file calling it directly.
- [ ] A5. `scripts/lib/fake-embedding-model.mjs` removes the temp folders it creates.
- [ ] A6. `npm --workspace apps/backend run test` is green with the same pass count as the base (recorded in the evidence log).
- [ ] A7. `npm run test:scripts` is green with the same pass count as the base.
- [ ] A8. `npm --workspace apps/backend run typecheck` exits 0.
- [ ] A9. `$TMPDIR` entry count after a full `npm --workspace apps/backend run test` plus `npm run test:scripts` has not grown versus the count before it (both numbers in the evidence log).
- [ ] A10. Backend wall time before and after is recorded in the evidence log (after is lower).
- [ ] A11. Eval goldens are byte-identical: `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.

## Verification

```bash
ls "${TMPDIR:-/tmp}" | wc -l
npm --workspace apps/backend run test
npm run test:scripts
ls "${TMPDIR:-/tmp}" | wc -l
npm --workspace apps/backend run typecheck
git diff --stat origin/main -- apps/backend/src/eval/fixtures
```

## Reverted findings

None yet. Record here any finding reverted because its proof failed.

## Files touched

- `apps/backend/src/eval/rules-gate/rulesGate.test.ts`
- `apps/backend/src/commanderSpellbook/matcher.test.ts`
- `apps/backend/src/eval/ragRetrievalBenchmark.test.ts`
- the temp-folder test files found by the grep (about 20)
- new vitest and `node:test` `makeTempDir` helpers
- `scripts/lib/fake-embedding-model.mjs`
