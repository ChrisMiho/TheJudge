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
| [trade-balancer-first-card-ux](trade-balancer-first-card-ux/) | `gate-qc` attempt 6 FAILed: `DESIGN-BRIEF.md`'s foil section and Assumption A6 now agree with the owner's accepted rule, but `intake/GRAPH-BRIEF.md` (decision 4, line 32) still states the pre-edit rule — "otherwise keep the player's current toggle (default off)" — and its design-direction section (line 41) still names a `defaultFoilFor(printing, currentFoil)` helper signature built around carrying a current toggle forward. The package README points future readers, including map-out, at this file for "converged design direction", so the stale rule can still reach a slice. Graph run `graph-20260909-213550`, build worktree `.worktrees/implement-trade-balancer-first-card-ux` |

## ideation

## owner-action

| Package | Note |
| --- | --- |


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
