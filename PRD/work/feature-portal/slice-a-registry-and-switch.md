# Slice A — Destination registry + state-preserving mode switch

## Status: done

## Goal

Introduce the extensible destination registry and the frontend-only, state-preserving view switch: extract today's `App` body into `MtgAssistantApp`, make `App` the shell, and mount destinations so switching preserves each mode's in-session state. No portal button yet (Slice B).

## Requirements

1. Extract the current MTG Assistant staged-flow body (everything in `App.tsx` today except the app-level `ThemeControl` chrome wrapper) into a self-contained `MtgAssistantApp` component that owns its own state; its rendered output and behavior are unchanged (DEC-095, REQ-067: "start screen, staged flow, and answered/conversation view are unchanged").
2. Define the registry type `PortalDestination = { id: DestinationId; label: string; render: () => ReactNode }` and export `PORTAL_DESTINATIONS` listing exactly two v1 entries in order: `mtg-assistant` → "MTG Assistant" (`<MtgAssistantApp />`), `trade-balancer` → "Trade Balancer" (`<TradeBalancerPlaceholder />`). Adding a destination must be a single appended entry with no other portal change (REQ-067 extensible-registry criterion).
3. Add a small stateless `TradeBalancerPlaceholder` ("Trade Balancer — coming soon" copy) that `card-trade-balancer` will later swap for its real view via a one-line registry `render` change. Leave a short code comment at the registry entry naming that handoff.
4. `App` becomes the shell: holds `activeDestinationId` (default = first registered, `mtg-assistant`) and the set of ever-activated ids; renders `ThemeControl` (unchanged `fixed right-3 top-3`) and a `DestinationOutlet`. Expose a `setActiveDestination(id)` handler (consumed by Slice B); selecting the current id is a no-op that does not reset state or remount.
5. `DestinationOutlet` mounts a destination lazily on first activation and keeps it mounted thereafter; the active destination is visible and inactive ones are hidden via the `hidden` attribute (`display:none`) so their React state persists across switches. App startup mounts only `mtg-assistant` (startup behavior unchanged); nothing is persisted across a page reload.

## Acceptance criteria

- [x] `MtgAssistantApp` contains the former `App` flow; the existing `App.*.test.tsx` suite passes unchanged (regression: MTG Assistant unchanged, `mtg-assistant` active by default).
- [x] `PORTAL_DESTINATIONS` has exactly the two ordered v1 entries; a unit test asserts ids/labels/order and that each `render()` returns a node.
- [x] With `mtg-assistant` active by default, `DestinationOutlet` renders MtgAssistantApp visible and does not mount `trade-balancer` until it is first activated (assert the placeholder is absent from the DOM before first activation, present after).
- [x] State-preservation test: activate a destination, mutate its in-session state (type into one of its inputs), switch to the other destination, switch back — the mutated value is retained (inactive subtree stays mounted with `hidden`, not unmounted).
- [x] Selecting the already-active destination id is a no-op: no remount, no state reset (assert the subtree instance / a typed value survives a same-id select).
- [x] `ThemeControl` still renders at `fixed right-3 top-3` and behaves exactly as before.
- [x] No change to `AskAiRequest`, `GameContext`, prompt assembly, providers, or `POST /api/ask-ai`.

## Implementation notes

`activeDestinationId` is a plain constant in `App.tsx` (not yet `useState`) since nothing changes it until Slice B adds the portal button — introducing state with no setter caller would fail `noUnusedLocals`/lint. `DestinationOutlet` owns the mount-on-first-activation / keep-mounted / hide-inactive logic internally (an internal `useState` + `useEffect` keyed on the `activeDestinationId` prop), matching the GAMEPLAN component-tree note that `DestinationOutlet` "mounts + shows active destination." Slice B promotes the constant to `useState` and defines `setActiveDestination` when it wires the button's `onClick` handlers.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run test
npm run lint
```

## Files touched

- `apps/frontend/src/lib/portal/types.ts` (new) — `DestinationId`, `PortalDestination`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (new) — extracted from `App.tsx`
- `apps/frontend/src/components/portal/TradeBalancerPlaceholder.tsx` (new)
- `apps/frontend/src/components/portal/destinationRegistry.tsx` (new) — `PORTAL_DESTINATIONS`
- `apps/frontend/src/components/portal/DestinationOutlet.tsx` (new) — lazy-mount + keep-mounted + hide-inactive
- `apps/frontend/src/App.tsx` (edit) — becomes the shell (nav state + chrome + outlet)
- `apps/frontend/src/components/portal/DestinationOutlet.test.tsx` (new) — mount/visibility + state-preservation + no-op
- `apps/frontend/src/components/portal/destinationRegistry.test.tsx` (new) — registry shape/order
