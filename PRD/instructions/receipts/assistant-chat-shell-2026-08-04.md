# Receipt — assistant-chat-shell

- Date: 2026-08-04
- Slug: `assistant-chat-shell`
- Status: shipped

## Actions taken

- [x] Verified Slice A: assistant messages render via `react-markdown` + `remark-gfm` in `ConversationThread`; user messages stay plain text; no raw HTML execution; plain-text answers unchanged.
- [x] Verified Slice B: `lib/conversationHistory/persistence.ts` mirrors DEC-103 guarded localStorage pattern; hook exposes `hiddenInitialQuestion`, `onConversationUpdated`, and `restoreConversation`; 20-cap prune.
- [x] Verified Slice C: `ConversationHistoryDrawer` (bottom sheet `<768px` / left drawer `768px+`), mode-filtered lists, resume wiring in both consumers, mutual exclusivity with Menu via `LeftEdgeDrawerContext`.
- [x] Verified Slice D: History trigger relocated into Menu corner rail (split zones + matching stroke-SVG icons); body button removed; drawer entry rows unboxed; destinations without history keep single-zone rail.
- [x] Verified Slice E: full-bleed taller thread, no nested bordered panel, plain assistant text / solid user bubbles, rounded-pill `FollowUpComposer`; DEC-118 scroll/New-response behavior preserved.
- [x] Confirmed DEC-123..DEC-127 (`decisions/conversation-ux.md`), REQ-102..REQ-105, FLOW-016 match shipped behavior; DEC-125 trigger-placement clause superseded by DEC-126. No `DEC`/`REQ` `Status:` field was edited to convey shipped-vs-planned.
- [x] Confirmed public contract unchanged (frontend rendering + browser-local persistence only).
- [x] Reviewed for secret-like patterns; none found.
- [x] Promoted `system-map.md` **Follow-up chat** (+ new **Conversation history drawer** child), refreshed thread/orchestration summaries; updated `goals-and-non-goals.md`, `technical-design-rules.md` (plain-string wire vs markdown render), and DEC-126 context/impact (drop deleted mock path; entry-row styling).
- [x] Fixed stale ambient-accent assertion in `EnrichmentStep.ambient-accent.test.tsx` for the pill optional-question composer.
- [x] Updated ideation follow-up package pointer away from the deleted work folder.
- [x] Deleted `PRD/work/assistant-chat-shell/` after receipt creation; removed slug from `PRD/work/STATUS.md`.

## Files created

- `PRD/instructions/receipts/assistant-chat-shell-2026-08-04.md`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx` (+ test)
- `apps/frontend/src/lib/conversationHistory/persistence.ts` (+ test)
- `apps/frontend/src/lib/portal/leftEdgeDrawerContext.tsx`

## Files updated

- `PRD/sections/decisions.md` (DEC-123..DEC-127 router — already present from refinement)
- `PRD/sections/decisions/conversation-ux.md` (DEC-123..DEC-127; DEC-126 context/impact polish at cleanup)
- `PRD/sections/functional-requirements.md` (REQ-102..REQ-105 — already present)
- `PRD/sections/user-flows.md` (FLOW-016 — already present)
- `PRD/sections/system-map.md` (Follow-up chat, Conversation thread UI, Conversation history drawer)
- `PRD/sections/goals-and-non-goals.md` (markdown answers, history, shared workspace shipped lines)
- `PRD/instructions/technical-design-rules.md` (plain-string wire vs client markdown render)
- `PRD/work/STATUS.md` (slug removed)
- `PRD/work/assistant-chat-shell-followup/README.md` (pointer → receipt)
- `apps/frontend/package.json` (`react-markdown`, `remark-gfm`)
- `apps/frontend/src/components/{ConversationThread,ConversationWorkspace,FollowUpComposer,EnrichmentStep}.tsx` (+ tests)
- `apps/frontend/src/components/EnrichmentStep.ambient-accent.test.tsx`
- `apps/frontend/src/components/portal/{FeaturePortalMenu,PortalSlot,MtgAssistantApp,quick-lookup/QuickLookupApp}.tsx` (+ tests)
- `apps/frontend/src/components/StagedStepHeader.tsx` (+ test)
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` (+ test)
- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/index.css` (thread/history/rail-split/composer)

## Files deleted

- `PRD/work/assistant-chat-shell/` (entire folder, after promotion)

## Verification results

- Package marker `STATUS.ship-ready` + board row confirmed before cleanup.
- Targeted Vitest: `ConversationThread`, `ConversationHistoryDrawer`, `conversationHistory/persistence`, `FollowUpComposer`, `FeaturePortalMenu`, `EnrichmentStep.ambient-accent` — passed.
- `npm run quality:check` — green after ambient-accent test fix.
- Public `AskAiRequest` / Zod / backend contract unchanged.
