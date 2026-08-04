# DESIGN-BRIEF: center-menu-tab-prominence

Status: approved (user explicit approval 2026-08-03).

## Problem

The feature-portal Menu tab (top-middle, icon-only ☰) is easy to miss: some users never notice it. The tab is a bit narrow and its edge treatment is too quiet relative to its role as the suite’s only app-chrome navigation affordance.

## Outcome

Make the Menu tab more discoverable with presentation-only changes:

1. **Responsive width (automatic CSS, DEC-117)** — modest widen on small viewports (~10–15% vs current horizontal padding baseline); ~25% wider from the `768px` structural breakpoint up. No user Desktop/Mobile toggle.
2. **Stronger border** — thicker accent border on the tab edge on every viewport.
3. **Medium glow** — clearly visible accent ring/shadow so the tab reads as primary chrome at a glance; CSS-only; honor `prefers-reduced-motion` (static emphasis may remain; no new decorative motion required).

## Confirmed choices

| Question | Choice |
| --- | --- |
| Desktop vs mobile sizing | **1A** — CSS breakpoints / fluid rules only; no Theme or layout preference |
| Glow intensity | **Medium** |

## Product truth

| ID | Role |
| --- | --- |
| DEC-121 | Confirmed presentation decision (amends DEC-109 visual treatment only) |
| REQ-101 | Measurable acceptance criteria |
| DEC-109 / REQ-067 / REQ-089 | Placement, docking, icon-only trigger, registry — unchanged |
| DEC-117 / REQ-096 | Automatic responsive presentation — must stay intact |

No new FLOW — navigation interaction is unchanged (open/close/select).

## Implementation pointers (non-normative)

- Trigger classes live on the Menu button in `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (today: `h-11` … `border border-t-0 border-accent/55` … `px-4`).
- Flush docking via `.portal-slot-tab` in `apps/frontend/src/index.css` stays; prominence styles should not break card-flush lift.
- Prefer shared Tailwind/CSS tokens over a second component tree.

## Non-goals

- Full nav / tab-bar redesign; relocating Menu; dropdown content/registry changes
- User-facing Desktop/Mobile or density control (forbidden by DEC-117)
- Separate mobile/desktop component trees, UA sniffing, or JS device profiles
- Backend, contract, prompt, scan, or destination-behavior changes
- Strong bloom/animation library; glow must stay CSS-only and reduced-motion aware

## Success check

A first-time user scanning the header can notice the Menu tab without hunting; mobile stays uncluttered; desktop tab is clearly larger; border + medium glow are present on both.
