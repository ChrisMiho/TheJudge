# compact-data-extracts

status: owner-action

## Summary

Re-encode the committed backend data extracts (brotli, 128-combo blocks) so
the full fresh corpus fits the 120 MB Lambda budget without trimming. See
`IDEA.md` for problem, outcome, non-goals, intake, and prior-run matches.

## Intake

- `intake/GRAPH-BRIEF.md` (originally staged at
  `.worktrees/.graph-intake/graph-20260908-233747/GRAPH-BRIEF.md`) — evidence
  only, not authority.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/compact-data-extracts/DESIGN-BRIEF.md`
- Findings: none. Amendment set verified complete by the reviewer's own grep —
  20 stable-ID slots cover every `PRD/sections` line that the brotli/rename
  change would make stale, every slot's "before" text is byte-identical to
  current truth, `GATE-QUESTIONS.md` is well-formed, and `PRD/sections/` is
  unedited. (Attempt 1 FAILed on a missed amendment set — REQ-167, REQ-180, and
  four `integrations-and-data.md` card-detail lines — fixed at define attempt 2.)
