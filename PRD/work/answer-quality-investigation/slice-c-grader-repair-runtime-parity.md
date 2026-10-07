# Slice C — Grader repair and runtime parity

## Status: planned

## Dependencies

Slice A (identity record and record shape)

## Goal

The grading model is told what the prompt actually carried, evaluation prompts match production's combo data, and records stop reporting unknown prices as $0.

## Requirements

1. REQ-186 amend: judge receives rule ids and text of the excerpts the answer prompt carried (labelled as attached), the case's deciding rule ids labelled separately, and for a case with a game state the printed state lines; inputs identical for every model, cap and arm.
2. REQ-187 amend: rubric revision moves to a new identifier because judge inputs changed; old and new grades are never compared per case. Do not rewrite old committed score records.
3. REQ-188 amend: `loadPromptResources` in `scripts/lib/prompt-fidelity.mjs` also loads the combo catalog when combo enrichment is on (production default) and records whether it did; answer calls keep the SDK default timeout and retries; no reasoning-effort parameter sent; `gpt-6-luna` joins the rate table with its check date; dry run prints every rate and its check date; `--bake-off` unchanged.
4. REQ-189 amend: records gain `allDecidingRulesInPrompt` (beside unchanged `goldRuleInPrompt`), reasoning tokens, reported reasoning effort, and `unpriced` in place of $0.
5. Offline only; fake clients.

## Acceptance criteria

- [ ] C1: A backend test shows the judge input carries attached excerpt ids and text, deciding rule ids under a separate label, and game-state lines when the case has a state
- [ ] C2: A test shows the judge input is built identically for different models, caps and arms
- [ ] C3: A test shows the rubric revision identifier changed and per-case comparison across revisions is refused
- [ ] C4: A test shows the evaluation prompt loader loads the combo catalog when combo enrichment is on and records the flag
- [ ] C5: A test shows evaluation answer calls pass no timeout, retry, or reasoning-effort override beyond the SDK default
- [ ] C6: A test shows records carry `allDecidingRulesInPrompt`, reasoning tokens, reported effort, and `unpriced` instead of a $0 cost; `goldRuleInPrompt` keeps its meaning
- [ ] C7: `gpt-6-luna` is in the rate table with a check date and the dry run prints each rate with its date
- [ ] C8: Script tests pass
- [ ] C9: Typecheck passes

## Verification

```bash
npm --workspace apps/backend run test
npm run test:scripts
npm run eval:answer-quality
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `apps/backend/src/eval/answer-quality/judge.ts`
- `apps/backend/src/eval/answer-quality/judge.test.ts`
- `apps/backend/src/eval/answer-quality/rubric.ts`
- `apps/backend/src/eval/answer-quality/rubric.test.ts`
- `apps/backend/src/eval/answer-quality/artifact.ts`
- `apps/backend/src/eval/answer-quality/artifact.test.ts`
- `scripts/lib/prompt-fidelity.mjs`
- `scripts/lib/prompt-fidelity.test.mjs`
- `scripts/eval-answer-quality.mjs`
- `scripts/eval-answer-quality.test.mjs`
