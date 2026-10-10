status: refined

# rulesguru-local-suite

Local-only RulesGuru practice suite for the rules test harness. See `IDEA.md`.

Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`, `intake/FINDINGS-fit.md`. Hard constraint: no RulesGuru data in any committed file.

- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (new REQ-232; amends REQ-185, REQ-186, REQ-188, REQ-226, NFR-018 and one non-goal; blockers B1 promotion, B2 folder)
- Evidence: `evidence/name-lookup-counts.mjs` and its saved output `evidence/name-lookup-counts.out.txt` (the brief's name-lookup counts, from committed data only); `evidence/amendment-grep.cmd.txt`, `evidence/amendment-grep.mjs` and the raw hit list `evidence/amendment-grep.hits.txt` (the brief's amendment-set grep, 269 hits at `c6dec2ce`)
- Graph run ledger: `GRAPH-RUN.md`

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rulesguru-local-suite/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade attempt 2 at `c6dec2ce`, commit `9face57d`, after the owner's 9/9 accept; attempt 1 `8476a3ef` failed on a stale amendment set, refreshed by define `02a2cc5b`). Report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/main
