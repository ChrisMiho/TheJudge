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

## Addendum — post-ship visual refinement (DEC-126 / DEC-127)

A/B/C above shipped. This addendum adds two more slices on top of that
already-shipped surface, driven by the live product-owner review captured in
`DESIGN-BRIEF.md`'s addendum and the mock at
`mockups/history-icon-and-full-bleed-chat.html`.

### Slice D architecture — history trigger relocates into the corner rail (DEC-126)

**The problem this solves.** The history trigger's *button* needs to render
inside the same DOM subtree `FeaturePortalMenu` already portals into the
active destination's header (`.portal-menu-rail`, positioned via the existing
`<PortalSlot />` mechanism), but the trigger's *behavior* (whether it exists
at all, and what `onOpen` does) is owned by each destination
(`EnrichmentStep.tsx` / `QuickLookupApp.tsx` via `StagedStepHeader.tsx`), far
down the tree from where `FeaturePortalMenu` is mounted (`App.tsx`'s
`PortalShell`). `LeftEdgeDrawerContext` already solved the analogous "far
apart in the tree" problem for open/close mutual exclusivity; this needs the
same kind of small context, but for descriptor data instead of open state.

**Mechanism.** Extend the existing `PortalSlotContext`
(`lib/portal/slotContext.tsx`) rather than inventing a parallel registration
path: `registerSlot` gains a second argument, a stable
`getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined`
getter. `PortalSlot.tsx` gains an optional `historyTrigger` prop; internally
it stores the latest descriptor in a ref (updated on every render body, no
effect — the "latest ref" pattern, not new to this codebase's problem shape)
and passes a `useCallback(() => ref.current, [])`-stable getter into
`registerSlot` so the registration effect still only runs on mount/unmount,
exactly like today. `FeaturePortalMenu.tsx` changes `slotNodes` from
`HTMLDivElement[]` to `{ node: HTMLDivElement; getHistoryTrigger: () => ... }[]`,
keeps the existing "closest `[hidden]` is null" visibility check unchanged,
and calls `.getHistoryTrigger()` on the visible entry at render time to
decide whether to render one rail zone (Menu only, today's shape) or two
(Menu + History).

Both destination call sites (`EnrichmentStep.tsx:385`,
`StagedStepHeader.tsx:11`, the latter threaded through a new
`historyTrigger` prop on `StagedStepHeaderProps` from
`QuickLookupApp.tsx:235`) pass `historyTrigger={historyTrigger}` next to the
existing `<PortalSlot />`, reusing the exact same `historyTrigger` prop
value each already receives today (no new prop plumbing into the
destinations themselves — only downstream of where they already have it).
This preserves today's shipped gating for free: the trigger is only ever
supplied inside the `isConversationActive` branch in both destinations, so
the rail's History zone still only appears once a conversation is active,
exactly as it does today with the body button.

`ConversationWorkspace.tsx` drops its `historyTrigger &&` button block
entirely (`ConversationWorkspace.tsx:58-69`) — the workspace no longer
renders anything for history; `ConversationHistoryTriggerDescriptor`'s
`label` field is dropped (it was only ever used for the removed button's
visible text; `FLOW_LABEL`/`entry.flowLabel` in the drawer's own list
rendering is unrelated and unaffected) — the two call sites become
`historyTrigger={{ onOpen: openHistory }}`.

**Rail visuals.** `.portal-menu-rail` (`index.css:71`) currently renders a
single hit-zone with a text glyph (`☰`, `.portal-menu-rail-icon`,
`scaleX(1.6)` hack). Per DEC-126's confirmed direction (mock's `.rail.split`
/ `.rail-zone` rules), add a `.portal-menu-rail-split` variant applied only
when a History zone is present: height becomes
`clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem)` (mock's exact values, satisfying
NFR-001's 44px-per-zone floor at every viewport per DEC-126), split into two
`flex: 1; min-height: 2.75rem` zones with a `1px` top border on the second
as the divider. Both icons switch from the current mixed
text-glyph/none-yet approach to matching inline stroke-SVG icons
(`viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`) — three
horizontal lines for Menu (replacing `☰` + its `scaleX` hack), a
clock-in-circle for History — this is the first inline-SVG icon in the
codebase (grep confirms no existing convention to match instead), so follow
the mock's exact glyphs. `aria-label="Switch feature"` stays on Menu;
History's button gets `aria-label="Conversation history"`. Destinations
without a history trigger (Life Tracker, Trade Balancer) keep rendering
today's unmodified single-zone `.portal-menu-rail`.

**Entry-row styling (same DEC-126, same slice — small, no file overlap with
the rail work).** `ConversationHistoryDrawer.tsx`'s entry `<button>`
(`ConversationHistoryDrawer.tsx:156-170`) drops its bordered-card classes
(`rounded-xl border ... bg-zinc-900/55` / active `bg-zinc-800`) for plain
unboxed rows with a quiet hover/active background highlight only — scope
this to exactly REQ-103's acceptance line ("plain, unboxed grouped rows with
a quiet active/hover highlight"), not the mock's illustrative group-label
header (the drawer already lists only one mode's entries per the original
GAMEPLAN's cross-cutting decision #1, so a group label would be redundant).

### Slice E architecture — full-bleed conversation thread (DEC-127)

**Scope constraint that shapes the whole approach.** `.page-shell`
(`index.css:7`) is `min-height: 100vh` with the *document* scrolling — there
is no bounded-height ancestor for `.conversation-thread` to flex-grow into.
Building a true "fills the viewport, internal scroll only" layout (like
Claude's actual app) would mean restructuring `.page-shell`/`.page-card`
into a fixed-height flex shell — explicitly out of scope
(non-goals: "no redesign of the outer app shell", "a persistent, always-open
desktop sidebar... explicitly declined"). "Full-bleed... within the
workspace" is therefore scoped to: the thread stops being a small
fixed-cap box nested in its own bordered sub-panel, and grows substantially
taller within the existing document-flow/page-scroll model, keeping
`ConversationThread.tsx`'s own internal `overflow-y: auto` +
DEC-118 near-bottom/auto-scroll/New-response logic (`ConversationThread.tsx`
lines 31-128) completely untouched — only the container's height budget and
bubble/composer presentation change.

- `.conversation-thread` (`index.css:225`): raise the height clamp from
  `clamp(18rem, 45dvh, 24rem)` to a substantially taller budget (e.g.
  `clamp(28rem, 70dvh, 44rem)` — tune during implementation against real
  viewports, the point is "reads as the dominant surface" not an exact
  number) and drop the nested `rounded-2xl border ... bg-zinc-900/55`
  panel treatment (`ConversationThread.tsx:139`) so the thread stops
  reading as a second boxed card inside `.page-card` — it should blend with
  the workspace surface, not sit inside its own visually near-identical
  bordered box.
- Bubbles (`ConversationThread.tsx:143-145`): assistant messages drop their
  `bg-zinc-800/80` container/padding entirely — plain flowing text,
  `max-w-[85%] self-start text-sm text-zinc-100`, no background — per
  DEC-127's "no bubble container" for assistant turns. User messages go from
  the current translucent `border border-accent-strong/30 bg-accent-strong/30`
  to a solid, opaque accent bubble (drop the border, raise the fill from
  `/30` to fully opaque or near it) so user turns read as clearly higher
  contrast against both the surface and the assistant turns next to them.
- `FollowUpComposer.tsx`: restructure from the current stacked
  label/textarea/full-width-button form (`FollowUpComposer.tsx:21-53`) into
  a single-row rounded-pill control (`border-radius: 999px` equivalent,
  e.g. Tailwind `rounded-full`) — textarea/input inline with a circular
  send-icon button (an SVG arrow, consistent with Slice D's new inline-SVG
  icon convention, replacing the text "Send" label). Keep the "Follow-up
  question" accessible name as a visually-hidden (`sr-only`) label rather
  than dropping it, and keep the existing `MAX_QUESTION_CHARS` enforcement
  and disabled/submitting states — only the visual structure and the
  character counter's placement change (it doesn't need to be dropped, just
  fit unobtrusively into the tighter pill layout).

Both slices are additive presentation work with no shared files that would
force ordering — D touches `FeaturePortalMenu.tsx`, `PortalSlot.tsx`,
`slotContext.tsx`, `StagedStepHeader.tsx`, `EnrichmentStep.tsx`,
`QuickLookupApp.tsx`, `ConversationHistoryDrawer.tsx`, `ConversationWorkspace.tsx`
(trigger removal only), and rail/entry-row CSS; E touches
`ConversationThread.tsx`, `FollowUpComposer.tsx`, and thread/bubble/composer
CSS. `ConversationWorkspace.tsx` is the one file both slices touch (D removes
the old trigger button block; E does not need to touch that file at all,
since the thread/composer changes are self-contained to their own
components) — no real overlap risk.

## Verification checklist (addendum)

```bash
cd apps/frontend && npx vitest run \
  src/components/portal/FeaturePortalMenu.test.tsx \
  src/components/portal/PortalSlot.test.tsx \
  src/components/ConversationWorkspace.test.tsx \
  src/components/ConversationHistoryDrawer.test.tsx \
  src/components/EnrichmentStep.test.tsx \
  src/components/StagedStepHeader.test.tsx \
  src/components/portal/quick-lookup/QuickLookupApp.test.tsx \
  src/components/ConversationThread.test.tsx \
  src/components/FollowUpComposer.test.tsx
cd apps/frontend && npm run quality:check
```

Manual (dev server, `npm run dev`, both In-Depth Question and Quick
Question): confirm the corner rail shows one zone (Menu only) before a
conversation starts and splits into two zones (Menu + History, divider
visible) once a conversation is active; confirm both icons render as
matching stroke-SVGs, not a mixed text-glyph/SVG pair; confirm History still
opens the same bottom-sheet/left-drawer, still closes an open Menu drawer
and vice versa; confirm the rail stays usable (no icon overlap/clipping) at
a narrow (~360px) viewport width; confirm drawer entries render as unboxed
rows with only the active/hovered one highlighted; confirm the thread now
fills substantially more vertical space with no inner bordered box, assistant
text has no bubble background, user turns are solid/high-contrast bubbles,
and the composer renders as a rounded pill; confirm DEC-118's near-bottom
auto-scroll and "New response" control still behave identically to before
this addendum.
