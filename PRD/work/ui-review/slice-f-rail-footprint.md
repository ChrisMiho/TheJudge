# Slice F — In-flow rail footprint and answered-workspace spacing

## Status: done

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

- [x] Tests prove the slot/rail host participates in layout with at least the 44px interactive-band height and the `.adaptive-context-trigger` rule has no compensating top margin
- [x] Tests prove Menu-only and Menu+History rail forms preserve their controls, accessible names, hit-area floors, inert-open state, portal target, and outside-dismiss behavior
- [x] At 390×844 and 1440×900, open answered Quick Question and answered In-Depth with a Menu+History rail; record rail host/trigger rectangles and confirm View Context neither overlaps nor sits beneath either rail zone
- [x] At both viewports, record heading-to-View-Context distance before/after; the 32px compensating margin is gone and remaining spacing equals shared layout tokens
- [x] Repeat at both viewports on a Menu-only destination/header state and confirm the corner placement/glow remains unchanged and destination content is not intercepted
- [x] At 390×844, record answered Quick Question `document.scrollHeight` before/after and confirm the change does not deepen its existing document scroll; at 1440×900 no new document scroll appears
- [x] Menu tray, History drawer, Back/Forward routing (when the routing package is integrated), and destination state preservation still work
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260811-1`), autonomous base `origin/main` @ `467cd42`.
- Servers started by this agent (not attached): backend `PORT=3111`, frontend
  `FRONTEND_PORT=5183`, via `npm run dev:mock`. Playwright MCP
  (`plugin-playwright-playwright`) drove the browser.
- Requirement 5 was already satisfied: `frontend-routing-and-code-splitting`
  merged into `main` before this run started, so every measurement below is
  against the routed/lazy shell.

### What changed

`.portal-menu-rail` moves from `position: absolute; left: 0; top: 0` to
`position: relative`. `relative` (not `static`) keeps it the containing block for
its decorative `::before` glow and keeps `z-index: 3` meaningful. Because
`.portal-slot-tab` has no padding, an absolutely-positioned box at `left/top: 0`
and an in-flow first child resolve to the same origin — measured rail rectangles
are byte-identical before and after (`17,69,88,44` at 390×844). The corner lift
stays on `.portal-slot-tab`, so the flush top-left placement is untouched.

`.adaptive-context-trigger` loses `margin-top: calc(2.75rem - var(--layout-panel-padding))`
and keeps only its `min-height: 44px` touch-target floor. No replacement constant
was introduced; `--layout-surface-gap` now owns the spacing.

### Live measurements — answered In-Depth (Menu + History rail)

| Measurement | 390×844 before | 390×844 after | 1440×900 before | 1440×900 after |
| --- | --- | --- | --- | --- |
| `.portal-slot-tab` computed height | 0px | 44px | 0px | 44px |
| Rail rect | 17,69 88×44 | 17,69 88×44 | 337,62 88×44 | 337,62 88×44 |
| Rail zones | — | 44×44, 44×44 | — | 44×44, 44×44 |
| View Context `margin-top` | 32px | 0px | 20px | 0px |
| View Context top | 157 | 125 | 158 | 138 |
| Header bottom → View Context top | 40px | 8px (`--layout-surface-gap` floor) | 36px | 16px (`--layout-surface-gap`) |
| Rail bottom → View Context top | 44px | 12px | 52px | 32px |
| Rail overlaps View Context | no | no | no | no |
| `document.scrollHeight` | 957 | 925 | 1045 | 1025 |

### Live measurements — answered Quick Question

390×844: `document.scrollHeight` 896 before and 896 after — the change does not
deepen the existing document scroll. Rail 17,69 88×44 with a 44px slot footprint;
workspace top unchanged at 170. No horizontal scroll. 1440×900 introduced no new
document scroll (the desktop page's scroll height fell from 1045 to 1025).

### Menu-only rail form (Life Tracker, 390×844)

Rail `position: relative`, `z-index: 3`, rect 0,56 88×56, glow `::before` still
88×168px (5.5rem × 10.5rem) with `pointer-events: none`. `elementFromPoint` 20px
below the interactive band returns "Decrease life for Player 1", so destination
content is still not intercepted (REQ-114's hit-tested compliance holds).

### Interaction regression (live)

Menu tray opens with all four destination entries and the rail goes
`portal-menu-rail-inert`; Escape closes it. History drawer opens as a left-edge
full-height surface (343×844 at 390×844) and Escape closes it. Menu → Trade
Balancer navigates to `/trade-balancer`; browser Back returns to `/quick-lookup`
with the answered conversation still mounted and the rail rect unchanged.

Captures: `PRD/work/ui-review/.playwright-mcp/slice-f-390x844-answered-rail.png`.

### Runtime cleanup

`browser_close` called after the last interaction. Owned servers stopped by
signalling the exact owning `node scripts/dev.mjs` manager PID; `lsof` then
reported no listener on `5183` or `3111` and no surviving manager process.

## Verification

```bash
npm --workspace apps/frontend run test -- AdaptiveContextDialog FeaturePortalMenu PortalSlot ConversationWorkspace App.answered-state App.conversation-header
npm run quality:check
```

## Files touched

- `apps/frontend/src/index.css`
- `apps/frontend/src/components/AdaptiveContextDialog.test.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`

`PortalSlot.tsx` and `FeaturePortalMenu.tsx` needed no change: the slot already
hosts the rail in the header's left grid column, and the footprint follows from
the rail's own positioning.
