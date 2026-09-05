status: refined

# hybrid-rule-retrieval

See `IDEA.md` for the problem, outcome, non-goals, and the four items this
package covers. Created by graph run `graph-20260905-173655`, node 2
(`shape`), following on from `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/hybrid-rule-retrieval

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/hybrid-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (build-half re-check, 2026-09-05, after the owner's 14 accept + 1 edit verdicts were applied: 21 of 21 `Current:` excerpts byte-identical to live `PRD/sections/` on `main` at `c0aa52c`; REQ-182/183/184 unused and next free after REQ-181; 16-term amendment-set re-grep leaves no uncovered live assertion; the NFR-017 owner edit is consistent with the brief, the live NFR-017 text, and `scripts/package-lambda.sh` (`ONNXRUNTIME_NODE_INSTALL_CUDA=skip`, unzipped-size measurement); `test:eval` semantic 9/12 and lexical 12/12, Lambda data 118.095 MB of 120 MB reproduced; benchmark recall@5 lexical 0.5833 / semantic 0.8526/0.8333 reproduced at the spec-forming gate-qc attempt 2 on the same corpus). Spec-forming history: attempt 1 FAILed on one missed spec row (`system-map/prompt-layout-spec.md` row 8), corrected at define attempt 2; attempt 2 PASSed.
