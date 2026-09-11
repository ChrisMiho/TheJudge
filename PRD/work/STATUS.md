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
| [domain-corporate-network-reachability](domain-corporate-network-reachability/) | Gate-qc PASS 2026-09-11 (run `graph-20260911-160859`). Owner: answer the five verdict slots in `GATE-QUESTIONS.md` (REQ-197 security headers, REQ-198 real `robots.txt`/`security.txt` — needs a contact address, REQ-199 reachability runbook, DEC-084 in-place, system-map), then merge the docs PR to build. Headline: no code change promises `mtgjudge.gg` opens at work; the six-day-old domain's category and reputation sit with the filter vendors |


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
