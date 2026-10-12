# Slice A — Fidelity gate and rule data

## Status: planned

## Goal

Prove a committed scorer reproduces today's search results, then fix the rule-book parser and rebuild the rule index so rules arrive whole and correctly titled.

## Requirements

1. Stop gate first, before any other change. Port `score-trained.mjs` from the probe folder to `scripts/score-rule-search.mjs` (fidelity mode scores production's current top ten). It must reproduce: 473 deciding-rule citations in the suite (tuning plus check), 159 suite questions with every deciding rule found, 5 of the hard 25, 351 corpus citations, 305 corpus cases with every deciding rule. A mismatch stops the build before any change: write the mismatch to the evidence log, make no further edits, report to the graph. Do not adjust numbers or the scorer to fit.
2. Per-question output goes only to a git-ignored folder (add `output/rule-search-eval/` to `.gitignore`); the scorer prints counts only to stdout and committed logs.
3. Commit `scripts/privacy-scan.mjs`: scans every tracked file for the practice suite's question and answer text and prints counts only (0 expected). Reads the suite from the launch checkout path. Test it against a synthetic fixture, not suite text.
4. Parser fixes in `scripts/build-game-rules.mjs` (REQ-179): part titles no longer glued onto eight rules (514.3a, 616.2 and six more); 700.15 and 303.7 restored; empty 702.163 and 702.179 dropped; two-letter ids kept apart (704.5aa not merged into 704.5z).
5. Index records the rule book edition (2026-09-25), a hash of the source, each part's title, and the glossary (741 entries, 35 obsolete) stored beside the index; the glossary never becomes an excerpt.
6. Rebuild the index from the same rule book. Old-versus-new diff test (target 8): `ruleId`, `sectionTitle` and `text` change only for the listed pieces, plus the two restored rules and minus the two empty ones. `searchText` and token statistics change everywhere (token fixes land in slice B); record that, do not assert it.
7. Word-token build fixes that belong to the index (dots on sentence ends, "can't" kept whole) land here only if they do not need the stemmer; the stemmer-dependent ones wait for B.
8. Apply by intent to `PRD/sections/`: REQ-179 amendment (and the index-recording sentence in `system-map/game-rules-retrieval.md` for the parser/data part only; the search rewrite is slice B). Re-derive against current text.

## Acceptance criteria

- [ ] `scripts/score-rule-search.mjs` fidelity run prints exactly 473 / 159 / 5 / 351 / 305 against the unchanged production search, run before any other edit in the slice
- [ ] Per-question results are written only under a git-ignored path (`git check-ignore` confirms) and no committed file holds suite text
- [ ] `scripts/privacy-scan.mjs` has a passing test on a synthetic fixture and reports 0 matches over tracked files
- [ ] Parser tests cover the eight glued titles, 700.15, 303.7, the two empty rules and 704.5aa vs 704.5z
- [ ] The rule-data diff test passes: only the listed pieces change `ruleId`, `sectionTitle` or `text`
- [ ] The rebuilt index carries edition, source hash, part titles and the 741-entry glossary (35 obsolete)
- [ ] REQ-179 is amended in `PRD/sections/functional-requirements.md` and the data parts of `game-rules-retrieval.md`, derived by intent
- [ ] `npm run quality:check` passes
- [ ] A dated evidence-log line records the fidelity numbers and that no edit preceded the run

## Verification

```bash
node scripts/score-rule-search.mjs --fidelity
node scripts/privacy-scan.mjs
npm run test:scripts
npm --workspace apps/backend run test
npm run quality:check
```

## Files touched

- `scripts/score-rule-search.mjs`, `scripts/privacy-scan.mjs` and tests
- `scripts/build-game-rules.mjs`, `scripts/build-game-rules.test.mjs`
- `apps/backend/data/gameRulesRuleIndex.json`, new glossary data file, `gameRulesTokenStats.json`
- `apps/backend/src/gameRules*.ts` readers of the index
- `.gitignore`
- `PRD/sections/functional-requirements.md`, `PRD/sections/system-map/game-rules-retrieval.md`
