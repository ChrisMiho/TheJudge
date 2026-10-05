# indepth-chip-collapse

Problem: on a single-row Ask composer the "In-depth" chip's text label eats width the question needs, even while the player is typing.
Outcome: the chip collapses to its ◈ glyph when the box is focused or has text; the "In-depth" label shows only at rest (empty and unfocused), freeing width for the question.
Non-goals: no ComposerPill structure change; frontend/CSS only; no change to what In-depth does. Amends REQ-206.

## Prior run
- PRD/instructions/receipts/ui-pass-2-2026-10-04.md
- PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md
- PRD/instructions/receipts/ui-look-translation-2026-10-02.md
- PRD/instructions/receipts/tab-personality-color-sync-2026-10-04.md

Intake (evidence, not authority): PRD/work/indepth-chip-collapse/intake/ (FINDINGS.md, PROBE.md), staged from .worktrees/.graph-intake/graph-20261004-234937.
Related live package (not a receipt): PRD/work/anchor-ask-composer also amends REQ-206.
