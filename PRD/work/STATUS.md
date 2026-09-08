# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

| Package | Note |
| --- | --- |
| [trade-balancer-price-slim](trade-balancer-price-slim/) | Backend-move design (owner pivot), gate-qc PASS, mapped out 2026-09-08. Gate resolved 2026-09-07: all ten stable-id blocks (REQ-064/065/066/174/175, FLOW-009, FLOW-025, NFR-004/013/014) accept, BLOCK-01 = A (sibling read-only route `GET /api/cards/:oracleId/prices`). Docs PR #211 merged — the build signal. Four slices (A backend build/artifact, B backend route, C shared cardMetadata index, D frontend balancer flow + cleanup); safe order A, B, C, D. Resumes at implement. |

## refined

## refining

## ideation

## owner-action

| Package | Note |
| --- | --- |
| [weekly-data-refresh-pr](weekly-data-refresh-pr/) | gate-qc PASS; docs PR open into `main` (REQ-195). Answer the verdict in `GATE-QUESTIONS.md`, then merge the PR to build. |

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
