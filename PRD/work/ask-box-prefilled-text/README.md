status: refined

# ask-box-prefilled-text

Bug: the Ask box shows an old question (a saved Draft) instead of the hint, so the In-depth button folds to ◈. Reproduced on dev and mtgjudge.gg via the In-depth carry, and via clear-then-reload once a Draft exists. See `DESIGN-BRIEF.md`, the proposal `GATE-QUESTIONS.md` (REQ-206, REQ-108, FLOW-017), and `evidence/measurements.md`. Owner's words: `intake/owner-request.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ask-box-prefilled-text

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/ask-box-prefilled-text/DESIGN-BRIEF.md`
- Findings: (attempt 2; both attempt-1 findings resolved) (1) a second tap on In-depth leaves In-depth's question box undefined — criterion 9 asserts only that Ask a Question clears, never what In-depth's box holds after a second tap when the first tap already filled it or a walk had started, nor whether the second tap starts a new carried attempt whose answer triggers the clear; fix in the brief and the REQ-206 criterion (a later tap replaces the carried question; that attempt's answer triggers the clear) and extend criterion 9 to assert In-depth's box and request text. Full text: `QUALITY-CHECK.md`.
