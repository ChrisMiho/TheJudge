# GAMEPLAN — center-menu-tab-prominence

Presentation-only discoverability pass for the feature-portal Menu trigger: modest automatic CSS widen on small viewports, ~25% widen from `768px` up, thicker accent border, and medium accent glow — without changing docking, icon-only labeling, dropdown behavior, or DEC-117's automatic responsive rules.

Source of truth: `DESIGN-BRIEF.md`, DEC-121, REQ-101, plus DEC-109 / REQ-067 / REQ-089 (placement/docking/registry unchanged) and DEC-117 / REQ-096 (no user layout preference).

## Architecture

One shared trigger; styles only:

1. **Prominence presentation (Slice A)** — Keep the existing single Menu `<button>` in `FeaturePortalMenu.tsx`. Replace the quiet `border border-t-0 border-accent/55 … px-4` treatment with a dedicated CSS class (preferred: `.portal-menu-trigger` or equivalent in `index.css`) that owns:
   - mobile-first horizontal padding ≈ `1.1–1.15rem` (~10–15% over pre-change `1rem` / `px-4`)
   - `@media (min-width: 768px)` horizontal padding ≈ `1.25rem` (~25% over baseline)
   - thicker accent border than the pre-change `1px` / `border-accent/55` edge (still `border-t-0` so flush docking reads correctly)
   - medium CSS-only accent ring and/or `box-shadow` glow on every viewport (clearly primary chrome; not subtle-only; not strong bloom)
   - `prefers-reduced-motion`: no new decorative motion required; static border/glow may remain. If the glow uses a transition/animation, include it in the existing reduced-motion block the same way `.portal-menu-motion` / ambient accents do.
2. **Assertions and ship closure (Slice B)** — Stylesheet and/or component assertions lock width rules, thicker border, and medium glow; existing docking / open-select / reduced-motion portal tests stay green; carry cleanup handoff.

`.portal-slot-tab` flush lift against `.page-card` stays untouched in behavior. Prefer tokens (`rgb(var(--accent) / …)`, `--accent-soft`, `--accent-strong`) over hard-coded palette RGB. No second component tree, UA sniffing, JS breakpoints, Theme Layout control, or animation library.

## Data flow

Unchanged. Destination switching, action entries, Theme palette section, and `sessionStorage` active-destination persistence keep their existing paths. This package only changes how the trigger looks.

## Interfaces / contracts

No public contract change. No new props on `FeaturePortalMenu`. No backend, Zod, prompt, scan, or destination-registry edits.

Suggested CSS surface (normative intent; exact class name chosen in Slice A):

```css
.portal-menu-trigger {
  /* thicker accent border; medium glow; padding ≈ 1.1–1.15rem */
}
@media (min-width: 768px) {
  .portal-menu-trigger {
    /* padding ≈ 1.25rem */
  }
}
```

Touch target stays ≥44px (`h-11` / NFR-001). Accessible name stays `aria-label="Switch feature"`; trigger remains icon-only (☰).

## Dependency order

| Slice | Depends on | Why sequential |
| --- | --- | --- |
| A | — | Owns the class/token choices on the shared trigger + CSS |
| B | A | Assertions must target the selectors/values Slice A ships |

Not parallel-ready: both slices would edit the same trigger class and test expectations.

## Verification checklist

- [ ] Below `768px`, trigger horizontal padding ≈ 10–15% above `1rem`
- [ ] At/above `768px`, trigger horizontal padding ≈ 25% above `1rem`
- [ ] Accent border thicker than pre-change single `border` / `border-accent/55` on every viewport
- [ ] Medium accent glow present on every viewport (CSS-only)
- [ ] Under `prefers-reduced-motion: reduce`, no new decorative motion; static emphasis OK
- [ ] Icon-only + `aria-label="Switch feature"`; `.portal-slot-tab` docking still flush; dropdown open/select/close unchanged
- [ ] No Desktop/Mobile / density / layout preference control
- [ ] Automated/stylesheet assertions cover width, border, glow; existing portal tests pass
- [ ] `npm --workspace apps/frontend run test` and `npm run quality:check` green for touched areas

## Non-goals (do not implement)

- Relocating Menu; restoring a visible "Menu" label; redesigning dropdown/registry
- User-facing Desktop/Mobile or density control; separate mobile/desktop component trees
- Backend, contract, prompt, scan, or destination-behavior changes
- Strong bloom / animation library
