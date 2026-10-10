# Slice D — Game-case request fidelity check

## Status: planned

## Goal

A paid run refuses to start if an In-Depth case would send Luna a different
prompt than a real player's request would.

## Requirements

1. A test: for every selected case with a `gameState`, the prompt built from the raw case request equals the prompt built from the request parsed by `askAiRequestSchema`.
2. A run-start check in experiment mode doing the same; on a difference the run refuses, naming the case.
3. An assertion only: no parse is added to the harness, so no existing prompt hash moves (brief assumption A4).
4. Apply the accepted REQ-230 fidelity-check line in `PRD/sections/functional-requirements.md`.

## Acceptance criteria

- [ ] A matching game case passes the check (test)
- [ ] A game case whose raw and parsed prompts differ makes the run refuse and name the case (test with a fabricated difference)
- [ ] Lookup cases are not affected and existing prompt-fidelity tests pass unchanged
- [ ] The dry-run command from slice A still prints calls and an estimate with the check active
- [ ] The REQ-230 fidelity line matches the accepted block

## Verification

```bash
node --test scripts/lib/experiment-run.test.mjs scripts/lib/prompt-fidelity.test.mjs scripts/eval-answer-quality.test.mjs
```

## Files touched

- `scripts/lib/experiment-run.mjs`, `scripts/lib/experiment-run.test.mjs`
- `scripts/eval-answer-quality.mjs` (only if the check hooks in there)
- `PRD/sections/functional-requirements.md` (REQ-230)
