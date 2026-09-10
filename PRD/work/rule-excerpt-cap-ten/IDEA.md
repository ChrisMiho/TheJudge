# Idea: Raise the deployed System 3 rule-excerpt cap from 5 to 10

Today, when a player asks Ask AI a rules question, System 3 (rule retrieval)
attaches at most 5 Comprehensive Rules excerpts to the prompt. On hard
questions the deciding rule sometimes ranks just outside that top 5, so the
deployed model (gpt-4.1) answers incorrectly even though the right rule was
retrieved. Raising the cap to 10 lets those borderline-ranked rules reach the
prompt.

The just-shipped answer-quality instrument already measured this directly: at
cap 5 gpt-4.1 scores 16/18 on the worked-solution gold set; at cap 10 it scores
18/18, with no latency change and no re-ranking of the excerpts already shown.
The outcome is a one-constant change (`DEFAULT_SUPPLEMENTAL_RULE_CAP` 5 → 10)
plus a full sweep of `PRD/sections/` assertions that currently say "five
excerpts," moved to ten. Non-goals: no new retrieval or ranking work, no
change to the unrelated five-variant combo-retrieval cap (REQ-094/095), and no
reopening of the answer-quality instrument itself (PR #203, shipped).

## Prior run

- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` — the answer-quality instrument's run 3, whose gpt-4.1 cap-5-vs-cap-10 numbers (16/18 vs 18/18) are this idea's entire evidence base.
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — shipped the hybrid System 3 retrieval (REQ-177–181) that the excerpt cap sits on top of; carries the "five official rule excerpts" framing this idea changes.
- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — System 3 RAG retrieval fixes and the "Comprehensive Rules excerpt" recall work this cap consumes.
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` — established the System 3 scoring/tie-break this cap slices into (IDF weighting, keyword boosts).
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` — built the System 3 supplemental-rules query and the answer-quality validation approach this idea's instrument descends from.
- `PRD/instructions/receipts/quick-lookup-2026-08-01.md` — Quick Lookup's System 3 retrieval + excerpt field, one of the two consumers this cap change applies to.
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md` — shipped the original "ADDITIONAL RELEVANT RULE EXCERPTS" supplemental section that the cap governs.
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md` — earlier general rules prompt work using excerpt-count framing (System 2, not System 3 — background only).
- `PRD/instructions/receipts/graph-workflow-land-2026-09-06.md` — names `ai-answer-quality-baseline` as the next kickoff target under the current graph shape; the run this idea's evidence came out of.
