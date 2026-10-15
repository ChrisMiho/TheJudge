status: refined

# ask-box-prefilled-text

Bug: the Ask box shows an old question (a saved Draft) instead of the hint, so the In-depth button folds to ◈. Reproduced on dev and mtgjudge.gg via clear-then-reload once a Draft exists. Owner's verdicts (2026-10-14): the fix is only that cleared text does not come back after a refresh (REQ-108 and FLOW-017 accepted); the In-depth hand-off change (REQ-206) was rejected and stays as today. See `DESIGN-BRIEF.md`, the finalized proposal `GATE-QUESTIONS.md`, and `evidence/measurements.md`. Owner's words: `intake/owner-request.md`.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ask-box-prefilled-text/DESIGN-BRIEF.md`
- Findings: none
