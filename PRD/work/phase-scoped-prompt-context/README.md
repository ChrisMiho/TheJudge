status: refined

# Phase-Scoped Prompt Context

Parent work package for incremental improvements to how turn phase drives prompt construction.

## Sub-slices

- **Slice A** — Frontend + type system: remove `stack_resolving`, update `TurnPhase`, add `CombatStep`, set `DEFAULT_TURN_PHASE = "main_1"`, add inline combat sub-step selector, trim `PHASE_ZONE_DEFAULTS` to 2 zones per phase
- **Slice B** — Backend prompt: add `PHASE GUIDANCE` block to every prompt, update `mtgReference.ts`

## Related PRD sections

- `sections/decisions.md` — DEC-034, DEC-035, DEC-036, DEC-037 (new); DEC-022 (superseded)
- `sections/integrations-and-data.md` — TurnPhase, CombatStep, GameContext, prompt context rules
- `sections/functional-requirements.md` — REQ-015 (updated), REQ-016 (updated), REQ-024 (new)
- `apps/backend/src/prompt/` — normalization, context, new phaseGuidance module
