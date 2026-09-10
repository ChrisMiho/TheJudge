status: refined

# rule-excerpt-cap-ten

Raise the deployed System 3 rule-excerpt cap from 5 to 10. See `IDEA.md` for
the problem/outcome/non-goals and prior-run evidence, and
`intake/GRAPH-BRIEF.md` for the graph-kickoff intake this package started
from. `intake/` is evidence, never authority — the product decisions it raises
are the owner's to make in `GATE-QUESTIONS.md`.

`DESIGN-BRIEF.md` is the design record. `GATE-QUESTIONS.md` carries the
proposed `PRD/sections/` edits — 14 verdict slots covering 32 lines across 7
files — which are applied to `PRD/sections/` at build, never here.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`
- Findings: none (attempt 3, 2026-09-10 — build-half re-grade after the owner accepted all 14 slots and `graph-gate-review` resolved the gate with no edit or reject; reviewer re-ran the 266-hit grep on the build branch with 0 undisposed hits, byte-compared all 32 before-text lines against `PRD/sections/` with 0 mismatches, confirmed 14 well-formed `accept` slots, no new DEC or REQ, `git diff --stat origin/main -- PRD/sections` empty, and the brief build-ready with no live provider call needed; attempts 1–2 were the spec-forming half's FAIL/PASS)

## Open gate

Answer `GATE-QUESTIONS.md` (14 verdict slots), then merge the docs PR to build: https://github.com/ChrisMiho/TheJudge/pull/230
