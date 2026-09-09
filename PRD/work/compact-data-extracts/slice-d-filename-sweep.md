# Slice D — File-name updates across path lists and readers

## Status: planned

## Goal

Every code path that names one of the five renamed committed files by its
old name is updated — a miss here either silently drops an artifact from the
weekly refresh PR or points a reader at a file that no longer exists.

## Requirements

1. `scripts/refresh-and-open-pr.mjs`'s `COMMITTED_ARTIFACT_PATHS` array
   updates all five renamed entries (`cardDetailByOracleId.json` →
   `.json.br`, `cardRulingsByOracleId.json` → `.json.br`,
   `cardPrintingPricesByOracleId.json.gz` → `.json.br`,
   `commanderSpellbookCombos.json.gz` → `commanderSpellbookComboBlocks.br`,
   `commanderSpellbookComboIndex.json.gz` → `commanderSpellbookComboIndex.json.br`).
   This is the highest-risk file in this slice: a miss here means the
   weekly refresh PR silently stops shipping that artifact, with no error.
2. `apps/backend/src/runtime/createConfiguredApp.ts` updates any renamed
   file path it references when wiring loaders.
3. Eval readers update their renamed file references:
   `apps/backend/src/eval/fixtureCardDetail.ts`,
   `apps/backend/src/eval/ragRetrievalBenchmark.ts`,
   `apps/backend/src/eval/contextEvaluationHarness.ts`,
   `apps/backend/src/eval/fixtures/README.md`.
4. `scripts/lib/prompt-fidelity.mjs` updates its `cardRulingsByOracleId.json`
   / `cardDetailByOracleId.json` path references (and their loaders, if
   `loadCardRulingsIndex` / `loadCardDetailIndex` need to brotli-decode
   instead of read raw JSON — coordinate with slice C's loader shape).
5. `scripts/compare-combo-answer-quality.mjs` updates its
   `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
   path references to the brotli block file / index.
6. `.gitignore` comments, root `README.md`, and `OPERATOR.md` (if it names
   any of these files) are updated to the new names.
7. Re-run the enumeration grep from the design brief and confirm every hit
   outside historical/evidence text (this package's own `GATE-QUESTIONS.md`,
   `DESIGN-BRIEF.md`, `IDEA.md`, `intake/`, receipts) has been updated:
   `grep -rln -E 'cardRulingsByOracleId|cardDetailByOracleId|cardPrintingPricesByOracleId|commanderSpellbookCombo' scripts apps/backend/src README.md OPERATOR.md .gitignore`
   — every matched file's old-name references are gone (still allowed to
   contain the new `.br` names).

## Acceptance criteria

- [ ] D1 — `COMMITTED_ARTIFACT_PATHS` in `refresh-and-open-pr.mjs` lists all
      five renamed artifacts by their new names, and its test passes
- [ ] D2 — `createConfiguredApp.ts` references no old artifact name
- [ ] D3 — the four eval readers reference no old artifact name
- [ ] D4 — `prompt-fidelity.mjs` and `compare-combo-answer-quality.mjs`
      reference no old artifact name
- [ ] D5 — `.gitignore`, root `README.md`, and `OPERATOR.md` reference no
      old artifact name
- [ ] D6 — the design brief's enumeration grep, re-run over
      `scripts apps/backend/src README.md OPERATOR.md .gitignore`, finds
      zero remaining old-name hits outside this package's own docs
      (`PRD/work/compact-data-extracts/`)

## Verification

```bash
node --test scripts/refresh-and-open-pr.test.mjs
grep -rln -E 'cardRulingsByOracleId\.json[^.]|cardDetailByOracleId\.json[^.]|cardPrintingPricesByOracleId\.json\.gz|commanderSpellbookCombos\.json\.gz|commanderSpellbookComboIndex\.json\.gz' scripts apps/backend/src README.md OPERATOR.md .gitignore
```

The grep must return no matches once this slice is done (old-name literals
with their old extension are gone; the new `.br` names are unaffected since
the pattern anchors on the old extension).

## Files touched

- `scripts/refresh-and-open-pr.mjs`
- `scripts/refresh-and-open-pr.test.mjs`
- `apps/backend/src/runtime/createConfiguredApp.ts`
- `apps/backend/src/runtime/createConfiguredApp.test.ts`
- `apps/backend/src/eval/fixtureCardDetail.ts`
- `apps/backend/src/eval/ragRetrievalBenchmark.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/fixtures/README.md`
- `scripts/lib/prompt-fidelity.mjs`
- `scripts/compare-combo-answer-quality.mjs`
- `.gitignore`
- `README.md`
- `OPERATOR.md` (only if it names a renamed file)
