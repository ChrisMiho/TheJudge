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
| [prompt-context-refinement](./prompt-context-refinement/) | Built, tested, reviewed (APPROVE). At `land` — owner merges two PRs in order: #152 (implementation `…-v2-work`→`…-v2`) first, then #151 (`…-v2`→`main`) last. Then resume `/graph-run PRD/work/prompt-context-refinement/` for `close` (promote truth, receipt, delete package). Built: multi-card Quick Question (≤5 cards) with complete/partial combo answers, guardrail phrasing fix + glossary, prompt-layout spec, worked-solutions eval; 28/28 criteria, suite green. |

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
