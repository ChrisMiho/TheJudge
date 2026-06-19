# Slice B - Answered Layout Integration

## Status: planned

## Goal

Integrate the compact answered-state layout so the frozen context appears before the conversation thread while preserving follow-up chat behavior.

## Requirements

1. In the active conversation branch, render the header as only `TheJudge`.
2. Remove the answered-state `Stack Assistant` subtitle and separate `Conversation` heading.
3. Place the compact frozen context summary above `ConversationThread`.
4. Keep `ConversationThread` as the visible chat thread, with the initial assistant answer as the first visible message.
5. Keep the follow-up composer below the thread.
6. Preserve existing error, retry, follow-up submitting, and start-over behavior.
7. Do not change `AskAiRequest`, backend validation, prompt assembly, provider behavior, or conversation-history assembly.
8. Update frontend tests so the answered-state layout expectations match `REQ-025` and `FLOW-005`.

## Acceptance criteria

- [ ] After first decrypt success, the Decrypt Stack form is hidden and the follow-up composer is visible.
- [ ] The answered-state header shows `TheJudge` and does not show `Stack Assistant`.
- [ ] The answered state does not render a `Conversation` heading.
- [ ] The frozen context summary appears before the conversation thread in DOM order.
- [ ] The assistant's first answer is the first visible chat bubble; the initial user question is not visible as a thread bubble.
- [ ] Follow-up submit appends a user bubble and assistant bubble while using the same frozen context/history behavior already covered by existing tests.
- [ ] Start Over remains visible and enabled when no request is in flight.
- [ ] `AskAiWaitingPanel` is not rendered for follow-up submits.
- [ ] No backend or provider tests need updates because public contracts remain unchanged.

## Verification

```bash
npm --workspace apps/frontend run test -- App.test.tsx
```

```bash
npm run quality:check
```

Manual check:

- Run the app in mock mode, complete a first decrypt, inspect the answered state at desktop and mobile widths, expand the frozen context, send a follow-up, and use Start Over.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/FrozenContextSummary.tsx`
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/App.test.tsx`

## PRD promotion checklist

- [ ] Confirm `PRD/sections/functional-requirements.md` reflects the shipped `REQ-025` answered-state layout.
- [ ] Confirm `PRD/sections/user-flows.md` reflects the shipped `FLOW-005` order: frozen context summary, thread, composer.
- [ ] Confirm `PRD/sections/system-map.md` lists the frozen context summary if it becomes a distinct shipped component.
- [ ] Write cleanup receipt at `PRD/instructions/receipts/post-question-chat-layout-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/post-question-chat-layout/` during cleanup after durable promotion is complete.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/post-question-chat-layout/` ready to delete
