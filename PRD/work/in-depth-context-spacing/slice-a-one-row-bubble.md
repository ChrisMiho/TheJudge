# Slice A — One-row waiting bubble

## Status: planned

## Goal

The waiting bubble puts the seal, the phrase and the timer on one row in both
In-depth and Ask a Question, and the product truth says so.

## Requirements

1. In `apps/frontend/src/index.css`, `.wait-inscription-bubble` gets `grid-template-columns: auto minmax(0, 1fr) auto`, `align-items: center`, `column-gap: 0.75rem`; `.wait-inscription-clock` gets `white-space: nowrap`.
2. Reword the stacked-layout comments in `index.css` (~2938) and `AskAiWaitingPanel.tsx` (seal badge comment, clock "bubble's foot" comment). No markup change.
3. Add one assertion to `AskAiWaitingPanel.test.tsx` that reads `index.css` and pins the three-column grid, centred items and the nowrap timer.
4. Apply the finalized REQ-023 diff in `GATE-QUESTIONS.md` to `PRD/sections/functional-requirements.md` (last acceptance criterion and a new Notes line) and the one-line bubble description in `PRD/sections/in-depth/README.md`, by intent against current text.
5. Do not touch phrases, thresholds, timing, animations, colours, timer size/font, aria attributes or DOM order.
6. Live checks save captures only under `PRD/work/in-depth-context-spacing/.playwright-mcp/` (git-ignored); commit no deliverable inside `PRD/work/`.

## Acceptance criteria

- [ ] A1. One row: at 1440x900, 390x844 and 375x667, in Ask a Question and In-depth first submit, seal ends before phrase starts, phrase ends before timer starts, and the three vertical centres are within 2 px (live measurement, noted in the PR).
- [ ] A2. Height: the bubble is at most 70 px tall at all three widths for every phrase (live measurement).
- [ ] A3. Long phrase on a phone: at 390x844 and 375x667 the 25 s and 40 s phrases show in full on two lines in the middle column, no "…", no clipped word, timer at the row's end, no horizontal page scroll at any of the three widths (live).
- [ ] A4. Timer look unchanged: monospace, 1.5rem, same colour, right-aligned, one line (`git diff` of the clock rule shows only `white-space: nowrap` added).
- [ ] A5. Motion unchanged: animation rules and the reduced-motion selector list are byte-identical (`git diff` shows no change to them), and `AskAiWaitingPanel.test.tsx`, `reduced-motion.test.ts` and `src/test/motion-foundation.test.ts` pass without edits to existing assertions.
- [ ] A6. Reduced motion: under `prefers-reduced-motion: reduce` at 375x667 the bubble is on one row and each phrase appears whole (live).
- [ ] A7. Live region unchanged: `aria-live="polite"`, `aria-atomic="true"`, lifting line `aria-hidden`, seal `aria-hidden`, DOM order seal, message stack, timer; existing tests pass; `AskAiWaitingPanel.tsx` diff is comments only.
- [ ] A8. Phrases and timing unchanged: `askAiWaitStages.ts` and `useElapsedWaitTimer.ts` have no diff and the 280 ms lift-away constant is unchanged.
- [ ] A9. A new test reading `index.css` asserts `minmax(0, 1fr)` three-column grid, centred items and `white-space: nowrap` on the timer, and it passes.
- [ ] A10. Product truth applied: REQ-023 and `PRD/sections/in-depth/README.md` carry the wording approved in `GATE-QUESTIONS.md` (grep for "on one row" in both files).
- [ ] A11. Cleanup evidence: browser closed, owned dev server stopped, ports released, captures written only under `PRD/work/in-depth-context-spacing/.playwright-mcp/` and none tracked (`git status` shows nothing under `PRD/work/` from captures).

## Verification

```bash
npm --workspace apps/frontend run test -- AskAiWaitingPanel reduced-motion motion-foundation
git diff origin/main -- apps/frontend/src/index.css apps/frontend/src/components/AskAiWaitingPanel.tsx
git diff --stat origin/main -- apps/frontend/src/askAiWaitStages.ts apps/frontend/src/hooks/useElapsedWaitTimer.ts
grep -n "on one row" PRD/sections/functional-requirements.md PRD/sections/in-depth/README.md
npm run quality:check
```

## Files touched

- `apps/frontend/src/index.css`
- `apps/frontend/src/components/AskAiWaitingPanel.tsx` (comments only)
- `apps/frontend/src/components/AskAiWaitingPanel.test.tsx`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/in-depth/README.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/in-depth-context-spacing/` ready to delete
