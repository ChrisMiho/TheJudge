# Quality check — concept-map-wording-entries

**Verdict: PASS.** Mode: graph. Run 2026-10-12, graph-20261013-034606, node gate-qc attempt 1. Package stays `STATUS.refined`.

## Findings

No FAIL issues. Checks run:

1. Gate diffs match current text. All 61 `-` and context lines in both `GATE-QUESTIONS.md` diffs were found, in order, in `PRD/sections/functional-requirements.md` (0 misses). `PRD/sections/` is identical to `origin/main`.
2. Block shape. Each block opens with "What this decides", "In plain terms", "What happens if you say no", and ends with blank `- Verdict:` and `- Reason:` slots.
3. IDs. The brief changes REQ-234 and REQ-236 only; each has a slot. No new ID is introduced; `origin/main` ends at REQ-247.
4. Amendment grep. Re-run as recorded: 75 hits. The hit list (file and line) matches the table's 75 rows exactly, one disposition row per hit; 5 amend, 70 no change. The 6258 criterion outside the grep is recorded and carried in the REQ-236 block.
5. Current-state numbers. `gameRulesConceptMap.test.ts` passes (25 tests) and pins 78 entries, 5 type-line entries, 163 words over 83 entries. Model id `rule-search-d2c2e500a4c6` appears in `embeddingModel.manifest.json` and all five vector files, plus `docs/aws/model-upload.md`.
6. No build deliverable under `PRD/work/`: the folder holds only the package's own docs; the deliverables table points at `apps/`, `docs/`, `PRD/instructions/receipts/` and git-ignored `output/`.
7. `node scripts/privacy-scan.mjs`: 0 matches in 0 files.

## Notes (not failures)

- Technical-design rules respected: backend-only, fixed committed table, no model call at request time, no stack-order change.
- No new user-visible screen, so no `screen-layout.md` row is needed.
- The owner must supply `split.json` and `hard25.json` before the build; the brief says so and the build parks at step 1 without them.
