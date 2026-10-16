# Measurements — tool-switch load delay

**What happened:** every number the brief leans on, taken 2026-10-15 in a real
browser against the live site (`https://mtgjudge.gg`, primary — the owner
reported the delay there) and a local production build (`npm --workspace
apps/frontend run build` + `vite preview` on port 4917, built from this branch
at `ed3e96b8`). The live deploy's tool chunks carry different file hashes but
match the local ones within 0.3 KB; `vendor`, `scan` and `playerLabels` are
byte-identical. Nothing here is estimated.

**What it means for you:** the "Loading…" screen on each tool is the code
download for that tool, 0.2–0.7 s even on a slow phone network. The only
multi-second wait is the Trade Balancer's card list on a slow network, up to
about 9 s. Downloading the two tools' code in the background while the player
is on the question screen removes the "Loading…" screen; it does not shorten
the card list.

## Method

- Browser: Playwright MCP Chromium, desktop viewport (one 390 px phone run for
  screenshots only).
- Script: `PRD/work/tool-switch-load-delay/.playwright-mcp/measure.js`
  (gitignored; kept for reruns). Per run it:
  1. for a **first visit**, clears the HTTP cache and all site storage over the
     Chrome DevTools Protocol (CDP); a **repeat visit** reloads the page with
     the cache kept from the previous run;
  2. applies network and CPU throttling over CDP;
  3. loads `/quick-lookup` (the question flow) and waits for "Ask a Question";
  4. opens the ☰ menu, waits 400 ms, then taps **Life Tracker** from inside the
     page and records, on every animation frame, when the "Loading…" fallback
     appears and when the tool is on screen (first visible "Decrease life"
     button, fallback gone);
  5. does the same for **Trade Balancer**: when the tool is on screen and when
     its "Loading card list…" note disappears (search becomes usable);
  6. reads the browser's Resource Timing entries (start, end, bytes over the
     wire, bytes decoded) and any long tasks (main-thread work over 50 ms).
- The tap on Life Tracker lands about 1–2 s after the question screen is up;
  Trade Balancer about 1.1–1.6 s after Life Tracker shows.
- Network profiles (Chrome DevTools presets):
  - **unthrottled** — the workstation's own connection;
  - **Fast 4G** — 165 ms added latency, 9 Mbps down;
  - **Slow 4G** — 562.5 ms added latency, 1.44 Mbps down.
- **CPU 4×** — Chrome CPU slowdown of 4, a mid-range phone stand-in.
- "Prefetched" runs approximate the proposed fix without code changes: after
  the question screen is up, the script adds `<link rel="modulepreload">` tags
  for the Life Tracker chunk, its shared `playerLabels` chunk and the Trade
  Balancer chunk, waits 1.5 s, then taps as above.

## What each tool costs on first open (bytes over the wire, gzip)

| Piece | Raw | Over the wire | Already loaded by the question flow? |
| --- | --- | --- | --- |
| Life Tracker code (`PlayerLifeTrackerApp-*.js`) | 26.1 KB | 8.1–8.3 KB | no |
| Shared `playerLabels-*.js` | 0.2 KB | 0.5 KB | no (Quick Question); yes (In-Depth) |
| Trade Balancer code (`TradeBalancer-*.js`) | 23.1 KB | 8.4 KB | no |
| Scan chunks the balancer imports (`scan`, `ScanReviewBubble`) | 53 KB | 19.9 KB | yes |
| Card list `/data/cardMetadata.json` (34,639 cards; `cardId`, `name`, `imageId`, `colors`) | 4,879 KB | 1,957 KB | yes — fetched when Quick Question (or In-Depth) opens |

The card list is downloaded separately by Quick Question, In-Depth and the
Trade Balancer (three `fetch` calls, one per tool). The browser's HTTP cache
makes the balancer's request wait on, or reuse, the question flow's download
rather than start a second one; each tool still parses its own copy.

## Live site — results (ms after the tap)

| Run | Life Tracker: "Loading…" shown → tool on screen | Trade Balancer: tool on screen | Trade Balancer: card list usable |
| --- | --- | --- | --- |
| unthrottled, first visit | 4 → **309** | **402** | 446 |
| unthrottled, repeat visit | 6 → **31** | 13 | 55 |
| Fast 4G, first visit | 5 → **197** | **185** | 228 |
| Fast 4G, repeat visit | 9 → **185** | 10 | 53 |
| Fast 4G + CPU 4×, first visit | 11 → **209** | **207** | **698** |
| Slow 4G + CPU 4×, first visit | 15 → **692** | **681** | **9,656** |
| Slow 4G + CPU 4×, repeat visit | 15 → **601** | 38 | 167 |

Supporting detail (live):

- Card list download, first visit: 0.83 s unthrottled, 2.1 s Fast 4G, **11.5 s
  Slow 4G** (1.96 MB over the wire). It starts when Quick Question opens, so
  on a fast connection it is done before the player reaches the balancer.
- Each tool chunk is one round trip: 42–373 ms unthrottled (373 ms was a
  CloudFront cache miss on the Trade Balancer chunk), ~180 ms Fast 4G,
  ~580–670 ms Slow 4G.
- Repeat visits still pay a round trip for some chunks: no asset carries a
  `Cache-Control` header (`aws s3 sync` in `scripts/aws-deploy.sh` sets none),
  so the browser guesses freshness and re-checks some files with the server
  (a 300-byte `304 Not Modified`). That is why Life Tracker still shows
  "Loading…" for 0.6 s on a repeat Slow 4G visit.
