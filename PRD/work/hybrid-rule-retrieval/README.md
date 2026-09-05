status: active

# hybrid-rule-retrieval

See `IDEA.md` for the problem, outcome, non-goals, and the four items this
package covers. Created by graph run `graph-20260905-173655`, node 2
(`shape`), following on from `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/hybrid-rule-retrieval

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (attempt 2, 2026-09-05: 21 of 21 `Current:` excerpts byte-identical to live `PRD/sections/`; REQ-182/183/184 unused and next free; amendment-set re-grep leaves no uncovered live assertion; `test:eval` semantic 9/12 and lexical 12/12, benchmark recall@5 lexical 0.5833 and semantic 0.8526/0.8333, Lambda data 118.095 MB of 120 MB all reproduced; hybrid gates stated as measured thresholds with baselines). Attempt 1 FAILed on one missed spec row (`system-map/prompt-layout-spec.md` row 8), corrected at define attempt 2.
