# Receipt — center-menu-tab-prominence-followup

- Date: 2026-08-05
- Slug: `center-menu-tab-prominence-followup`
- Status: shipped

## Actions taken

- [x] Verified Slice A: `PageShell` + `ShellBounds` registration; Menu drawer portals into visible shell bounds; sticky/`100dvh` drawer with shell clip + matching radii; Life Tracker `.page-shell-bleed` parity; no-shell-bounds fallback preserved for isolated tests.
- [x] Verified Slice B: quiet decorative `BrandMark` in unused lower tray space (`aria-hidden`, non-interactive, clip-omit).
- [x] Confirmed DEC-133 / REQ-113 already in durable sections and match shipped behavior. No new IDs. No `DEC`/`REQ` `Status:` field edited for shipped-vs-planned.
- [x] Promoted `system-map.md` Feature portal Lives-in / Summary for shell-bounds plumbing and DEC-137 rail hit-area note (shared chrome surface).
- [x] Confirmed public Ask AI / provider / registry / Theme contracts unchanged.
- [x] Reviewed for secret-like patterns; none found.
- [x] `npm run quality:check` green.
- [x] Deleted `PRD/work/center-menu-tab-prominence-followup/` after receipt; removed slug from `PRD/work/STATUS.md`.

## Files created

- `PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md`
- `apps/frontend/src/components/portal/ShellBounds.tsx` (+ test; implementation)

## Files updated (cleanup promotion)

- `PRD/sections/system-map.md` (Feature portal Lives in / Summary)
- `PRD/work/STATUS.md` (slug removed)

## Files updated (implementation; already on branch)

- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (+ test)
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/BrandMark.tsx` (reused decoratively)
- `PRD/sections/decisions/navigation.md`, `decisions.md`, `functional-requirements.md`, `goals-and-non-goals.md` (product truth at refinement)

## Files deleted

- `PRD/work/center-menu-tab-prominence-followup/` (entire folder, after promotion)

## Verification results

- Package marker `STATUS.ship-ready` + board row confirmed before cleanup.
- `npm run quality:check` — green.
- Public contract unchanged; no secrets.