- CloudFront compresses with gzip only. A request that accepts only Brotli gets
  the raw 4.88 MB card list. Brotli would make the card list 1.62 MB instead of
  1.96 MB (local `brotli` CLI, 17% smaller).
- Main-thread cost when the card list arrives (CPU 4×): three long tasks of
  57–91 ms, about 200 ms total (JSON parsing for each tool that fetched it, plus
  the balancer's name search index). Unthrottled: no long task over 50 ms.
- The balancer's warm-up health ping (`GET /api/health`, REQ-064) answers in
  0.17–0.58 s and never blocks the screen.

## Local production build — results (ms after the tap)

| Run | Life Tracker on screen | Trade Balancer on screen | Card list usable |
| --- | --- | --- | --- |
| unthrottled, first visit | 19 | 25 | 70 |
| Slow 4G + CPU 4×, first visit | **688** | **685** | **9,785** |
| Slow 4G + CPU 4×, first visit, **prefetched** (two-tool approximation) | **41** | **34** | 8,916 |
| Fast 4G + CPU 4×, first visit, **prefetched** | **42** | **36** | 334 |

- The local build reproduces the live slow-network numbers within 15 ms per
  switch (688 vs 692, 685 vs 681), so it is a faithful stand-in for testing a fix.
- Prefetched runs still showed the fallback for one frame (~11–14 ms) because a
  `modulepreload` tag warms the browser's module cache but not React's lazy
  wrapper. The proposed fix calls the registry's own `preload()`, which feeds
  React the already-loaded module synchronously
  (`apps/frontend/src/components/portal/destinationRegistry.tsx`,
  `lazyDestination`), so no fallback frame is expected — an acceptance check
  for build, not yet measured.
- Prefetch did not shorten the card list wait on Slow 4G: it is bandwidth, not
  code.

## Life Tracker landing — what it downloads (live, define re-run)

Taken 2026-10-15 after the re-grade, on the live site, unthrottled, first
visit (HTTP cache and site storage cleared over CDP), Playwright MCP Chromium.
Sizes are Resource Timing `transferSize` (gzipped bytes over the wire, headers
included). Read-only; no timing claim rests on this run.

| Step | Requests | Over the wire |
| --- | --- | --- |
| Land on `/life-tracker`, wait 6 s | entry `index` 27.3 KB, `vendor` 58.6 KB, CSS 35.9 KB, `PlayerLifeTrackerApp` 8.1 KB, `playerLabels` 0.5 KB, font 47.6 KB | **no `/data/cardMetadata.json`** |
| ☰ → Ask a Question (Quick Question) | `QuickLookupApp` 4.6 KB, `ScanReviewBubble` 3.7 KB, `ConversationWorkspace` 56.2 KB, `scan` 15.7 KB, then `/data/cardMetadata.json` 1,911 KiB (about 1.96 MB) | code 80.2 KB + card list |
| "In-depth" from Quick Question | `MtgAssistantApp` 18.7 KB, and a **second** `/data/cardMetadata.json` request served from the HTTP cache (0 bytes over the wire, parsed again) | 18.7 KB |

What this settles:

- A player who lands on the Life Tracker downloads no card list today. Tier 3
  on that landing adds about 1.96 MB (Q-014 in `GATE-QUESTIONS.md`).
- Tier 2 cost by landing, from the measured chunk sizes above and in the table
  under "What each tool costs": Quick Question landing about 36 KB (Life
  Tracker 8.1 + player-labels 0.5 + Trade Balancer 8.4 + In-Depth 18.7); Life
  Tracker landing about 107 KB (the five question-tool chunks above, 98.9, plus
  Trade Balancer 8.4). Trade Balancer and In-Depth landings are sums of these
  chunk sizes, not separate runs: about 88 KB, and about 21–25 KB (the range is
  whether In-Depth already holds the 3.7 KB scan-review chunk).
- Opening scan-capable code downloads no scan data: no `cardhashes.bin` or
  `cardScanMap.json` request followed the `scan` chunk.
- Each card-search screen issues its own card-list request today; the second
  one is a cache hit but is parsed again.
- Not measured: tap-to-screen times for the question tools from a Life Tracker
  landing, and the shared card-list load (it does not exist yet). The 41 ms /
  34 ms prefetched figures below cover the Life Tracker and Trade Balancer
  only, approximated with `modulepreload`; the build measures every tool
  (`DESIGN-BRIEF.md`, acceptance criteria 2 and 4).

## Screenshots (gitignored, local only)

Under `PRD/work/tool-switch-load-delay/.playwright-mcp/`, live site, Slow 4G +
CPU 4×, 390 px wide:

- `live-slow4g-lifetracker-loading-fallback-390.png` — the "Loading…" screen
  200 ms after tapping Life Tracker.
- `live-slow4g-tradebalancer-loading-fallback-390.png` — the same for Trade
  Balancer.
- `live-slow4g-tradebalancer-loading-card-list-390.png` — the balancer on
  screen with "Loading card list…" and search not yet usable.

## Not reproduced

The owner describes "a few seconds" on each switch. Emulation shows the
"Loading…" screen for at most 0.7 s; only the balancer's card list reaches
multiple seconds, and only on a slow network. A real phone on a weak cellular
signal can have more latency than the Slow 4G preset, which multiplies the
per-chunk round trip. The proposed fix does not depend on network speed: the
code downloads while the player is still on the question screen.
