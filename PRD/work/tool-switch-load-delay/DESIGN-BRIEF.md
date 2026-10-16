# Design brief — tools open without the "Loading…" screen

**Decide:** one open question in `GATE-QUESTIONS.md`, Q-014: should a player
who opens the app on the Life Tracker also download the card list in the
background (about 1.96 MB)? Recommendation: yes. The NFR-014 slot (the
code-splitting rule) is answered: owner verdict edit (2026-10-15), widened from
two tools to a three-tier background download. This brief is written for a
"yes" on Q-014; the lines a "no" changes are marked.

## The answer in one paragraph

The "Loading…" screen a player sees when first opening the Life Tracker or the
Trade Balancer is that tool's code downloading. Each tool is a separate small
download (about 8 KB) that today starts only when the player taps it. Measured
on the live site, the wait is 0.2 s on a good connection and 0.7 s on a slow
phone network. The fix downloads in three tiers once the player's first screen
is up. Tier 1 is the landing screen, as today. Tier 2 is the code for every
other tool, including both question tools: about 36 KB from a Quick Question
landing, about 107 KB from a Life Tracker landing. Tier 3 is the card list,
downloaded and read once and shared by Quick Question, In-Depth and the Trade
Balancer. It adds nothing for a player who lands on one of those three screens,
and about 1.96 MB for a player who lands on the Life Tracker (Q-014). The tap
then shows the tool at once. Measured with the fix approximated for two tools
on a production build: 688 ms → 41 ms for the Life Tracker, 685 ms → 34 ms for
the Trade Balancer, on a slow phone profile; the question tools are measured at
build. The Trade Balancer's "Loading card list…" on a slow network (up to
9.7 s) shrinks because tier 3 starts the card list download early, but the
list's size (Brotli, trimming) is not changed: out of scope, offered below as F1.

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
6. A player who opens the app on the Life Tracker downloads no card list at
   all until they open a card-search screen (measured, live).

Full numbers and method: `evidence/measurements.md`.

## What the player sees after

1. Same first screen, same speed. Nothing extra downloads until it is up.
2. While the player reads or types, the code for every other tool downloads
   quietly (tier 2): about 36 KB from a Quick Question landing, about 107 KB
   from a Life Tracker landing. Then the card list (tier 3) is downloaded and
   read once, shared by the three screens that use it. For a question-screen
   or Trade Balancer landing it is already downloading today; for a Life
   Tracker landing it is a new download of about 1.96 MB (Q-014; on a "no" it
   is skipped there).
3. Tapping any tool shows it straight away — no "Loading…" screen, on any
   connection, as long as the background download has finished (about 0.2 s on
   Fast 4G, 0.7 s on Slow 4G after the first screen).
4. If the player taps before it finishes, they see "Loading…" only for the time
   left, and the download is not repeated.
5. Each card-search screen looks and fails exactly as today: Quick Question
   still says "Card search is unavailable. You can still ask without a card."
   when the list cannot load, the Trade Balancer still shows "Loading card
   list…" and its own error, In-Depth still shows nothing. Those states are
   shorter or gone when the list has already arrived; the list's size is
   unchanged, so a slow network can still wait (rest of follow-up F1).

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
- Amend NFR-014 and the places that describe the fallback (shared-chrome spec,
  screen-layout row) and the Trade Balancer's wake-up ping overlap (REQ-064
  wording, four files) — proposal in `GATE-QUESTIONS.md`, Diffs 1-4.

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
2. **Tiered download after the first screen, in order.** Export a production
   background-download function from the registry that calls `preload()` for
   every other destination (tier 2), then starts the shared card-list load
   (tier 3, see 7). Order: every tier-2 `preload()` call is made before the
   tier-3 request is issued, so the code requests start first and the 1.96 MB
   list never queues ahead of them; tier 3 does not wait for tier 2 to finish
   (on HTTP/2 they share the connection). Call it once per page load, after the
   landing destination has committed, when the browser is idle:
   `requestIdleCallback` with a timeout where available, otherwise a short
   `setTimeout` after mount (Safari lacks `requestIdleCallback` on older
   versions). `DestinationOutlet` (or the portal shell that renders it) is the
   natural home: it already owns the mounted-destination list. Exact delay and
   host component are equivalent technical choices for the implementer.
   On a "no" to Q-014, tier 3 is skipped when the landing destination is the
   Life Tracker; nothing else changes.
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
   renders or mounts a tool or fetches its other data. Importing the scan chunk
   downloads no scan data (measured: no `cardhashes.bin` or `cardScanMap.json`
   request follows it). The Trade Balancer's health ping (REQ-064) stays in its
   mount effect and fires only when the player opens it. The keep-alive
   mounting in `DestinationOutlet` (`mountedDestinationIds`) is unchanged.
