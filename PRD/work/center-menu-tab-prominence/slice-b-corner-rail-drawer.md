# Slice B — Corner-rail trigger and sliding drawer

## Status: planned

## Goal

Rebuild the Menu trigger as a top-left radial-gradient corner rail that opens
a partial-height drawer sliding in horizontally from the left edge, replacing
today's top-middle pill button and dropdown box.

## Requirements

1. `FeaturePortalMenu.tsx` trigger markup: no visible button/pill rendered on
   top of a rail — the trigger *is* the radial-gradient glow area. Radial
   gradient anchored at the rail's own top-left corner (`0% 0%`), decreasing
   alpha stops, fully transparent well inside its own bounding box, `border: none`.
   Same click target, `aria-label="Switch feature"`, `aria-haspopup="true"`,
   `aria-expanded` semantics as today — only the visual treatment and DOM
   structure of the clickable area change, not its accessible name or role.
2. Hover/expanded states darken the same gradient rather than adding a border
   or separate chrome layer.
3. Open state renders a **partial-height drawer**, not a dropdown box: closed
   state `transform: translateX(-100%)`, open state `translateX(0)`,
   transitioning on `transform` only (not `max-height`), so it visibly
   originates from the left edge. Keep existing outside-click and Escape-key
   close behavior unchanged.
4. Rail and drawer stay docked inline per-screen via the existing
   `PortalSlot`/`registerSlot`/`visibleSlotNode` mechanism — do not change
   that mechanism, only the DOM/classes rendered inside the trigger and the
   open-state panel. The `fixed` fallback (headerless destinations) keeps its
   defensive role per DEC-109, repositioned to the top-left corner (fixed
   `top-0 left-0`, no `-translate-x-1/2` centering) instead of top-middle.
5. `index.css`: add rail/drawer classes (radial-gradient rail treatment,
   drawer transform transition); retire `.portal-slot-tab`'s top-middle-flush
   assumptions in favor of the corner-rail equivalent, keeping the same
   flush-to-`.page-card`-border technique (negative margin) if still needed
   for the new left-anchored geometry. Cover the drawer's slide transition in
   the existing `@media (prefers-reduced-motion: reduce)` block (mirrors
   `.portal-menu-motion`'s existing entry) so it snaps instead of animating.
6. `PortalSlot.tsx`: update its doc comment's references to the header's
   previous top-middle placement if they no longer describe the rail's
   top-left position; no logic change expected.
7. Rewrite `FeaturePortalMenu.test.tsx` assertions that hard-code top-middle
   geometry (`left-1/2`, `-translate-x-1/2`, `top-0`, "is positioned
   top-middle, distinct from right-corner chrome") to assert top-left corner
   geometry instead. Keep every behavioral assertion (open/close, menuitems,
   Theme section, action entries, outside-click, Escape) intact — those are
   unchanged by this slice.

## Acceptance criteria

- [ ] Rail renders with no border and no separate button-shaped element layered on the glow.
- [ ] Trigger keeps `aria-label="Switch feature"`, `aria-haspopup="true"`, and toggling `aria-expanded`.
- [ ] Opening the trigger renders a drawer whose closed/open states are driven by `transform: translateX`, not by a dropdown-style absolute box.
- [ ] Drawer transition is covered in the `prefers-reduced-motion: reduce` block.
- [ ] Headerless-destination fallback renders fixed at the top-left corner, not centered top-middle.
- [ ] All existing behavioral tests (menu contents, Theme section, action entries, outside-click, Escape, chrome-integration tests in `App`) still pass with updated geometry assertions.

## Verification

```bash
cd apps/frontend && npx vitest run src/components/portal/FeaturePortalMenu.test.tsx
cd apps/frontend && npm run quality:check
```

Manual check (dev server, `npm run dev` in `apps/frontend`): load each
destination, confirm the rail is discoverable at the top-left with no visible
border/box, confirm the drawer visibly slides in from the left, confirm the
brand block (from slice A) reads centered against the now-lighter opposite
corner.

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/portal/PortalSlot.tsx`
- `apps/frontend/src/index.css`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/center-menu-tab-prominence/` ready to delete
