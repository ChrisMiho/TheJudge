status: refined

# ask-box-prefilled-text

Bug: the Ask box shows an old question (a saved Draft) instead of the hint, so the In-depth button folds to ◈. Reproduced on dev and mtgjudge.gg via the In-depth carry, and via clear-then-reload once a Draft exists. See `DESIGN-BRIEF.md`, the proposal `GATE-QUESTIONS.md` (REQ-206, REQ-108, FLOW-017), and `evidence/measurements.md`. Owner's words: `intake/owner-request.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ask-box-prefilled-text

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ask-box-prefilled-text/DESIGN-BRIEF.md` with the proposal in `GATE-QUESTIONS.md`
- Findings: none (attempt 3; the attempt-2 second-tap finding is resolved). Full text: `QUALITY-CHECK.md`.
