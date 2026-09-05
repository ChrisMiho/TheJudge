status: refined

# hybrid-rule-retrieval

See `IDEA.md` for the problem, outcome, non-goals, and the four items this
package covers. Created by graph run `graph-20260905-173655`, node 2
(`shape`), following on from `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/hybrid-rule-retrieval

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md`
- Findings: `PRD/sections/system-map/prompt-layout-spec.md`, row 8 of the prompt-section table (`ADDITIONAL RELEVANT RULE EXCERPTS`), still says the excerpts are "ranked by meaning against committed per-rule embeddings with a keyword-overlap fallback" (citing REQ-181). REQ-182's hybrid blend falsifies that row the same way it falsifies the four sibling descriptions the proposal already amends (`system-map.md`, `system-map/game-rules-retrieval.md`, `quick-lookup/README.md`, `in-depth/README.md`), and `GATE-QUESTIONS.md` has no block for it. Everything else passed: 12 `Current:` blocks byte-identical, REQ-182/183/184 unused and next free, all four measurements reproduced exactly.
