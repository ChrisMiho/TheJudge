status: refined

# health-flow

Part 1 of the self-healing idea: one frozen Playwright test per player flow (18), a coverage map that keeps the PRD and the tests in step, nine flow bugs fixed first (a tenth, the Life Tracker tap, waits on blocker question Q-015), and the retired FLOW-008/012 stubs removed. Part 2 (the auto-merge pipeline) is `PRD/work/health-pipeline/`. See `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (17 blocks, with the test-case list under NFR-022, plus blocker Q-015) and `evidence/`. One gameplan: fixes, then tests, then the code PR opens and the graph run closes (the receipt carries the test-case list, checks/skips lists and must-fail records; this folder is deleted). Before merging, the owner watches a run in Playwright UI mode and a Claude Code session the owner starts on the PR branch adds the owner's misses to the same PR. The tests freeze at merge. `intake/owner-use-cases.md` is optional input to that round.

Next: `/thejudge-quality-check PRD/work/health-flow/`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/health-flow

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/health-flow/DESIGN-BRIEF.md`
- Findings: 4 blocking — (1) NFR-012 diff leaves the retired `built-server` / `browser-smoke` job names in the second half of `non-functional-requirements.md:209`; (2) NFR-021 Description (line 376), Constraint line 387 (`unit-tested under scripts/`) and Notes line 403 still describe the old six smoke steps; (3) fixes 6–10 have no diagnosis, file list or named unit test in `evidence/bug-diagnosis.md`, and fix 10 depends on PR #341 text not on this branch; (4) `### 6. Order` steps 6–7 happen after the graph `close` node has deleted the package, and the brief does not say who adds the owner misses or that the receipt must carry the test-case list, the checks/skips lists and the must-fail records. 5 advisory (decision 7 count, reconciliation supersede note, disposition rows for the other flow ids, REQ-206 cite substance, deploy-needs wording). Full report: `PRD/work/health-flow/QUALITY-CHECK.md` (commit `022a7ff5`).
