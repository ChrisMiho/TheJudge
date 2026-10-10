status: refined

# rulesguru-local-suite

Local-only RulesGuru practice suite for the rules test harness. See `IDEA.md`.

Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`, `intake/FINDINGS-fit.md`. Hard constraint: no RulesGuru data in any committed file.

- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (new REQ-232; amends REQ-185, REQ-186, REQ-188, REQ-226, NFR-018 and one non-goal; blockers B1 promotion, B2 folder)
- Evidence: `evidence/name-lookup-counts.mjs` and its saved output `evidence/name-lookup-counts.out.txt` (the brief's name-lookup counts, from committed data only)
- Graph run ledger: `GRAPH-RUN.md`

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/rulesguru-local-suite/DESIGN-BRIEF.md`
- Findings: build-half re-grade at `c6dec2ce` (after code PR #285 merged), commit `8476a3ef`: (1) the amendment-set grep now returns 269 hits, not the stated 251, and its file:line keys shifted; (2) 18 new hits need rows, all no-change (16 license lines in new #285 case files, the REQ-187 rubric-moves line, `rubric.ts:86`); (3) three existing rows have stale reasons (REQ-185 Description, the REQ-185 agent-approval constraint, the REQ-230 arm list), all still no-change; (4) non-blocking: the brief's recipe-overlap prose still calls the recipe package parked. Diffs 19/19 exact, build-scope names all present, 9/9 verdicts consistent. Report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/main
