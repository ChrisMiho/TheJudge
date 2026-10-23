status: owner-action

# health-flow

Part 1 of the self-healing idea: one frozen Playwright test per player flow (18), a coverage map that keeps the PRD and the tests in step, nine flow bugs fixed first (a tenth, the Life Tracker tap, waits on blocker question Q-015), and the retired FLOW-008/012 stubs removed. Part 2 (the auto-merge pipeline) is `PRD/work/health-pipeline/`. See `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (17 blocks, with the test-case list under NFR-022, plus blocker Q-015) and `evidence/`. One gameplan: fixes, then tests, then the code PR opens and the graph run closes (the receipt carries the test-case list, checks/skips lists and must-fail records; this folder is deleted). Before merging, the owner watches a run in Playwright UI mode and a Claude Code session the owner starts on the PR branch adds the owner's misses to the same PR. The tests freeze at merge. `intake/owner-use-cases.md` is optional input to that round.

Next: answer the 18 verdict slots in `GATE-QUESTIONS.md` (17 spec blocks + blocker Q-015), then merge the docs PR; `/graph-implement PRD/work/health-flow/` builds it.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/health-flow

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/health-flow/DESIGN-BRIEF.md`
- Findings: none blocking (attempt 2, commit `03c77103`; attempt 1 failed on four completeness gaps, all resolved by define commit `dd56ff68`). 3 advisory: name `scripts/smoke-browser.mjs`'s renamed file at build when `system-map.md:537` is applied; `quick-lookup/README.md:195` and `:364` still say `1-20 turns` (same meaning as the amended `messages` wording, no disposition row); `evidence/bug-diagnosis.md:21` still says `all five` (cosmetic). Full report: `PRD/work/health-flow/QUALITY-CHECK.md`.
