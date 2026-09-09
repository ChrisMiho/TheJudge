# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

| Package | Note |
| --- | --- |

## active

## refined

| Package | Note |
| --- | --- |

## refining

| Package | Note |
| --- | --- |

## ideation

## owner-action

| Package | Note |
| --- | --- |
| [trade-balancer-first-card-ux](trade-balancer-first-card-ux/) | PARKED by `graph-implement` after `gate-qc` attempt 6 FAIL (past the three-loop limit). The brief now matches the owner's accepted foil rule, but the verbatim intake brief `intake/GRAPH-BRIEF.md` (decision 4, line 32; helper signature, line 41) still states the superseded keep-current-toggle rule and the README pointer sends map-out there. Intake is verbatim evidence, so the fix is a supersession note in the README pointer (and brief), not an intake edit. Then restore `STATUS.refined`, push, `/graph-implement PRD/work/trade-balancer-first-card-ux/`. Graph run `graph-20260909-213550`, build worktree `.worktrees/implement-trade-balancer-first-card-ux` |


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
| [combo-context-validation](../ideasForLater/combo-context-validation/) | ideation — investigate-first, complete: `FINDINGS.md` (500-case combo suite, 2026-08-31: context sufficient, the model over-asserts combos on unrelated cards, RAG measurably better) and `HANDOFF.md` parked 2026-09-07 from the unmerged `thejudge-auto/semantic-rule-retrieval` branch; the throwaway harness and its generated JSON stay on that branch at `origin` (`bcbcebc`), cited by REQ-177's note. Next: a combo-grounded answer test now that the answer-quality instrument (REQ-185–190) exists |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [graph-workflow](../ideasForLater/graph-workflow/) | unregistered (braindump + spine plan, no `STATUS.*`) |
| [life-tracker-me-map-and-tray](../ideasForLater/life-tracker-me-map-and-tray/) | ideation |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
