---
status: active
---

# Chrome tray and conversation history UX

Ephemeral work package for menu-tray occlusion/hit-target fixes, answered-workspace top clearance,
past-conversation delete, outside-click overlay dismiss, and related chrome regressions found
during Playwright verification.

Approved product truth: DEC-140…144, REQ-115…119, FLOW-018. See `DESIGN-BRIEF.md`.

## Preparation gate

- Quality-check: **PASS** (`QUALITY-CHECK.md`)

## Slices

Plan: [`GAMEPLAN.md`](./GAMEPLAN.md).

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](./slice-a-menu-tray-occlusion.md) | Menu tray occludes under-rail History | — | planned |
| [B](./slice-b-answered-top-clearance.md) | Compact answered top clearance | A (`index.css`) | planned |
| [C](./slice-c-resilient-card-preview.md) | Resilient resumed card context preview | — | planned |
| [D](./slice-d-overlay-scrim-dismiss.md) | Outside/scrim dismiss for View Context + History | — | planned |
| [E](./slice-e-delete-history-entries.md) | Delete completed history entries | D (drawer) | planned |

Default sequence A → B → C → D → E. C is parallel-ready with A/B/D; E follows D; B follows A
because both edit `index.css`. Slice E carries the ship gates and PRD promotion checklist.

## Implementation map

| Area | Files |
| --- | --- |
| A — tray occlusion | `FeaturePortalMenu.tsx`, `index.css` (portal-menu-*), tests |
| B — top clearance | `index.css` (`.adaptive-context-trigger`), spacing/overlap tests |
| C — card preview | `CardSelectionPreview.tsx` (+ test); Quick Lookup save path only if needed |
| D — scrim dismiss | `AdaptiveContextDialog.tsx`, `ConversationHistoryDrawer.tsx` (+ tests) |
| E — delete | `persistence.ts`, drawer, `MtgAssistantApp.tsx`, `QuickLookupApp.tsx` (+ tests) |

## Next step

`/thejudge-implement PRD/work/chrome-tray-conversation-history-ux/ slice A`

For one unattended agent completing every slice:
`/thejudge-implement-all PRD/work/chrome-tray-conversation-history-ux/`
