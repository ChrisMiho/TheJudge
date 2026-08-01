# Slice A — Theme-in-Menu consolidation + icon-only trigger

## Status: planned

## Goal

Retire `ThemeControl`'s standalone `fixed right-3 top-3` corner control, fold its palette-swatch
grid and Chunky/Slim density toggle into `FeaturePortalMenu`'s dropdown as a **Theme** section, and
drop the Menu trigger's visible "Menu" text label — per DEC-110 (Theme-in-Menu) and the icon-only
clause of DEC-109.

## Requirements

1. `apps/frontend/src/components/portal/ThemeSection.tsx` (new) — extract `ThemeControl`'s dropdown
   *body* only (palette swatch grid + "Layout" label + Chunky/Slim segmented control), as a
   presentational component: `{ paletteId, onSelect, density, onDensityChange }`. Preserve existing
   markup, classes, and `aria-label`s exactly (`Theme: <name>`, `aria-pressed`, `Layout: <name>`) —
   this is a relocation, not a redesign (DEC-110: "interaction details ... are preserved, not
   redesigned").
2. `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`:
   - accept four new props: `paletteId: string`, `onPaletteSelect: (id: string) => void`,
     `density: LayoutDensity`, `onDensityChange: (density: LayoutDensity) => void`
   - render `<ThemeSection ... />` inside the open dropdown, below the destination list, separated
     by the same divider treatment already used for the existing "Layout" sub-section in
     `ThemeControl` (border-top + spacing)
   - selecting a destination or a Theme option both close the menu, matching existing per-control
     close behavior (destinations already close on select; `ThemeSection`'s palette/density buttons
     should close the menu the same way `ThemeControl` did — call the existing `handleSelect`-style
     close after invoking `onPaletteSelect`/`onDensityChange`)
   - trigger button: remove the `<span>Menu</span>` text node; keep the `☰` glyph and the existing
     `aria-label="Switch feature"`, `aria-haspopup`, `aria-expanded`
3. `apps/frontend/src/App.tsx`:
   - remove the `<div className="fixed right-3 top-3 z-30"><ThemeControl .../></div>` block and its
     `ThemeControl` import
   - pass `paletteId`, `onPaletteSelect={setPalette}`, `density`, `onDensityChange={setDensity}` to
     `<FeaturePortalMenu>` (the existing `useThemePalette()`/`useLayoutDensity()` hook calls and
     their return values are unchanged — only the destination of the setters changes)
4. Delete `apps/frontend/src/components/ThemeControl.tsx` and
   `apps/frontend/src/components/ThemeControl.test.tsx` — no consumer remains after step 3.
5. `apps/frontend/src/components/portal/ThemeSection.test.tsx` (new) — port `ThemeControl.test.tsx`'s
   assertions (renders one swatch per palette, indicates active palette/density, calls
   `onSelect`/`onDensityChange` with the right id, selecting the current palette doesn't throw) onto
   `ThemeSection` rendered standalone (no trigger button, so no "open the dropdown" click step).
6. `apps/frontend/src/index.css` — re-key the `.mock-mode-banner` z-index comment (currently
   `/* below ThemeControl's z-30 so it stays on top and clickable */`) to reference the Menu's
   `z-30` instead. No value change (`z-index: 20` stays as-is — Menu's fixed fallback and inline
   trigger context are already the relevant `z-30` layer above it).
7. `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx` — update the existing
   `"Slice B: portal chrome integration"` test that queries
   `screen.getByRole("button", { name: "Theme" })` and asserts
   `.closest("div")?.parentElement?.className` contains `"right-3"`. That assertion targeted the old
   standalone `ThemeControl` trigger, which no longer exists. Replace it with an assertion that
   opening the Menu on the MTG Assistant screen shows both a destination (`role="menuitem"`) and a
   Theme section (e.g. `screen.getByRole("button", { name: /^Theme: /, hidden: false })` after
   opening), and add/keep a case confirming the trigger button has no accessible "Menu" text (its
   accessible name still resolves via `aria-label`, but `screen.queryByText("Menu")` inside the
   trigger should be absent).

## Acceptance criteria

- [ ] No `fixed right-3 top-3` element remains in `App.tsx` or anywhere in `apps/frontend/src`
- [ ] Opening `FeaturePortalMenu` shows the destination list, a divider, then a Theme section
      (palette swatches + Chunky/Slim toggle)
- [ ] Selecting a palette swatch calls `onPaletteSelect` with the chosen id and applies/persists via
      the existing `useThemePalette` hook (browser-local storage key unchanged)
- [ ] Selecting a density option calls `onDensityChange` and applies/persists via the existing
      `useLayoutDensity` hook (unchanged)
- [ ] Menu trigger shows only the `☰` glyph — no visible "Menu" text — with
      `aria-label="Switch feature"` unchanged
- [ ] `ThemeControl.tsx` and `ThemeControl.test.tsx` no longer exist; `grep -r "ThemeControl"
      apps/frontend/src` returns no matches
- [ ] `.mock-mode-banner`'s z-index comment in `index.css` references the Menu, not `ThemeControl`
- [ ] `npm --workspace apps/frontend run test -- ThemeSection FeaturePortalMenu App` passes
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test -- ThemeSection FeaturePortalMenu App
npm --workspace apps/frontend run typecheck
grep -r "ThemeControl" apps/frontend/src
```

## Files touched

- `apps/frontend/src/components/portal/ThemeSection.tsx` (new)
- `apps/frontend/src/components/portal/ThemeSection.test.tsx` (new)
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/ThemeControl.tsx` (deleted)
- `apps/frontend/src/components/ThemeControl.test.tsx` (deleted)
- `apps/frontend/src/index.css`