6. **Comments and tests.** Update the "production never preloads" comments in
   `destinationRegistry.tsx` (`lazyDestination`, `preloadPortalDestinations`).
   The test-only `preloadPortalDestinations` seam in
   `apps/frontend/src/test/setup.ts` stays as is.
7. **One shared card list (tier 3) — the contract.** Today each of the three
   screens fetches `/data/cardMetadata.json` in its own mount effect, parses
   it, and aborts its fetch on unmount: Quick Question
   (`components/portal/quick-lookup/QuickLookupApp.tsx`, the
   `loadCardMetadata` effect), In-Depth (`components/portal/MtgAssistantApp.tsx`,
   the `loadMetadata` effect) and the Trade Balancer
   (`components/trade/TradeBalancer.tsx`, the `METADATA_URL` effect). The
   shared load replaces only the fetch-and-parse inside those effects:
   - **What it hands over:** the parsed `CardMetadataItem[]` array, nothing
     else. A module-level load (new file under `apps/frontend/src/lib/`, name
     at map-out) exposes a load call that returns a promise of the array,
     reusing an in-flight or finished load, and a synchronous read that returns
     the array when it has already arrived (else nothing).
   - **What each screen keeps:** its own `cardMetadata` state, its own
     `isMetadataLoading` flag, its own failure handling and copy, and its own
     derived data. Quick Question still sets "Card search is unavailable. You
     can still ask without a card." on failure. In-Depth still logs the error to
     the console and shows nothing. The Trade Balancer still shows "Loading card
     list…" while waiting, still sets `METADATA_LOAD_ERROR_COPY` plus the reason
     on failure, and still builds its own search index
     (`buildOracleSearchIndex`) from the array.
   - **No loading flash when the list is already here:** each screen seeds its
     state from the synchronous read on first render, so a screen opened after
     tier 3 has finished renders with the list in hand and its loading flag
     false — no one-frame "Loading card list…".
   - **Unmount:** a screen's unmount stops that screen from applying the result
     (an "is still mounted" guard in place of today's `AbortController`); it
     never cancels the shared download, which another screen or tier 3 may be
     waiting on.
   - **Failure:** a failed download (network error or non-2xx response) rejects
     every waiting caller with the error and clears the shared load, so the
     next caller — the next screen to open, or the next page load — starts a
     fresh download. Tier 3's own failure is silent. A screen already open when
     the download fails shows its failure state, as today; it does not retry
     by itself (today it does not either).
   - **Tests:** the module exposes a test-only reset, called from
     `apps/frontend/src/test/setup.ts` `afterEach`, so a list cached by one test
     never leaks into the next (several tests mock the card-list `fetch`,
     e.g. `test/interactionFlowsHarness.ts`).

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
  question tools: from a Life Tracker landing, tier 2 is about 107 KB gzipped,
  mostly the 56.2 KB shared conversation workspace and the 15.7 KB scan chunk
  (measured live, `evidence/measurements.md`). (Owner verdict.)
- **A5 — NFR-014 must be amended, not bypassed.** Its first constraint says a
  visitor never downloads the code of destinations they never open; the tiered
  download contradicts that, so it goes to the owner as an amendment. (Ladder 1.)
- **A6 — NFR-013 is not affected.** NFR-013 keeps price data off players who
  never open the balancer. The background download fetches code and the shared
  card list, never prices; the card list is identity data (REQ-174), not price
  data. It is a new download only for a Life Tracker landing, which Q-014 puts
  to the owner. (Ladder 1.)
- **A7 — no endpoint, deploy or dependency change in core.** The card list file
  itself is unchanged; compression, caching headers and trimming are follow-ups.
  (Ladder 6.)
- **A8 — no special case for data-saver mode.** Tier 2 is 36–107 KB, below a
  couple of card images. Tier 3's 1.96 MB is new data only for a Life Tracker
  landing; whether that player downloads it is Q-014, and a `Save-Data`
  exception would be new behavior nobody asked for, so none is proposed.
  (Ladder 4.)
- **A9 — the multi-second figure is not fully reproduced.** Emulation shows at
  most 0.7 s of "Loading…" per tool; a real weak cellular signal can have more
  latency than Slow 4G, which multiplies each round trip. The fix removes the
  download from the tap path whatever the network, so it holds either way.
- **A10 — Life Tracker landing and the card list: open (Q-014).** The owner's
  verdict asks for everything a hop needs, and states tier 3 adds no data for a
  question-screen landing. It does add about 1.96 MB for a Life Tracker
  landing, which the verdict did not weigh. That meets the genuine-blocker test
  (data handling; the verdict and NFR-013's pattern point opposite ways; either
  build decides it), so it is asked, not assumed. Everything else in this brief
  holds under either answer; the one switch is design item 2.
- **A11 — each screen's loading and failure behaviour is preserved.** The
  shared load hands over the array only; flags, copy and index stay per screen
  (design item 7). (Ladder 5: preserve user-visible behavior.)

## Product truth dispositions

Every `PRD/sections/` line that mentions the card list download or the
balancer's ping overlap (`grep -rn -e cardMetadata -e "card list"` and
`"while the card list downloa"` over `PRD/sections/`), one row per hit that
tier 3 could touch:

