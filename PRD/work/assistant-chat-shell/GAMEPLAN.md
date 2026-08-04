# assistant-chat-shell — GAMEPLAN

## Scope recap

Two additive capabilities on the already-shipped shared conversation workspace
(`ConversationWorkspace.tsx` / `ConversationThread.tsx` / `AdaptiveContextDialog.tsx`,
DEC-118):

1. **DEC-123 / REQ-102** — structured markdown rendering of assistant messages.
2. **DEC-124 / DEC-125 / REQ-103 / REQ-104 / FLOW-016** — persistent, resumable,
   browser-local conversation history behind a left history drawer.

Both consumers of the shared workspace get the changes automatically:
`MtgAssistantApp.tsx` → `EnrichmentStep.tsx` → `ConversationWorkspace` (game
mode, "In-Depth Question") and
`components/portal/quick-lookup/QuickLookupApp.tsx` → `ConversationWorkspace`
(lookup mode, "Quick Question"). Both call
`hooks/useAskAiSubmitOrchestration.ts` independently — that hook is the one
place that already knows `frozenContext`, `visibleMessages`, and the private
`hiddenInitialQuestion`, so it is the natural owner of save/restore behavior
rather than duplicating that logic in each consumer.

## Architecture

### Markdown rendering (Slice A, independent)

`ConversationThread.tsx:143` currently renders every message as
`<p className="whitespace-pre-wrap">{message.content}</p>`. Assistant messages
switch to `react-markdown` + `remark-gfm`; user messages keep the existing
plain-text path untouched. No `rehype-raw` plugin is added, so raw HTML in
model output is never executed — `react-markdown`'s default parser treats
inline HTML in the markdown source as literal text, which is the sanitization
requirement (REQ-102 "no raw HTML execution") satisfied without adding a
separate sanitizer dependency (`dompurify`/`rehype-sanitize`). This is fully
isolated to `ConversationThread.tsx` + `index.css` + `package.json` and has no
dependency on the history work.

### Conversation history (Slices B → C, sequential)

**Storage + hook layer (Slice B).** New `lib/conversationHistory/persistence.ts`
mirrors the guarded-read/write shape of `lib/lifeTracker/persistence.ts`
(DEC-103's established pattern: try/catch around `localStorage`, a runtime
type-guard, corrupt values dropped rather than crashing). Entries store the
full snapshot needed to resume: `frozenContext` (the hook's existing
`FrozenAskAiContext` union — `{kind:"game", gameContext}` or
`{kind:"lookup", card}`), `hiddenInitialQuestion`, and `visibleMessages`.

`hiddenInitialQuestion` must be persisted even though it is never rendered:
`submitFollowUp` (`useAskAiSubmitOrchestration.ts:279-282`) rebuilds
`conversationHistory` from it on every follow-up request. A resumed
conversation that dropped this field would be unable to ask a coherent
follow-up — this is a functional requirement, not a display nicety.

The hook gains, purely additively (no change to existing request-building
logic in `submitAttempt`/`submitFollowUp`):
- `hiddenInitialQuestion` returned in the result (currently private state).
- an internal `conversationId` (generated via the same
  `crypto.randomUUID()`-with-fallback approach as `createCorrelationId` in
  `lib/debugLogger.ts`), reset on `startOver()` and on the new
  `restoreConversation()`.
- an `onConversationUpdated` callback option, fired after every successful
  decrypt and successful follow-up with
  `{ conversationId, frozenContext, hiddenInitialQuestion, visibleMessages }`.
  This is the single point that knows "a turn just succeeded," so it is the
  right owner of *when* to save — consumers don't need their own
  success-detection effects.
- `restoreConversation(entry)` — sets `frozenContext`, `hiddenInitialQuestion`,
  `visibleMessages`, `conversationId` from a stored entry in one call, clears
  `pendingRetry`/`error`/`retryCountdown`, so follow-ups behave exactly like a
  freshly-decrypted conversation (REQ-104).

Because saves already happen after every successful turn, REQ-103's "leaving
an active conversation auto-saves it first" and REQ-104's "replacing the
active conversation auto-saves the outgoing one first" need no separate
flush-on-exit call — the persisted entry is already current from the last
successful turn by the time `startOver`/`restoreConversation` runs.

**Drawer UI + wiring (Slice C, final).** New `ConversationHistoryDrawer.tsx`
mirrors `AdaptiveContextDialog.tsx`'s dialog mechanics (portal to
`document.body`, `role="dialog"`, Tab/Shift+Tab focus trap, Escape-to-close,
focus-restore-to-trigger) and its CSS breakpoint shape
(`index.css:159-206`), mirrored to the left edge instead of the right:
`justify-content: flex-start` and `border-radius: 0 1rem 1rem 0` in the
`768px`+ block, instead of `flex-end` / `1rem 0 0 1rem`. `ConversationWorkspace`
gets a new full-width trigger row stacked above the existing context trigger
(before the `AdaptiveContextDialog` block, `ConversationWorkspace.tsx` around
line 51), per DEC-125.

