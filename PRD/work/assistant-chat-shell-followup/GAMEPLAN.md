# GAMEPLAN — assistant-chat-shell-followup

## Architecture

Four independent post-ship defects against the shared chat shell (DEC-118–127), each already resolved into product truth (DEC-129–131, REQ-107–110, FLOW-017) by refinement. No backend, contract, or provider change in any slice — this package is frontend-only (`apps/frontend`).

Grounding from the current codebase (verified by inspection, not assumption):

- **History rail gap (REQ-107).** `StagedStepHeader`/`PortalSlot` already accept an optional `historyTrigger` prop and `FeaturePortalMenu` already renders the two-zone split rail (Menu + History) whenever a visible slot supplies one (`portal-menu-rail-split` / `portal-menu-rail-zone`, `apps/frontend/src/index.css:130-152`). The prop just isn't threaded everywhere:
  - `MtgAssistantApp.tsx:591` — game-context step's `<StagedStepHeader onBrandClick={...} />` passes no `historyTrigger`.
  - `ZoneCollectionStep.tsx:179` and `ZoneConfirmStep.tsx:27` — both render bare `<StagedStepHeader />`.
  - `EnrichmentStep.tsx:424` — the pre-submit (cards-review/question-form) render's own `<StagedStepHeader />` doesn't forward the `historyTrigger` prop the component already receives (it's only forwarded at line 385, inside the `isConversationActive` branch).
  - `QuickLookupApp.tsx:281` — the pre-submit form's `<StagedStepHeader />` is bare; only the answered branch (`:235`) passes `historyTrigger`.
  - Net effect: History is only visible once a conversation is answered, and disappears again the instant `handleStartOver()` resets `flowStep` back to `"game-context"` (`MtgAssistantApp.tsx:560-573`) — exactly `issues/2.png`.
  - The View Context overlap (`issues/1.png`) is a corner-rail-vs-`.adaptive-context-trigger` collision: the rail is `position: absolute` at the card's top-left corner (`.portal-menu-rail`, `index.css:71-97`, `.portal-slot-tab` negative-margin popout at `:60-63`) and grows taller in its two-zone form, while `.adaptive-context-trigger` (`index.css:395-397`) is a plain in-flow full-width button with no clearance reserved for the rail.

- **Draft slot (REQ-108, FLOW-017).** `apps/frontend/src/lib/conversationHistory/persistence.ts` only has completed-history functions (`loadHistoryEntries`, `saveHistoryEntry`, 20-entry cap, guarded-read pattern). There is no Draft concept anywhere in code yet. Mid-flight staging lives in each destination's own local state:
  - In-Depth (`MtgAssistantApp.tsx`): `flowStep`, `gameContext`, `selectedZones`, `zoneCardsByZone`, `question`, `turnPhase`, `combatStep`, `confirmedPhase`, `activePlayer` (player roster itself is out of scope — DEC-040 already preserves it separately via the Player Life Tracker persistence pattern).
  - Quick Question (`QuickLookupApp.tsx`): `selectedCard`, `question`, `lockedTopic` (and any other pre-submit staging the implementer finds load-bearing to resume meaningfully).
  - `ConversationHistoryDrawer.tsx` renders only completed `entries`; it has no Draft row concept.
  - Depends on Slice A: FLOW-017's precondition is "History rail is always visible on these destinations (REQ-107)" — Draft is surfaced through History, so History must already be reachable everywhere before Draft rows are meaningful.

- **Answered-workspace fill + Start Over chrome (REQ-109).** `ConversationWorkspace.tsx` renders Start Over as a plain button (not full-width, but the only sizing rule at all) inside a `.conversation-workspace` flex column with no height-filling rule (`index.css:266-271`). `.conversation-thread` is capped at `clamp(28rem, 70dvh, 44rem)` (`index.css:260-264`) with no distinct short-content-fill behavior. No mobile/desktop distinction exists for Start Over sizing today.

- **Growing pre-submit composers (REQ-110).** Both fields are fixed `rows={1}` textareas with no grow behavior: `EnrichmentStep.tsx:534-540` (Optional question) and `QuickLookupApp.tsx:429-437` (Quick Question). Product truth explicitly prefers one shared fix (DEC-131, package non-goal: "prefer shared workspace / shared composer patterns"), suggesting a shared grow-to-fit textarea hook/utility consumed by both call sites rather than two divergent implementations.

## Data flow

No data flow changes. All four slices are presentation/local-state only:
- No `AskAiRequest`/`AskAiResponse` shape changes, no Zod schema changes, no prompt-assembly or provider changes (explicit non-goal, all four REQs).
- Draft (Slice B) adds one new browser-local storage key family (mirroring `CONVERSATION_HISTORY_STORAGE_KEY`'s guarded-read pattern), scoped per destination mode, holding UI staging state only.

## Verification checklist (package-level, from DESIGN-BRIEF)

1. Desktop + mobile (~390×844): History rail visible on In-Depth and Quick Question at every step, including empty history, pre-submit, and immediately after Start Over; no overlap with View Context.
2. Stage mid-flight → leave via Menu → return → mid-flight UI restored from Draft; History shows **Draft**; reload with Draft present auto-hydrates the same way; after answered Start Over, new staging overwrites Draft (no second unfinished entry).
3. Answered workspace with short thread fills available height; desktop Start Over remains reachable without scrolling the page away; mobile Start Over is visually smaller than today's full-width large control.
4. Enrichment optional question and Quick Question question fields grow with long text until bottom chrome, without document scroll.
5. `npm run quality:check` (or frontend workspace equivalent for touched areas) green.

## Slices

| Slice | Goal | Depends on | Files (primary) |
| --- | --- | --- | --- |
| A | Always-visible History rail, no View Context overlap (REQ-107) | none | `MtgAssistantApp.tsx`, `ZoneCollectionStep.tsx`, `ZoneConfirmStep.tsx`, `EnrichmentStep.tsx`, `QuickLookupApp.tsx`, `index.css` |
| B | Mid-flight Draft slot, single-slot, auto-hydrate (REQ-108, FLOW-017) | A | `lib/conversationHistory/persistence.ts`, `ConversationHistoryDrawer.tsx`, `MtgAssistantApp.tsx`, `QuickLookupApp.tsx` |
| C | Answered workspace fill + Start Over chrome (REQ-109) | none (parallel-ready with A/B) | `ConversationWorkspace.tsx`, `ConversationThread.tsx`, `index.css` |
| D | Growing pre-submit question composers (REQ-110) | none (parallel-ready with A/B/C) | `EnrichmentStep.tsx`, `QuickLookupApp.tsx`, new shared grow-textarea hook, `index.css` |

Sequential execution order: A → B → C → D. C and D touch disjoint files from A/B (aside from C/D both touching `EnrichmentStep.tsx`/`QuickLookupApp.tsx` in different regions than A) and carry no functional dependency on A/B, so an implementer or reviewer may reorder C/D ahead of B if that's more convenient — only B's dependency on A is load-bearing.

## Ship gates

See final slice (D) for the Ship gates block.
