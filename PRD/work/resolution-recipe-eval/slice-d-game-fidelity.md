# Slice D — Game-case request fidelity check

## Status: done

## Goal

A paid run refuses to start if an In-Depth case would send Luna a different
prompt than a real player's request would.

## Requirements

1. A test: for every selected case with a `gameState`, the prompt built from the raw case request equals the prompt built from the request parsed by `askAiRequestSchema`.
2. A run-start check in experiment mode doing the same; on a difference the run refuses, naming the case.
3. An assertion only: no parse is added to the harness, so no existing prompt hash moves (brief assumption A4).
4. Apply the accepted REQ-230 fidelity-check line in `PRD/sections/functional-requirements.md`.

## Acceptance criteria

- [x] A matching game case passes the check (test)
- [x] A game case whose raw and parsed prompts differ makes the run refuse and name the case (test with a fabricated difference)
- [x] Lookup cases are not affected and existing prompt-fidelity tests pass unchanged
- [x] The dry-run command from slice A still prints calls and an estimate with the check active
- [x] The REQ-230 fidelity line matches the accepted block

## Notes (evidence, re-runnable)

- D1, D2, D3: `node --test scripts/lib/experiment-run.test.mjs scripts/lib/prompt-fidelity.test.mjs scripts/eval-answer-quality.test.mjs` -> 100 pass, 0 fail. The helper is `findGameFidelityProblems` / `assertGameFidelity` in `scripts/lib/experiment-run.mjs`; it is hooked in `scripts/eval-answer-quality.mjs` (`defaultCheckGameFidelity`, run after the arm-use check, in a dry run and a live run, before any client exists). Existing prompt-fidelity tests are untouched.
- D4: `npm run eval:answer-quality -- --run-id rr-dry --manifest output/answer-quality/manifests/rr-diagnostic.json --model gpt-6-luna --excerpt-cap 10 --arm A --arm R --max-cost-usd 3` -> "Arms: A (A.1), R (R.1)", 92 answer calls, 92 lone judge calls, estimated cost $1.08 (no game cases in the diagnostic set yet; slice F re-runs it with them).
- D5: the fidelity line is in REQ-230 in `PRD/sections/functional-requirements.md`, word for word as accepted.

## Verification

```bash
node --test scripts/lib/experiment-run.test.mjs scripts/lib/prompt-fidelity.test.mjs scripts/eval-answer-quality.test.mjs
```

## Files touched

- `scripts/lib/experiment-run.mjs`, `scripts/lib/experiment-run.test.mjs`
- `scripts/eval-answer-quality.mjs` (only if the check hooks in there)
- `PRD/sections/functional-requirements.md` (REQ-230)
