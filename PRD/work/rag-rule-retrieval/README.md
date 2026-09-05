status: active

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

Next step: mapped into five sequential slices (A–E, one per gameplan step,
`GAMEPLAN.md`). Build half running under `/loop graph-implement` (run
`graph-20260905-012712`, at `plan` → `build` → `review`); if interrupted,
resume with `/graph-implement PRD/work/rag-rule-retrieval/`. Direct
implementation entry: `/thejudge-implement PRD/work/rag-rule-retrieval/ slice A`.
See `GRAPH-RUN.md`.

## Slices

| Slice | Step / REQ | Title | Status |
| --- | --- | --- | --- |
| [A](slice-a-trustworthy-measurement.md) | Step 1 / REQ-177 | Make the recall ruler trustworthy | planned |
| [B](slice-b-fix-the-query.md) | Step 2 / REQ-178 | Stop drowning the question in card text | planned |
| [C](slice-c-clean-the-corpus.md) | Step 3 / REQ-179 | Clean the junk out of the rule index | planned |
| [D](slice-d-scryfall-keywords.md) | Step 4 / REQ-180 | Use the keyword list Scryfall already gives us | planned |
| [E](slice-e-pick-rules-by-meaning.md) | Step 5 / REQ-181 | Pick rules by meaning, not word overlap | planned |

Sequential, A → B → C → D → E (dependency-forced; see `GAMEPLAN.md`).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rag-rule-retrieval

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rag-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (build-half re-check attempt 3, 2026-09-05, run `graph-20260905-012712`, 13 calls, no fan-out). All 24 verdict slots `accept`; REQ-177–181 still unused live; every spot-checked `Current:` block in `GATE-QUESTIONS.md` byte-identical to live `PRD/sections/`; no `PRD/sections/` edit since the gate resolved; `DESIGN-BRIEF.md` agent-ready (five ordered steps, relative measurement gates, enumerated amendment set, assumptions resolved via the conservative ladder). Run-one attempt 1 (2026-09-05) also PASSed with the same verbatim checks and live measurements reproduced (`retrieval:report` 6/9 with the same three failures, `test:eval` green, index 3,432/3,285/147/626).
- Gate resolved 2026-09-05: 24/24 verdicts `accept` in `GATE-QUESTIONS.md`; no blocker questions. Docs PR #190 merged to `main`. See `GRAPH-RUN.md` `## Gate verdicts`.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/190
