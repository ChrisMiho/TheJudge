status: owner-action

Intake origin: .worktrees/.graph-intake/graph-20261004-234937 (probe-indepth-chip-collapse), copied verbatim to intake/.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/indepth-chip-collapse

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/indepth-chip-collapse/DESIGN-BRIEF.md`
- Findings: none blocking. Three non-blocking notes carried to build: (1) anchor-ask-composer (owner-action, docs PR #249 merged) rewrites the same REQ-206 acceptance line — apply this as a sub-clause substitution and re-read REQ-206 before applying; (2) the `:focus-within` selector also fires on chip/mic/send focus — build decides whether to scope to `textarea:focus`; (3) the proposed REQ-206 Notes "owner signed off" bullet must track the owner's actual verdict (gate-review keeps it in step).
