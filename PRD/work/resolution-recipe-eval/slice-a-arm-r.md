# Slice A — Arm R: recipe substitution arm

## Status: done

## Goal

The test bench can build a prompt under arm R: today's prompt with the layers
paragraph swapped for the owner-approved recipe, in Quick Lookup and In-Depth.

## Requirements

1. Registry entry `R`, revision `R.1`, title "layer-and-timing resolution recipe", `usesDecidingRules: false`, in `scripts/lib/diagnostic-arms.mjs`.
2. P and R share one substitution helper; P's behaviour is unchanged.
3. R refuses unless the target paragraph appears exactly once and the file carries `approvedOn`.
4. `apps/backend/src/eval/answer-quality/arm-r-recipe.json` carries `replaces` (the current layers paragraph, verbatim from `mtgReference.ts`), `recipe` (the G2 text as accepted, with the G1 choice it encodes), and `approvedOn` (the docs PR merge date).
5. `--arm R` in `parseArgs`; R handled like P in `validateArmUse` (diagnostic manifest, or held-out only when frozen); `defaultLoadArmSets` in `scripts/eval-answer-quality.mjs` loads R's file.
6. `scripts/diagnostic-arms-check.mjs` checks R substitutes exactly once on every diagnostic case, game cases included.
7. Apply the accepted REQ-230 block lines for arm R in `PRD/sections/functional-requirements.md`, and update the build-marked lines (rows 67, 68, 69, 83, 86, 89, 94, 95, 98 of the brief's grep table) and the arms paragraph of `apps/backend/src/eval/worked-solutions/README.md`.

## Acceptance criteria

- [x] R on a lookup prompt and on a game prompt changes only the target paragraph (test)
- [x] R refuses when the target is missing, when it appears twice, and when `approvedOn` is absent (tests)
- [x] P's existing tests pass unchanged
- [x] `arm-r-recipe.json` `replaces` equals the layers paragraph in `mtgReference.ts` verbatim, and `recipe` equals the accepted G2 text
- [x] `--arm R` parses; R is refused outside the diagnostic manifest unless frozen; the dry-run command with `--arm A --arm R` prints calls and an estimate and spends nothing
- [x] `node scripts/diagnostic-arms-check.mjs` passes with R substituting once on every diagnostic case
- [x] The REQ-230 arm-R lines and the build-marked doc/test lines name R
- [x] `git diff origin/main --stat -- apps/backend/src/prompt` is empty

## Notes (evidence, re-runnable)

- A1, A2, A3, A4: `node --test scripts/lib/diagnostic-arms.test.mjs scripts/eval-answer-quality.test.mjs` -> 83 pass, 0 fail (the R tests are in `diagnostic-arms.test.mjs`; the verbatim and G2 checks are in "arm R's committed file replaces the layers paragraph ...").
- A5: `npm run eval:answer-quality -- --run-id rr-dry-a --manifest output/answer-quality/manifests/rr-diagnostic.json --model gpt-6-luna --excerpt-cap 10 --arm A --arm R --max-cost-usd 3` -> "Arms: A (A.1), R (R.1)", 92 answer calls, 92 lone judge calls, 0 blind-ranking calls, estimated cost $1.08, no `--confirm-live-calls`.
- A6: `node scripts/diagnostic-arms-check.mjs` -> `{"cases":46,"problems":[]}` (the script now registers the tsx loader itself so the plain command runs).
- A7: arm R lines and notes in REQ-230 (`PRD/sections/functional-requirements.md`); arms paragraph of `apps/backend/src/eval/worked-solutions/README.md`; build-marked lines in `diagnostic-arms.mjs`, `eval-answer-quality.mjs`, both test files, `diagnostic-arms-check.mjs` name R.
- A8: `git diff origin/main --stat -- apps/backend/src/prompt` -> empty.

## Verification

```bash
node --test scripts/lib/diagnostic-arms.test.mjs scripts/eval-answer-quality.test.mjs
node scripts/diagnostic-arms-check.mjs
npm run eval:answer-quality -- --run-id rr-dry-a --manifest output/answer-quality/manifests/rr-diagnostic.json --model gpt-6-luna --excerpt-cap 10 --arm A --arm R --max-cost-usd 3
```

(The last command is a dry run: no `--confirm-live-calls`. Emit the manifest first with `npm run eval:answer-quality:manifests -- --emit output/answer-quality/manifests/rr-diagnostic.json --from diagnostic`.)

## Files touched

- `scripts/lib/diagnostic-arms.mjs`, `scripts/lib/diagnostic-arms.test.mjs`
- `scripts/eval-answer-quality.mjs`, `scripts/eval-answer-quality.test.mjs`
- `scripts/diagnostic-arms-check.mjs`
- `apps/backend/src/eval/answer-quality/arm-r-recipe.json`
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/functional-requirements.md` (REQ-230)
