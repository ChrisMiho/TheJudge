# Slice B — Colorless runtime and Theme controls

## Status: done

## Goal

Deliver the complete Colorless selection, native custom-color, persistence, restoration, and reset
interaction through the existing global theme hook and portal Theme section.

## Requirements

1. Extend `useThemePalette` to initialize both the selected profile id and optional saved custom
   Colorless RGB through Slice A's preference functions, then resolve and apply the effective
   palette through the existing `applyPalette` boundary.
2. Preserve the current `setPalette(id)` behavior for fixed profiles. Selecting Colorless must use
   the remembered custom RGB when present or fixed gray when absent; switching away must not delete
   or overwrite the custom RGB.
3. Expose hook actions for setting and resetting the Colorless custom value:
   - set: update React state, persist separately, and immediately apply custom Colorless;
   - reset: clear only the custom preference/state and immediately apply fixed Colorless;
   - storage failure: keep the chosen selected/custom state active for the session.
4. Extend the `App` → `FeaturePortalMenu` → `ThemeSection` prop seam with the current custom value
   and the two custom actions. Do not introduce a new provider, global store, or component-specific
   palette state.
5. Render exactly six labeled theme profile controls in catalog order. Keep each control accessible,
   visually indicate the active profile, and derive the check foreground from `accentContrast` so
   White remains readable.
6. Only when Colorless is selected, render an inline native `<input type="color">` labeled for
   Colorless customization and a `Reset to gray` action. The picker value reflects the remembered
   custom value or fixed Colorless `accent` when none is saved.
7. Keep the portal Theme section open when a profile is selected so choosing Colorless immediately
   exposes its inline controls. Destination menu items, outside click, and Escape continue to close
   the menu. Fit the six swatches and inline controls within the existing viewport-safe menu without
   reducing required touch targets.
8. Do not add warnings, validation UI, contrast repair, derived shades, or customization controls for
   the five fixed Magic profiles.

## Tests

- `useThemePalette.test.ts`: fixed selection, fixed Colorless, custom apply/persist, switch-away/back
  restore, reset, malformed-load fallback, and session-only behavior when storage writes fail.
- `ThemeSection.test.tsx`: exact WUBRGC order, accessible selected state, White check contrast, native
  input/reset visibility only for Colorless, callbacks, and fixed-profile non-customizability.
- `FeaturePortalMenu.test.tsx`: expanded prop seam, profile selection stays open, Colorless controls
  work inline, while destination selection/outside/Escape behavior remains unchanged.
- `App.theming.test.tsx`: App-level custom selection/restoration/reset without staged or conversation
  state loss.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- useThemePalette ThemeSection FeaturePortalMenu App.theming`
      proves immediate custom apply, independent persistence, switch-away/back restoration, reset,
      and menu/UI behavior.
- [ ] A test verifies a chosen RGB is copied unchanged into `--accent`, `--accent-strong`, and
      `--accent-soft`, while `--accent-contrast` stays `255 255 255`; no derived token value appears.
- [ ] A test verifies `Reset to gray` removes only the custom key, preserves the selected Colorless
      id, and immediately restores all four fixed Colorless values.
- [ ] A test verifies thrown storage writes do not block selecting a profile or using a custom value
      for the current session.
- [ ] An explicit DOM check verifies only active Colorless exposes the native input and reset action;
      White/Blue/Black/Red/Green expose neither.
- [ ] `npm --workspace apps/frontend run typecheck` passes with one shared hook/API path and no new
      theme provider or token role.

## Verification

```bash
npm --workspace apps/frontend run test -- useThemePalette ThemeSection FeaturePortalMenu App.theming
npm --workspace apps/frontend run typecheck
git diff --check
```

## Files touched

- `apps/frontend/src/hooks/useThemePalette.ts`
- `apps/frontend/src/hooks/useThemePalette.test.ts`
- `apps/frontend/src/components/portal/ThemeSection.tsx`
- `apps/frontend/src/components/portal/ThemeSection.test.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/App.theming.test.tsx`
