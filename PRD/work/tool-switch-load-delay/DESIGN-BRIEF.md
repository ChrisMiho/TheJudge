# Design brief — tools open without the "Loading…" screen

**Decide:** one slot in `GATE-QUESTIONS.md` (NFR-014, the code-splitting
rule): may the app download every tool's code, and the shared card list, in
the background so tools open instantly? Owner verdict: edit (2026-10-15) —
widened from two tools to a three-tier background download.

## The answer in one paragraph

The "Loading…" screen a player sees when first opening the Life Tracker or the
Trade Balancer is that tool's code downloading. Each tool is a separate small
download (about 8 KB) that today starts only when the player taps it. Measured
on the live site, the wait is 0.2 s on a good connection and 0.7 s on a slow
phone network. The fix downloads in three tiers once the player's first screen
is up. Tier 1 is the landing screen, as today. Tier 2 is the code for every
other tool, including both question tools. Tier 3 is the card list, downloaded
and read once and shared by Quick Question, In-Depth and the Trade Balancer. The
tap then shows the tool at once. Measured with
the fix approximated on a production build: 688 ms → 41 ms for the Life
Tracker, 685 ms → 34 ms for the Trade Balancer, on a slow phone profile. The
Trade Balancer's "Loading card list…" on a slow network (up to 9.7 s) shrinks
because tier 3 starts the card list download early, but the list's size
(Brotli, trimming) is not changed: out of scope, offered below as F1.

## Where the owner saw it

The owner reported the delay on the live site (`https://mtgjudge.gg`), going
from the question flow to the Life Tracker, then to the Trade Balancer. The
live site is the primary measurement target; a local production build of this
branch confirms causes and tests the fix.

## What the player sees today

1. The player opens TheJudge on Quick Question (the default first screen) and
   the card list starts downloading for its "Add card" search.
2. They tap ☰ → Life Tracker. The tool area shows "Loading…" while the Life
   Tracker's code downloads: 0.3 s on the live site unthrottled, 0.2 s on Fast
   4G, 0.7 s on Slow 4G with a slowed phone CPU.
3. They tap ☰ → Trade Balancer. "Loading…" again, for the same reason: 0.4 s,
   0.2 s, 0.7 s. Then the balancer shows "Loading card list…" with search not
   usable until the card list (1.96 MB over the wire) has arrived: done within
   0.05 s on a good connection, 0.7 s on Fast 4G with a slow CPU, 9.7 s on Slow
   4G.
4. After that, switching back and forth is instant: visited tools stay open in
   the background for the rest of the session (REQ-067's portal keeps every
   visited destination mounted and hidden, DEC-095).
5. On a later visit with a warm browser cache, the Life Tracker can still show
   "Loading…" for 0.6 s on Slow 4G, because the site sends no caching header and
   the browser re-checks the file with the server.

Full numbers and method: `evidence/measurements.md`.

## What the player sees after

1. Same first screen, same speed. Nothing extra downloads until it is up.
2. While the player reads or types, the code for every other tool downloads
   quietly (tier 2; from a Quick Question landing the Life Tracker and Trade
   Balancer part is about 17 KB, less than one card image). Then the card list
   (tier 3) is downloaded and read once, shared by the three screens that use it;
   for a question-screen landing it is already downloading today.
3. Tapping any tool shows it straight away — no "Loading…" screen, on any
   connection, as long as the background download has finished (about 0.2 s on
   Fast 4G, 0.7 s on Slow 4G after the first screen).
4. If the player taps before it finishes, they see "Loading…" only for the time
   left, and the download is not repeated.
5. The Trade Balancer's "Loading card list…" is shorter or gone when the card
   list has already arrived in the background; the list's size is unchanged, so
   a slow network can still wait (rest of follow-up F1).

## What causes the wait — measured, ranked

| Cause | First visit, good connection | First visit, slow phone (Slow 4G + CPU 4×) | In core? |
| --- | --- | --- | --- |
| Tool code downloads only on tap ("Loading…") | 0.2–0.4 s per tool | 0.7 s per tool | **yes** |
| Card list still downloading when the balancer opens ("Loading card list…") | 0–0.05 s (already done) | up to 9.7 s | partly — tier 3 starts it early; size is F1 |
| No caching header, so repeat visits re-check files | 0.02–0.2 s | 0.6 s (Life Tracker) | no — F2; the background download hides it |
| Parsing the card list once per tool + building the balancer's search index | under 50 ms | about 200 ms total | yes — tier 3 reads the list once (index build stays per tool) |
| Backend health ping (REQ-064) | 0.17 s, never blocks | 0.58 s, never blocks | no — not a cause |

Node 2's code-read ranking put the card list first. Measured, the card list is
the bigger wait only on a slow network, and only on the balancer; the
"Loading…" screen on every first tool open is the code download.

## Scope

In:

- Tiered background download after the first screen renders: tier 2, the code
  for every other tool (Life Tracker, Trade Balancer, Quick Question,
  In-Depth); tier 3, the card list downloaded and read once and shared by Quick
  Question, In-Depth and the Trade Balancer. Their first open shows no
  "Loading…" screen.
