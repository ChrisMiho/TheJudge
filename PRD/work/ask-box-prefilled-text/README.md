status: refining

# ask-box-prefilled-text

Bug: the Ask box shows an old question (a saved Draft) instead of the hint, so the In-depth button folds to ◈. Reproduced on dev and mtgjudge.gg via the In-depth carry, and via clear-then-reload once a Draft exists. See `DESIGN-BRIEF.md`, the proposal `GATE-QUESTIONS.md` (REQ-206, REQ-108, FLOW-017), and `evidence/measurements.md`. Owner's words: `intake/owner-request.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ask-box-prefilled-text

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/ask-box-prefilled-text/DESIGN-BRIEF.md`
- Findings: (1) the rule for what Ask a Question clears after the In-depth answer is ambiguous when only the question or only the cards change after the carry, and changed is undefined — the brief reads all-or-nothing, the REQ-206 diff reads per-item, criterion 5 tests neither partial case; (2) the owner's type → clear → reload path restores the old question and the brief misses it — `snapshotMidFlightDraft` (`QuickLookupApp.tsx` ~214) removes the Draft only on Menu-leave, history open, or a card change, never when the box is emptied, and there is no page-hide save; needs root cause, live reproduction, a rule, a testable criterion, and REQ-108 / FLOW-017 slots. Full text: `QUALITY-CHECK.md`.
