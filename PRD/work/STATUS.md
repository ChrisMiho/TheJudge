# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

| Package | Note |
| --- | --- |

## active

| Package | Note |
| --- | --- |

## refined

| Package | Note |
| --- | --- |
| ask-box-prefilled-text | Ask box shows an old question instead of the hint; fix the In-depth hand-off (including a second tap) and make the saved Draft follow the box (REQ-206, REQ-108, FLOW-017 slots) |

## refining

| Package | Note |
| --- | --- |

## ideation

| Package | Note |
| --- | --- |

## owner-action

| Package | Note |
| --- | --- |

## deferred

| Package | Note |
| --- | --- |

## parked in ideasForLater

Moved out of the lifecycle on 2026-08-22 to clear the board. Artifacts are
preserved verbatim under `PRD/ideasForLater/<slug>/`, including each package's
`STATUS.*` marker file recording the stage it was at when parked. To resume
one, move the folder back to `PRD/work/<slug>/` and re-list it under the
matching heading above — the `thejudge-*` skills only look inside `PRD/work/`.

| Package | Stage when parked |
| --- | --- |
| [advert](../ideasForLater/advert/) | unregistered (draft announcement posts, no `STATUS.*`) |
| [card-collection-manager](../ideasForLater/card-collection-manager/) | ideation |
| [combo-over-assertion](../ideasForLater/combo-over-assertion/) | unregistered (`IDEA.md` only) — the residual from the combo-context-validation probe (full report in git history at `16d51806`): the model claimed a combo on 2 of 50 unrelated-card pairs; re-test on Luna |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [future-infra](../ideasForLater/future-infra/) | unregistered (forward AWS infra sweep, 2026-08-30) |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
