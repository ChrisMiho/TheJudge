# Slice D — Retrieval check suite mode

## Status: planned

## Goal

`npm run eval:worked-solutions -- --suite rulesguru` reports, free and offline, how often the cited rule reached the prompt, split by level, complexity and rules section.

## Requirements

1. Applies the accepted `REQ-232` block: add the retrieval-check and filters criteria to the `REQ-232` entry.
2. `scripts/eval-worked-solutions.mjs` gains `--suite rulesguru` with `--level`, `--complexity`, `--suite-tag`, `--include-unsupported`. It loads suite cases in external mode, applies the shared filters from slice A, drops excluded and stale cases (counted), and runs the existing loop unchanged (`buildCaseRequest`, `embedGoldCaseQueries`, `preparePromptInput`, `describeRetrieval`).
3. Scoring by rule group: any-group-reached and all-groups-reached. Report: totals, split by level, by complexity and by CR section (three-digit prefix of each cited id), misses by case id; titled a local practice-suite report, not committed.
4. Writes `reports/retrieval-<UTC timestamp>.txt` under `SUITE_DIR` and stdout; `--output` outside `SUITE_DIR` is refused. Runs the ignore guard first. Default (non-suite) behaviour is unchanged.
5. Pure functions (filters, group scoring, splits, output check) are exported and tested on synthetic cases. The build runs no real suite check.

## Acceptance criteria

- [ ] Group scoring gives any-reached and all-reached correctly on synthetic cases, including a bare-header group reached by any member
- [ ] Level, complexity and CR-section splits are correct on synthetic cases, and misses list case ids only
- [ ] Filters combine as the brief says (or within a flag, and across flags) in the retrieval path, and excluded and stale cases are dropped and counted
- [ ] An `--output` outside `SUITE_DIR` is refused; a report path inside the (temporary) suite folder is accepted
- [ ] Without `--suite`, the existing corpus run behaves as before (existing tests unchanged and green)
- [ ] The report title says local practice-suite report and the run makes no provider call
- [ ] The `REQ-232` entry gains the retrieval-check and filters criteria
- [ ] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/eval-worked-solutions.test.mjs
npm run test:scripts
npm run eval:worked-solutions -- --help
```

## Files touched

- `scripts/eval-worked-solutions.mjs` and its test file(s)
- `scripts/lib/rulesguru-suite.mjs` (only if a helper is missing)
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
