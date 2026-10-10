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
- Findings: (1) GATE-QUESTIONS.md:129 abbreviates the removed system-map Answer-quality Summary line (`system-map.md:501`) instead of quoting it word for word, plus a readability note at :137-138 to drop; (2) GATE-QUESTIONS.md:67 says more about the permission than intake decision 2 allows; (3) the brief's name-lookup coverage numbers name files but no command or script. Full report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rulesguru-local-suite
