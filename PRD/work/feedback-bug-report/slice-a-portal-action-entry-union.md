# Slice A — Portal action-entry union

## Status: planned

## Goal

Extend the feature-portal entry model to a discriminated union (`PortalDestination` |
`PortalActionEntry`) so the menu can render handler-backed action entries alongside view-mounting
destinations, per DEC-104/REQ-086 — with zero behavior change to existing destinations.

## Requirements

1. `apps/frontend/src/lib/portal/types.ts` — add `kind: "destination"` to `PortalDestination`; add
   `PortalActionEntry = { kind: "action"; id: DestinationId; label: string; onSelect: () => void }`;
   add `PortalEntry = PortalDestination | PortalActionEntry`.
2. `apps/frontend/src/components/portal/destinationRegistry.tsx` — each entry in `PORTAL_DESTINATIONS`
   gains `kind: "destination"`. No new entries; v1 destination list (DEC-095) is unchanged.
3. `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` — accept `entries: PortalEntry[]`
   (renamed from `destinations`). Render both kinds identically in the dropdown, in array order.
   Selecting a `kind: "destination"` item keeps current behavior (calls `onSelect(id)`, closes menu).
   Selecting a `kind: "action"` item calls the entry's own `onSelect()`, closes the menu, and does
   **not** call the destination-switch callback or touch `activeDestinationId`.
4. `apps/frontend/src/App.tsx` — update the `FeaturePortalMenu` call site for the renamed `entries`
   prop (still passing `PORTAL_DESTINATIONS`; no action entry is registered yet — that is Slice E).
   `DestinationOutlet` keeps taking `PortalDestination[]` unchanged (outlet only ever mounts
   `kind: "destination"` entries; with no action entries registered yet there is nothing to filter).

## Acceptance criteria

- [ ] `types.ts` exports `PortalDestination` (`kind: "destination"`), `PortalActionEntry`
      (`kind: "action"`), and the `PortalEntry` union
- [ ] `FeaturePortalMenu` renders a mix of destination and action entries in one dropdown
- [ ] Selecting an action entry invokes its own `onSelect` handler, closes the menu, and leaves
      `activeDestinationId` unchanged (verified with a mock action entry in the test harness)
- [ ] Selecting a destination entry is unchanged: switches active destination, closes menu
- [ ] Existing `destinationRegistry.test.tsx`, `DestinationOutlet.test.tsx`, and `App.*.test.tsx`
      files stay green with no assertion changes required
- [ ] `npm --workspace apps/frontend run typecheck` passes with the new union threaded through

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu destinationRegistry DestinationOutlet App
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/portal/types.ts`
- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/App.tsx`
