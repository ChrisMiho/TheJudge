# Slice B — Snapshot mid-flight Draft when opening a saved conversation

## Status: planned

## Goal

Make opening a saved conversation the third Draft-covered mid-flight exit, matching Menu-leave and
reload, in both conversation-bearing destinations.

## Requirements

1. In **both** `MtgAssistantApp.tsx` (`handleSelectHistoryEntry`, ~line 651) and
   `QuickLookupApp.tsx` (`handleSelectHistoryEntry`, ~line 272), write the destination's Draft
   **before** calling `restoreConversation(entry)`.
2. The staging-presence test must reuse the **same predicate** as that destination's existing
   `isActive`-edge effect, not a second copy of it. Extract the existing `hasStaging` expression
   (and the draft payload construction) into one function per destination and call it from both
   the effect and the new handler. A duplicated predicate across two write sites is a defect under
   `technical-design-rules.md`'s *reuse before creating*, and would drift the moment either site
   changes.
3. When there is no meaningful staging, write no Draft — matching the existing empty-staging
   branch, which clears rather than writes.
4. When a conversation is already active (`isConversationActive`), there is no Draft to maintain;
   behavior is unchanged.
5. The snapshot is silent: no confirmation dialog, no toast, no new UI.
6. Do not modify the existing `isActive`-edge effect or the mount-time hydrate path.

## Why this is not already covered

The Draft snapshot fires on the destination's `isActive` true→false edge. Selecting a history entry
never changes `isActive` — the destination stays mounted and active — so the effect never runs and
`restoreConversation` overwrites staging in place. Reproduced live on Quick Question: a typed
question vanished with `localStorage` holding only `thejudge.conversationHistory.entries`. Staging
the same question and leaving via Menu instead **did** write `thejudge.conversationDraft.lookup`.

`REQ-108` previously scoped this to "Menu leave or reload", so it was genuinely uncovered rather
than merely unimplemented.

## Acceptance criteria

- [ ] Staging mid-flight on **In-Depth Question**, then selecting a completed conversation, writes
      `thejudge.conversationDraft.game`
- [ ] Staging mid-flight on **Quick Question**, then selecting a completed conversation, writes
      `thejudge.conversationDraft.lookup`
- [ ] The staged attempt is then recoverable as the **Draft** row in the same history drawer
- [ ] Selecting a conversation with no meaningful staging writes no Draft
- [ ] Selecting a conversation while one is already active writes no Draft
- [ ] The restored conversation still lands correctly from any staged step — DEC-134's
      "always lands on that conversation" behavior is unbroken, including In-Depth's move to the
      enrichment step
- [ ] The existing Menu-leave and reload Draft paths still pass **without their tests being
      modified**
- [ ] The staging predicate exists in exactly one place per destination

## Verification

```bash
npm --workspace apps/frontend run test -- App.mid-flight-draft
npm --workspace apps/frontend run test -- ConversationHistoryDrawer
npm --workspace apps/frontend run test -- MtgAssistantApp
npm --workspace apps/frontend run test -- QuickLookupApp
npm run quality:check
```

`App.mid-flight-draft.test.tsx` covers the existing exits; it must stay green. Add the
history-select cases alongside, for both modes.

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/App.mid-flight-draft.test.tsx`

## Notes

Reuse `saveDraft`, `GameDraftState`, and `LookupDraftState` from
`lib/conversationHistory/persistence.ts` exactly as the Menu-leave path does. No new storage key,
no change to the one-slot-per-destination rule, and the Draft still does not count toward the
20-entry completed-conversation cap.
