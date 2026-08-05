# Slice A — Corner rail hit area bounded to painted affordance

## Status: planned

## Goal

Stop the feature-portal corner rail from intercepting taps on destination content, without moving
any destination content and without changing the single-zone rail's appearance.

## Requirements

1. **Single-zone rail** (`.portal-menu-rail`, used where there is no History zone): the interactive
   element's box becomes `5.5rem` wide × `3.5rem` tall. The radial gradient continues to paint at
   the current `5.5rem × 10.5rem` extent from a layer that does not accept pointer events.
2. The single-zone rail's rendered output is otherwise unchanged: gradient stops, hover and
   `aria-expanded` states, top-left radius, and — critically — **the icon's rendered position**.
   The icon is centered in `5.5rem` today; do not narrow the interactive box's width, which would
   re-center it 16px to the left.
3. **Split rail** (`.portal-menu-rail-split`): the Menu and History zones move from stacked to
   **side-by-side** within the rail's `5.5rem` width — each zone `2.75rem × 2.75rem`, Menu leading
   (left), History trailing (right). The rail occupies one `2.75rem`-tall band.
4. The split rail's `clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem)` height is retired; the
   `.portal-menu-rail-zone + .portal-menu-rail-zone` separator becomes a vertical rule between
   side-by-side zones instead of a horizontal one between stacked zones.
5. No destination's content is inset, repositioned, or resized.

## Why the obvious fix is wrong

A width-only narrowing was the first proposal and does **not** work. Measured against the real
Life Tracker card at 430 × 900:

| Geometry | Overlap with "Decrease life for Player 1" |
| --- | --- |
| Today `88 × 168` | 8,325px² |
| Width-only `56 × 168` | 4,773px² ❌ still broken |
| Height-capped `88 × 56` | **0px²** ✓ |

The life control begins at `y=57`, so **height** is the dimension that matters; width is free.

Likewise, keeping the zones stacked is impossible: only **70px** exists between the split rail's
top (`y=45`) and the eyebrow (`y=115`), while two stacked zones at NFR-001's 44px floor need
**88px**. Side-by-side clears by 26px.

## Acceptance criteria

- [ ] On Life Tracker, `document.elementFromPoint` over the former overlap region returns the
      player card's life control, not `Switch feature` — asserted at **multiple** points spanning
      the former `75 × 111` region, not one sample
- [ ] The measured intersection between the single-zone rail's interactive box and the
      "Decrease life for Player 1" control is **exactly zero**
- [ ] On a History-bearing destination, `elementFromPoint` over the step-name eyebrow's leading
      characters returns the eyebrow's own content, and the rail's interactive box ends above the
      eyebrow's top edge
- [ ] The split rail renders Menu and History side-by-side, Menu leading, each ≥ `2.75rem` square
- [ ] The single-zone rail's interactive box is ≥ 44px in both dimensions
- [ ] The single-zone rail's icon renders at the same position as before the change
- [ ] The gradient still paints at `5.5rem × 10.5rem` and does not accept pointer events
- [ ] No destination content moved

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu
npm --workspace apps/frontend run test -- App.responsive-presentation
npm --workspace apps/frontend run test -- App.mtg-color-themes
npm run quality:check
```

Hit-testing is required. A screenshot does not satisfy this slice — the defect is invisible by
construction, so visual inspection cannot detect its return. Assert geometry via
`getBoundingClientRect` intersection and/or `document.elementFromPoint`.

## Files touched

- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/App.responsive-presentation.test.tsx`
- `apps/frontend/src/App.mtg-color-themes.test.tsx`

## Notes

Existing suites assert `.portal-menu-rail` / `.portal-menu-rail-zone` class presence and read the
`.portal-menu-rail {` CSS block directly; they will need updating for the new geometry. Preserve
their intent (the trigger keeps its class and role) rather than deleting the assertions.
