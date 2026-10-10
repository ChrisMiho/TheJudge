# Slice C — Compare report: repeat selectors and answer-level counts

## Status: done

## Goal

The compare report can split one run's six repeats into halves (the noise
floor) and shows right answers out of answers and right-but-too-slow counts per
flow.

## Requirements

1. `--repeats`, `--repeats-a`, `--repeats-b` selectors (ranges such as `1-3`) in `scripts/eval-answer-compare.mjs` and `scripts/lib/answer-compare.mjs`.
2. Refuse comparing a side with itself (same run, same arm, same repeats).
3. Per side, in every breakdown (so per flow): right answers out of answers counting every repeat, and a right-but-over-budget count (right answer slower than REQ-231's 30 s).
4. Update the CLI header usage lines and the paired-report paragraph of `apps/backend/src/eval/worked-solutions/README.md`.
5. Apply the accepted REQ-228 block in `PRD/sections/functional-requirements.md`.

## Acceptance criteria

- [x] `--repeats-a 1-3 --repeats-b 4-6` on one run and one arm compares the two halves (test)
- [x] Identical sides are refused with a message naming the problem (test)
- [x] Answer-level right count and right-but-over-budget count appear per side and per request kind (test)
- [x] Existing compare tests pass unchanged
- [x] The REQ-228 block is applied; REQ-228 still decides nothing (the command only prints numbers)

## Notes (evidence, re-runnable)

- C1 to C4: `node --test scripts/lib/answer-compare.test.mjs` -> 17 pass, 0 fail (14 existing tests unchanged apart from the import line, 3 new).
- The self-comparison refusal lives in the command (`scripts/eval-answer-compare.mjs`, via `selfComparisonReasons`), not in `compareRunSides`, so the existing library tests that pass one run on both sides stay unchanged.
- C5: the REQ-228 lines and note in `PRD/sections/functional-requirements.md` match the accepted block; the report prints counts and names no winner (asserted in the new test).

## Verification

```bash
node --test scripts/lib/answer-compare.test.mjs
```

## Files touched

- `scripts/eval-answer-compare.mjs`, `scripts/lib/answer-compare.mjs`, `scripts/lib/answer-compare.test.mjs`
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/functional-requirements.md` (REQ-228)
