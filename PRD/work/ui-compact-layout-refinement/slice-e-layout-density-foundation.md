# Slice E — Layout Density Foundation

## Status: pending

## Goal

Add global **Chunky / Slim** layout density preference to the theme panel, persisted in localStorage and applied via `data-layout-density` on the document root. Extract shared `PageShell` and semantic CSS density classes.

## Requirements

### Preference infrastructure

- `apps/frontend/src/lib/theme/layoutDensity.ts` — `LayoutDensity = "chunky" | "slim"`, default `"chunky"`
- `apps/frontend/src/lib/theme/layoutDensityPrefs.ts` — key `thejudge.theme.layoutDensity`
- `apps/frontend/src/lib/theme/applyLayoutDensity.ts`
- `apps/frontend/src/hooks/useLayoutDensity.ts`
- `layoutDensityPrefs.test.ts`

### Theme panel

- Extend `ThemeControl` with Chunky / Slim segmented control below palette swatches (`w-52` dropdown).
- Wire through `App.tsx` alongside `useThemePalette`.

### Page shell

- Create `PageShell.tsx` (`page-shell` / `page-card` classes).
- Migrate duplicated shell markup from `App.tsx`, `ZoneConfirmStep`, `ZoneCollectionStep`, `EnrichmentStep`.
- Define chunky defaults + `[data-layout-density="slim"]` overrides in `index.css`:

| Class | Chunky | Slim |
| --- | --- | --- |
| `.page-shell` padding-y | `py-6` | `py-3` |
| `.page-card` gap | `gap-4` | `gap-2` |
| `.page-card` padding | `p-4` / `md:p-6` | `p-3` / `md:p-4` |
| `.panel-inner` | `p-4`, `space-y-3` | `p-3`, `space-y-2` |

## Acceptance criteria

- [ ] Default density is chunky; `data-layout-density` not set or `"chunky"` matches pre-change spacing on a reference screen.
- [ ] Slim sets `data-layout-density="slim"` on `document.documentElement`.
- [ ] Preference survives page reload; corrupt storage falls back to chunky.
- [ ] Toggling density does not reset game setup, zones, cards, or conversation state (mirror existing theme tests).
- [ ] `ThemeControl.test.tsx` covers density toggle.

## Dependencies

- `parallel-ready`: DEC-066 (theme panel pattern), NFR-011

## Files touched

- `apps/frontend/src/lib/theme/layoutDensity*.ts`
- `apps/frontend/src/hooks/useLayoutDensity.ts`
- `apps/frontend/src/components/ThemeControl.tsx`
- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/index.css`
- Tests: `layoutDensityPrefs.test.ts`, `ThemeControl.test.tsx`, `App.test.tsx`

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/theme/layoutDensityPrefs.test.ts
npm --workspace apps/frontend run test -- src/components/ThemeControl.test.tsx
npm --workspace apps/frontend run test -- src/App.test.tsx
npm --workspace apps/frontend run typecheck
```
