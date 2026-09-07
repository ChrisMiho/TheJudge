# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

## refining

## ideation

## owner-action

| Package | Notes |
| --- | --- |
| [ai-answer-quality-baseline](./ai-answer-quality-baseline/) | Parked 2026-09-07 by `graph-implement` (run `graph-20260907-032104`) at the build gate: slices A–D done and pushed, slice E wired, applied, and gated green except E9/E10 — the owner's first live run (≈ $2.56, `npm run eval:answer-quality -- --confirm-live-calls`) and read-through. PR #203 open into `main`. Owner steps: `GRAPH-RUN.md` `## Open gate` and `slice-e-integrate-and-apply.md` `## Owner steps for E9 and E10`; then `/loop graph-implement` resumes at `build` → `review` → `close` |

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
