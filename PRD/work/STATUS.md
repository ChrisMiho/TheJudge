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

## refining

| Package | Note |
| --- | --- |

## ideation

| Package | Note |
| --- | --- |

## owner-action

| Package | Note |
| --- | --- |
| [niche-interaction-rule-tests](niche-interaction-rule-tests/) | Build half PARKED 2026-10-07: gate-qc attempt 7 FAIL on one mechanical item (the brief's re-measure step needs the gitignored MiniLM model folder `apps/backend/data/models/`; the brief says no gitignored file is needed), loops spent; everything else re-verified on `main`. Owner: authorize one define pass to add the copy-the-model step, then `/graph-implement PRD/work/niche-interaction-rule-tests/`; branch `thejudge-auto/niche-interaction-rule-tests-work` |

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
| [card-collection-manager](../ideasForLater/card-collection-manager/) | ideation |
| [combo-context-validation](../ideasForLater/combo-context-validation/) | ideation — investigate-first, complete: `FINDINGS.md` (500-case combo suite, 2026-08-31: context sufficient, the model over-asserts combos on unrelated cards, RAG measurably better) and `HANDOFF.md` parked 2026-09-07 from the unmerged `thejudge-auto/semantic-rule-retrieval` branch; the throwaway harness and its generated JSON stay on that branch at `origin` (`bcbcebc`), cited by REQ-177's note. Next: a combo-grounded answer test now that the answer-quality instrument (REQ-185–190) exists |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [graph-workflow](../ideasForLater/graph-workflow/) | unregistered (braindump + spine plan, no `STATUS.*`) |
| [life-tracker-me-map-and-tray](../ideasForLater/life-tracker-me-map-and-tray/) | ideation |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