| Spot | Disposition |
| --- | --- |
| `non-functional-requirements.md:239`, `:245`, `:246`, Dependencies | Diff 1 |
| `shared-chrome/README.md:91` | Diff 2 |
| `screen-layout.md:73` | Diff 3 |
| `trade-balancer/README.md:59-64`, `:185-189`, `:196-198` | Diff 4 |
| `functional-requirements.md:1512` (REQ-064), `user-flows.md:199`, `system-map.md:564` | Diff 4 |
| `non-functional-requirements.md:217` (NFR-013) | Stays true: it is about price data; "the balancer's only up-front frontend cost is the slim shared `cardMetadata` index" still holds, and tier 3 fetches no price data. |
| `integrations-and-data.md:327` | Stays true: "users who never open the balancer pay no startup cost" is about price data, which tier 3 never fetches. |
| `trade-balancer/data/cardPrintingPrices.md:131` | Stays true: same price-data statement as NFR-013. |
| `non-functional-requirements.md:328-330` (NFR-019) | Stays true: a size gate on the list downloaded on entry to MTG Assistant and Quick Lookup; tier 3 changes neither the file nor those entries. |
| `user-flows.md:197`, `:564`, `:568`, `trade-balancer/README.md:82`, `functional-requirements.md:1575` (REQ-066) | Stays true: they say the balancer reads the shared index; it still does, now loaded once. |
| `functional-requirements.md:1060` (REQ-049) | Stays true: "runtime load unchanged" bounds REQ-049's own data-build change, which this does not reopen. |
| `functional-requirements.md:36`, `:43` | Stays true: matching still runs in the browser over the same list. |

## Touched files (build)

- `apps/frontend/src/components/portal/destinationRegistry.tsx` — production
  background-download export for every other destination; reset `loadPromise` on
  rejection; comments.
- `apps/frontend/src/lib/portal/types.ts` — only if an opt-out field is added.
- `apps/frontend/src/components/portal/DestinationOutlet.tsx` (or the portal
  shell that renders it) — schedule tier 2 then tier 3 once after first commit.
- A new shared card-list module under `apps/frontend/src/lib/` and its three
  consumers: `components/portal/quick-lookup/QuickLookupApp.tsx`,
  `components/portal/MtgAssistantApp.tsx`, `components/trade/TradeBalancer.tsx`.
- `apps/frontend/src/test/setup.ts` — reset the shared card list after each test.
- Tests: `destinationRegistry.test.tsx`, `DestinationOutlet.test.tsx`, the shared
  card-list module, and the three consumers' existing card-list tests.
