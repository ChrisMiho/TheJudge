# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

| Package | Note |
| --- | --- |
| [resilient-weekly-data-refresh](resilient-weekly-data-refresh/) | Fix broken weekly refresh (Scryfall JSONL bulk `jsonl_download_uri`), hash-gate combos (card-identity + template-set hashes, full re-expansion on change), keep 200ms pacing + harden retries, fail loud on a skipped headline download. Mapped: slices A (JSONL fix) → B (fail-loud) → C (retry harden) → D (hash gate + PRD promotion). PRD promotion at cleanup: amend REQ-195 + integrations-and-data, reserve REQ-196. Next: implement-all. |

## refined

## refining

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
