# Slice D — Retrieval check suite mode

## Status: done

## Goal

`npm run eval:worked-solutions -- --suite rulesguru` reports, free and offline, how often the cited rule reached the prompt, split by level, complexity and rules section.

## Requirements

1. Applies the accepted `REQ-232` block: add the retrieval-check and filters criteria to the `REQ-232` entry.
2. `scripts/eval-worked-solutions.mjs` gains `--suite rulesguru` with `--level`, `--complexity`, `--suite-tag`, `--include-unsupported`. It loads suite cases in external mode, applies the shared filters from slice A, drops excluded and stale cases (counted), and runs the existing loop unchanged (`buildCaseRequest`, `embedGoldCaseQueries`, `preparePromptInput`, `describeRetrieval`).
3. Scoring by rule group: any-group-reached and all-groups-reached. Report: totals, split by level, by complexity and by CR section (three-digit prefix of each cited id), misses by case id; titled a local practice-suite report, not committed.
4. Writes `reports/retrieval-<UTC timestamp>.txt` under `SUITE_DIR` and stdout; `--output` outside `SUITE_DIR` is refused. Runs the ignore guard first. Default (non-suite) behaviour is unchanged.
5. Pure functions (filters, group scoring, splits, output check) are exported and tested on synthetic cases. The build runs no real suite check.

## Acceptance criteria

- [x] Group scoring gives any-reached and all-reached correctly on synthetic cases, including a bare-header group reached by any member
- [x] Level, complexity and CR-section splits are correct on synthetic cases, and misses list case ids only
- [x] Filters combine as the brief says (or within a flag, and across flags) in the retrieval path, and excluded and stale cases are dropped and counted
- [x] An `--output` outside `SUITE_DIR` is refused; a report path inside the (temporary) suite folder is accepted
- [x] Without `--suite`, the existing corpus run behaves as before (existing tests unchanged and green)
- [x] The report title says local practice-suite report and the run makes no provider call
- [x] The `REQ-232` entry gains the retrieval-check and filters criteria
- [x] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/eval-worked-solutions.test.mjs
npm run test:scripts
npm run eval:worked-solutions -- --help
```

## Notes (evidence, self-reported; re-run to confirm)

- D1 to D4, D6: `node --test scripts/eval-worked-solutions.test.mjs` 13 pass, 0 fail (7 existing corpus tests unchanged, 6 new suite tests on invented cases and a temporary suite folder).
- D5: the 7 existing tests in that file pass unchanged; `parseArgs([])` still returns an undefined output path and no suite; `npm run test:scripts` 834 pass, 0 fail. The live corpus run was not re-run (it needs the local embedder cache); its code path is untouched.
- D7: `grep -n "retrieval check over the suite" PRD/sections/functional-requirements.md` finds the criterion; the filters criterion sits beside it in the `REQ-232` entry.
- D8: `npm run test:scripts` 834 pass, 0 fail.
- Also ran `npm run eval:worked-solutions -- --help` (prints usage, no data read, no embedder).
- Decision: selection reuses `selectSuiteCases` from slice A with a stale check built on `compareSnapshot`; a case counts under each rules section it cites.

## Files touched

- `scripts/eval-worked-solutions.mjs` and its test file(s)
- `scripts/lib/rulesguru-suite.mjs` (only if a helper is missing)
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
