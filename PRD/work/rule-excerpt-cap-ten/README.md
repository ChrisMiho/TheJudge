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

- Autonomous base: origin/thejudge-auto/rule-excerpt-cap-ten

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/rule-excerpt-cap-ten/DESIGN-BRIEF.md`
- Findings: the amendment-set appendix mislabels 8 of 266 "not this cap" rows as the REQ-094/095 combo-variant cap when the cited line is a layout, attach-limit, deploy, or section-order cap (`screen-layout.md:132`, `functional-requirements.md:2211`, `:3107`, `:3379`, `:3881`, `:4442`, `decisions/deployment.md:31`, `in-depth/README.md:302`); the "not this cap" conclusion holds for all 8, the stated reason is wrong, so the table cannot be trusted at face value by an implementing agent. All other checks clean (grep reproduced 266 hits, 32 amend rows = 32 diff hunks, all before-text byte-identical, 14 slots well-formed, no new DEC, `PRD/sections/` unedited)
