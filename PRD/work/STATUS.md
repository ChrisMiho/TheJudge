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
| browser-smoke-suite | Parked mid-define: drafts written (NFR-021 proposal) but uncommitted; run id trapped by the hook's retry guard on the run-state file — rotate the run id to resume |
| ci-built-server-smoke | Quality-check PASS — answer `GATE-QUESTIONS.md` (NFR-020 new; REQ-166, NFR-012 amended), then merge the docs PR to build |

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
| [codebase-cleanup-followups](../ideasForLater/codebase-cleanup-followups/) | unregistered (follow-up pass from codebase-cleanup-pass, PR #322) |
| [combo-over-assertion](../ideasForLater/combo-over-assertion/) | unregistered (`IDEA.md` only) — the residual from the combo-context-validation probe (full report in git history at `16d51806`): the model claimed a combo on 2 of 50 unrelated-card pairs; re-test on Luna |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [future-infra](../ideasForLater/future-infra/) | unregistered (forward AWS infra sweep, 2026-08-30) |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
