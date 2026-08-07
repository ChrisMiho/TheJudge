# Slice F — In-flow rail footprint and answered-workspace spacing

## Status: planned

## Goal

Give the feature-portal corner rail real layout participation so the answered
workspace no longer needs a compensating gap above View Context.

## Requirements

1. Refactor the `PortalSlot` / rail host so the 44px interactive corner band has
   a real in-flow footprint while retaining the approved top-left placement,
   glow, split Menu/History form, drawer portal target, and hit-area bounds.
2. Delete `.adaptive-context-trigger`'s compensating
   `margin-top: calc(2.75rem - var(--layout-panel-padding))`; do not tune or
   replace it with another one-off clearance constant.
3. Let normal `--layout-surface-gap` / `.conversation-workspace` tokens own the
   spacing between header/rail, View Context, and conversation.
4. Preserve Menu/History interaction, drawer clipping/placement, destination
   keep-alive compatibility, and the answered workspace's existing content,
   composer, retry, and scroll behavior.
5. Before implementation, integrate the active
   `frontend-routing-and-code-splitting` package or confirm its portal/App work is
   no longer running; re-resolve tests against its routed/lazy shell.
6. Add focused DOM/CSS regression tests before the layout change.

## Acceptance criteria

- [ ] Tests prove the slot/rail host participates in layout with at least the 44px interactive-band height and the `.adaptive-context-trigger` rule has no compensating top margin
- [ ] Tests prove Menu-only and Menu+History rail forms preserve their controls, accessible names, hit-area floors, inert-open state, portal target, and outside-dismiss behavior
- [ ] At 390×844 and 1440×900, open answered Quick Question and answered In-Depth with a Menu+History rail; record rail host/trigger rectangles and confirm View Context neither overlaps nor sits beneath either rail zone
- [ ] At both viewports, record heading-to-View-Context distance before/after; the 32px compensating margin is gone and remaining spacing equals shared layout tokens
- [ ] Repeat at both viewports on a Menu-only destination/header state and confirm the corner placement/glow remains unchanged and destination content is not intercepted
- [ ] At 390×844, record answered Quick Question `document.scrollHeight` before/after and confirm the change does not deepen its existing document scroll; at 1440×900 no new document scroll appears
- [ ] Menu tray, History drawer, Back/Forward routing (when the routing package is integrated), and destination state preservation still work
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- AdaptiveContextDialog FeaturePortalMenu PortalSlot ConversationWorkspace App.answered-state App.conversation-header
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/PortalSlot.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/ConversationWorkspace.tsx` only if semantic structure is needed for the in-flow slot
- Focused tests beside those components and answered-state App tests
- `apps/frontend/src/index.css`
