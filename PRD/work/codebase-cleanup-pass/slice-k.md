# Slice K — Life Tracker cleanups (owner decision 3)

## Status: planned

Depends on: J (both touch Life Tracker files; J settles `index.css` first). Findings: C-09 (light version), Q-12 (Life Tracker part), Q-10 (Life Tracker part).

## Goal

Life Tracker loses eight style classes that do nothing, an unused index file, and a misplaced hook file. The Life Tracker looks and plays exactly the same. REQ-202 keeps the Life Tracker table pixel-untouched and asks every touching slice for a before/after screenshot pair; it does not forbid edits to the files.

## Where evidence lives

- **Kept in the repo (outside `PRD/work/`, which cleanup deletes):** `docs/design/codebase-cleanup-pass/slice-k/` holds `before-390x844.png`, `after-390x844.png`, `before-1440x900.png`, `after-1440x900.png` (Game setup sheet open), `computed-style-summary.md` (the Game setup header's computed style before and after) and `README.md` (PR-ready text).
- **Throwaway, in `PRD/work/codebase-cleanup-pass/.playwright-mcp/`:** raw captures and raw computed-style JSON.

## Requirements

1. **Capture "before" first,** on the tip after slice J and before any slice K edit: serve the app from this worktree on an owned port; open Life Tracker, open the Game setup sheet; dump `getComputedStyle` for the sheet header `<p>` and `<h2>` (properties: all); screenshot at 390x844 and 1440x900. Save the `before-*` files in `docs/design/codebase-cleanup-pass/slice-k/`.
2. **C-09 (light version).** In `PlayerLifeTrackerApp.tsx` (about lines 39-40) remove the eight Tailwind classes on the Game setup header's `<p>` and `<h2>`. The `[data-testid="life-tracker-game-setup"] .sheet-legacy-head` rule (`index.css` about `:5312-5329`) already sets every property they set, so the pixels stay. Verify by the computed-style comparison; if any property differs, restore the class that carries it and record it. Do not move the test-id block onto `lt-sheet` (follow-up 27).
3. **Q-12 (Life Tracker part).** Delete `lib/lifeTracker/index.ts`. First grep that nothing imports `lib/lifeTracker` bare (`grep -rn "lib/lifeTracker\"\|lib/lifeTracker'\|from \"\.\./lifeTracker\"\|from \"\./lifeTracker\"" apps/frontend/src`; also check relative forms like `"../lib/lifeTracker"`); if something does, keep the file and record it.
4. **Q-10 (Life Tracker part).** Move `lib/lifeTracker/useLifeTracker.ts` and its test to `hooks/` with `git mv`. Update **all** of these:
   - the importer (`PlayerLifeTrackerApp.tsx`);
   - **the moved `useLifeTracker.ts`'s own relative imports** (`../../types`, `./counters`, `./persistence`, `./state`, `./types`), which now point from `hooks/` to the new paths of `types` and of the sibling `lib/lifeTracker/*` modules;
   - the moved test's own relative imports;
   - the jsdom entry in `apps/frontend/vite.config.ts` (about line 62).
   Keep the test file's `describe` title.
5. **Confinement.** The pop-ups brief edits the Game setup `SheetShell` at `PlayerLifeTrackerApp.tsx` about `:31`; touch only the import line and lines 39-40 there.
6. **Capture "after"** the same way, save the `after-*` files, write `computed-style-summary.md` and `README.md`.
7. **Cleanup:** `browser_close`, stop the owned server, confirm the port is released, record the capture path in `slice-k.evidence.md`.

## Acceptance criteria

- [ ] K1. The eight Tailwind classes are gone from the Game setup header's `<p>` and `<h2>`; no other line of `PlayerLifeTrackerApp.tsx` changed except the hook import line.
- [ ] K2. The computed style of the Game setup header `<p>` and `<h2>` is identical before and after (all properties), recorded in `docs/design/codebase-cleanup-pass/slice-k/computed-style-summary.md`.
- [ ] K3. `lib/lifeTracker/index.ts` is deleted after a bare-import grep showing no importer (grep result in the evidence log).
- [ ] K4. `useLifeTracker.ts` and its test live in `hooks/`; the moved hook file's own relative imports (`../../types`, `./counters`, `./persistence`, `./state`, `./types`) are corrected, the test's imports are corrected, the importer is updated, and the `vite.config.ts` jsdom entry points at the new path.
- [ ] K5. The moved test keeps its `describe` title.
- [ ] K6. All Life Tracker test files are green with the same test count as the base.
- [ ] K7. `npm --workspace apps/frontend run typecheck` exits 0 and `npm --workspace apps/frontend run build` exits 0.
- [ ] K8. The four REQ-202 screenshots (`before`/`after` at 390x844 and 1440x900, Game setup sheet open) are committed under `docs/design/codebase-cleanup-pass/slice-k/` and show no visible difference.
- [ ] K9. `docs/design/codebase-cleanup-pass/slice-k/README.md` holds PR-ready text naming the screenshot pair and the computed-style result.
- [ ] K10. Browser closed, owned server stopped, port released; raw captures in `PRD/work/codebase-cleanup-pass/.playwright-mcp/`; paths recorded in the evidence log.
- [ ] K11. `npm run lint` exits 0.

## Verification

```bash
npm --workspace apps/frontend run test -- lifeTracker
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run build
npm run lint
git diff --stat origin/main -- apps/frontend/vite.config.ts
ls docs/design/codebase-cleanup-pass/slice-k
```

## Reverted findings

None yet.

## Files touched

- `apps/frontend/src/components/PlayerLifeTrackerApp.tsx` (re-read the path; import line and lines 39-40 only)
- `apps/frontend/src/lib/lifeTracker/index.ts` (delete)
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts` and its test (move to `apps/frontend/src/hooks/`)
- `apps/frontend/vite.config.ts`
- `docs/design/codebase-cleanup-pass/slice-k/`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/codebase-cleanup-pass/` ready to delete (nothing to promote to `PRD/sections/`; the screenshot pairs for J and K are already under `docs/design/codebase-cleanup-pass/`)
