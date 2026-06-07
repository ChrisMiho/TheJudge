# Slice C — Frontend Conversation Hook

## Status: done

## Goal

Evolve `useAskAiSubmitOrchestration` to manage multi-turn conversation state: frozen game context snapshot, hidden initial question, visible message thread, and history assembly for follow-up and retry submits.

## Dependencies

- Slice A (types; `conversationHistory` field on `ZoneAskAiPayload`)

## Requirements

1. In `apps/frontend/src/types.ts`, add:
   ```typescript
   type ConversationMessage = { role: "user" | "assistant"; content: string };
   ```
2. In `apps/frontend/src/lib/contextFlow/flow.ts`, extend `ZoneAskAiPayload` with optional `conversationHistory?: ConversationMessage[]`.
3. In `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, add state fields:
   - `visibleMessages: ConversationMessage[]` — UI thread; empty pre-decrypt, seeded with `[{ role: "assistant", content: answer }]` on first success.
   - `frozenGameContext: GameContext | null` — snapshot from first decrypt success; null pre-decrypt.
   - `hiddenInitialQuestion: string | null` — `payload.question` captured at first decrypt; null pre-decrypt.
4. On first decrypt success:
   - Capture `frozenGameContext` snapshot from `payload.gameContext`.
   - Capture `hiddenInitialQuestion` from `payload.question`.
   - Seed `visibleMessages` with the assistant answer.
5. Add a `submitFollowUp(text: string)` path (or `source: "followup"` branch) that:
   - Uses `frozenGameContext` for `gameContext` (never the live context).
   - Assembles `conversationHistory` from: `[{ role: "user", content: hiddenInitialQuestion }, { role: "assistant", content: visibleMessages[0].content }, ...all subsequent visible user/assistant turns]`.
   - Sends `{ question: text, gameContext: frozenGameContext, conversationHistory }` to `POST /api/ask-ai`.
   - On success: appends `{ role: "user", content: text }` then `{ role: "assistant", content: answer }` to `visibleMessages`.
6. `retry` resubmits the last failed attempt (first decrypt or follow-up) with the same frozen context and history (history captured at time of failure).
7. Add a `startOver()` action that clears `visibleMessages`, `frozenGameContext`, and `hiddenInitialQuestion`. Does **not** touch game context, zones, cards, enrichment, or question.
8. Expose from the hook: `visibleMessages`, `frozenGameContext`, `isConversationActive` (bool: first decrypt has succeeded), `submitFollowUp`, `startOver`, existing `submit` and `isSubmitting` / `isFollowUpSubmitting` (separate loading flags).
9. Add tests in `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts`.

## Acceptance criteria

- [ ] After first decrypt success, `visibleMessages` contains exactly one assistant bubble (the answer)
- [ ] `frozenGameContext` is set to the game context from the first decrypt and is unchanged by follow-ups
- [ ] `hiddenInitialQuestion` equals `payload.question` used in the first decrypt (including fallback)
- [ ] `submitFollowUp` sends `{ question, gameContext: frozen, conversationHistory }` to the API
- [ ] `conversationHistory[0]` is `{ role: "user", content: hiddenInitialQuestion }` on the first follow-up
- [ ] `conversationHistory[1]` is `{ role: "assistant", content: <first answer> }` on the first follow-up
- [ ] After a successful follow-up, two new bubbles appended: user then assistant
- [ ] After two follow-ups, `conversationHistory` on the third call has 4 entries (hidden initial + answer + follow1 + answer1)
- [ ] `retry` resubmits the failed follow-up with the same frozen context + history (not a fresh first decrypt)
- [ ] `startOver` sets `visibleMessages = []`, `frozenGameContext = null`, `hiddenInitialQuestion = null`
- [ ] `isSubmitting` is true only during the initial decrypt; `isFollowUpSubmitting` is true only during follow-ups
- [ ] `npm run quality:check` passes

## Verification

```bash
npm run quality:check
npx vitest run apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts
```

## Files touched

- `apps/frontend/src/types.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts`
