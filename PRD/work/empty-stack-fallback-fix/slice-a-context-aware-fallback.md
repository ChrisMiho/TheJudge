# Slice A — Context-aware fallback question

## Status: planned

## Goal

Replace the unconditional blank-question fallback `"Resolve the stack"` with a **zone-aware** default so battlefield-only (and other non-stack) submissions ask the LLM an appropriate question.

## Depends on

- None

## Requirements

### Shared fallback rule

Implement `resolveFallbackQuestion(zones)` per [GAMEPLAN.md § Fallback question spec](GAMEPLAN.md#fallback-question-spec):

| Condition | Fallback |
| --- | --- |
| Stack has 1+ cards | `"Resolve the stack"` |
| Stack empty, other zone(s) have cards | `"Explain the interaction with the provided game state"` |
| No cards anywhere | `"Resolve the stack"` (defensive; submit blocked upstream) |

### Frontend — [`flow.ts`](../../../apps/frontend/src/lib/contextFlow/flow.ts)

1. Export `resolveFallbackQuestion` (and optionally `DEFAULT_STACK_QUESTION` / `DEFAULT_BOARD_QUESTION` constants for tests/UI).
2. Update `buildAskAiRequest` to use the helper when `question.trim()` is empty.
3. Keep existing behavior: trim non-empty questions; omit empty zone keys; default `turnPhase`.

### Backend — [`context.ts`](../../../apps/backend/src/prompt/context.ts)

1. Apply the same rule in `buildPromptContext` when normalized question is empty.
2. Use `gameCtx.zones` for zone population check (stack length + other zones).
3. Keep `fallbackQuestion` constant only if still needed for the stack case; prefer explicit constants matching frontend.

**Parity requirement:** frontend payload `question` and backend `finalQuestion` must match for the same `gameContext` when question is blank.

### Tests

**Frontend — [`flow.test.ts`](../../../apps/frontend/src/lib/contextFlow/flow.test.ts):**

- [ ] Stack with cards, blank question → `"Resolve the stack"`
- [ ] Battlefield only, blank question → board fallback string
- [ ] Stack + battlefield, blank question → `"Resolve the stack"` (stack takes precedence)
- [ ] Explicit trimmed question unchanged

**Backend — [`context.test.ts`](../../../apps/backend/src/prompt/context.ts):**

- [ ] Same matrix as frontend for `finalQuestion`

**Contract — optional spot in [`app.contract.test.ts`](../../../apps/backend/src/app.contract.test.ts):**

- [ ] POST with battlefield-only + blank question returns answer whose embedded prompt QUESTION section uses board fallback

## Acceptance criteria

- [ ] Blank question no longer sends `"Resolve the stack"` when stack zone is empty but other zones have cards
- [ ] Stack-only blank question still uses `"Resolve the stack"`
- [ ] No change to `AskAiRequest` Zod schema shape
- [ ] `npm run quality:check` passes

## Files

| Action | Path |
| --- | --- |
| Edit | `apps/frontend/src/lib/contextFlow/flow.ts` |
| Edit | `apps/frontend/src/lib/contextFlow/flow.test.ts` |
| Edit | `apps/backend/src/prompt/context.ts` |
| Edit | `apps/backend/src/prompt/context.test.ts` |

## Non-goals

- Enrichment UI changes (slice B)
- Zone collection nudge (slice C)
- Prompt `targets: (none)` wording changes
