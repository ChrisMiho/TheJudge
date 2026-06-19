# Gameplan - Post-Question Chat Layout

## Goal

Refine the answered/follow-up frontend layout so the frozen game context is compact setup above the conversation thread, the header is slimmer, and the existing follow-up chat behavior is preserved.

## Current architecture

- `apps/frontend/src/App.tsx` owns the staged flow and passes `frozenGameContext`, `visibleMessages`, follow-up state, and handlers into `EnrichmentStep`.
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` freezes the initial `gameContext`, assembles client-side conversation history, and exposes visible chat messages. This package must not change those semantics.
- `apps/frontend/src/components/EnrichmentStep.tsx` owns the active conversation branch. It currently renders `TheJudge`, the redundant `Stack Assistant` subtitle, a `Conversation` heading, `ConversationThread`, a frozen zone-only summary below the thread, errors, composer, and start-over.
- `apps/frontend/src/components/ConversationThread.tsx` renders visible assistant/user bubbles only. The initial hidden user question remains outside the visible thread by orchestration design.

## Target architecture

- Keep the answered-state branch in `EnrichmentStep`, but extract frozen context presentation into a small read-only component if useful.
- Render the answered-state header as only `TheJudge`; remove the answered-state `Stack Assistant` subtitle and `Conversation` heading.
- Render a compact frozen context summary above `ConversationThread`.
- Keep `ConversationThread` immediately after the compact summary and keep the follow-up composer below the thread.
- Add an expand/collapse disclosure that reveals full frozen context details without exposing any edit controls.
- Continue to use `frozenGameContext` from `useAskAiSubmitOrchestration`; do not derive a mutable context or change request payloads.

## Data flow

1. Initial decrypt succeeds through `submitAttempt`.
2. `useAskAiSubmitOrchestration` stores `frozenGameContext` and seeds visible messages with the assistant's first answer.
3. `App.tsx` passes `frozenGameContext` and `visibleMessages` to `EnrichmentStep`.
4. `EnrichmentStep` renders the compact summary from `frozenGameContext` before `ConversationThread`.
5. Follow-up submission still calls `submitFollowUp(text)`, which sends the frozen context and assembled history.
6. Start over still clears conversation state and returns the user to editable enrichment state with previous context preserved.

## UX rules

- The compact summary must include turn phase, active player when known, and every populated zone with card names.
- The expanded view must include setup details, zones, card names, and enrichment details such as owner/caster, mana spent, targets, and context notes when present.
- The expanded view is read-only. It must not render inputs, selects, textareas, remove buttons, add-target buttons, or zone/card editing actions.
- The initial assistant answer remains the first visible conversation bubble.
- The initial user question remains hidden from the visible thread.
- `AskAiWaitingPanel` remains an initial decrypt-only affordance; follow-up loading stays inline in the Send button.

## Out of scope

- Backend changes.
- Prompt assembly changes.
- AI response formatting changes.
- Conversation history contract changes.
- Editing frozen context during an active conversation.
- Redesigning pre-decrypt zone collection or enrichment.

## Verification checklist

- `npm --workspace apps/frontend run test -- App.test.tsx`
- `npm --workspace apps/frontend run typecheck`
- `npm run quality:check`
- Manual browser check with mock provider:
  - Complete a first decrypt.
  - Confirm answered-state header shows only `TheJudge`.
  - Confirm compact frozen context appears above the thread.
  - Expand frozen context and confirm it is read-only.
  - Send a follow-up and confirm bubbles append below the frozen context summary.
  - Start over and confirm enrichment editing returns with prior context preserved.

