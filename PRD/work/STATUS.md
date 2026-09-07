# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

| Package | Notes |
| --- | --- |
| [ai-answer-quality-baseline](./ai-answer-quality-baseline/) | Built 2026-09-07 (node 6, build half): slices A–D done (gold set, cap parameter, judge/rubric, artifact — REQ-185–190 applied). Slice E wired end to end and gated green (E1–E8), blocked on E9/E10 (the owner's first live run and read-through — no paid call was made by this node). Next: the owner follows `slice-e-integrate-and-apply.md`'s "Owner steps", then `thejudge-cleanup` / the graph's `close` step |

## refined

## refining

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
