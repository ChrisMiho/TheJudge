# Slice B — Mid-flight Draft slot in conversation history

## Status: done

## Goal

Give each conversation-bearing destination (In-Depth Question, Quick Question) exactly one browser-local **Draft** slot that snapshots mid-flight staging (anything before the first successful Ask AI submit), so Menu navigation away and page reload don't wipe staged work — auto-hydrated on mount, listed in History as **Draft**, single updating slot, per REQ-108 / DEC-130 / FLOW-017.

## Requirements

1. Depends on Slice A: History must already be reachable on every pre-submit step before Draft rows are meaningful (FLOW-017 precondition).
2. Extend `apps/frontend/src/lib/conversationHistory/persistence.ts` with a Draft store, mirroring the existing guarded-read pattern (`readAllEntries`/`saveHistoryEntry`'s try/catch-and-drop-invalid approach) rather than introducing new storage infrastructure:
   - A distinct storage key (or key-per-mode) separate from `CONVERSATION_HISTORY_STORAGE_KEY`.
   - `loadDraft(mode)`, `saveDraft(draft)`, `clearDraft(mode)` (naming may follow existing conventions in the file).
   - Draft shape holds mid-flight UI staging, not a `ConversationHistoryEntry` — for In-Depth: `flowStep`, `gameContext`, `selectedZones`, `zoneCardsByZone`, `question`, and turn/combat staging (`turnPhase`, `combatStep`, `confirmedPhase`, `activePlayer`) as applicable; for Quick Question: `selectedCard`, `question`, `lockedTopic`, and any other staging load-bearing to resume meaningfully. Player roster is out of scope (already preserved separately per DEC-040).
   - Draft does not count toward `MAX_ENTRIES` (20) and is not stored in the completed-entries array.
   - Reads are guarded; corrupt/invalid Draft data is dropped without throwing.
3. In `MtgAssistantApp.tsx` and `QuickLookupApp.tsx`:
   - Write/update Draft as mid-flight staging changes meaningfully (debounced or on-change is an implementation choice; avoid writing on every keystroke if it causes perf/test flakiness — a reasonable throttle or on-blur/on-step-change trigger is acceptable).
   - On destination mount, auto-hydrate mid-flight UI from a stored Draft (DEC-103-style restore, not "list until selected") — this must happen without requiring the user to open History first.
   - On first successful Ask AI submit for the attempt, clear that destination's Draft (it then follows the normal completed-history auto-save path, already shipped).
   - After Start Over from an answered conversation (`handleStartOver` in `MtgAssistantApp.tsx`, equivalent in `QuickLookupApp.tsx`), new subsequent mid-flight staging overwrites the Draft slot — no second unfinished entry accumulates.
4. `ConversationHistoryDrawer.tsx` gains a distinct **Draft** row (labeled "Draft", not "In progress") shown above or visually distinct from completed entries, only when a Draft exists for the current destination's mode. Selecting it restores mid-flight staged state via a new callback (parallel to the existing `onSelectEntry`).
5. No `AskAiRequest`/Zod/prompt-assembly/provider changes. No multi-draft backlog — one slot per destination, browser-local, single-device only (mirrors DEC-039/DEC-124's narrow persistence divergence).

## Acceptance criteria

- [ ] Staging mid-flight work (e.g. selecting zones/cards and typing a question on In-Depth, or typing a question on Quick Question) without submitting, then navigating away via Menu and back, restores the staged UI automatically on mount.
- [ ] Reloading the page while on a destination with a stored Draft auto-hydrates the same staged UI without requiring a History selection first.
- [ ] History drawer shows exactly one **Draft** row (not "In progress") when mid-flight state exists for that destination, in addition to any completed entries.
- [ ] Selecting Draft from History restores the mid-flight staged state so the user can continue toward submit.
- [ ] On first successful answer for the attempt, the Draft row disappears from History and the conversation appears as a completed entry per existing auto-save behavior.
- [ ] After an answered conversation's Start Over, new mid-flight staging overwrites the same Draft slot — History never shows two unfinished rows.
- [ ] Draft does not count toward the 20-entry completed-history cap (saving 20 completed entries plus an active Draft does not prune the Draft or evict early).
- [ ] Corrupting the Draft storage value (e.g. invalid JSON) does not crash the app; the destination mounts fresh with no Draft.
- [ ] `npm --workspace apps/frontend run typecheck` and `npm --workspace apps/frontend run lint` pass.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run test -- persistence ConversationHistoryDrawer MtgAssistantApp QuickLookupApp
```

Manual check: stage a partial In-Depth Question (pick zones/cards, type a question, don't submit), switch to Life Tracker via Menu, switch back — staging should be restored. Reload the page on that state — same restoration. Submit successfully — Draft should be gone from History and the conversation should appear as a completed entry. Repeat the staged-then-reload check on Quick Question.

## Files touched

- `apps/frontend/src/lib/conversationHistory/persistence.ts`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
