# Slice A — Router foundation and URL as source of truth

## Status: done

## Goal

Make the four registered destinations addressable at flat top-level URLs, with
the URL as the source of truth for the active destination, without changing
which destinations exist, how they render, or what stays mounted.

## Requirements

1. Add `react-router` to `apps/frontend` runtime dependencies. Wrap the app in
   `<BrowserRouter>` at the `App` root, outside `LeftEdgeDrawerProvider`.
2. Add a `path` field to `PortalDestination` in `src/lib/portal/types.ts` and
   populate it literally in `destinationRegistry.tsx`:
   `quick-lookup` → `/quick-lookup`, `mtg-assistant` → `/in-depth`,
   `player-life-tracker` → `/life-tracker`, `trade-balancer` → `/trade-balancer`.
   Paths are declared, not derived from ids or labels.
3. Rewrite `src/hooks/useActiveDestination.ts` to derive `activeDestinationId`
   from `useLocation()` and to `navigate()` on `setActiveDestinationId`, keeping
   its existing `{ activeDestinationId, setActiveDestinationId }` shape so
   `App.tsx` call sites are unchanged.
4. Resolution order: a path matching a registry `path` wins; `/` falls back to
   `loadActiveDestinationId(validIds)` and then registry order, via a
   **replace** navigation so `/` does not linger in history; an unregistered
   path redirects to `/`.
5. Reuse `loadActiveDestinationId` / `saveActiveDestinationId` from
   `src/lib/portal/activeDestinationPrefs.ts` as-is. Do not reimplement the
   guarded storage read, and do not delete the module — DEC-157 keeps it as the
   bare-`/` fallback.
6. Keep writing the selection to `sessionStorage` on navigation.
7. `DestinationOutlet` is not modified in this slice. Destinations must not be
   placed inside `<Routes>` elements.
8. `handleDestinationSelect` in `App.tsx` keeps the Life Tracker → In-Depth
   roster-seed handoff. Do not move seeding into a route effect or location
   listener.
9. Feedback stays a routeless action entry: opening the modal must not navigate.

## Acceptance criteria

- [ ] Deep-linking each of `/quick-lookup`, `/in-depth`, `/life-tracker`, `/trade-balancer` in a fresh context mounts that destination, overriding any stored `sessionStorage` value
- [ ] Selecting a destination from the Menu updates the URL to its `path`
- [ ] Browser Back after two destination selections returns to the previous destination; Forward returns again
- [ ] `/` with a valid stored `sessionStorage` value resolves to that destination; with a missing, corrupted, or unregistered value it resolves to the first registered destination (`quick-lookup`)
- [ ] `/` resolves by **replace**, so Back from the resolved destination does not land on `/` and re-resolve in a loop
- [ ] An unknown path (e.g. `/nope`) redirects to `/` and resolves from there — no error screen, no blank shell
- [ ] Switching from a destination with in-session state to another and back preserves that state and does not remount the component
- [ ] Opening the feedback modal leaves the URL, active destination, and history length unchanged
- [ ] Deep-linking `/in-depth` does **not** seed the roster; selecting In-Depth Question from the Menu while on Life Tracker still does
- [ ] `App.tsx`'s `useActiveDestination` call site is unchanged apart from the provider wrapper
- [ ] `npm run quality:check` green
- [ ] Browser verification of Back/Forward and deep-link entry at phone (`390px`) and desktop (`1280px`) widths; browser closed, owned dev server stopped, port released; captures written to `PRD/work/frontend-routing-and-code-splitting/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test
npm run quality:check
```

## Files touched

- `apps/frontend/package.json`
- `package-lock.json`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/hooks/useActiveDestination.ts`
- `apps/frontend/src/lib/portal/types.ts`
- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/hooks/useActiveDestination.test.ts` (new or extended)

## Verification evidence — 2026-08-07

- Automated: `npm --workspace apps/frontend run test` passed 124 files / 1,235 tests after the router and global history reset were integrated.
- Browser: Playwright MCP on the worktree-owned Vite server at `127.0.0.1:4177` verified all four direct paths, stored and registry-order `/` fallback, unknown-path fallback, Menu URL updates, Back/Forward, keep-alive field state, and feedback-modal routelessness at `390x844` and `1280x900`.
- Runtime ownership: server sessions `43127` and `95086` were started by this worktree and stopped through their exact handles; `browser_close` completed after each browser run; `lsof -nP -iTCP:4177 -sTCP:LISTEN` returned no listener after cleanup.
- Captures: `PRD/work/frontend-routing-and-code-splitting/.playwright-mcp/slice-a-phone-trade-deep-link.png`, `slice-a-desktop-back-navigation.png`, and automatic session artifacts under `slice-a-auto/`.
- Console: no application console errors; the only observed resource error was the existing missing `/favicon.ico` response.
