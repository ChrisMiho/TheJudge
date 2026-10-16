# Slice B — Tiered background download

## Status: done

## Goal

After the first screen renders, the app downloads the code of every other tool (tier 2) and then starts the shared card list (tier 3), so a tap on any tool shows it at once.

## Requirements

Depends on slice A (tier 3 calls its load).

1. `apps/frontend/src/components/portal/destinationRegistry.tsx`: export a production background-download function that calls `preload()` for every registered destination except the landing one, then starts the shared card-list load. Every tier-2 call is made before the tier-3 request; tier 3 does not wait for tier 2 to finish. No change to `vite.config.ts` `manualChunks`.
2. Schedule it once per page load, after the landing destination has committed, via `requestIdleCallback` with a timeout, falling back to a short `setTimeout`. Home: `DestinationOutlet.tsx` (or the portal shell). Tier 3 runs on every landing, the Life Tracker included (Q-014 accept).
3. A pre-downloaded tool never suspends (use `preload()`, not `modulepreload`).
4. On a rejected `preload()`, clear the cached `loadPromise` so a later tap retries; the background download swallows its own error.
5. The download never mounts a tool, fetches a tool's other data (no `cardhashes.bin`), or sends `GET /api/health`. Keep-alive mounting is unchanged.
6. Update the "production never preloads" comments in `destinationRegistry.tsx`. The test-only `preloadPortalDestinations` seam in `test/setup.ts` stays.
7. Product truth: Diffs 1, 2 and 3 of `GATE-QUESTIONS.md` (NFR-014 in `non-functional-requirements.md` including the two added Dependencies; `shared-chrome/README.md`; `screen-layout.md`), applied to `PRD/sections/` by intent together with the code.

## Acceptance criteria

- [ ] The background download calls the loader of every other destination and not the landing one (unit test)
- [ ] Every tier-2 call is made before the tier-3 card-list request (unit test)
- [ ] It runs once per page load and never mounts a destination (unit test)
- [ ] A rejected preload clears the cached promise and a later tap loads and shows the tool (unit test on `lazyDestination`)
- [ ] A destination whose code has already arrived renders without the "Loading…" fallback (test)
- [ ] A tap before the download finishes shows "Loading…" only until the in-flight download lands, with exactly one request for that chunk (test)
- [ ] No `GET /api/health` is sent before the Trade Balancer opens (test)
- [ ] The "production never preloads" comments in `destinationRegistry.tsx` are updated
- [ ] Diffs 1, 2 and 3 are applied to `PRD/sections/` as finalized
- [ ] `npm --workspace apps/frontend run test` and `npm run quality:check` pass with no coverage threshold lowered (NFR-012)

## Verification

```bash
npm --workspace apps/frontend run test
npm run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/destinationRegistry.tsx` and `destinationRegistry.test.tsx`
- `apps/frontend/src/components/portal/DestinationOutlet.tsx` and `DestinationOutlet.test.tsx`
- `apps/frontend/src/lib/portal/types.ts` (only if an opt-out field is added)
- `PRD/sections/non-functional-requirements.md`, `shared-chrome/README.md`, `screen-layout.md` (Diffs 1-3)
