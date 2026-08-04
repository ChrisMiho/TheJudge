# Slice A — Menu trigger prominence presentation

## Status: done

## Goal

Apply responsive width, thicker accent border, and medium accent glow to the existing feature-portal Menu trigger via CSS-only presentation on the single component tree.

## Requirements

1. Keep one Menu trigger in `FeaturePortalMenu.tsx`; do not add a second tree, UA sniffing, JS device profile, or Theme/layout preference.
2. Introduce a dedicated CSS class (e.g. `.portal-menu-trigger`) in `apps/frontend/src/index.css` (or equivalent shared token approach) that owns prominence styles; wire it onto the trigger button. Prefer accent CSS variables over hard-coded RGB.
3. Horizontal padding (or equivalent width treatment) ≈ 10–15% larger than the pre-change `1rem` (`px-4`) baseline below `768px` (target band roughly `1.1–1.15rem`).
4. At and above the `768px` structural breakpoint, that padding ≈ 25% larger than the same baseline (target ≈ `1.25rem`), via mobile-first `@media (min-width: 768px)` only.
5. Accent border thicker than the pre-change single `border` / `border-accent/55` treatment on every viewport; keep `border-t-0` (or equivalent) so flush docking against `.page-card` still reads correctly.
6. Medium accent ring and/or `box-shadow` glow on every viewport — clearly visible primary-chrome emphasis, not subtle-only and not strong bloom. CSS-only; no animation library.
7. Honor `prefers-reduced-motion`: no new decorative motion required; static border/glow may remain. If the treatment adds animated/transitioned glow, include the selector in the existing reduced-motion block.
8. Preserve icon-only glyph, `aria-label="Switch feature"`, `aria-haspopup` / `aria-expanded`, open/close/select behavior, and `.portal-slot-tab` flush lift. Touch target stays ≥44px (`h-11` or equivalent).

## Acceptance criteria

- [ ] Trigger uses the new prominence class/styles; quiet `px-4` + thin `border-accent/55` treatment is gone from the Menu button.
- [ ] Stylesheet defines mobile-first padding in the ~10–15% band and a `min-width: 768px` rule in the ~25% band vs `1rem` baseline.
- [ ] Border weight is visibly thicker than pre-change `1px` accent border on the trigger.
- [ ] Medium accent glow (ring and/or box-shadow) is present without an animation library.
- [ ] Manual check in a narrow viewport (<768) and a wide viewport (≥768): tab is wider at desktop, border + glow present on both, header stays uncluttered on mobile, flush docking still meets `.page-card`.
- [ ] Manual check with `prefers-reduced-motion: reduce`: no new decorative motion; static emphasis remains acceptable.
- [ ] Dropdown still opens/closes and switches destinations; trigger remains icon-only with `aria-label="Switch feature"`.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/portal/FeaturePortalMenu.test.tsx
npm --workspace apps/frontend run typecheck
```

Manual: load the app, inspect Menu tab below and above `768px`, and with OS/browser reduced-motion enabled.

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css`
