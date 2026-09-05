status: owner-action

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

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rag-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (attempt 1, 2026-09-05). Every `Current:` block re-verified verbatim against live `PRD/sections/`; new IDs REQ-177–181 confirmed unused; amendment set re-grepped complete; live measurements reproduced (`retrieval:report` 6/9 with the same three named failures, `test:eval` green, 3,432 index entries / 147 duplicate ids / 626 under 60 chars).

## Open gate

- Answer `PRD/work/rag-rule-retrieval/GATE-QUESTIONS.md` (24 verdict slots), then merge the docs PR to `main`; `graph-implement` builds it from there.
