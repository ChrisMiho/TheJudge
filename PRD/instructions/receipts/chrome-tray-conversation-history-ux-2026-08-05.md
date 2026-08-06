# Receipt — chrome-tray-conversation-history-ux

- Date: 2026-08-05
- Slug: `chrome-tray-conversation-history-ux`
- Status: shipped

## Actions taken

- [x] Verified Slice A: open-state Menu tray occludes the History rail zone — `aria-hidden`,
      `tabIndex={-1}`, no click handler, `.portal-menu-rail-zone-inert` (non-hit-testable, does not
      paint through the tray); Menu zone stays interactive as the close control. Covered by
      `FeaturePortalMenu.test.tsx`.
- [x] Verified Slice B: `.adaptive-context-trigger` clearance retargeted to the side-by-side rail's
      `2.75rem` interactive footprint (from the retired pre-DEC-137 stacked-rail clamp);
      History↔View Context non-overlap (DEC-129) holds.
- [x] Verified Slice C: `CardSelectionPreview` tolerates missing/undefined `colors` / `supertypes` /
      `subtypes` and other optional fields via existing N/A-style fallback handling instead of
      throwing. Covered by `CardSelectionPreview.test.tsx`.
- [x] Verified Slice D: `AdaptiveContextDialog` and `ConversationHistoryDrawer` overlays dismiss on
      outside/scrim click in addition to Close/Escape; surface clicks do not close; focus trap and
      restore unchanged. Covered by `AdaptiveContextDialog.test.tsx`, `ConversationHistoryDrawer.test.tsx`.
- [x] Verified Slice E: guarded `deleteHistoryEntry(id)` in `persistence.ts`; each completed row has
      a delete-with-confirm control distinct from select-to-resume; deleting the active completed
      conversation clears the workspace via `startOver()` without re-saving the deleted thread;
      Draft rows are not deletable via this control; prune-at-20 preserved. Covered by
      `persistence.test.ts`, `ConversationHistoryDrawer.test.tsx`, `App.conversation-history-delete.test.tsx`.
- [x] Confirmed DEC-140…DEC-144 bodies and the `decisions.md` router lines already landed during
      refinement and match shipped behavior; no edits needed. REQ-115…REQ-119 and FLOW-018 likewise
      already accurate against shipped code. No `DEC`/`REQ` `Status:` field edited for
      shipped-vs-planned signaling.
- [x] Promoted `system-map.md`: **Feature portal (app navigation)** (tray-open History inertness,
      DEC-140/REQ-115), **Conversation history drawer** (delete control DEC-143/REQ-118/FLOW-018;
      scrim dismiss DEC-142/REQ-117), **Adaptive context overlay** (clearance retarget
      DEC-141/REQ-116; scrim dismiss DEC-142/REQ-117; resilient `CardSelectionPreview`
      DEC-144/REQ-119).
- [x] Confirmed public Ask AI / provider / Zod contract unchanged (frontend-only, browser-local
      history storage; no new storage keys, no sync).
- [x] Reviewed for secret-like patterns; none found.
- [x] Re-ran the six touched-area test files in an isolated worktree off `main` (174c6c6, post
      PR #74 merge): `FeaturePortalMenu.test.tsx`, `AdaptiveContextDialog.test.tsx`,
      `ConversationHistoryDrawer.test.tsx`, `CardSelectionPreview.test.tsx`, `persistence.test.ts`,
      `App.conversation-history-delete.test.tsx` — 95/95 passing. Full `npm run quality:check` not
      re-run in this pass (already merged via PR #74, which passed CI); scoped re-verification
      covers every file this package touched.
- [x] Deleted `PRD/work/chrome-tray-conversation-history-ux/` after this receipt; removed slug from
      `PRD/work/STATUS.md`.

## Files created

- `PRD/instructions/receipts/chrome-tray-conversation-history-ux-2026-08-05.md`

## Files updated (cleanup promotion)

- `PRD/sections/system-map.md` (Feature portal, Conversation history drawer, Adaptive context overlay)
- `PRD/work/STATUS.md` (slug removed)

## Files updated (implementation; already merged via PR #74)

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (+ test)
- `apps/frontend/src/index.css` (`.adaptive-context-trigger`, `.portal-menu-rail-zone-inert`)
- `apps/frontend/src/components/CardSelectionPreview.tsx` (+ test)
- `apps/frontend/src/components/AdaptiveContextDialog.tsx` (+ test)
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx` (+ test)
- `apps/frontend/src/lib/conversationHistory/persistence.ts` (+ test)
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/App.conversation-history-delete.test.tsx` (new)
- `PRD/sections/decisions.md`, `decisions/navigation.md`, `decisions/conversation-ux.md`,
  `functional-requirements.md`, `user-flows.md` (product truth at refinement; unchanged here)

## Files deleted

- `PRD/work/chrome-tray-conversation-history-ux/` (entire folder, after promotion)

## Verification results

- Package marker `STATUS.ship-ready` + board row confirmed before cleanup; PR #74 confirmed merged
  to `main` (merge commit `174c6c6`).
- Scoped re-verification: 6/6 touched-area test files green, 95/95 tests passing.
- Public contract unchanged; no secrets.
