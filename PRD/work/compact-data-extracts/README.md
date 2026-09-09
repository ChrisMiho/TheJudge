# compact-data-extracts

status: refining

## Summary

Re-encode the committed backend data extracts (brotli, 128-combo blocks) so
the full fresh corpus fits the 120 MB Lambda budget without trimming. See
`IDEA.md` for problem, outcome, non-goals, intake, and prior-run matches.

## Intake

- `intake/GRAPH-BRIEF.md` (originally staged at
  `.worktrees/.graph-intake/graph-20260908-233747/GRAPH-BRIEF.md`) — evidence
  only, not authority.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/compact-data-extracts

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/compact-data-extracts/DESIGN-BRIEF.md`
- Findings: Amendment set incomplete. `GATE-QUESTIONS.md` renames
  `cardDetailByOracleId.json` → `.json.br` but does not amend REQ-167 and
  REQ-180 (`PRD/sections/functional-requirements.md`), nor four more lines in
  `PRD/sections/integrations-and-data.md` (the `GET /api/cards/:oracleId`
  Purpose block, the request-context resolution line, the Card Detail Data
  Strategy section, and the Delivery Strategy zone-rendering line) — all name
  the old file and would describe a nonexistent artifact after the rename.
  Looping to `define` (loop 1 of 3) to re-enumerate the amendment set by grep.
