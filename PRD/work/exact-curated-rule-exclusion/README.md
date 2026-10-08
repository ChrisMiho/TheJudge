status: active

# exact-curated-rule-exclusion

Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179).

- Idea: [IDEA.md](IDEA.md)
- Intake (verbatim, evidence only): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposal (owner verdict slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220): [GATE-QUESTIONS.md](GATE-QUESTIONS.md)
- Plan: [GAMEPLAN.md](GAMEPLAN.md)
- Next: `thejudge-implement-all` (build half `graph-20261008-061643`, node 6 `build`).

## Slices

| Slice | Doc | Criteria | Depends on | Goal |
| --- | --- | --- | --- | --- |
| A | [slice-a-exact-exclusion-code.md](slice-a-exact-exclusion-code.md) | [slice-a.criteria.json](slice-a.criteria.json) | none | Exact exclusion in code, evidence trace, tests, data test |
| B | [slice-b-goldens-baseline-measure.md](slice-b-goldens-baseline-measure.md) | [slice-b.criteria.json](slice-b.criteria.json) | A | Regenerate three goldens, raise baseline, re-measure |
| C | [slice-c-prd-truth-and-close.md](slice-c-prd-truth-and-close.md) | [slice-c.criteria.json](slice-c.criteria.json) | A, B | Apply the PRD truth and close |

## Implementation map

- A: `apps/backend/src/gameRulesRetrieval.ts` (both branches), its test, `scripts/lib/evidence-trace.mjs` and test, new `apps/backend/src/gameRulesTopicData.test.ts`.
- B: three prompt goldens under `apps/backend/src/eval/fixtures/`, the rules-gate baseline, measurements recorded in `slice-b.evidence.md`.
- C: `PRD/sections/` per the five accepted slots; REQ-179 build record.
- Every deliverable lands outside `PRD/work/`; the package is deleted at close.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade, run `graph-20261008-061643`, after the owner accepted all five IDs; full report `QUALITY-CHECK.md`; two non-blocking notes for map-out — N1 the topic-excerpt data test's matching method is left to build, a substring check over the committed index gives zero mismatches today; N2 map-out confirms the data test location and the evidence-trace test file path)
