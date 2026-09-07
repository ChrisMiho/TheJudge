# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

| Package | Notes |
| --- | --- |
| [ai-answer-quality-baseline](./ai-answer-quality-baseline/) | Brief reconciled 2026-09-07 with the finalized, owner-edited GATE-QUESTIONS.md (six `edit`, four `accept`): the instrument is a multi-model bake-off over a tiered, all-official gold set, judged by a stronger model that scores alone then ranks blind. Non-goals, judge section, assumptions, M3 cost, measurement plan, and gold-set section rewritten to follow it; REQ-185's tier-1 provenance corrected to the committed rule index `apps/backend/data/gameRulesRuleIndex.json` (277 `Example:` lines), the gitignored raw CR download being neither committed nor read by a run. Verdicts untouched. Awaiting gate-qc re-grade |

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
