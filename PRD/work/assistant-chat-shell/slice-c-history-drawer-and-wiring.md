# Slice C — History drawer UI, resume flow, and Menu mutual exclusivity

## Status: planned

## Goal

Ship the resumable history drawer end-to-end: trigger + drawer UI, wired into
both In-Depth Question and Quick Question, mutually exclusive with the
feature-portal Menu drawer.

## Requirements

1. New `apps/frontend/src/components/ConversationHistoryDrawer.tsx`, mirroring
   `AdaptiveContextDialog.tsx`'s dialog mechanics: portal to `document.body`,
   `role="dialog"`, `aria-modal`, `aria-labelledby`, Tab/Shift+Tab focus trap,
   Escape closes, focus moves to the close control on open and restores to
   the trigger on close. Props: `isOpen`, `onClose`, `entries: ConversationHistoryEntry[]`,
   `activeConversationId?: string | null`, `onSelectEntry: (entry) => void`.
   List entries most-recent-first, each showing `flowLabel`, a formatted
   `updatedAt` timestamp, and a preview snippet (`hiddenInitialQuestion`
   truncated to ~80 chars). Empty state: a short "No saved conversations yet"
   row. Selecting the entry matching `activeConversationId` is a no-op
   (FLOW-016 edge case).
2. CSS in `index.css` mirroring `.adaptive-context-overlay`/
   `.adaptive-context-surface` (lines 159-206) but mirrored to the left edge:
   same mobile bottom-sheet base (`align-items: flex-end`); in the `768px`+
   block, `justify-content: flex-start` (not `flex-end`) and
   `border-radius: 0 1rem 1rem 0` (not `1rem 0 0 1rem`) on the surface.
3. `ConversationWorkspace.tsx`: add a full-width history-trigger button in the
   workspace body, stacked above the existing context trigger (before the
   `AdaptiveContextDialog` block, around line 51). New optional prop for the
   trigger label/open-handler, following the existing `context` prop's
   optional-render pattern.
4. New `LeftEdgeDrawerContext` (small, e.g.
   `apps/frontend/src/lib/portal/leftEdgeDrawerContext.tsx`): provides
   `activeDrawer: "menu" | "history" | null`, `openDrawer(id)`,
   `closeDrawer(id)`. Provide it once near the app root (`App.tsx`'s
   `PortalShell`). `FeaturePortalMenu.tsx` (currently fully local `isOpen`,
   `FeaturePortalMenu.tsx:38`) and the new `ConversationHistoryDrawer` each
   keep their own open/close state as today, but call `openDrawer`/
   `closeDrawer` on their own toggles and close themselves when the context
   reports the *other* drawer opened. **Before adding this**, check whether
   `PRD/work/center-menu-tab-prominence/` (slice B, `FeaturePortalMenu.tsx`)
   has landed a controlled open-state API of its own in the meantime — if so,
   wire into that instead of introducing a second mechanism; otherwise this
   addition is independent of that slice's DOM/CSS-only trigger restyle.
5. Wire into `MtgAssistantApp.tsx`/`EnrichmentStep.tsx` (game mode) and
   `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
   (lookup mode):
   - `onConversationUpdated` (from Slice B) → `saveHistoryEntry`, with
     `flowLabel` taken from `destinationRegistry.tsx`'s `label` field
     ("In-Depth Question" / "Quick Question") and `mode` fixed per consumer
     (`"game"` / `"lookup"`).
   - Load entries via `loadHistoryEntries(mode)` — **filtered to the
     consumer's own mode**; see GAMEPLAN's "History list is filtered per
     destination" decision. Each destination's drawer only shows and offers
     its own mode's entries; the underlying stored list stays one global
     20-cap set.
   - `onSelectEntry` → `restoreConversation(entry)`, then close the drawer.

## Acceptance criteria

- [ ] History trigger renders as a full-width button in the workspace body,
      above the context trigger, in both destinations.
- [ ] Drawer lists the current destination's saved conversations
      most-recent-first with flow label, timestamp, and question preview;
      shows an empty state when none saved.
- [ ] The combined stored list is capped at 20 entries; saving a 21st prunes
      the oldest across both flows.
- [ ] Selecting an entry restores frozen context, mode, and thread; the
      follow-up composer is enabled afterward and behaves identically to a
      freshly-decrypted conversation (same limits, same frozen-context
      rules, same retry/error handling).
- [ ] Selecting the already-active entry is a no-op.
- [ ] Drawer opens/closes via an explicit control and Escape, traps focus
      while open, restores focus to its trigger on close.
- [ ] Below `768px` the drawer presents as a bottom sheet; at `768px`+ it
      presents as a left-side drawer.
- [ ] Opening the history drawer while the Menu drawer is open closes the
      Menu drawer first, and vice versa — the left edge never shows two
      overlapping panels.
- [ ] Resuming a conversation replaces the previously active one; if that
      prior conversation had a successful answer, it was already persisted
      (Slice B's continuous save-on-success) before being replaced.
- [ ] No change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas,
      prompt assembly, providers, or backend routes.

## Verification

```bash
cd apps/frontend && npx vitest run \
  src/components/ConversationHistoryDrawer.test.tsx \
  src/components/ConversationWorkspace.test.tsx \
  src/components/portal/FeaturePortalMenu.test.tsx
cd apps/frontend && npm run quality:check
```

Manual check (`npm run dev` in `apps/frontend`): for both In-Depth Question
and Quick Question — reach a successful answer, confirm it appears in that
destination's own history drawer (and not the other destination's); resume
it and confirm context/thread restore and follow-ups work; confirm bottom
sheet `<768px` / left drawer `768px+`; confirm opening the history drawer
closes an open Menu drawer and vice versa; save 21 conversations and confirm
the oldest is pruned.

## Files touched

- `apps/frontend/src/components/ConversationHistoryDrawer.tsx` (new)
- `apps/frontend/src/components/ConversationHistoryDrawer.test.tsx` (new)
- `apps/frontend/src/components/ConversationWorkspace.tsx`
- `apps/frontend/src/components/ConversationWorkspace.test.tsx`
- `apps/frontend/src/lib/portal/leftEdgeDrawerContext.tsx` (new)
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/MtgAssistantApp.tsx` and/or
  `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/index.css`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/assistant-chat-shell/` ready to delete

## PRD promotion checklist (executed at cleanup)

DEC-123/124/125 and REQ-102/103/104/FLOW-016 are already written into
`sections/decisions/conversation-ux.md`, `sections/functional-requirements.md`,
and `sections/user-flows.md` as confirmed product truth (done during
refinement) — no further decision/requirement promotion is needed. Cleanup
should:

- Add new `system-map.md` entries (no existing stub to flip — grep confirmed
  none) for: **markdown answer rendering** (`ConversationThread.tsx`, backed
  by DEC-123/REQ-102) and **persistent conversation history**
  (`lib/conversationHistory/persistence.ts`,
  `useAskAiSubmitOrchestration.ts`, `ConversationHistoryDrawer.tsx`,
  `ConversationWorkspace.tsx`, backed by DEC-124/DEC-125/REQ-103/REQ-104/
  FLOW-016), both marked `shipped` per the system-map promotion gate.
- Write the receipt at `PRD/instructions/receipts/assistant-chat-shell-<date>.md`.
- Delete `PRD/work/assistant-chat-shell/`.
- Remove the `assistant-chat-shell` row from `PRD/work/STATUS.md`.
