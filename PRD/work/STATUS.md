# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready
- [rag-rule-retrieval](rag-rule-retrieval/) — one gameplan for RAG in Ask AI's
  supplemental Comprehensive-Rules block (System 3): five ordered steps, each
  with a measurement gate — repair the recall instruments (REQ-177), fix the
  retrieval query (REQ-178), clean the rule corpus (REQ-179), feed it Scryfall
  keywords (REQ-180), then rank rules by meaning with a bundled local model
  (REQ-181). Consolidates every RAG-shaped work folder and the parked,
  never-merged `semantic-rule-retrieval` design (PR #154). All 24 gate slots
  accepted 2026-09-05, docs PR #190 merged. All five slices (A–E) done
  2026-09-05; PR #191 (`thejudge-auto/rag-rule-retrieval-work` →
  `thejudge-auto/rag-rule-retrieval`) ready for owner review and merge.

## active

## refined

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
