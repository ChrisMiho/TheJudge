---
status: ship-ready
---

# center-menu-tab-prominence-followup

Follow-up to the shipped `center-menu-tab-prominence` package (receipt: `PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md`) for minor post-ship chrome polish.

Implements DEC-133 / REQ-113: the open feature-portal Menu tray becomes a
full-height left side of the outer app shell (`.page-card` / Life Tracker
full-bleed), sized to the visible shell side on tall pages, with matching
bottom-left radius and an optional quiet decorative brand mark.

See `DESIGN-BRIEF.md` for approved scope and `GAMEPLAN.md` for the
implementation architecture.

## Slices

| Slice | Goal | Depends on | Status |
| --- | --- | --- | --- |
| [A](./slice-a-shell-bounds-tray-geometry.md) | Shell-bounds architecture: full-height + visible-bounds sizing + matching corner radius, for both `.page-card` and Life Tracker full-bleed | — | done |
| [B](./slice-b-tray-brand-mark-and-shipgate.md) | Quiet decorative brand mark in unused lower tray space; final verification, PRD promotion, ship gates | A | done |

## Implementation map

- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/components/portal/ShellBounds.tsx` (new)
- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/BrandMark.tsx` (slice B, reused decoratively)

## Next step

`/thejudge-implement PRD/work/center-menu-tab-prominence-followup/ slice A`
(Cursor / Claude Code) or
`$thejudge-implement PRD/work/center-menu-tab-prominence-followup/ slice A`
(Codex).

For one unattended agent completing both slices:
`/thejudge-implement-all PRD/work/center-menu-tab-prominence-followup/`.
