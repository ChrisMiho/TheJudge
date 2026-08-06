# Slice C — Scope jsdom to the tests that need a DOM

## Status: planned

## Goal

Stop charging every frontend test file the jsdom environment cost by opting
DOM-free suites into the `node` environment, proven green run by green run.

## Requirements

1. Add `environmentMatchGlobs` to `apps/frontend/vite.config.ts` mapping proven
   DOM-free globs to `node`, keeping `environment: "jsdom"` as the default so
   any unlisted or newly added file stays safe.
2. Start with `src/lib/scan/**`, which is already measured safe: all 15 files /
   138 cases pass under `node`, and environment CPU drops from **8.51s to
   0.002s**.
3. Extend to further globs **only** where a full green run proves it. A blanket
   directory or file-extension rule is prohibited by DEC-155 — measured
   counter-examples that still need a DOM are
   `src/lib/lifeTracker/useLifeTracker.test.ts`,
   `src/lib/feedback/FeedbackContextProvider.test.tsx`, and
   `src/lib/portal/seedContext.test.tsx`.
4. Do not modify `src/test/setup.ts` behavior for jsdom files. If a `node`-env
   file does not need the Testing Library cleanup hook, that is a consequence of
   the environment, not a reason to change shared setup.
5. No test is edited, renamed, skipped, or deleted in this slice — configuration
   only.

## Acceptance criteria

- [ ] Full frontend suite passes: **1227 cases / 115 files**, unchanged
- [ ] `src/lib/scan/**` reports `environment` CPU under 0.1s in vitest's
      duration breakdown (baseline 8.51s)
- [ ] Total frontend `environment` CPU measurably below the 54.1s baseline; the
      new value is recorded in this slice doc
- [ ] `environment: "jsdom"` remains the default in the config — verified by
      reading the file, so an unlisted new test file is not silently DOM-less
- [ ] `git diff --stat` shows no changes under `apps/frontend/src/**/*.test.*`
- [ ] Coverage thresholds unchanged and coverage still passes
- [ ] `npm run quality:check` green locally

## Verification

```bash
cd apps/frontend

# whole suite must be unchanged in count and green
npx vitest run

# per-directory environment cost, before/after comparison
npx vitest run src/lib/scan   # expect environment ~0ms, 15 files / 138 cases

# no test file was touched
git diff --stat -- 'apps/frontend/src/**/*.test.*'

# canonical local gate
cd ../.. && npm run quality:check
```

## Files touched

- `apps/frontend/vite.config.ts`
- `PRD/work/ci-quality-check-runtime/slice-c-scope-jsdom-per-file.md` (record
  the measured environment-CPU delta and the final glob list)
