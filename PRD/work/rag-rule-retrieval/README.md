status: refined

# rag-rule-retrieval

Seed idea captured 2026-09-05. Refined 2026-09-05 — the gameplan is
`DESIGN-BRIEF.md`, the proposed product truth is `GATE-QUESTIONS.md`.

Upgrade how Ask AI picks the supplemental Comprehensive-Rules excerpts it
hands the model (System 3), today lexical keyword/IDF scoring, toward
semantic retrieval — together with the retrieval pre-work (query
construction, rule-corpus hygiene, Scryfall keyword enrichment) and the
RAG-deferred mechanic-definition enrichment idea. Consolidates every RAG-
shaped work-folder and the parked, never-merged `semantic-rule-retrieval`
design (PR #154, closed unmerged) into one pinpoint gameplan.

Next step: `/thejudge-quality-check PRD/work/rag-rule-retrieval/`

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rag-rule-retrieval