- Amend NFR-014 and the two places that describe the fallback (shared-chrome
  spec, screen-layout row) — proposal in `GATE-QUESTIONS.md`.

Out (see Follow-ups): Brotli compression, caching headers and trimming the card
list (rest of F1, F2), backend cold start for answers, price data.

## Design

Technical detail for the implementer, below the player story.

1. **Cover every tool.** The registry
   (`apps/frontend/src/components/portal/destinationRegistry.tsx`) already keeps
   a `preload()` per destination (`lazyDestination`); tier 2 calls it for every
   registered destination except the landing one, so no per-entry mark is needed
   (whether an opt-out field is still worth adding is an implementer choice).
   No change to `vite.config.ts` `manualChunks` (NFR-014: adding a destination
   must not touch chunk config).
2. **Tiered download after the first screen.** Export a production
   background-download function from the registry that calls `preload()` for
   every other destination (tier 2), then starts the shared card-list load (tier 3,
   see 7). Call it once per
   page load, after the landing destination has committed, when the browser is
   idle: `requestIdleCallback` with a timeout where available, otherwise a short
   `setTimeout` after mount (Safari lacks `requestIdleCallback` on older
   versions). `DestinationOutlet` (or the portal shell that renders it) is the
   natural home: it already owns the mounted-destination list. Exact delay and
   host component are equivalent technical choices for the implementer.
3. **No fallback frame for a pre-downloaded tool.** `lazyDestination` already feeds
   React an already-loaded module synchronously once `preload()` has resolved
   (the `loadedModule` thenable path), so a pre-downloaded tool never suspends. A
   `<link rel="modulepreload">`-style approach would still flash the fallback
   for one frame (measured ~11–14 ms); use `preload()`.
4. **A failed background download must not break the tool.** Today `preload()` caches its
   promise (`loadPromise ??=`). If a background download fails and the rejected
   promise stays cached, the later tap would reuse the failure and the tool
   would not open. On rejection, clear the cached promise so the tap retries the
   download; swallow the background download's own error (no console noise, no UI).
5. **Code and the shared card list only.** The background download never
   renders or mounts a tool or fetches its other data. The Trade Balancer's
   health ping (REQ-064) stays in its mount effect and fires only when the player
   opens it. The keep-alive mounting in `DestinationOutlet`
   (`mountedDestinationIds`) is unchanged.
6. **Comments and tests.** Update the "production never preloads" comments in
   `destinationRegistry.tsx` (`lazyDestination`, `preloadPortalDestinations`).
   The test-only `preloadPortalDestinations` seam in
   `apps/frontend/src/test/setup.ts` stays as is.
7. **One shared card list (tier 3).** Quick Question, In-Depth and the Trade
   Balancer today each fetch `/data/cardMetadata.json` and parse it themselves.
   Download and parse it once (a shared module-level load that reuses an
   in-flight or finished result and clears itself on failure), start it in the
   background after tier 2, and have the three consumers read from it. A
   question-screen landing already downloads it, so no player downloads more
   than today. Exact module shape is the implementer's choice.

## Decisions and assumptions (assumption ladder)

- **A1 — live site is the target.** The owner reported the delay on the live
  site (coordinator update). Measured there first; the local build matched it
  within 15 ms per switch, so the fix was tested locally. (Owner observation.)
- **A2 — "question flow" means Quick Question.** It is the default first
  screen (`PORTAL_DESTINATIONS` order, DEC-104). In-Depth behaves the same: it
  also starts the card list on entry and already loads the shared
  `playerLabels` chunk. (Ladder 2: tested behavior.)
- **A3 — keep-alive is unchanged.** Visited tools stay mounted (REQ-067,
  DEC-095); the IDEA names it a non-goal. (Ladder 1, 5.)
- **A4 — download every tool, in tiers.** Owner verdict on the NFR-014 slot
  (edit, 2026-10-15): the player should have everything they need when they hop
  from one screen to the next, the landing screen loading first. This includes the
  question tools (from a Life Tracker landing, +56 KB shared conversation
  workspace and +15.5 KB scan chunk, gzipped). (Owner verdict.)
- **A5 — NFR-014 must be amended, not bypassed.** Its first constraint says a
  visitor never downloads the code of destinations they never open; the tiered
  download contradicts that, so it goes to the owner as an amendment. (Ladder 1.)
- **A6 — NFR-013 is not affected.** NFR-013 keeps price data off players who
  never open the balancer. The background download fetches code and the shared
  card list (which every question-screen visitor already downloads), never
  prices. (Ladder 1.)
- **A7 — no endpoint, deploy or dependency change in core.** The card list file
  itself is unchanged; compression, caching headers and trimming are follow-ups.
  (Ladder 6.)
- **A8 — no special case for data-saver mode.** The Life Tracker and Trade
  Balancer part is 17 KB, below one card image; adding a `Save-Data` branch is new
  behavior nobody asked for. (Ladder 4.)
- **A9 — the multi-second figure is not fully reproduced.** Emulation shows at
  most 0.7 s of "Loading…" per tool; a real weak cellular signal can have more
  latency than Slow 4G, which multiplies each round trip. The fix removes the
  download from the tap path whatever the network, so it holds either way.

