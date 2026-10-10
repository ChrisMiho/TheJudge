# Slice E — Answer-quality run suite mode

## Status: planned

## Goal

`npm run eval:answer-quality -- --suite rulesguru --run-id <id>` plans and, when the owner launches it, runs the paid answer check over a filtered slice, writing only under the suite folder; the build proves it with a fake client and dry runs only.

## Requirements

1. Applies the accepted `REQ-232` block: add the answer-quality-run criterion to the `REQ-232` entry.
2. `scripts/eval-answer-quality.mjs`: a third mode beside routine and experiment. Cases from the suite in external mode; manifest built from the filters (ids plus question and answer hashes via `manifestEntryFor`) and saved in the run folder; `runsRoot` is `SUITE_DIR/runs`; arm A only; `--sample` with `--seed` (seeded, recorded). Runs the ignore guard first.
3. `scripts/lib/experiment-run.mjs`: case-file hashing takes the case folder as a parameter (today it joins `CASES_DIR`); a suite validation hook replaces the approved check (present, not excluded, not stale, hashes match manifest); strata gain `level` and `complexity`; the summary adds per-level and per-complexity counts of Correctness 2, labelled "agrees with RulesGuru".
4. Gates unchanged: dry run by default with count and estimate; `--confirm-live-calls` requires `--max-cost-usd`; sequential; `--resume`, `--retry-errors`, `--repeat` work as in experiment mode; dirty-checkout refusal applies.
5. Refused with `--suite`: `--manifest`, `--changed`, `--all`, `--tier`, `--tag`, `--regrade-from`, `--arm` other than A, `--output-dir` outside `SUITE_DIR`. Never reads or writes `apps/backend/src/eval/answer-quality/results.json` or `coverage.json`. Judge, rubric and rubric revision unchanged.
6. No test and no verification passes `--confirm-live-calls` or makes a live OpenAI call; tests use an injected fake client and temporary folders.

## Acceptance criteria

- [ ] A `--suite` dry run prints the selected count and estimate and makes no client call (fake client records zero calls)
- [ ] A fake-client live path writes only under the temporary `runs/<id>/` and leaves `results.json` and `coverage.json` byte-identical
- [ ] Each refused flag (`--manifest`, `--changed`, `--all`, `--tier`, `--tag`, `--regrade-from`, arm other than A, `--output-dir` outside the suite folder) is refused with a message
- [ ] The manifest is built from the filters and saved in the run folder; `--sample` with `--seed` is repeatable and the seed is recorded
- [ ] Suite validation passes a present, non-excluded, non-stale case and refuses an excluded, stale or hash-mismatched one
- [ ] The summary labels Correctness 2 as agreement with RulesGuru and splits it by level and complexity; strata carry `level` and `complexity`; the compare report still reads two suite run folders
- [ ] `--resume` reuses the checkpoint, and `--confirm-live-calls` without `--max-cost-usd` is refused
- [ ] Experiment and routine modes are unchanged (existing tests green)
- [ ] No live call was made in verification: no `--confirm-live-calls` outside fake-client tests
- [ ] The `REQ-232` entry gains the answer-quality-run criterion
- [ ] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/eval-answer-quality.test.mjs scripts/lib/experiment-run.test.mjs
npm run test:scripts
npm run typecheck
```

## Files touched

- `scripts/eval-answer-quality.mjs` and its tests
- `scripts/lib/experiment-run.mjs` and its tests
- `PRD/sections/functional-requirements.md` (REQ-232 criterion)
