# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

| Package | Notes |
| --- | --- |
| [ai-answer-quality-baseline](./ai-answer-quality-baseline/) | Confirmed ship-ready 2026-09-07 by `/loop graph-implement` (run `graph-20260907-032104`, build attempt 2): all five slices `done`, 41/41 criteria `true` (E9 the owner-cleared live run, E10 the owner's read-through of run 3), instrument corrected and re-run (semantic retrieval, tier-2 cards attached). Verification gates re-run green on this head. PR #203 open into `main`, retitled `[READY]`. Next is `review` → `close`; the owner merges after `close` |

## active

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
