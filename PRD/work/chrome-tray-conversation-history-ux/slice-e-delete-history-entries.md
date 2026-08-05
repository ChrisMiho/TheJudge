# Slice E — Delete completed history entries

## Status: planned

## Goal

Users can delete individual completed browser-local history entries from the History drawer after
confirmation; deleting the active completed conversation clears the workspace without re-saving
that thread (DEC-143 / REQ-118 / FLOW-018).

## Requirements

1. Add a guarded `deleteHistoryEntry(id: string)` (name may match repo style) in
   `lib/conversationHistory/persistence.ts` that removes the entry from
   `thejudge.conversationHistory.entries` without throwing; preserve the existing 20-entry prune
   behavior for remaining completed entries.
2. Each completed history row exposes a delete affordance distinct from select-to-resume.
3. Delete requires an explicit confirmation step before removal; cancel leaves the entry and keeps
   the drawer open.
4. On confirm, the entry is removed from storage and disappears from the list immediately.
5. Deleting a non-active entry does not change the active workspace.
6. Deleting the active completed conversation removes it and clears the workspace to that
   destination's clean pre-answer state (reuse `startOver` / equivalent) **without** writing the
   deleted thread back via `saveHistoryEntry` / `onConversationUpdated`.
7. Draft rows are not deletable by this control; Draft rules remain REQ-108 / DEC-130 / DEC-138.
8. Frontend-only; no server store, accounts, or sync.

## Depends on

**Slice D** — both edit `ConversationHistoryDrawer.tsx`. Implement after D lands.

## Wiring

```
ConversationHistoryDrawer
  └─ onDeleteEntry?(entry) → parent confirms → deleteHistoryEntry(entry.id)
       ├─ refresh local entries list
       └─ if entry.id === activeConversationId → startOver() / clear active id
          (order must not trigger a history re-save of the deleted thread)
```

Wire from both `MtgAssistantApp.tsx` and `QuickLookupApp.tsx`. Prefer a shared confirm pattern
already used in the app if one exists; otherwise a minimal `window.confirm` / accessible confirm
control is acceptable for this slice — do not build a new global dialog system.

## Acceptance criteria

- [ ] Each completed row has a delete control distinct from select-to-resume
- [ ] Delete asks for confirmation; cancel leaves storage and UI unchanged
- [ ] Confirm removes the entry from localStorage and from the list immediately
- [ ] Deleting a non-active entry leaves the active workspace unchanged
- [ ] Deleting the active completed conversation clears to clean pre-answer state and does not
      re-save that thread
- [ ] Draft row has no delete-via-this-flow control
- [ ] Empty completed list shows the existing empty/zero-state (Draft may still show)
- [ ] Persistence failures do not crash the app (existing guarded pattern)
- [ ] Auto-prune-at-20 still applies to remaining completed entries

## Verification

```bash
npm --workspace apps/frontend run test -- conversationHistory/persistence
npm --workspace apps/frontend run test -- ConversationHistoryDrawer
npm --workspace apps/frontend run test -- QuickLookupApp
npm --workspace apps/frontend run test -- MtgAssistantApp
npm --workspace apps/frontend run test -- App.mid-flight-draft
npm run quality:check
```

## Files touched

- `apps/frontend/src/lib/conversationHistory/persistence.ts`
- `apps/frontend/src/lib/conversationHistory/persistence.test.ts`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.test.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- Destination tests covering history select / Start Over / draft as needed

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/chrome-tray-conversation-history-ux/` ready to delete

## PRD promotion checklist (executed in cleanup, not here)

- [ ] `DEC-140`…`DEC-144` bodies and router lines already landed during refinement — verify they
      still match shipped reality
- [ ] `REQ-115`…`REQ-119` acceptance matches shipped behavior; REQ-103/107 notes remain accurate
- [ ] `FLOW-018` matches shipped delete + close paths (including scrim dismiss from slice D)
- [ ] Navigation / conversation-ux decision notes on DEC-118/122/124/129/133/137 amendments still
      read correctly against the shipped chrome
- [ ] Flip any relevant `sections/system-map.md` entries that now meet the shipped gate
- [ ] Write the receipt at
      `PRD/instructions/receipts/chrome-tray-conversation-history-ux-<YYYY-MM-DD>.md`
