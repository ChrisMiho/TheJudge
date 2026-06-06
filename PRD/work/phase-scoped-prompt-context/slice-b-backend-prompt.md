# Slice B — Backend Prompt

## Status: planned

## Goal

Add a `PHASE GUIDANCE` block to every backend prompt, positioned between `GENERAL GAME CONTEXT` and the zone sections; build guidance text from a new `phaseGuidance.ts` module that maps `TurnPhase` + optional `CombatStep` to phase-specific reasoning instructions; thread `combatStep` through `PromptContext`; clean `mtgReference.ts` of removed references.

## Requirements

1. A new file `apps/backend/src/prompt/phaseGuidance.ts` exports a function `getPhaseGuidance(phase: TurnPhase, combatStep?: CombatStep): string`. It returns a non-empty, human-readable guidance string for every valid `TurnPhase`.
2. `main_1` and `main_2` share a base guidance builder function internally. `main_2` appends a sentence noting this is the post-combat main phase (e.g., referencing that attackers have already been declared). The shared logic is not duplicated—use a private helper or base string.
3. When `phase === "combat"`, the returned string incorporates the `combatStep` to give sub-step-specific reasoning context (e.g., "You are in the declare blockers step…"). When `combatStep` is absent during combat, fall back to generic combat guidance.
4. `PromptContext` in `apps/backend/src/types/index.ts` gains `combatStep?: CombatStep` on its `gameContext` sub-shape.
5. `buildPromptContext` in `apps/backend/src/prompt/context.ts` extracts `combatStep` from `payload.gameContext` and includes it on `normalizedGameContext` when present.
6. `buildPromptText` in `apps/backend/src/prompt/normalization.ts` calls `getPhaseGuidance` and inserts a `PHASE GUIDANCE` section immediately after the `GENERAL GAME CONTEXT` block and before any zone sections. The section is always present (never conditional on whether zones are populated).
7. `apps/backend/src/prompt/mtgReference.ts` is updated:
   - Remove `stack_resolving` from the phase list sentence.
   - Remove the instruction telling users to specify combat sub-steps in their question (that instruction is now superseded by the inline sub-step selector).
8. No existing `POST /api/ask-ai` response shape changes. The `PHASE GUIDANCE` block is prompt-internal only.

## Files touched

- `apps/backend/src/prompt/phaseGuidance.ts` — new file; exports `getPhaseGuidance(phase, combatStep?)`
- `apps/backend/src/prompt/normalization.ts` — import `getPhaseGuidance`; splice `PHASE GUIDANCE` block into `sections` array in `buildPromptText` after `GENERAL GAME CONTEXT`
- `apps/backend/src/prompt/context.ts` — extract and pass `combatStep` in `normalizedGameContext` within `buildPromptContext`
- `apps/backend/src/types/index.ts` — add `combatStep?: CombatStep` to `PromptContext.gameContext`
- `apps/backend/src/prompt/mtgReference.ts` — remove `stack_resolving` from phase list; remove combat sub-step hint sentence

## Tests

- `apps/backend/src/prompt/normalization.test.ts` — add tests asserting:
  - Built prompt contains `PHASE GUIDANCE` section for every phase (at minimum: `main_1`, `main_2`, `combat`, `untap`)
  - `PHASE GUIDANCE` appears after `GENERAL GAME CONTEXT` and before any `ZONE:` section in the prompt text
  - Combat guidance with `combatStep: "declare_blockers"` differs from generic combat guidance
  - `main_2` guidance text is distinct from (and longer than) `main_1` guidance text
- Unit test file for `phaseGuidance.ts` (can be colocated in the existing test folder or added as `phaseGuidance.test.ts`):
  - `getPhaseGuidance` returns a non-empty string for every `TurnPhase`
  - `main_1` and `main_2` share text but `main_2` includes additional content
  - Combat with each `CombatStep` returns distinct strings

## Acceptance criteria

- [ ] `phaseGuidance.ts` exists and exports `getPhaseGuidance`
- [ ] `getPhaseGuidance` returns a non-empty string for all 8 `TurnPhase` values
- [ ] `main_2` guidance contains all text of `main_1` guidance plus additional post-combat content (no logic duplication)
- [ ] Every prompt produced by `buildPromptText` contains a `PHASE GUIDANCE` section
- [ ] `PHASE GUIDANCE` appears after `GENERAL GAME CONTEXT` and before any `ZONE:` line in the prompt string
- [ ] Combat guidance references the combat sub-step when `combatStep` is provided
- [ ] `stack_resolving` does not appear in `MTG_PROMPT_REFERENCE`
- [ ] The sentence directing users to specify combat sub-steps in their question is removed from `MTG_PROMPT_REFERENCE`
- [ ] TypeScript compiles with no errors in `apps/backend`
- [ ] `npm test` passes in `apps/backend`
- [ ] `npm run quality:check` passes in `apps/backend`

## Verification

```bash
cd apps/backend && npx tsc --noEmit
npm test --workspace=apps/backend
npm run quality:check --workspace=apps/backend
# Manual spot-check: run the app and submit a combat-phase question; verify PHASE GUIDANCE appears in prompt preview
```

## Ship gates

- [ ] Slice A and Slice B acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for all touched areas
- [ ] Public contract unchanged (`POST /api/ask-ai` request/response shapes unmodified except additive optional `combatStep`)
- [ ] No secrets committed
- [ ] Durable outcomes promoted to `sections/decisions.md` (DEC-034, DEC-035, DEC-036, DEC-037), `sections/functional-requirements.md` (REQ-015, REQ-016, REQ-024), `sections/integrations-and-data.md`; `PRD/work/phase-scoped-prompt-context/` ready to delete
