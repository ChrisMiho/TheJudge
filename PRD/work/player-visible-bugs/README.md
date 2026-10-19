status: ship-ready

# player-visible-bugs

Fix the seven player-visible bugs from section a of the codebase-cleanup follow-ups, Trade scanned-printing bug first.

- Idea: `IDEA.md`
- Intake (evidence only): `intake/IDEA.md`
- Design brief: `DESIGN-BRIEF.md`
- Gate questions (REQ-214, REQ-085): `GATE-QUESTIONS.md`
- Live measurements: `evidence/measurements.md`
- Gameplan: `GAMEPLAN.md`

## Slices

One code PR; slice A in its own commits. Parallel-ready; run in letter order.

| Slice | Doc | Bug | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-trade-scanned-printing.md` | 1 Trade scanned printing | none |
| B | `slice-b-feedback-and-retry.md` | 3 feedback context, 5 Retry | none |
| C | `slice-c-scanner-refusal-line.md` | 2 scanner refusal line (applies REQ-214 diff) | none |
| D | `slice-d-reopen-keeps-players.md` | 4 reopen keeps players (applies REQ-085 diff) | none |
| E | `slice-e-tap-floor.md` | 7 tap floor; REQ-202 screenshot pair; ship gates | none |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/player-visible-bugs/DESIGN-BRIEF.md`
- Findings: none blocking (build-half re-grade 2026-10-19 on `origin/main` `e19dd31e`: no cited line drifted, both gate diffs apply once, no colliding active package; earlier: attempt 2 resolved all seven attempt-1 findings). Advisory: bug 7's base `.seg button` test assertion must be line-start anchored so it cannot match `.lt-scope .seg button` (the brief already says so); the stylesheet test may sit beside the existing 44 px floor tests instead of `ZoneCollectionStep.test.tsx` (optional); one long sentence in the brief's bug 2 foot-note (cosmetic). Full write-up: `QUALITY-CHECK.md`