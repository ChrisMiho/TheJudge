status: refined

# player-visible-bugs

Fix the seven player-visible bugs from section a of the codebase-cleanup follow-ups, Trade scanned-printing bug first.

- Idea: `IDEA.md`
- Intake (evidence only): `intake/IDEA.md`
- Design brief: `DESIGN-BRIEF.md`
- Gate questions (REQ-214, REQ-085): `GATE-QUESTIONS.md`
- Live measurements: `evidence/measurements.md`

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/player-visible-bugs/DESIGN-BRIEF.md`
- Findings: none blocking (build-half re-grade 2026-10-19 on `origin/main` `e19dd31e`: no cited line drifted, both gate diffs apply once, no colliding active package; earlier: attempt 2 resolved all seven attempt-1 findings). Advisory: bug 7's base `.seg button` test assertion must be line-start anchored so it cannot match `.lt-scope .seg button` (the brief already says so); the stylesheet test may sit beside the existing 44 px floor tests instead of `ZoneCollectionStep.test.tsx` (optional); one long sentence in the brief's bug 2 foot-note (cosmetic). Full write-up: `QUALITY-CHECK.md`