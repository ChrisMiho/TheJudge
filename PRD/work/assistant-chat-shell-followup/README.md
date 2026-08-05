---
status: active
---

# assistant-chat-shell-followup

Follow-up to the shipped `assistant-chat-shell` package (receipt: `PRD/instructions/receipts/assistant-chat-shell-2026-08-04.md`) for post-ship chat-shell feedback.

Approved design brief: `DESIGN-BRIEF.md`. Captures: `issues/`. Product truth: DEC-129–131, REQ-107–110, FLOW-017 (Draft model clarified: Menu-leave snapshot + reload auto-hydrate; Start Over stays answered-only).

Architecture, data flow, and package-level verification: `GAMEPLAN.md`.

## Slices

| Slice | Goal | Status | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-always-visible-history-rail.md) | Always-visible History rail, no View Context overlap (REQ-107) | done | none |
| [B](./slice-b-mid-flight-draft-slot.md) | Mid-flight Draft slot, auto-hydrate (REQ-108 / FLOW-017) | planned | A |
| [C](./slice-c-answered-fill-start-over-chrome.md) | Answered workspace fill + Start Over chrome (REQ-109) | planned | none |
| [D](./slice-d-growing-pre-submit-composers.md) | Growing pre-submit question composers (REQ-110) | planned | none |

Sequential order: A → B → C → D. C and D have no functional dependency on A/B and may be reordered ahead of B if convenient — only B's dependency on A is load-bearing (FLOW-017 requires History to already be reachable everywhere before Draft rows are meaningful).

## Implementation map

- History rail plumbing: `apps/frontend/src/components/portal/MtgAssistantApp.tsx`, `ZoneCollectionStep.tsx`, `ZoneConfirmStep.tsx`, `EnrichmentStep.tsx`, `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`, `apps/frontend/src/index.css`
- Draft persistence: `apps/frontend/src/lib/conversationHistory/persistence.ts`, `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- Answered workspace chrome: `apps/frontend/src/components/ConversationWorkspace.tsx`, `ConversationThread.tsx`
- Composer growth: `apps/frontend/src/components/EnrichmentStep.tsx`, `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`, new shared grow-textarea hook under `apps/frontend/src/hooks/`

## Next step

`/thejudge-implement PRD/work/assistant-chat-shell-followup/ slice A` (Cursor / Claude Code) or `$thejudge-implement PRD/work/assistant-chat-shell-followup/ slice A` (Codex). For one unattended agent completing every slice, use `/thejudge-implement-all PRD/work/assistant-chat-shell-followup/` (`$thejudge-implement-all` in Codex).
