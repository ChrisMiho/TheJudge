# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

| Package | Notes |
| --- | --- |
| [shared-chrome-spec](./shared-chrome-spec/) | Phase A #6 of the docs-refactor gameplan — current-state shared-chrome spec verified against its cited sources and the `apps/frontend/src/` tree. All 3 slices done: A (structural chrome), B (conversation/overlay chrome, one bounded path correction), C (scope-boundary bullets, `PRD/README.md` Section Inventory row, diff-scope proof from `ee6e33f`). PR #118 merged (`thejudge-auto/shared-chrome-spec-work` → `thejudge-auto/shared-chrome-spec`); `land` done. Ready for `/thejudge-cleanup`. |

## active

## refined

- [lambda-s3-deploy](./lambda-s3-deploy/)

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
| [ai-answer-quality-baseline](../ideasForLater/ai-answer-quality-baseline/) | ideation |
| [card-collection-manager](../ideasForLater/card-collection-manager/) | ideation |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [graph-workflow](../ideasForLater/graph-workflow/) | unregistered (braindump + spine plan, no `STATUS.*`) |
| [life-tracker-me-map-and-tray](../ideasForLater/life-tracker-me-map-and-tray/) | ideation |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
