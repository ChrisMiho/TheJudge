# Slice B — Conversation history persistence layer

## Status: planned

## Goal

Build the browser-local storage layer and the `useAskAiSubmitOrchestration`
save/restore API a history drawer will need. No UI in this slice.

## Requirements

1. New `apps/frontend/src/lib/conversationHistory/persistence.ts`, mirroring
   the guarded-read/write shape of `apps/frontend/src/lib/lifeTracker/persistence.ts`
   (DEC-103's established pattern):
   - Storage key `thejudge.conversationHistory.entries`.
   - Entry type:
     ```ts
     type ConversationHistoryEntry = {
       id: string;
       mode: "game" | "lookup";
       flowLabel: string;
       frozenContext: FrozenAskAiContext; // reuse from useAskAiSubmitOrchestration.ts
       hiddenInitialQuestion: string;
       visibleMessages: ConversationMessage[];
       createdAt: string; // ISO
       updatedAt: string; // ISO
     };
     ```
   - `loadHistoryEntries(mode?: "game" | "lookup"): ConversationHistoryEntry[]`
     — guarded `localStorage` read + `JSON.parse` inside try/catch; runs a
     runtime type-guard per entry and **drops individually invalid entries**
     rather than discarding the whole list on one bad entry (matches FLOW-016's
     "selected entry's data corrupted → dropped without crashing"); returns
     entries sorted most-recent-first by `updatedAt`; filters to `mode` when
     provided.
   - `saveHistoryEntry(entry: ConversationHistoryEntry): void` — upserts by
     `id` (updates `updatedAt`/content if the id already exists, otherwise
     inserts), then prunes to the 20 most-recently-updated entries across
     **all** modes combined (the cap is global, not per-flow); guarded
     try/catch write that no-ops silently on failure (matches
     `saveTrackerState`'s swallow-and-continue behavior — history persistence
     must never break the conversation flow itself).
   - No delete/clear API — not required by REQ-103/REQ-104/FLOW-016.
2. Extend `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, purely
   additively (no change to existing request-building in `submitAttempt`/
   `submitFollowUp`/the payload shapes):
   - Return `hiddenInitialQuestion` in the hook's result (currently private
     state, needed by callers to persist a resumable entry — `submitFollowUp`
     at lines 279-282 already depends on it internally to rebuild
     `conversationHistory` for follow-up requests, so it must round-trip
     through a saved/restored entry for follow-ups to keep working).
   - Add an internal `conversationId` (generate with the same
     `crypto.randomUUID()`-with-string-fallback approach as
     `createCorrelationId` in `lib/debugLogger.ts`), generated fresh on a
     successful first decrypt, reset by `startOver()`, and set to the
     resumed entry's `id` by the new `restoreConversation()`.
   - Add an `onConversationUpdated?: (snapshot: { conversationId: string; frozenContext: FrozenAskAiContext; hiddenInitialQuestion: string; visibleMessages: ConversationMessage[] }) => void`
     option, invoked once after every successful decrypt and every successful
     follow-up (right after the existing `setVisibleMessages`/`setFrozenContext`
     calls in `doDecryptRequest`/`doFollowUpRequest`). This is the one place
     that already knows a turn succeeded — callers persist from here instead
     of re-deriving "did the thread just grow" via their own effects.
   - Add `restoreConversation(entry: { id: string; frozenContext: FrozenAskAiContext; hiddenInitialQuestion: string; visibleMessages: ConversationMessage[] }): void`
     — sets `frozenContext`, `hiddenInitialQuestion`, `visibleMessages`,
     `conversationId` from the entry in one call, and clears
     `pendingRetry`/`error`/`retryCountdown`/`answer` as `startOver()` does,
     so the follow-up composer and retry state behave exactly like a
     freshly-decrypted conversation (REQ-104).

## Acceptance criteria

- [ ] `loadHistoryEntries()` returns entries sorted most-recent-first,
      optionally filtered by `mode`, and never throws on missing/corrupt
      storage.
- [ ] A list containing one corrupt entry among valid ones drops only the
      corrupt entry, not the whole list.
- [ ] `saveHistoryEntry()` upserts by `id` and caps the combined stored list
      at 20 entries, pruning the oldest by `updatedAt`.
- [ ] A `localStorage` write failure (e.g. quota) is swallowed without
      throwing and without affecting the in-progress conversation.
- [ ] `useAskAiSubmitOrchestration` returns `hiddenInitialQuestion`; its
      `onConversationUpdated` callback fires exactly once per successful
      decrypt and once per successful follow-up, with a stable
      `conversationId` across a conversation's turns.
- [ ] `restoreConversation()` fully replaces `frozenContext`,
      `hiddenInitialQuestion`, `visibleMessages`, and `conversationId`, and
      clears in-flight retry/error state.
- [ ] No change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas,
      prompt assembly, providers, or backend routes; `submitAttempt`/
      `submitFollowUp`'s request-building is untouched.

## Verification

```bash
cd apps/frontend && npx vitest run \
  src/lib/conversationHistory/persistence.test.ts \
  src/hooks/useAskAiSubmitOrchestration.test.ts
cd apps/frontend && npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/conversationHistory/persistence.ts` (new)
- `apps/frontend/src/lib/conversationHistory/persistence.test.ts` (new)
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts`
