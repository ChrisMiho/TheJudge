# Slice A — Draft follows the box

## Status: planned

## Goal

The saved unsent question (the Draft) is rewritten on every change and removed
the moment nothing is staged, in Ask a Question and In-depth details, so
cleared text stays cleared after a refresh.

## Requirements

1. Ask a Question: `snapshotMidFlightDraft` also runs on every change to the
   question (the `selectedCards` effect gains `question`), keeping the
   first-pass skip so the mount restore is not overwritten.
2. In-depth details: `snapshotMidFlightDraft` runs on every change to a field the
   Draft saves, with the same first-pass skip. No change to how a carry is consumed.
3. "Nothing is staged" keeps today's test (Ask: question empty or spaces only and
   no card; In-depth: the existing ten-field test).
4. Apply the finalized REQ-108 and FLOW-017 diffs from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md` and `PRD/sections/user-flows.md`,
   located by text. Do not touch REQ-206 or `quick-lookup/README.md`.
5. No CSS change; no change to the In-depth button hand-off.

## Acceptance criteria

- [ ] 1. Reload mid-walk: type `How does ward work?`, attach Sol Ring, tap In-depth, reload once; In-depth still holds Sol Ring (waiting for a zone) and the question (test).
- [ ] 2. Clear then reload stays empty: after Menu trip then clearing, the `thejudge.conversationDraft.lookup` key is absent before reload; after reload the textarea value is `""`, `data-fill="0"`, Draft absent; same when the Draft came from attaching then removing Sol Ring (test).
- [ ] 3. Clear with a card kept: after clearing the box with Sol Ring attached and reloading, the box is empty, Sol Ring is on the stage, and the Draft holds Sol Ring and an empty question (test).
- [ ] 4. Replace then reload shows `What does hexproof stop?`; from clean storage, type `How does ward work?` and reload with no Menu trip shows `How does ward work?` (test).
- [ ] 5. In-depth details: type a question at its question box, Menu-leave and return, clear it, reload; the box is empty and `thejudge.conversationDraft.game` holds an empty question (test).
- [ ] 6. Desktop at rest (1440x900), empty and unfocused, clean storage: value `""`, hint "What would you like to know?", `data-fill="0"`, no focus, In-depth button "◈ In-depth" with label `display: block`, about 96px; focusing or typing still folds it to ◈ (manual live check on the dev build).
- [ ] 7. Phone at rest (390x844), empty and unfocused: value `""`, hint "Your question…", `data-fill="0"`, no focus, In-depth button ◈ only (label `display: none`, about 35px) (manual live check on the dev build).
- [ ] 8. No regressions: an unsent uncarried question still returns after a Menu trip or reload; Ask a Question's own answer still clears its Draft; opening a saved conversation still saves the staged attempt as a Draft first; Edit cards still returns cards and question; Start over still empties everything; the In-depth hand-off is unchanged (tests, existing suites included).
- [ ] 9. REQ-108 and FLOW-017 in `PRD/sections/` carry the finalized accepted wording (acceptance criterion, notes, FLOW-017 main flow, two edge cases, dated note); REQ-206 and `quick-lookup/README.md` are unchanged (grep and git diff).
- [ ] 10. Live check cleanup: browser closed, owned dev server(s) stopped, ports released; captures written only under `PRD/work/ask-box-prefilled-text/.playwright-mcp/` (manual, recorded in the evidence log).
- [ ] 11. `npm run typecheck`, the frontend test suite, and `npm run quality:check` pass.

## Verification

```bash
npm --workspace apps/frontend run test -- App.mid-flight-draft
npm --workspace apps/frontend run test
npm run quality:check
git diff --stat main -- PRD/sections
```

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/App.mid-flight-draft.test.tsx`
- `PRD/sections/functional-requirements.md` (REQ-108)
- `PRD/sections/user-flows.md` (FLOW-017)

## PRD promotion checklist

- [ ] REQ-108 and FLOW-017 amended as finalized in `GATE-QUESTIONS.md` (done at build; cleanup only confirms)
- [ ] No new REQ, FLOW, or decision-log entry

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ask-box-prefilled-text/` ready to delete
