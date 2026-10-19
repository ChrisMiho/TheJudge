# Slice B — Feedback names the right screen; Retry resends

## Status: in-progress

## Goal

Feedback describes only the screen on view, and Retry on a reopened
conversation resends the failed question.

## Requirements

1. Bug 3: `useRegisterFeedbackContributor` (`lib/feedback/feedbackSeam.ts`)
   takes an active flag and registers only while it is true. In-Depth passes
   its existing `isActive` prop (`MtgAssistantApp.tsx`, registration near
   `:440-449`). On another tool the snapshot carries shell fields only.
2. Bug 5: `useAskAiSubmitOrchestration.ts` exposes `hasPendingRetry` (true
   while `pendingRetry` is set) and `retryPending()` that runs the existing
   saved-resend branch with no payload; update `UseAskAiSubmitOrchestrationResult`.
3. `handleRetry` (`MtgAssistantApp.tsx`, near `:744-752`) calls
   `retryPending()` when `hasPendingRetry` is true, before any staging check.
   With nothing saved and no game context it flashes "Confirm game context
   before decrypting." instead of returning silently.
4. Tests: visit In-Depth, switch to Trade, snapshot has no MTG Assistant
   screen, flow step or zone cards, and they return on switching back. Reopen
   a saved entry with no staged game, fail a follow-up, wait out the cooldown,
   tap Retry: the follow-up is sent again.
5. No spec edit (REQ-088 "current screen"; REQ-014 retry).

## Acceptance criteria

- [ ] After visiting In-Depth then opening Trade, the feedback snapshot has no MTG Assistant screen, flow step or zone cards, and they return on switching back (test)
- [ ] Feedback contributor registration is gated on the active flag and In-Depth passes `isActive`
- [ ] The submit hook exposes `hasPendingRetry` and `retryPending`, and `handleRetry` uses them before staging checks
- [ ] A reopened conversation with a failed follow-up resends it on Retry after the cooldown (test)
- [ ] With nothing saved and no game context, Retry shows "Confirm game context before decrypting." (test)
- [ ] Existing feedback and submission suites still pass
- [ ] Typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- App.feedback FeedbackContextProvider App.interaction-flows.submission MtgAssistantApp.retry
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/lib/feedback/feedbackSeam.ts`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- tests: `App.feedback.test.tsx` or `FeedbackContextProvider.test.tsx`; `App.interaction-flows.submission.test.tsx` or new `MtgAssistantApp.retry.test.tsx`
