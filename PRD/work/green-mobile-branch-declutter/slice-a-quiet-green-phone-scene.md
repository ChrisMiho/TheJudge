# Slice A — Quiet green scene on phones

## Status: done

## Goal

On a phone (viewport width `< 768px`) the Green ambient scene stays a quiet
backdrop clear of the content column, with no other theme or width changed.

## Requirements

1. Capture the "before" screenshots first (Green, 390x844: Ask a Question, In-depth, Menu tray) on unmodified code.
2. In `GREEN.backdrop` / `GREEN.init`, serve the whole phone band `< 768px` (not only `W < 520`): limbs do not hang down the side edges across the content; leaf clusters and drifting leaves are thinned via the scene's density and opacity numbers.
3. Keep green's personality: a few leaves, soft glow, a hint of branch.
4. Leave the other five scenes, green at `>= 768px`, the reduced-motion still frame, and the weak-hardware fallback untouched.
5. Add a unit test in `AmbientScene.test.tsx` for the green phone path (widths 390 and a 520-767 width) and that `>= 768` and non-green are unaffected.
6. Apply the REQ-207 amendment (three diffs in `GATE-QUESTIONS.md`) to `PRD/sections/functional-requirements.md`; cite the phone-shell-width line to `PRD/sections/shared-chrome/screen-layout.md`, not DEC-145/REQ-124.
7. Capture "after" screenshots and judge them against the bar: quiet, clear of the content column.

## Acceptance criteria

- [ ] Fresh "before" screenshots exist for Ask a Question, In-depth and Menu tray at 390x844 (Green) in `PRD/work/green-mobile-branch-declutter/.playwright-mcp/`, captured before the code change
- [ ] The Green phone path covers every width `< 768px` including 520-767 (no limbs down the side edges); asserted by a unit test at 390 and a 520-767 width
- [ ] Green at `>= 768px` and every non-green scene render unchanged; asserted by a unit test
- [ ] "After" screenshots exist for the same three screens at 390x844; manual check: branches and leaves do not run across or crowd the content column, green still reads as forest ambience
- [ ] `AmbientScene` unit tests pass: `npm run test -w apps/frontend -- AmbientScene`
- [ ] `PRD/sections/functional-requirements.md` carries the REQ-207 amendment (criterion line, test-list line, amended-by line) with the phone-shell cite pointing to `screen-layout.md`
- [ ] `npm run quality:check` is green for touched areas
- [ ] Browser closed, owned dev server stopped, ports released; captures written to `PRD/work/green-mobile-branch-declutter/.playwright-mcp/`

## Verification

```bash
npm run test -w apps/frontend -- AmbientScene
npm run quality:check
```

Browser: `npm run dev` in `apps/frontend`; Playwright at 390x844, Green theme; capture before/after on Ask a Question, In-depth, Menu tray; `browser_close` and stop the server afterwards.

## Files touched

- `apps/frontend/src/components/AmbientScene.tsx`
- `apps/frontend/src/components/AmbientScene.test.tsx`
- `PRD/sections/functional-requirements.md` (REQ-207 amendment, applied at build)
- `PRD/work/green-mobile-branch-declutter/.playwright-mcp/` (screenshots)

## PRD promotion checklist (executed in cleanup)

- [ ] REQ-207 amendment present in `PRD/sections/functional-requirements.md`
- [ ] No new REQ/FLOW/DEC id minted

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/green-mobile-branch-declutter/` ready to delete
