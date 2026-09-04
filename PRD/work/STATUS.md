# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

## refining

- [image-first-cards](image-first-cards/) — image-first tiles with on-demand card detail; gate-qc FAIL (attempt 5): `DESIGN-BRIEF.md` still narrates the pre-edit design (no new endpoint, name+oracle-id fallback) and contradicts the finalized `GATE-QUESTIONS.md` on the owner's D3 and D5 edits. Needs the brief reconciled to the finalized proposal before gate-qc can re-run.

## ideation

- [single-source-invariants](single-source-invariants/) — de-duplicate cross-cutting product-truth invariants (rules asserted in 3+ files, e.g. "one main endpoint") into one canonical home each + a grep-before-amend guardrail; bounded corpus hygiene, not an ID-system rewrite. Seeded 2026-09-04 from the image-first-cards D5 near-miss. To implement next, after image-first-cards ships.

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
