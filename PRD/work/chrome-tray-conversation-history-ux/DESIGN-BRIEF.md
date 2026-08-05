# Design brief — Chrome tray and conversation history UX

## Problem

Recent chrome work (Menu tray, History rail, chat shell, hit-area fixes) left several follow-on UX defects:

1. **Menu tray occlusion** — when the feature-portal Menu is open, the corner-rail History icon (and rail chrome) still paints through the tray and remains clickable.
2. **Answered-workspace top gap** — `.adaptive-context-trigger` still reserves tall clearance sized for the pre–DEC-137 stacked rail, leaving ~64px+ empty band above View Context on resumed/answered Quick and In-Depth chats.
3. **No delete** — DEC-124/REQ-103 auto-save and prune-at-20, but never defined user-initiated delete of past conversations.
4. **Context overlay dismiss** — View Context closes only via Close / Escape; clicking the scrim does nothing (DEC-118). History drawer has the same gap.
5. **Related crash** — opening View Context for a resumed lookup conversation with incomplete frozen card metadata crashes `CardSelectionPreview` (`formatMetaList` on undefined arrays) and whitescreens the app.

## Outcome

Opaque, non-interactive under-tray chrome when Menu is open; tight top clearance that still satisfies History↔View Context non-overlap; delete for completed history entries; outside-click dismiss for View Context and History overlays; resilient frozen-card context preview.

## Playwright evidence (2026-08-05, local mock)

| Issue | Evidence |
| --- | --- |
| Tray/icon overlap | Open Menu on Quick Question: `.portal-menu-rail` `z-index: 3`, `.portal-menu-drawer` `z-index: 2`; History still `pointer-events: auto`; click on History while Menu open closes Menu and opens History. Screenshots: `menu-tray-open-overlap.png`, `mobile-menu-tray-overlap.png`. |
| Top gap | Resumed conversation: `.adaptive-context-trigger` computed `margin-top: 64px` from `calc(clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem) - var(--layout-panel-padding))` in `index.css` (comment cites DEC-126 stacked rail clearance). Eyebrow→View Context gap ~87px. |
| No delete | History drawer lists entries with select + Close only; no delete control in UI or `ConversationHistoryDrawer.tsx`. |
| Outside click | `AdaptiveContextDialog` overlay has no backdrop click handler; Close + Escape only. History overlay same pattern. |
| Context crash | Opening View Context on seeded incomplete card → React error in `CardSelectionPreview` / white screen. |

## Decisions (new)

| ID | Summary |
| --- | --- |
| DEC-140 | When Menu tray is open, it paints above and occludes non-Menu rail chrome; under-tray icons are not visible through the tray and are not clickable. Menu trigger remains available to close. |
| DEC-141 | Answered-workspace top clearance matches the post–DEC-137 side-by-side rail footprint — no large empty band; DEC-129 non-overlap preserved. |
| DEC-142 | View Context and History overlays dismiss on outside/scrim click (as well as Close + Escape). Amends DEC-118 close clause for these overlays. |
| DEC-143 | User can delete completed history entries from the drawer (confirm first); active-entry delete clears the workspace without re-saving. Amends DEC-124. |
| DEC-144 | Frozen/resumed card context preview must tolerate incomplete metadata and must not crash the app. |

## Requirements / flows

- REQ-115 — Menu tray occlusion of under-rail chrome
- REQ-116 — Compact answered top clearance (amends spacing from REQ-107/DEC-129 clearance approach)
- REQ-117 — Outside-click dismiss for View Context + History overlays
- REQ-118 — Delete completed conversations
- REQ-119 — Resilient resumed card context preview
- FLOW-018 — Delete a saved conversation

## Assumptions (resolved without user pause — PRD + evidence)

1. **Menu stays tappable when open** — only non-Menu rail chrome (History) is occluded/disabled under the open tray; Menu remains the close control (matches existing outside-click-to-close Menu behavior in `FeaturePortalMenu`).
2. **Outside-click covers History too** — same scrim overlay family as View Context; fixing only one would leave the identical dead-scrim pattern.
3. **Delete confirms** — completed entries only; confirm before remove; Draft is unchanged (overwrite/clear rules stay DEC-130/138). Deleting the active completed conversation clears the workspace like Start Over without writing a new history save of the deleted thread.
4. **No backend / no sync** — delete and preview hardening stay browser-local frontend-only (DEC-124 constraints).
5. **Clearance fix is presentation-only** — retarget margin/layout to actual rail height after DEC-137; do not hide History or move View Context into a different surface.

## Non-goals

- Redesigning Menu tray visual language, destination registry, or Theme section
- Cross-device history, accounts, or server-side conversation store
- Multi-select bulk delete, search/filter history, or export
- Changing Ask AI contracts, prompt assembly, or providers
- Pre-submit empty lower-half fill (still out of scope per DEC-131)

## PRD references to update

- `PRD/sections/decisions.md` — index DEC-140…144
- `PRD/sections/decisions/navigation.md` — DEC-140
- `PRD/sections/decisions/conversation-ux.md` — DEC-141…144; note on DEC-118
- `PRD/sections/functional-requirements.md` — REQ-115…119; amend REQ-103/107 notes as needed
- `PRD/sections/user-flows.md` — FLOW-018

## Implementation touchpoints (guidance, not slices)

- `FeaturePortalMenu.tsx` / `.portal-menu-drawer` / `.portal-menu-rail` stacking + open-state inert/visibility for History zone
- `index.css` `.adaptive-context-trigger` margin clearance
- `AdaptiveContextDialog.tsx`, `ConversationHistoryDrawer.tsx` — backdrop dismiss
- `conversationHistory/persistence.ts` — delete helper
- `CardSelectionPreview.tsx` (+ persistence/restore path for full card shape)
