# Design Brief — Phase-Scoped Prompt Context

## Scope

Three coordinated changes across frontend and backend:

1. Remove `stack_resolving` from the `TurnPhase` enum entirely (not a real MTG phase) and set `main_1` as the new default turn phase on the game setup screen.
2. Trim phase zone defaults to 2 zones per phase in `PHASE_ZONE_DEFAULTS`; empty defaulted zones continue to be excluded from payload and LLM context per DEC-024.
3. Add a `PHASE GUIDANCE` block to every backend prompt, positioned between `GENERAL GAME CONTEXT` and the zone sections, with phase-specific and combat-sub-step-specific reasoning instructions. Combat sub-step is captured as a new optional structured field `combatStep?: CombatStep` on `GameContext`, with a frontend inline selector that defaults to `declare_blockers`.

## Decisions (confirmed this brief)

- **DEC-034** — `stack_resolving` removed from `TurnPhase`; default turn phase is `main_1`. Supersedes DEC-022.
- **DEC-035** — Phase zone defaults trimmed to 2 zones per phase. DEC-024's empty-zone exclusion rule explicitly applies to all phase-defaulted zones, not only stack.
- **DEC-036** — `PHASE GUIDANCE` block added to every backend prompt between `GENERAL GAME CONTEXT` and zone sections; text is phase-specific and combat-sub-step-specific per `phaseGuidance.ts`.
- **DEC-037** — `combatStep?: CombatStep` added as optional field on `GameContext`; frontend renders an inline sub-step selector when combat is selected; default is `declare_blockers`.

## Requirements (confirmed this brief)

- **REQ-015** (updated) — Game setup context capture: turn phase list updated to 8 phases; combat sub-step selector added inline when `turnPhase === "combat"`.
- **REQ-016** (updated) — Zone confirmation: phase defaults now use the 2-zone mapping from DEC-035.
- **REQ-024** (new) — Phase-scoped prompt guidance: every backend prompt includes a `PHASE GUIDANCE` block per DEC-036.

## Non-Goals

- No redesign of the context-collection UI flow.
- No change to `POST /api/ask-ai` success or error response shapes.
- No new turn phases introduced.
- No structural reordering of zone sections in the prompt (stack already renders first via canonical order).
- No rules-validation behavior added under the label of phase guidance.

## Slices (to be defined in slice docs)

### Slice A — Frontend + type system
Files expected:
- `apps/frontend/src/types.ts` — remove `stack_resolving` from `TurnPhase`, add `CombatStep` type
- `apps/frontend/src/App.tsx` — remove `stack_resolving` from `TURN_PHASE_OPTIONS`, add inline combat sub-step selector, update `DEFAULT_TURN_PHASE` import
- `apps/frontend/src/lib/contextFlow/flow.ts` — `DEFAULT_TURN_PHASE = "main_1"`, remove `stack_resolving` fallback
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` — update `PHASE_ZONE_DEFAULTS` to 2-zone mapping, remove `stack_resolving` entry
- `apps/backend/src/types/index.ts` — remove `stack_resolving` from `TurnPhase`, add `CombatStep`
- `apps/backend/src/validation/askAiRequest.ts` — add optional `combatStep` to `gameContext` Zod schema

### Slice B — Backend prompt
Files expected:
- `apps/backend/src/prompt/phaseGuidance.ts` — new module mapping `TurnPhase` + optional `CombatStep` to guidance strings; `main_1` and `main_2` share a base builder with `main_2` appending a post-combat addendum — the phases are distinct and the difference matters, but the implementation must not duplicate shared logic
- `apps/backend/src/prompt/normalization.ts` — emit `PHASE GUIDANCE` block in `buildPromptText`
- `apps/backend/src/prompt/context.ts` — pass `combatStep` through `PromptContext` when present
- `apps/backend/src/prompt/mtgReference.ts` — remove `stack_resolving` references; remove note that combat sub-step belongs in the question

## REQ/DEC references

- DEC-022 (superseded by DEC-034)
- DEC-023, DEC-024, DEC-028 (unchanged; DEC-035 extends DEC-024's empty-zone exclusion to all defaulted zones explicitly)
- REQ-015, REQ-016, REQ-024