## Touched files (build)

- `apps/frontend/src/components/portal/destinationRegistry.tsx` — production
  background-download export for every other destination; reset `loadPromise` on
  rejection; comments.
- `apps/frontend/src/lib/portal/types.ts` — only if an opt-out field is added.
- `apps/frontend/src/components/portal/DestinationOutlet.tsx` (or the portal
  shell that renders it) — schedule tier 2 then tier 3 once after first commit.
- The shared card-list load and its three consumers: Quick Question, In-Depth
  (`apps/frontend/src/components/...`) and
  `apps/frontend/src/components/trade/TradeBalancer.tsx` (`METADATA_URL`); exact
  files found at map-out.
- Tests: `destinationRegistry.test.tsx`, `DestinationOutlet.test.tsx`, the shared
  card-list load.
- Product truth at build: the three diffs in `GATE-QUESTIONS.md`.

## Acceptance criteria

Measured with `PRD/work/tool-switch-load-delay/.playwright-mcp/measure.js` (or
an equivalent rAF-timed tap) against a production build (`npm --workspace
apps/frontend run build` + `vite preview`), first visit, cache cleared:

1. Land on Quick Question, wait 3 s, tap Life Tracker: no "Loading…" frame is
   ever visible and the tool is on screen within 100 ms of the tap — at Fast 4G
   + CPU 4× and at Slow 4G + CPU 4×.
2. Then tap Trade Balancer, then Quick Question and In-Depth (from a Life
   Tracker landing too): same — no "Loading…" frame, tool on screen within
   100 ms. After the Trade Balancer opens, "Loading card list…" does not show
   when the shared card list has already arrived.
3. The first screen is not slower: the other tools' chunk requests and the
   card-list request start after the landing destination has rendered (Resource
   Timing), and "Ask a Question" appears within 50 ms of the pre-change build on
   the same profile.
4. Before the balancer is opened, there is no `GET /api/health` request. The
   card list is requested exactly once per page load, whichever screen reads it
   and whichever landing screen, and no tool is mounted by the background
   download.
5. Tapping a tool before its background download finishes shows "Loading…" only until the
   in-flight download lands, with exactly one request for that chunk.
6. A failed background download (block the chunk URL once, then unblock) leaves the tool
   working: tapping it loads and shows it. Covered by a unit test on
   `lazyDestination` (rejected preload, then a successful retry).
7. Unit tests: the background download calls every other destination's loader,
   runs once per page load, never mounts a destination, and the shared card-list
   load fetches once, is reused by all three consumers and retries after a
   failure. `npm run quality:check` passes with no
   coverage threshold lowered (NFR-012).

## Non-goals

- No change to keep-alive mounting (REQ-067, DEC-095).
- No change to the card list's content or size, and no Brotli, caching-header or
  trimming change (rest of F1, F2).
- No change to Trade Balancer price data or its per-card price fetch.
- No new loading UI; the fallback stays as specified (quiet, inside the shell).

## Follow-ups (offered separately, not in this proposal; F1 load-once and F3 folded in)

- **F1 (rest) — the card list's size on a slow network.** "Loading card list…"
  lasted 9.7 s on Slow 4G (live, first visit), because the 1.96 MB card list was
  still downloading. The load-once part is now in scope (tier 3). Still out:
  turn on Brotli compression at CloudFront (measured 1.62 MB instead of 1.96 MB,
  17% less; deploy config only); trim the list (a data-contract change under
  REQ-174).
- **F2 — caching headers.** No asset carries `Cache-Control` (`aws s3 sync` in
  `scripts/aws-deploy.sh` sets none), so repeat visits re-check files with the
  server; Life Tracker showed "Loading…" for 0.6 s on a repeat Slow 4G visit.
  Marking the hashed `/assets/*` files as cacheable for a year fixes that; a
  deploy-script change. The background download above already hides most of it.
- **F3 — folded in.** Warming the question tools (Quick Question 4.4 KB,
  In-Depth 18.6 KB, shared conversation workspace 56.2 KB, plus the 15.5 KB scan
  chunk from a Life Tracker landing, gzipped) is now tier 2 by the owner's
  verdict.
- **F4 — backend cold start for answers.** Not measured here and not part of
  the tool-switch symptom.

## Prior runs

Cited by kickoff (`IDEA.md`), not reopened: the current truth they produced
was read directly instead (NFR-014, the shared-chrome routing section, the
screen-layout fallback row, the Trade Balancer code), and the live
measurements above replace their timing claims.

- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-17.md`
  and `-2026-08-11.md` — per-tool lazy loading, the fallback, keep-alive.
- `PRD/instructions/receipts/trade-balancer-first-card-ux-2026-09-10.md` — the
  REQ-064 health ping on balancer open.
- `PRD/instructions/receipts/trade-balancer-price-slim-2026-09-08.md`,
  `compact-data-extracts-2026-09-09.md`, `card-trade-balancer-2026-08-03.md`,
  `player-life-tracker-2026-08-03.md`.
