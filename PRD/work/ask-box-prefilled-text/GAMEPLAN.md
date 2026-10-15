# Gameplan — ask-box-prefilled-text

## Outcome

A player clears the Ask box, refreshes, and the box stays empty. Whatever is in
the box (and on the stage) is what comes back after a reload. The same holds in
In-depth details.

## Architecture

The Draft is the browser-local copy of an unsent question
(`thejudge.conversationDraft.lookup` for Ask a Question,
`thejudge.conversationDraft.game` for In-depth details). Today
`snapshotMidFlightDraft` writes or removes it only at a few exits. The change
runs that same function on every change to anything the Draft saves.

Data flow after the change:

1. Player edits the question or changes cards (and, in In-depth, step, zone,
   placement or game state).
2. An effect depending on those fields calls `snapshotMidFlightDraft`.
3. The function writes the Draft, or removes it when nothing is staged (the
   existing "nothing staged" test, unchanged).
4. Mount restore reads the Draft once. A first-pass skip stops the effect from
   overwriting the stored Draft with the pre-restore empty state.

Touched code:

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`: the
  `selectedCards` effect (~252) also depends on `question`; first-pass skip kept.
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`: an effect over
  every field the Draft saves calls `snapshotMidFlightDraft` (~372); same
  first-pass skip. How a carry is consumed does not change.
- `apps/frontend/src/App.mid-flight-draft.test.tsx`: new cases.
- `PRD/sections/functional-requirements.md` (REQ-108) and
  `PRD/sections/user-flows.md` (FLOW-017): apply the finalized diffs in
  `GATE-QUESTIONS.md`, by intent (find the text, not the line number).

Out of scope: In-depth hand-off (REQ-206 rejected), hint wording/colour, the
fold rule, CSS, the Context-step spacing finding, cleaning old Drafts.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| A | Draft follows the box in both destinations, with tests, PRD truth, and ship gates | none |

One slice: the two code changes share one rule, one test file, and one PRD
amendment, and splitting them would leave the two destinations disagreeing
(FLOW-017 requires identical behaviour).

## Verification checklist

- Brief criteria 1-5 and 8 by Vitest (jsdom) in `App.mid-flight-draft.test.tsx`.
- Brief criteria 6-7 by a live browser check at 1440x900 and 390x844 on the dev
  build (clean storage), captures under `PRD/work/ask-box-prefilled-text/.playwright-mcp/`
  (gitignored; no tracked deliverable). Browser closed and owned servers
  stopped afterward.
- `npm run quality:check` and the frontend suite (`npm --workspace apps/frontend run test`) green.
- REQ-108 and FLOW-017 in `PRD/sections/` carry the accepted wording; REQ-206 and
  `quick-lookup/README.md` untouched.