## Cross-cutting decisions made during mapping

These fill gaps the approved brief/decisions left at the architecture level
(not product-scope reopenings — the product shape is fixed by DEC-123/124/125
and REQ-102/103/104; these are implementation calls within that scope).

1. **History list is filtered per destination, not shown mixed.** Each
   consumer (`MtgAssistantApp`/`EnrichmentStep` for game mode,
   `QuickLookupApp` for lookup mode) only knows how to render its own
   `frozenContext.kind` — `EnrichmentStep.tsx:390-397` assumes `frozenContext`
   is game-shaped, `QuickLookupApp.tsx:192-217` assumes lookup-shaped. Making
   a game-mode entry resumable from the Quick Question destination (or vice
   versa) would require building cross-destination navigation, which no
   existing infrastructure supports and which the brief's technical direction
   ("no new context-derivation logic") and non-goals ("no redesign of
   unrelated suite features... beyond shared chrome this shell needs") don't
   ask for. `loadHistoryEntries` takes a `mode` filter; each destination's
   drawer only lists and offers entries of its own mode. Storage itself stays
   one global 20-cap list/key (matching "20 most recent conversations," not
   "20 per flow") — only the drawer's rendered list is filtered.
2. **Mutual exclusivity with the Menu drawer uses a small shared context**,
   not a lifted prop, because the history trigger (deep inside
   `ConversationWorkspace`, mounted inside each destination) and
   `FeaturePortalMenu` (mounted in `App.tsx`'s `PortalShell`) are far apart in
   the tree — `FeaturePortalMenu`'s `isOpen` is `useState`-local today
   (`FeaturePortalMenu.tsx:38`) with no `onOpenChange` or registry. A small
   `LeftEdgeDrawerContext` (`activeDrawer: "menu" | "history" | null`,
   `openDrawer`/`closeDrawer`) provided once near the app root is the minimal
   mechanism; each drawer keeps its own open/close state as today and just
   syncs with the shared "who's open" signal.
3. **Coordination risk**: `PRD/work/center-menu-tab-prominence/` is `active`
   in parallel and its slice B
   (`slice-b-corner-rail-drawer.md`) also touches `FeaturePortalMenu.tsx`
   (visual/DOM rework of the trigger and open-state CSS, not an open-state
   API change per its own requirements). If that slice has already landed by
   the time Slice C executes, re-check whether it introduced any controlled
   open-state API before adding `LeftEdgeDrawerContext` wiring, to avoid two
   parallel mechanisms. If it hasn't landed yet, Slice C's `FeaturePortalMenu`
   edit is additive (a new context subscription) and should not conflict with
   a later DOM/CSS-only restyle, but expect a rebase/merge check either way
   since both slices touch the same file.
4. **No manual delete/clear-entry UI** — REQ-103/REQ-104/FLOW-016 only specify
   auto-save and automatic oldest-pruning past 20; no requirement asks for a
   delete action, so none is built (avoids inventing an unrequested control).

## Non-goals reaffirmed (from DESIGN-BRIEF)

- No `AskAiRequest`/`AskAiResponse`/Zod schema/prompt-assembly/provider/route
  changes anywhere in this package.
- No cross-device sync, accounts, or server-side storage.
- No editing of resumed/frozen context (DEC-040 unchanged).
- No schema-enforced answer shapes — markdown rendering only.

## Verification checklist (whole package)

```bash
cd apps/frontend && npx vitest run \
  src/components/ConversationThread.test.tsx \
  src/lib/conversationHistory/persistence.test.ts \
  src/hooks/useAskAiSubmitOrchestration.test.ts \
  src/components/ConversationHistoryDrawer.test.tsx \
  src/components/ConversationWorkspace.test.tsx \
  src/components/portal/FeaturePortalMenu.test.tsx
cd apps/frontend && npm run quality:check
```

Manual (dev server, `npm run dev` in `apps/frontend`): for both In-Depth
Question and Quick Question — confirm markdown renders (headings, lists,
tables, code blocks, links) and a plain-text answer is unchanged; confirm a
saved conversation appears in its own destination's history drawer and not
the other's; confirm resume restores context/thread and follow-ups work;
confirm bottom-sheet at `<768px` and left-drawer at `768px+`; confirm opening
the history drawer closes an open Menu drawer and vice versa; confirm 21st
save prunes the oldest entry.

## Implementation map

| Slice | Objective | Depends on |
| --- | --- | --- |
| [A](./slice-a-markdown-answer-rendering.md) | Structured markdown rendering of assistant messages | none |
| [B](./slice-b-history-persistence-layer.md) | Browser-local conversation history storage + hook save/restore API | none |
| [C](./slice-c-history-drawer-and-wiring.md) | History drawer UI, resume flow, Menu mutual exclusivity, dual-consumer wiring | B |

A has no dependency on B/C and can be implemented in any order relative to
them.
