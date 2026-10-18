# Graph-run brief — Scanner that recovers and runs lighter

Self-contained intake for `graph-kickoff`. Measured by the 2026-10-17 code health
probe; refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- Card scanning keeps working after a bad connection. Today, if the scanner's
  first download fails once (about 18 MB compressed — exactly what fails on a weak
  game-store connection), scanning stays broken in **every** tool until the page is
  reloaded, and the player sees raw text like `Could not load card hash DB: 503`.
- The first scan downloads less (the scan map can shrink from 6.5 MB to about
  4.0 MB gzipped).
- Phones do less work per scanned frame and hold less memory.
- The three scanners (In-Depth, Quick Question, Trade Balancer) share one panel,
  so the exit ✕ sits in the same place everywhere and never covers the caution
  triangle.

## Why (measured — do not re-derive)

1. **Sticky failure (bug).** `apps/frontend/src/lib/scan/loadScanMap.ts:8-15` and
   `lib/scan/loadHashDb.ts:9-18` store the fetch promise in a module variable and
   never clear it, so a rejected promise is returned for the rest of the session.
   `hooks/useScanCapture.ts:239-259` (`ensureResources`) caches `resourcesPromiseRef`
   the same way. The card-list loader already does this right:
   `lib/cardMetadataStore.ts:26-29` clears on failure. The raw error message reaches
   the player at `QuickLookupApp.tsx:581`, `TradeSide.tsx:286-288`,
   `ZoneCardPicker.tsx:300-302`. No test covers fail-then-retry.
2. **Duplicate fingerprint copies.** `lib/scan/identify.ts:213-226` (`CardIdentifier`
   constructor) copies all 97,311 fingerprints one by one (`Uint8Array.from`) into a
   new buffer, although the decoded `HashDb` already holds them contiguously. Each
   `useScanCapture` instance builds its own (`QuickLookupApp.tsx:357`,
   `ZoneCollectionStep.tsx:143`, `trade/useTradeScan.ts:90`); In-Depth rebuilds it
   on every Cards-station visit. 25 ms and 9,341,856 bytes per build; about 28 MB
   duplicated if all three scanners are used.
3. **Per-frame waste.** `identify.ts:251` fully sorts 97,311 indexes to keep the top
   10: sort 15.5–16.4 ms vs bounded top-10 selection 0.10–0.73 ms, same 10 results
   in every run checked (distance loop itself 8.6–11.2 ms). `resolveScanCandidates.ts:40`
   rebuilds a 34,639-card `Map` on every identified frame (~1.9 ms). Desktop Node
   numbers; phones are 3–6× slower; the camera runs about 3 frames per second.
4. **Oversized scan map.** `public/data/cardScanMap.json`: 21.6 MB raw / 6.5 MB gzip,
   95,895 entries of `{oracleId, name, imageUrl}`. `name` is never read at runtime.
   Every `imageUrl` equals `deriveCardImageUrl(printingId)` (`lib/cardImage.ts`) plus
   a `?timestamp` cache-buster.

   | Shape | Raw | Gzip |
   |---|---|---|
   | Today | 21.6 MB | 6.5 MB |
   | Without `name` | 19.1 MB | 5.2 MB |
   | `printingId → oracleId` only | 7.5 MB | 4.0 MB |

5. **Three copies of the scanner panel.** Only the host panel is copied; the engine
   (`ScanCameraSurface`, `ScanReviewBubble`, `useScanCapture`) is shared.
   - In-Depth `ZoneCardPicker.tsx:279-288`: ✕ is `icon-round absolute right-3 top-3
     z-10` in the same box as the caution triangle (`.vf-top-right`, `index.css:4189-4197`),
     so it likely covers it — **code-read, verify live first**. A test pins the
     placement (`ZoneCardPicker.test.tsx:176-184`).
   - Trade `TradeSide.tsx:245-259`: ✕ in a `.scan-head` row, explicitly so it never
     covers the triangle.
   - Quick Question `QuickLookupApp.tsx:549-554`: a different control (`.scan-exit`,
     44 px rounded square vs the 40 px `.icon-round`).
   - Loading text, error styling (`role="alert"` on two of three) and the held-entries
     mapping into `ScanReviewBubble` are copied three times.

## Decisions already made — do not re-litigate

- Scan data stays out of the background preload (NFR-014). This brief does not
  change when scan data downloads.
- The scan engine is already shared; only the host panel is consolidated.
- D-01's retry-on-failure needs no new product truth: NFR-014 already says failed
  loads retry, and the card-list loader does.

## Open decisions for the define gate

1. Where the scanner's ✕ sits on all three tools (recommendation: Trade's head row,
   `.icon-round`).
2. The player-facing wording when scan data fails to load (replacing the raw error).
3. Whether scan images may drop Scryfall's `?timestamp` cache-buster, which the
   smallest scan map (`printingId → oracleId`) requires. The middle option (drop
   only `name`) needs no such decision.

## Design direction (converged)

- Loaders clear their cached promise on rejection; `ensureResources` resets on
  rejection; one fail-then-succeed test per loader.
- One module-level `loadScanResources()` builds the identifier once from the shared
  `HashDb` (single pass into a preallocated buffer) and hands every scanner the same
  instance.
- Bounded top-N insertion keeping lower-index-first ties (matches the stable sort);
  card-id map cached per card-list array (`WeakMap`). The `reference/identify.py`
  parity tests must pass unchanged.
- Slimmer scan map per decision 3, rebuilt by the existing build script.
- One `ScanPanel` host component (head row with title + ✕, loading, error, bubble
  mapping); each tool passes its title, destination label and handlers.

## Current-state PRD truth to amend

- `PRD/sections/scan/README.md` — the shared scanner panel and ✕ placement; failure
  wording.
- `PRD/sections/scan/data/cardScanMap.md` — the scan map shape, if decision 3 slims it.
- The REQ-066 constraint cited at `resolveScanCandidates.ts:55-58`, if the map shape
  changes.
- `PRD/sections/screen-layout.md` — scanner panel row, if the ✕ moves.

## Constraints (don't rediscover)

- Committed data artifacts are rebuilt by script; never hand-edit them, and never
  run `npm run data:refresh` (network).
- Scan identification output must stay identical; the Python parity reference is the
  check.
- Clusters "one card search box" and this one both edit `QuickLookupApp.tsx`,
  `ZoneCardPicker.tsx` and `TradeSide.tsx` — do not run them at the same time.

## Evidence + reusable tooling

`PRD/work/probe-codebase-health-pass/FINDINGS-data-and-clients.md` (D-01, D-03,
D-04, D-06) and `FINDINGS-ui-and-personalities.md` (U-02).

## What the graph run should produce

A DESIGN-BRIEF covering the five changes above, the three gate questions, the
`PRD/sections/scan/` amendments, and slices that land the bug fix first (smallest,
highest value), then the shared resources and per-frame work, then the panel, then
the scan map.

## How to hand this off

/graph-kickoff "Scanner recovers from a failed download, builds its data once, and shares one panel across tools" PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-scanner.md
