# GAMEPLAN: feature-portal

Implementation architecture for the first-class feature portal (DEC-095, refines DEC-089). Chrome-only, frontend-only, contract-frozen: no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any backend route.

## What ships

A top-middle header **portal button** that opens a dropdown of **registered destinations**, backed by an **extensible destination registry** and a **state-preserving, frontend-only view switch**. v1 registers two destinations: **MTG Assistant** (the existing staged flow / start screen, unchanged) and **Trade Balancer** (a placeholder mount that `card-trade-balancer` later swaps for its real view via a one-line registry change). `ThemeControl` keeps `fixed right-3 top-3` (DEC-066, unchanged).

## Architecture

Today `App.tsx` owns both the MTG Assistant staged-flow state **and** the app-level chrome (`ThemeControl`). The portal splits these:

```
App.tsx  (app shell — owns portal nav state + app chrome)
├── FeaturePortalMenu           top-middle button + dropdown          (Slice B)
├── ThemeControl (fixed right-3 top-3, unchanged)                     (existing)
└── DestinationOutlet           mounts + shows active destination     (Slice A)
    ├── MtgAssistantApp          extracted from today's App body       (Slice A)
    └── TradeBalancerPlaceholder swapped by card-trade-balancer later  (Slice A)
```

### Destination registry (Slice A)

```ts
// src/lib/portal/types.ts
export type DestinationId = string;
export interface PortalDestination {
  id: DestinationId;
  label: string;
  render: () => ReactNode; // current-view mount
}
```

```tsx
// src/components/portal/destinationRegistry.tsx
export const PORTAL_DESTINATIONS: PortalDestination[] = [
  { id: "mtg-assistant", label: "MTG Assistant", render: () => <MtgAssistantApp /> },
  { id: "trade-balancer", label: "Trade Balancer", render: () => <TradeBalancerPlaceholder /> }
];
```

Adding a destination = appending one entry (no portal redesign). `card-trade-balancer` swaps the `trade-balancer` entry's `render` for its real `<TradeBalancer />`; `card-lookup-qa` / `rules-lookup` append their own entries when they ship.

### State-preserving view switch (Slice A)

The core constraint (REQ-067 / FLOW-010): switching destinations **preserves each mode's in-session state while the app stays loaded**; nothing persists across a page reload. Realized with **lazy-mount-on-first-activation + keep-mounted + hide-inactive**:

- `App` holds `activeDestinationId` (default = first registered = `mtg-assistant`) and the set of **ever-activated** ids.
- `DestinationOutlet` renders every ever-activated destination; the active one is visible, inactive ones get the `hidden` attribute (`display:none`) so their React subtree — and all in-session state — persists.
- A destination is not mounted until first activated, so **app startup is unchanged** (only `mtg-assistant` mounts at load) and lazy per-destination init (e.g. the balancer's price artifact) fires on first open, not at boot.
- Selecting the current destination is a **no-op** (same id → no state change, no remount).

This is the registry-driven realization of the `appMode` mount/visibility approach the retired `card-trade-balancer` Slice B sketched.

### Portal chrome (Slice B)

`FeaturePortalMenu` renders a compact centered button (`fixed left-1/2 top-3 -translate-x-1/2 z-30`) and, when open, a dropdown listing `PORTAL_DESTINATIONS` with the current mode indicated (`aria-current` + check). Three non-overlapping header regions (DEC-065 precedent): brand block (left, in the page-card header), portal button (center, fixed), `ThemeControl` (right, `fixed right-3 top-3`). Open/close motion is CSS-only and reduced-motion-aware, reusing the existing motion tokens / `prefers-reduced-motion` block in `index.css`. Matches `ThemeControl`'s z-index/offset treatment relative to the mock-mode banner (DEC-085) so the fixed button is never obscured.

## Data flow

Chrome only — no request/response path touched. The switch changes which mounted subtree is visible; submitted game context, prompt text, and AI responses are identical to today whether or not the portal exists.

## Reuse (before creating)

- `ThemeControl.tsx` / its dropdown + `PageShell.tsx` as the sibling-chrome pattern (button + absolutely-positioned menu, `aria-expanded`, 44px touch target, click-to-toggle).
- Motion tokens + `@media (prefers-reduced-motion: reduce)` block already in `index.css` (`motion-hover`, `motion-press`, `motion-focus`, `motion-enter`).
- Existing `App.*.test.tsx` suite: after MtgAssistantApp extraction these render `<App />` with `mtg-assistant` active by default and must stay green — they are the regression proof that the MTG Assistant flow is unchanged.

## Sequencing

Two sequential slices. **Blocker:** Slice B renders the registry from Slice A and calls Slice A's `setActiveDestination`; the button is inert without the switch, so B follows A. The registry/switch API is defined in Slice A and consumed unchanged by B.

## Verification checklist

- [ ] `npm --workspace apps/frontend run typecheck` clean
- [ ] `npm --workspace apps/frontend run test` green (new portal tests + unchanged `App.*.test.tsx` regression suite)
- [ ] `npm run lint` and `npm run format:check` clean for touched files
- [ ] Manual: portal button centered top-middle; brand block, portal button, and `ThemeControl` (open + closed) have non-overlapping visual bounds and hit areas at a 375px mobile width and a desktop width
- [ ] Manual: start an MTG Assistant flow (enter game context / type a question), switch to Trade Balancer and back — in-progress state is preserved; selecting the current mode does not reset state; a page reload clears everything
- [ ] Manual: open/close animation is present with motion enabled and disabled under `prefers-reduced-motion: reduce`
- [ ] No change to `AskAiRequest` / `GameContext` / `POST /api/ask-ai` / prompt assembly (grep touched files: frontend chrome only)
