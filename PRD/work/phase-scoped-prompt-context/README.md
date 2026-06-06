status: active

# Phase-Scoped Prompt Context

Parent work package for incremental improvements to how turn phase drives prompt construction.

## Slice Table

| Slice | Name | Status | Depends on |
|-------|------|--------|-----------|
| A | [Frontend + Type System](slice-a-frontend-types.md) | planned | — |
| B | [Backend Prompt](slice-b-backend-prompt.md) | planned | A |

## Implementation Map

1. Implement Slice A (type changes, frontend UI, zone defaults)
2. Implement Slice B (phaseGuidance module, prompt assembly, mtgReference cleanup)
3. Run `thejudge-cleanup` to promote decisions and delete this folder

## Related PRD sections

- `sections/decisions.md` — DEC-034, DEC-035, DEC-036, DEC-037 (new); DEC-022 (superseded)
- `sections/integrations-and-data.md` — TurnPhase, CombatStep, GameContext, prompt context rules
- `sections/functional-requirements.md` — REQ-015 (updated), REQ-016 (updated), REQ-024 (new)
- `apps/backend/src/prompt/` — normalization, context, new phaseGuidance module
