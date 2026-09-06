# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

| Package | Notes |
| --- | --- |
| [ai-answer-quality-baseline](./ai-answer-quality-baseline/) | Define gate answered and applied 2026-09-06 (6 edit / 4 accept); docs PR #200 awaits owner merge, then `graph-implement` resumes at `gate-qc` |

## refining

| Package | Notes |
| --- | --- |
| [graph-workflow-land](./graph-workflow-land/) | Graph-workflow fix part 2: one writer per branch, `close` before `land`, two PRs per package (audit findings 2 and 7); QC 1 FAIL 2026-09-06, reworked; manual package on `fix/graph-workflow-land` |

## ideation

## owner-action

## deferred

## parked in ideasForLater

Moved out of the lifecycle on 2026-08-22 to clear the board. Artifacts are
preserved verbatim under `PRD/ideasForLater/<slug>/`, including each package's
`STATUS.*` marker file recording the stage it was at when parked. To resume
one, move the folder back to `PRD/work/<slug>/` and re-list it under the
matching heading above — the `thejudge-*` skills only look inside `PRD/work/`.

| Package | Stage when parked |
| --- | --- |
| [card-collection-manager](../ideasForLater/card-collection-manager/) | ideation |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [graph-workflow](../ideasForLater/graph-workflow/) | unregistered (braindump + spine plan, no `STATUS.*`) |
| [life-tracker-me-map-and-tray](../ideasForLater/life-tracker-me-map-and-tray/) | ideation |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
