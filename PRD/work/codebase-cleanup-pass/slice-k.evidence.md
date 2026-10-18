# Slice K evidence

## Baseline (tip after slice J, 2026-10-18)

- Frontend: 156 files, 1671 tests pass; Life Tracker tests (`-- lifeTracker`): 8 files, 200 tests.
- "Before" captured before any edit: the Game setup header's computed style (all properties, `<p>` and `<h2>`) at 390x844 and 1440x900, and the two screenshots.

## Changes

- C-09 (light): the eight classes are gone from the Game setup header `<p>` (`text-xs font-bold uppercase tracking-[0.14em] text-accent-soft`) and `<h2>` (`text-xl font-black text-zinc-100`) in `components/portal/life-tracker/PlayerLifeTrackerApp.tsx` (the file lives under `components/portal/life-tracker/`, not where the slice doc says). The `h2` JSX went from three lines to one; only the import line and these two elements changed. The test-id block was not moved onto `lt-sheet`.
- Q-12 (Life Tracker part): the grep for a bare import (`lib/lifeTracker"`, `lib/lifeTracker'`, `from "../lifeTracker"`, `from "./lifeTracker"`, and the relative forms under `apps/frontend/src`) found nothing; `lib/lifeTracker/index.ts` was deleted with `git rm`.
- Q-10 (Life Tracker part): `git mv` of `useLifeTracker.ts` and `useLifeTracker.test.ts` to `src/hooks/`. The hook's own imports now read `../types`, `../lib/lifeTracker/counters`, `../lib/lifeTracker/persistence`, `../lib/lifeTracker/state`, `../lib/lifeTracker/types`; the test's `../lib/lifeTracker/persistence`, `../lib/lifeTracker/state`, `../test/memoryStorage` (its `./useLifeTracker` import is unchanged); the importer reads `../../../hooks/useLifeTracker`; `vite.config.ts` lists `src/hooks/useLifeTracker.test.ts` as jsdom. The `describe` title is unchanged.

## Test change

`PlayerLifeTrackerApp.test.tsx` "uses accent-soft for the dark Game Setup modal's accent heading" asserted `toHaveClass("text-accent-soft")` on the heading; the class is the thing removed. It now asserts the heading carries no class and that the stylesheet's Game setup head rule sets `color: var(--accent-soft)` (read through the shared `appCss`). The test count is unchanged.

## Proof

- K2: computed style identical but for `--tw-text-opacity` (Tailwind's internal variable defined by the removed colour utilities; nothing reads it) — 597 other properties on each of the two elements at both sizes; see `docs/design/codebase-cleanup-pass/slice-k/computed-style-summary.md`.
- K6: frontend 156 files, 1671 tests (same as the baseline); Life Tracker tests 8 files, 200 tests (same).
- K7: `npm --workspace apps/frontend run typecheck` and `run build` exit 0 (build: zero warnings). K11: `npm run lint` exits 0.
- `git diff --stat origin/main -- apps/frontend/vite.config.ts`: 1 line changed.

## Dated observations (manual criteria)

2026-10-18 K5 — the moved test file's `describe` titles (`Frontend - Shared`, `useLifeTracker`) are unchanged by `git mv`; its 200-test-file run passes under the same names.

2026-10-18 K10 — browser: `browser_close` called after the last capture. Server: dev server (vite, port 5451, started by this node, stopped with plain `kill`); `lsof -i :5451` prints nothing. Captures: `PRD/work/codebase-cleanup-pass/.playwright-mcp/k-header-before-390.json`, `k-header-before-1440.json`, `k-header-after-390.json`, `k-header-after-1440.json` (throwaway); screenshots in `docs/design/codebase-cleanup-pass/slice-k/`.

## Reverted findings

None.
