# Answer-quality investigation

STATUS.ideation

Players asking about hard interactions (Academy Manufactor + Esix, Necropotence + Silence + Borne Upon a Wind) get wrong or shaky explanations, and nobody can yet say which change helps and which hurts. Outcome: a reproducible before/after answer comparison for PR #273 (base `3e973ced` vs head `07cc3ab6`) on the existing rules-test harness, a split of retrieval failures from prompt-organization failures, and a GPT-4.1 versus GPT-6 Luna comparison, so a product fix is chosen from measured results. Non-goals: rebuilding the harness, naming a retrieval architecture or model winner before results exist, clarification UX, new data-source ingestion, a deterministic rules engine, a multi-agent answer system, and any production change during the investigation.

Selected candidate: the bounded investigation plus the comparison tooling it needs (distinct result destinations, fixed case manifests, run IDs, per-call checkpoint/resume, enforced run budget). Evidence: the owner's intake brief (`intake/GRAPH-BRIEF.md`) records an offline probe where none of four deciding rules reach the Academy Manufactor prompt and `514.3a` is missing from the Necropotence prompt, a 392-case approved paired cohort, and no valid historical baseline (144 old-rubric records over 18 cases).

## Prior run

- Prior run: `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` (the answer-quality instrument, REQ-185-190, and the gpt-4.1 cap 5 versus cap 10 scorecard)
- Prior run: `PRD/instructions/receipts/rules-test-harness-2026-10-06.md` (the 393-case harness this study reuses)
- Prior run: `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` (current rule retrieval being measured)
- Prior run: `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` (local-embedding retrieval design and excerpt-cap measurements)
- Prior run: `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` (earlier prompt-context and retrieval tuning)
- Prior run: `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` (prompt-context refinement)
