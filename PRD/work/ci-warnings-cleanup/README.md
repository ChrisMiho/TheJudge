---
status: ship-ready
---

# ci-warnings-cleanup

Clear the warnings and notices on the Quality Check workflow: Node 20 action deprecation, the `ubuntu-latest` migration to Ubuntu 26 (2026-10-19), and the frontend lint warnings.

- Idea and evidence: `IDEA.md`
- Design brief: `DESIGN-BRIEF.md` (no product-truth change, so no `GATE-QUESTIONS.md`)
- Intake (driver capture of the CI annotations): `intake/ci-warnings-capture.md` (evidence, not authority)
- Next step: implement slices A and B (parallel-ready) on `thejudge-auto/ci-warnings-cleanup-work`
- Graph run ledger: `GRAPH-RUN.md`

## Slices

| Slice | Doc | Goal | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-workflow-pins.md` | Action majors to latest, all jobs on `ubuntu-24.04` | none |
| B | `slice-b-lint-fixes.md` | Clear all 19 lint warnings, no visible change (carries Ship gates) | none |

Criteria files: `slice-a.criteria.json`, `slice-b.criteria.json`. Plan: `GAMEPLAN.md`.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ci-warnings-cleanup/DESIGN-BRIEF.md`
- Findings: none