- Product truth at build: Diffs 1-4 in `GATE-QUESTIONS.md`, adjusted per Q-014's
  answer.

## Acceptance criteria

Measured with an rAF-timed tap (a script that records on every animation frame
when "Loading…" appears and when the tool is on screen; the define run's
gitignored `.playwright-mcp/measure.js` is one such script, not shipped) against
a production build (`npm --workspace apps/frontend run build` + `vite
preview`), first visit, cache cleared:

1. Land on Quick Question, wait 3 s, tap Life Tracker: no "Loading…" frame is
   ever visible and the tool is on screen within 100 ms of the tap — at Fast 4G
   + CPU 4× and at Slow 4G + CPU 4×.
2. Continue from criterion 1: tap Trade Balancer, then In-Depth, then Quick
   Question — same, no "Loading…" frame, each on screen within 100 ms. When
   the Trade Balancer opens after the card list has arrived, "Loading card
   list…" is never visible, not even for one frame.
3. **Tier order.** Resource Timing on a Quick Question landing and on a Life
   Tracker landing: every tier-2 chunk request (`startTime`) starts after the
   landing destination has rendered, and before the tier-3
   `/data/cardMetadata.json` request on the Life Tracker landing. (On a
   question landing the list is requested by the landing screen itself, as
   today.)
4. **Life Tracker landing.** Land on the Life Tracker, wait 3 s on Fast 4G +
   CPU 4×, then tap Quick Question, then In-Depth, then Trade Balancer: each
   on screen within 100 ms with no "Loading…" frame; `/data/cardMetadata.json`
   is requested exactly once for the page; the Trade Balancer shows no
   "Loading card list…" frame. On a "no" to Q-014: no card-list request before
   the first card-search screen opens, then exactly one.
5. The first screen is not slower: "Ask a Question" appears at about the same
   time as on the pre-change build on the same profile. Read it as a trend
   over three runs each, not a hard per-run threshold; a consistent slowdown
   over 50 ms fails.
6. Before the balancer is opened, there is no `GET /api/health` request. The
   card list is requested exactly once per page load, whichever screen reads
   it and whichever landing screen, and no tool is mounted by the background
   download.
7. Tapping a tool before its background download finishes shows "Loading…" only until the
   in-flight download lands, with exactly one request for that chunk.
8. A failed background download (block the chunk URL once, then unblock) leaves the tool
   working: tapping it loads and shows it. Covered by a unit test on
   `lazyDestination` (rejected preload, then a successful retry).
9. **Each card-search screen behaves as today** (component tests, existing
   ones kept green):
   - Quick Question: card search works once the list arrives; when the list
     fails to load it shows "Card search is unavailable. You can still ask
     without a card." and the player can still ask.
   - In-Depth: card search in the zone step works; a failed list shows no
     message (the error is logged, as today).
   - Trade Balancer: "Loading card list…" while waiting, search disabled until
     the list arrives, search finds cards by name once it has; a failed list
     shows its existing error copy with the reason.
   - A screen that unmounts while the list is downloading does not cancel it
     for another screen still waiting.
10. Unit tests: the background download calls every other destination's
    loader, makes every tier-2 call before the tier-3 call, runs once per page
    load, and never mounts a destination; the shared card-list load fetches
    once, is reused by all three consumers, hands a screen the finished list
    synchronously, and after a failure the next call fetches again.
    `npm run quality:check` passes with no coverage threshold lowered (NFR-012).

## Non-goals

- No change to keep-alive mounting (REQ-067, DEC-095).
- No change to the card list's content or size, and no Brotli, caching-header or
  trimming change (rest of F1, F2).
- No change to Trade Balancer price data or its per-card price fetch.
- No new loading UI; the fallback stays as specified (quiet, inside the shell).
- No change to any card-search screen's loading or failure copy.

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
- **F3 — folded in.** Warming the question tools (Quick Question 4.6 KB,
  In-Depth 18.7 KB, shared conversation workspace 56.2 KB, plus the 15.7 KB scan
  chunk and 3.7 KB scan review from a Life Tracker landing, gzipped) is now
  tier 2 by the owner's verdict.
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
