# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

| Package | Notes |
| --- | --- |
| [prompt-context-refinement](./prompt-context-refinement/) | All 5 slices done 2026-08-30 on `thejudge-auto/prompt-context-refinement-v2-work`: A (multi-card lookup backend), B (multi-card pre-submit UI + follow-up wiring, Playwright-verified), C (REQ-168 guardrail wording + phrasing glossary), D (REQ-169 prompt-layout spec), E (NFR-018 worked-solutions eval set). Quality gate green. Ready for `thejudge-cleanup` after the PR merges. |

## active

## refined

## refining

## ideation

## owner-action

| Package | Notes |
| --- | --- |
| [semantic-rule-retrieval](./semantic-rule-retrieval/) | Run one of graph run graph-20260901-044411 parked here 2026-08-31 after quality-check PASS. Owner action: answer the 9 verdicts in `GATE-QUESTIONS.md` (semantic rule retrieval, REQ-170, + combo over-assertion fix), then resume with `/graph-run PRD/work/semantic-rule-retrieval/`. Design published to `origin/thejudge-auto/semantic-rule-retrieval`; docs-only PR into `main` open for review — merge it last. Run two applies the verdicts, re-checks, then plans/builds/reviews. |

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
