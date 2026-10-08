status: owner-action

# exact-curated-rule-exclusion

Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179).

- Idea: [IDEA.md](IDEA.md)
- Intake (verbatim, evidence only): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposal (owner verdict slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220): [GATE-QUESTIONS.md](GATE-QUESTIONS.md)
- Next: `thejudge-quality-check` (graph run `graph-20261008-053030`, node 4 `gate-qc`).

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md`
- Findings: none (attempt 2 of 3; full report `QUALITY-CHECK.md`; two non-blocking notes for map-out — N1 the topic-excerpt data test's matching method is left to build, a substring check over the committed index gives zero mismatches today; N2 the outline's code paths come from the intake, the two exclusion sites and the trace helper are confirmed, map-out confirms the rest)
