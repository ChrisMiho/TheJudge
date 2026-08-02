# Compact Theme Picker Design

## Status

Approved in conversation on 2026-08-02. The selected direction is visual companion Option A: one compact row of five circular palette controls.

## Context

`ThemeSection` currently renders every palette as a full-width row containing a color swatch, visible palette name, and active checkmark. Inside the 224-pixel feature Menu, those five rows consume more vertical space than the palette choice requires.

## Design

Render the five entries from `PALETTES` in their existing order as a centered five-column grid. Each grid cell is a circular button whose fill uses `palette.swatch`. Remove the visible palette-name text.

The active palette has both a visible focus-independent selection ring and a checkmark centered inside the circle. Keyboard focus has its own visible focus treatment so focus and selection remain distinguishable. Each button retains:

- the existing `aria-label` pattern (for example, `Theme: Blue`)
- `aria-pressed` for selected state
- a native `title` containing the palette name for pointer hover
- the existing `onSelect(palette.id)` behavior

Each circle uses a 40-by-40-pixel interactive target. A two-pixel gap between five equal columns fits the Menu's current 208-pixel inner width exactly, without widening the Menu or introducing horizontal scrolling.

The Theme section label, Layout divider, and Chunky/Slim segmented buttons remain unchanged.

## Data Flow and Error Handling

No data-flow changes are required. `ThemeSection` continues receiving `paletteId` and `onSelect`; `FeaturePortalMenu` continues closing after a palette selection; `useThemePalette` continues applying and persisting the selected id.

The picker introduces no new error state. Unknown or corrupt persisted palette ids continue using the existing theme-preference fallback outside `ThemeSection`.

## Tests

Update focused `ThemeSection` tests to verify:

- all five accessible palette buttons still render
- palette names are not rendered as visible text
- the controls use one five-column grid and circular presentation
- the active palette exposes `aria-pressed="true"` and a visible selection indicator
- choosing a palette still calls `onSelect` with its id
- Chunky/Slim behavior remains unchanged

Run the existing `ThemeSection`, `FeaturePortalMenu`, and App-level theme tests plus frontend typecheck. The final work-package quality check remains required.

## Scope

Only `ThemeSection` markup/classes and its focused tests change. Palette definitions, ordering, colors, persistence, Menu-close behavior, Layout controls, and public component props remain unchanged.
