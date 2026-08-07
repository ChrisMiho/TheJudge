# Slice C — Scope jsdom to the tests that need a DOM

## Status: done

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

- [x] Full frontend suite passes: **1227 cases / 115 files**, unchanged
- [x] `src/lib/scan/**` reports `environment` CPU under 0.1s in vitest's
      duration breakdown (baseline 8.51s)
- [x] Total frontend `environment` CPU measurably below the 54.1s baseline; the
      new value is recorded in this slice doc
- [x] `environment: "jsdom"` remains the default in the config — verified by
      reading the file, so an unlisted new test file is not silently DOM-less
- [x] `git diff --stat` shows no changes under `apps/frontend/src/**/*.test.*`
- [x] Coverage thresholds unchanged and coverage still passes
- [x] `npm run quality:check` green locally

## Measurements

Full suite after scoping — **115 files / 1227 cases, unchanged and green**:

| Metric | Baseline | After slice C |
| --- | --- | --- |
| Frontend `environment` CPU | 54.1s | **33.8s** |
| `src/lib/scan/**` `environment` CPU | 8.51s | **0.002s** (2ms) |
| Full-suite local wall (no coverage) | 15.2s | 15.0s |

`environment: "jsdom"` remains the config default, so an unlisted or newly added
test file still gets a DOM. Files opt *out*; nothing opts in by omission.

### How the glob list was derived

Every `node` entry is backed by a green `--environment=node` run of exactly the
files it covers — 44 files in total. Four directories proved DOM-free in whole
(`src/lib/scan`, `src/lib/contextFlow`, `src/lib/conversationHistory`,
`src/lib/trade`); everywhere else the entry names a single file, because those
directories are mixed. No blanket directory or extension rule is used, per
DEC-155.

The measured counter-examples are pinned back to `jsdom` explicitly and first in
the list, so they survive any later broadening of a sibling glob:

| File | Why it needs a DOM |
| --- | --- |
| `src/lib/lifeTracker/useLifeTracker.test.ts` | named in DEC-155 |
| `src/lib/feedback/FeedbackContextProvider.test.tsx` | named in DEC-155 |
| `src/lib/portal/seedContext.test.tsx` | named in DEC-155 |
| `src/lib/theme/applyPalette.test.ts` | **found by this slice** — applies a palette to `document`, so it fails under `node` while both of its siblings pass |

### Remaining environment cost

33.8s of jsdom CPU is left, and it is not further reducible by configuration:
it belongs to the ~71 component and `App.*` files that genuinely render. The
`src/lib/scan/**` saving is the one that matters for the shard floor, because
those files carry the heaviest instrumented test CPU.

### Cancellation observation

The PR-branch half of slice A's cancellation criterion is observed on this
slice's push — see slice A's `## Measurements`.

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
