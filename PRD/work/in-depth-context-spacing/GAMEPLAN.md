# Gameplan — waiting bubble on one row

Player view: after a first question, the waiting bubble shows the seal, the
funny phrase and the timer side by side on one row (about 62 px, down from
123 px). A long phrase wraps in the middle on a phone. Same in In-depth and
Ask a Question.

## Architecture

One shared component (`AskAiWaitingPanel`), CSS only, no markup change. Add
`grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
column-gap: 0.75rem;` to `.wait-inscription-bubble` and `white-space: nowrap`
to `.wait-inscription-clock` in `apps/frontend/src/index.css`. Re-word the
stacked-layout comments. Pin the rules with one test. Apply the finalized
REQ-023 diff (`GATE-QUESTIONS.md`) to `PRD/sections/` by intent.

## Slices

One slice. The change is a few lines of CSS, one test and two wording edits;
splitting would only add handoffs. Slice A is also the final slice, so it
carries the product-truth step and the Ship gates.

| Slice | Doc | Depends on | Goal |
| --- | --- | --- | --- |
| A | `slice-a-one-row-bubble.md` | none | Bubble on one row, pinned by a test, checked live, product truth applied |

## Data flow

None. No state, API or timing change. `askAiWaitStages.ts` and
`useElapsedWaitTimer.ts` stay untouched.

## Verification checklist

- [ ] Frontend tests: `npm --workspace apps/frontend run test -- AskAiWaitingPanel reduced-motion motion-foundation`
- [ ] Live browser check at 1440x900, 390x844, 375x667, plus reduced motion at 375x667; captures only under the git-ignored `PRD/work/in-depth-context-spacing/.playwright-mcp/`
- [ ] `npm run quality:check` green
- [ ] REQ-023 and `in-depth/README.md` carry the approved wording
- [ ] Browser closed, owned dev server stopped, ports released

## Builder notes (from QUALITY-CHECK.md)

- `QuickLookupApp.tsx` is `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (render site ~702); it is not edited.
- Re-check hunk start lines at HEAD before editing `PRD/sections/`: `functional-requirements.md` 429 and 438; the `in-depth/README.md` hunk header says 278 but the edited line is 282. Apply by intent, not by patch.
- `index.css` has two bubble rules (204 base, 3080 override block) and two clock rules (218, 3093); the brief's proposed CSS goes on the bubble ~204 and the clock ~3093. Confirm which block wins before editing.
- No tracked deliverable lives in `PRD/work/` (cleanup deletes the folder).
