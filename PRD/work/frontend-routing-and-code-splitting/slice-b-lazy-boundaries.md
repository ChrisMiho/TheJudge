# Slice B — Per-destination lazy boundaries and the load-fallback surface

## Status: done

## Goal

Put each destination behind a `React.lazy` code boundary so a visitor downloads
only the destinations they open, without disturbing keep-alive mounting or
introducing a fallback that flashes on every switch.

## Requirements

1. Convert each `destinationRegistry.tsx` entry's component import to
   `React.lazy(() => import(...))`. The registry keeps its shape — `id`, `path`,
   `label`, `render` — so consumers are unaffected.
2. Add the `Suspense` boundary **inside** `DestinationOutlet`'s per-destination
   `<div hidden>`, wrapping each mounted destination individually. Do not wrap
   the outlet as a whole: a shared boundary suspends and blanks already-loaded
   siblings while a new destination loads, which is the state loss DEC-095
   forbids.
3. `DestinationOutlet`'s `mountedDestinationIds` accumulation and `hidden`
   rendering are otherwise unchanged.
4. Build the fallback to the `screen-layout.md` **Destination load fallback**
   row: it occupies the destination content region inside the existing shell,
   leaves the shell/rail/brand mounted and visible, reserves the region rather
   than collapsing it, and stays quiet — no branded splash, no progress bar, no
   motion beyond NFR-006's CSS rules.
5. Reuse existing shell/spacing tokens rather than inventing geometry
   (DEC-149 / REQ-126).

## Acceptance criteria

- [ ] Each of the four destinations resolves through its own dynamic `import()`
- [ ] Visiting a destination for the first time shows the fallback; navigating away and back shows **no** fallback, because keep-alive means it is already mounted and loaded
- [ ] While a newly-selected destination is loading, a previously-visited destination retains its in-session state and is not blanked or remounted
- [ ] The suite shell, corner rail, and brand block stay mounted and visible during the fallback
- [ ] The shell does not shift height when a chunk resolves — measured, not eyeballed: record `.page-card`'s `getBoundingClientRect().height` while the fallback is showing and again after the destination renders, and confirm the fallback-state height is not larger than the resolved height (the region may grow to fit real content; it must not collapse and re-expand)
- [ ] Feature-portal chrome is visually unchanged — corner rail, tray, Theme section, and action entries are untouched (DEC-122 / DEC-133 / DEC-150)
- [ ] `npm run quality:check` green
- [ ] Browser verification at phone (`390px`) and desktop (`1280px`) with network throttled enough to observe the fallback: capture the fallback state and the resolved state for one destination, confirm no layout shift and no fallback on revisit; browser closed, owned dev server stopped, port released; captures written to `PRD/work/frontend-routing-and-code-splitting/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/components/portal/DestinationOutlet.tsx`
- `apps/frontend/src/components/portal/DestinationOutlet.test.tsx` (new or extended)
- `apps/frontend/src/index.css` (only if the fallback needs a token-based rule)

## Verification evidence — 2026-08-07

- Automated: `npm --workspace apps/frontend run test` passed 124 files / 1,237 tests; the focused outlet tests prove per-destination fallback isolation, retained sibling state, and no fallback on revisit.
- Build: `npm --workspace apps/frontend run build` emitted separate `QuickLookupApp`, `MtgAssistantApp`, `PlayerLifeTrackerApp`, and `TradeBalancer` chunks.
- Browser: Playwright MCP used a capture-only delayed Vite configuration on the worktree-owned `127.0.0.1:4178` server. At `390x844`, the Trade Balancer fallback card measured `131px` and the resolved card `693px`; at `1280x900`, the fallback measured `218px` and the resolved card `478px`. Both satisfy fallback height ≤ resolved height, with the shell, corner Menu rail, and brand present throughout.
- Revisit: after loading Quick Question, returning to the retained Trade Balancer destination showed its heading immediately with no fallback.
- Captures: `.playwright-mcp/slice-b-phone-fallback.png`, `slice-b-phone-resolved.png`, `slice-b-desktop-fallback.png`, `slice-b-desktop-resolved.png`, plus automatic session artifacts under `slice-b-auto/`.
- Runtime ownership: Vite server sessions `81077`, `44971`, and `74602` were stopped through their exact handles; `browser_close` completed; `lsof -nP -iTCP:4178 -sTCP:LISTEN` returned no listener afterward.
- Console/network: the destination module request returned `200`; the only console error was the existing missing `/favicon.ico` response.
