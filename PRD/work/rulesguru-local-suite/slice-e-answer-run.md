# Slice E — Answer-quality run suite mode

## Status: done

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

- [x] A `--suite` dry run prints the selected count and estimate and makes no client call (fake client records zero calls)
- [x] A fake-client live path writes only under the temporary `runs/<id>/` and leaves `results.json` and `coverage.json` byte-identical
- [x] Each refused flag (`--manifest`, `--changed`, `--all`, `--tier`, `--tag`, `--regrade-from`, arm other than A, `--output-dir` outside the suite folder) is refused with a message
- [x] The manifest is built from the filters and saved in the run folder; `--sample` with `--seed` is repeatable and the seed is recorded
- [x] Suite validation passes a present, non-excluded, non-stale case and refuses an excluded, stale or hash-mismatched one
- [x] The summary labels Correctness 2 as agreement with RulesGuru and splits it by level and complexity; strata carry `level` and `complexity`; the compare report still reads two suite run folders
- [x] `--resume` reuses the checkpoint, and `--confirm-live-calls` without `--max-cost-usd` is refused
- [x] Experiment and routine modes are unchanged (existing tests green)
- [x] No live call was made in verification: no `--confirm-live-calls` outside fake-client tests
- [x] The `REQ-232` entry gains the answer-quality-run criterion
- [x] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/eval-answer-quality.test.mjs scripts/lib/experiment-run.test.mjs
npm run test:scripts
npm run typecheck
```

## Notes (evidence, self-reported; re-run to confirm)

- E1 to E4, E7: `node --test scripts/eval-answer-quality.test.mjs` 68 pass, 0 fail (6 new suite tests: flag refusals by name, dry run with zero client calls, filters and seeded sample, unignored folder and outside `--output-dir` refused, live path needs `--max-cost-usd` and hands the runner the filter manifest and the suite `runs/` root with `results.json` and `coverage.json` byte-identical).
- E5, E6, E7 (resume): `node --test scripts/lib/experiment-run.test.mjs` 35 pass, 0 fail (suite validation hook, run folder holds only `runs/<id>/` files plus `suite-manifest.json`, summary labelled "agrees with RulesGuru" split by level and complexity, strata carry level and complexity, `--resume` makes zero new answer calls, corpus identity and summary unchanged).
- E6 (compare): `node --test scripts/lib/answer-compare.test.mjs` 18 pass, 0 fail (two suite run folders compare and gain "by suite level" and "by suite complexity" tables; a corpus-only comparison gains none).
- E8: all existing tests in those files pass unchanged; `npm run test:scripts` 843 pass, 0 fail.
- E10: `grep -n "answer-quality run over the suite" PRD/sections/functional-requirements.md` finds the criterion in the `REQ-232` entry.
- E11: `npm run test:scripts` 843 pass, 0 fail; `npm run typecheck` clean; `npm run lint` 0 errors.
- Decisions: a suite run skips the game-fidelity check (every suite case is a lookup). The compare report counts tier `external` records in its "tiers 1-2" group, which is harmless for a suite-only comparison. The filter manifest (filters, sample, seed, counts) is saved as `suite-manifest.json` beside the identity record `manifest.json`, whose case list holds ids and hashes.

2026-10-10 E9 — Checked my own command history for this build: no real import, convert or suite run was started, no network request was made to the source, no OpenAI call was made, and `--confirm-live-calls` appears only inside tests that inject a fake client (`CONFIRM_FLAG` with `fakeAccessClient`/stub runners). The one entry-point command run on the real suite path was `npm run eval:rulesguru:purge` without `--yes` (prints a count, deletes nothing). No file under `.secrets/` was read; every `run()` test passes a stand-in for the local env loader.

## Files touched

- `scripts/eval-answer-quality.mjs` and its tests
- `scripts/lib/experiment-run.mjs` and its tests
- `PRD/sections/functional-requirements.md` (REQ-232 criterion)
