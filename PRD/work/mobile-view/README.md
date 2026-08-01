status: active

# Mobile View

Ephemeral planning folder for mobile home-screen layout fixes: floating orb/header text collision and main navigation hub scroll behavior. See `IDEA.md` for problem/outcome/non-goals and the attached screenshot for the reported visual bug, and `DESIGN-BRIEF.md` for the approved fix (consolidate `ThemeControl` into the feature-portal Menu; give every destination screen an inline Menu slot). `GAMEPLAN.md` has architecture and data flow; slices below are agent-implementation-ready.

## Slices

| Slice | Goal | Depends on | Doc |
| --- | --- | --- | --- |
| A | Fold `ThemeControl` into `FeaturePortalMenu` as a Theme section; retire the top-right corner control; icon-only Menu trigger | — | `slice-a-theme-in-menu.md` |
| B | Give the answered/conversation view its own inline header slot so Menu docks flush instead of floating fixed | — | `slice-b-conversation-header-slot.md` |

A and B are parallel-ready — disjoint files, no shared dependency.

## Implementation map

- `apps/frontend/src/App.tsx` — drop the standalone `ThemeControl` wrapper; wire palette/density into `FeaturePortalMenu` (Slice A)
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` — Theme section, icon-only trigger (Slice A)
- `apps/frontend/src/components/portal/ThemeSection.tsx` (new) — extracted palette/density picker body (Slice A)
- `apps/frontend/src/components/ThemeControl.tsx` — deleted (Slice A)
- `apps/frontend/src/index.css` — `.mock-mode-banner` z-index comment re-key (Slice A)
- `apps/frontend/src/components/EnrichmentStep.tsx` — conversation-view header gains `<PortalSlot />` (Slice B)
