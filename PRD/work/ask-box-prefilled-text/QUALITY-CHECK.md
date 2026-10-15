# Quality check — ask-box-prefilled-text

Attempt 4, graph mode (`graph-20261015-044701`, node `gate-qc`, build-half re-grade). Graded: `DESIGN-BRIEF.md` plus the finalized REQ-108 and FLOW-017 proposal in `GATE-QUESTIONS.md` (after `graph-gate-review`, `a18a9d68`) against `PRD/sections/` on `origin/main` (`84ae13f5`), unchanged by design.

**Verdict: PASS.** No findings.

## Checked and fine

- Rejected REQ-206 change: no passage, criterion, touched-file entry or test plan in the brief carries it out. Remaining REQ-206 mentions are the unchanged fold rule, the reload promise, and Non-goals and Assumptions rows saying it is not proceeding. Criterion 8 and the Non-goals keep today's In-depth hand-off.
- One Draft rule: the brief, the REQ-108 diff and the FLOW-017 diff all say the Draft is rewritten on every change and removed the moment nothing is staged, in Ask a Question and In-depth details, with the same "nothing is staged" test as Menu-leave.
- Diff anchors match current `PRD/sections/` on `origin/main`: `functional-requirements.md` 2674 and 2698; `user-flows.md` 396, 406 and 414.
- Code lines match: `QuickLookupApp.tsx` mount restore 167, history-resume snapshot 183, `snapshotMidFlightDraft` 214, Menu-leave 234, `selectedCards` effect with first-pass skip 252; `MtgAssistantApp.tsx` 372, 413, 795 and its ten-field staging test; `flow.css` fold rules 281-288 (brief says 281-289, immaterial). `App.mid-flight-draft.test.tsx` exists.
- All 8 acceptance criteria are testable as written (exact inputs, storage key, `data-fill`, label and width values).
- No new REQ, FLOW or screen, so no `screen-layout.md` row is needed. The In-depth Context spacing item is out of scope by owner decision.
