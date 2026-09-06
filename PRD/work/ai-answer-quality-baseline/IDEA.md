# ai-answer-quality-baseline

TheJudge's backend eval harness (`apps/backend/src/eval/`) scores prompt/context structure and, since hybrid rule retrieval shipped (PRs #197, #199), retrieval relevance — but nothing grades the model's final rules answer. `apps/backend/src/eval/worked-solutions/` holds six `*.case.json` cases with published correct answers; today `npm run eval:worked-solutions` only checks whether the source rule reached the prompt, not whether the answer is right (intake: `intake/answer-quality-context.md`, `intake/IDEA.md`).

Outcome: a repeatable, human-reviewable instrument that scores the model's actual final answer, seeded from the six worked-solution gold cases, so a prompt or retrieval change can be shown to help, hurt, or do nothing — including whether attaching more than System 3's current five rule excerpts helps or hurts the answer.

Non-goals: the judge mechanism, scoring axes, cost/cadence, and any fixture subset beyond the worked-solution seed are decided at the define gate, not here; no automated CI gate on model output; no new product surface, endpoint, or `AskAiRequest` contract change; no provider or model swap.

## Prior run

- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md`
- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md`
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md`
- `PRD/instructions/receipts/prompt-preview-command-2026-06-06.md`
- `PRD/instructions/receipts/phase-scoped-prompt-context-2026-06-06.md`
- `PRD/instructions/receipts/full-card-oracle-prompt-2026-06-12.md`
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md`
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md`
- `PRD/instructions/receipts/ci-quality-check-runtime-2026-08-06.md`
- `PRD/instructions/receipts/scan-capture-quality-2026-06-26.md`
