status: refining

# player-visible-bugs

Fix the seven player-visible bugs from section a of the codebase-cleanup follow-ups, Trade scanned-printing bug first.

- Idea: `IDEA.md`
- Intake (evidence only): `intake/IDEA.md`
- Design brief: `DESIGN-BRIEF.md`
- Gate questions (REQ-214, REQ-085): `GATE-QUESTIONS.md`
- Live measurements: `evidence/measurements.md`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/player-visible-bugs

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/player-visible-bugs/DESIGN-BRIEF.md`
- Findings: (1) blocking — bug 2's new refusal line inside the scanner is not reconciled with REQ-070's redesigned-screens rule (`PRD/sections/functional-requirements.md:1690`: on the card scanner's chrome, helper text follows the approved mockup, and where the mockup shows no line none renders; the mockup `docs/design/ui-reimagining/direction-1/card-scan.html` shows no refusal line); (2) blocking — bug 7 says `.seg` renders only in In-Depth, but Life Tracker uses it (`CounterPanel.tsx:330`, `GameSetupPanel.tsx:271`, `:291`), and `.lt-scope .seg button` (`index.css:4587`, min-height 42px) outranks the base rule, so the brief and proof test must say and assert Life Tracker height is unchanged; advisory — REQ-085 citation lines (`:2026-2027`, not `:2021-2024`); REQ-214 hunk skips the `Exit scan` bullet at `:5619`; bug 7 proof should name `ComposerPill.test.tsx:415`; bug 5 should say definitely which file exposes the saved-request flag; collision section should also cover `index.css` against the card-rings and pop-ups briefs. Full write-up: `QUALITY-CHECK.md`
