status: refining

# health-flow

Part 1 of the self-healing idea: one frozen Playwright test per player flow (18), a coverage map that keeps the PRD and the tests in step, ten flow bugs fixed first, and the retired FLOW-008/012 stubs removed. Part 2 (the auto-merge pipeline) is `PRD/work/health-pipeline/`. See `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (17 blocks, with the test-case list under NFR-022) and `evidence/`. One gameplan: fixes, then tests, then the code PR opens; before merging it the owner watches a run in Playwright UI mode and the owner's misses are added to the same PR. The tests freeze at merge. `intake/owner-use-cases.md` is optional input to that round.

Next: `/thejudge-quality-check PRD/work/health-flow/`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/health-flow
