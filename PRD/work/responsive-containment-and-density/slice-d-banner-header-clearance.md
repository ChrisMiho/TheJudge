# Slice D — Banner clears every destination header

## Status: planned

## Goal

Make DEC-085's guarantee — page content offset so the fixed mock-mode banner never
obscures the header — hold on every destination, including full-bleed ones (REQ-123).

## Requirements

1. The shell offset must track the banner's **rendered** height rather than a
   hardcoded value. `index.css` currently applies
   `.page-shell[data-mock-banner="true"] { padding-top: calc(... + 2rem) }` = 32px,
   while the banner wraps to two lines at narrow widths and measures 56px.
2. The guarantee must cover full-bleed destinations (Life Tracker, Trade Balancer),
   not only destinations on the standard `PageShell` path.
3. Exactly one banner element is mounted at a time.
4. Non-mock builds render no banner and no offset — unchanged.

## Acceptance criteria

- [ ] In mock mode, no header control on any destination intersects the banner's
      painted bounds at 390×844 or 1440×900 (baseline defect: Life Tracker
      "Switch feature" covered 24px, brand `h1` 9px, "Open game setup" 12px;
      Trade Balancer "Switch feature" 11px)
- [ ] Verified on all four destinations: Quick Question, In-Depth Question,
      Life Tracker, Trade Balancer
- [ ] `document.querySelectorAll('.mock-mode-banner')` returns exactly one element
      (baseline defect: three nodes mounted simultaneously)
- [ ] A non-mock build renders no banner and applies no offset —
      existing `MockModeBanner.test.tsx` non-mock case still passes
- [ ] Banner copy, non-dismissibility, and the build-time `ASK_AI_PROVIDER`
      resolution path are unchanged

## Verification

```bash
npm --workspace apps/frontend run test -- MockModeBanner PageShell
npm run quality:check
```

Playwright MCP at both viewports: for each destination, `browser_evaluate`
intersecting every header control's rect against the banner's rect, and count
`.mock-mode-banner` nodes.

## Files touched

- `apps/frontend/src/index.css` (`.mock-mode-banner`, `data-mock-banner` offset)
- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/components/MockModeBanner.test.tsx`

## Dependencies

- Slice C — both slices edit shell/tray rules in `apps/frontend/src/index.css`;
  sequencing avoids a file-level conflict.
