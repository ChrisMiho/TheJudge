# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

| Package | Notes |
| --- | --- |
| [prompt-context-refinement](./prompt-context-refinement/) | define loop 2 (2026-08-30, run two): specified the lookup-mode partial-combo mechanics the gate-qc FAIL flagged. REQ-094 (amended) now defines "complete" (every ingredient slot filled by an exact/template match in the attached set, zone/quantity checks dropped for a board-less mode) and "partial" (qualifies on any one attached card, at least one slot unmatched), with lookup selection order complete → attached-card coverage → fewer missing → popularity → variant id; REQ-167's answer AC settled (explain a complete combo; for a partial, describe the missing role from the combo catalog, not a card recommendation) and cap fixed at 5. REQ-095's existing present/missing rendering covers the answer text — no new stable ID. All "not fully specified" flags removed; DESIGN-BRIEF refreshed (cap 5, assumption 8). Resume `/graph-run PRD/work/prompt-context-refinement/` — re-grades at `gate-qc`. |

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
