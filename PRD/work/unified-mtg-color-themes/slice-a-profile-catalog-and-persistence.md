# Slice A — Profile catalog and persistence foundation

## Status: done

## Goal

Establish the authoritative six-profile theme domain and defensive browser-preference contract that
all later Colorless UI and integration work consumes.

## Requirements

1. Replace `PALETTES` with exactly White, Blue, Black, Red, Green, Colorless in WUBRGC order using
   the DEC-119/REQ-099 values. Keep `DEFAULT_PALETTE_ID = "blue"`; remove Violet, Emerald, Amber,
   and Rose definitions entirely.
2. Keep the public four-role `Palette` shape and CSS-ready channel triples. Add only the smallest
   pure helpers/constants needed to:
   - strictly recognize a complete six-digit RGB hex value from native color input/storage;
   - convert that value to the existing channel-triple representation;
   - resolve fixed Colorless or a custom Colorless palette that assigns the exact chosen RGB to
     `accent`, `accentStrong`, and `accentSoft` and leaves `accentContrast` white.
3. Add a separate namespaced browser-storage key for custom Colorless RGB. The selected-profile key
   remains `thejudge.theme.paletteId`; do not combine the two preferences.
4. On load, delete an unsupported selected id (including retired ids) and return Blue. Delete a
   malformed saved custom RGB and return no custom value. Missing storage and thrown reads/removals
   return safe defaults without throwing.
5. Add save/remove functions for the custom value. Failed writes/removals are swallowed so callers
   can retain session-only state.
6. Update `:root` defaults in `index.css` to the approved Blue channels so first paint matches the
   default palette before the hook effect runs.
7. Update existing theme tests that name retired profiles to valid WUBRGC profiles so the full
   frontend suite stays green after the catalog replacement; this is assertion migration only, not
   Colorless UI behavior (Slice B) or new cross-destination reach coverage (Slice D).

## Tests

- `palettes.test.ts`: exact ids/order/names/token values, default, retired absence, strict RGB-hex
  parsing, exact custom Colorless resolution, 4.5:1 contrast at both gradient endpoints, and fixed
  Black-versus-Colorless distinction.
- `themePrefs.test.ts`: round trips, independent keys, retired/unknown deletion, malformed-custom
  deletion, missing storage, thrown reads/writes/removals.
- Existing `applyPalette`, hook, portal, Theme section, App theming, and responsive tests: replace
  obsolete fixture ids/labels with fixed WUBRGC equivalents without adding Slice B behavior.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- palettes themePrefs applyPalette useThemePalette`
      proves exact catalog/default/custom resolution and persistence cleanup behavior.
- [ ] The contrast assertions calculate at least 4.5:1 for `accentContrast` over both `accent` and
      `accentStrong` for all six fixed profiles; the test also proves Black and Colorless values are
      not equal.
- [ ] `npm --workspace apps/frontend run test` passes with no test or product reference expecting a
      retired Violet/Emerald/Amber/Rose selection.
- [ ] `npm --workspace apps/frontend run typecheck` passes with the existing four-token contract and
      no new token role.
- [ ] `rg -n 'id: "(violet|emerald|amber|rose)"' apps/frontend/src/lib/theme/palettes.ts` returns no
      matches, while the exact six approved ids remain in WUBRGC order.

## Verification

```bash
npm --workspace apps/frontend run test -- palettes themePrefs applyPalette useThemePalette
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
! rg -n 'id: "(violet|emerald|amber|rose)"' apps/frontend/src/lib/theme/palettes.ts
git diff --check
```

## Files touched

- `apps/frontend/src/lib/theme/palettes.ts`
- `apps/frontend/src/lib/theme/palettes.test.ts`
- `apps/frontend/src/lib/theme/themePrefs.ts`
- `apps/frontend/src/lib/theme/themePrefs.test.ts`
- `apps/frontend/src/lib/theme/applyPalette.test.ts`
- `apps/frontend/src/hooks/useThemePalette.test.ts`
- `apps/frontend/src/components/portal/ThemeSection.test.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/App.theming.test.tsx`
- `apps/frontend/src/App.responsive-presentation.test.tsx`
- `apps/frontend/src/index.css`
