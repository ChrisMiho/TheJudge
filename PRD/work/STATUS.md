# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

| [graph-shipping-mode-phase1](graph-shipping-mode-phase1/) | propose/apply lifecycle rework (mapped, 4 slices A–D): refinement proposes (work-folder only), implement applies durable truth + code, cleanup promotes once; agent-workflow only. Guard/auto-bridge/concurrency = Phase 2 |

## refined

## refining

## ideation

| [graph-shipping-mode-phase2](graph-shipping-mode-phase2/) | two decoupled tools joined by main: parallel spec-former (worktree per run) + single background implementation loop; subagents off by default; depends on phase1 |

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
