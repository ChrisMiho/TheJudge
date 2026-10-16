---
status: owner-action
---

# ci-warnings-cleanup

Clear the warnings and notices on the Quality Check workflow: Node 20 action deprecation, the `ubuntu-latest` migration to Ubuntu 26 (2026-10-19), and the frontend lint warnings.

- Idea and evidence: `IDEA.md`
- Design brief: `DESIGN-BRIEF.md` (no product-truth change, so no `GATE-QUESTIONS.md`)
- Intake (driver capture of the CI annotations): `intake/ci-warnings-capture.md` (evidence, not authority)
- Next step: owner reviews the docs PR, then merges it to build; `graph-implement` picks it up from `main`
- Graph run ledger: `GRAPH-RUN.md`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ci-warnings-cleanup

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ci-warnings-cleanup/DESIGN-BRIEF.md`
- Findings: none
