# Gate questions — tools open without the "Loading…" screen

**Decided:** both slots are answered. NFR-014 (the code-splitting rule) is
`edit`. Q-014 is `accept`: a player who opens the app on the Life Tracker also
downloads the card list in the background (about 1.96 MB). The diffs below state
that cost and carry the Trade Balancer wording the change makes stale. No new
stable ID.

Every diff is against `PRD/sections/` at `ed3e96b8`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`. The full reasoning is
in `DESIGN-BRIEF.md`.

## NFR-014 — Every tool's code, and the card list, download in the background so tools open instantly

**What this decides:** whether the app may download everything a player needs
for the next screen in the background while they are still on the screen they
opened, in three tiers, so the first switch to any tool shows no "Loading…"
screen.

**In plain terms:** the app is split into one download per tool so the first
screen loads fast. Today's rule (NFR-014) says a player who opens one tool
never downloads the code of a tool they never open, so the first time they
switch to another tool they wait on a "Loading…" screen. Measured on the live
site, that wait is 0.2 s on a good connection and 0.7 s on a slow phone
network. The change fetches in tiers. Tier 1: the screen the player lands on,
exactly as today. Tier 2, once that screen is up and the phone is idle: the
code for every other tool, including both question tools — about 36 KB from a
Quick Question landing, about 107 KB from a Life Tracker landing. Tier 3, after
tier 2: the card list (`/data/cardMetadata.json`), which Quick Question, the
In-depth question flow and the Trade Balancer all use; it is downloaded and
read once and shared by the three screens instead of each fetching and parsing
its own copy. A player landing on a question screen or the Trade Balancer
already downloads the card list today, so tier 3 adds no data for them. A
player landing on the Life Tracker does not download it today, so tier 3 adds
about 1.96 MB for them, once per visit; the owner accepted that (Q-014). The first screen still loads exactly as fast as today. The background
download opens no tool; the Trade Balancer's wake-up ping to the server
(REQ-064) still goes only when the player opens the balancer; visited tools
stay open (REQ-067); and if a background download fails, nothing shows and the
tool loads the normal way when opened. Out of scope, offered separately:
Brotli compression, caching headers, and trimming the card list.

**What happens if you say no:** the rule stands, each tool still downloads on
its first open, and the "Loading…" screen keeps showing for 0.2–0.7 s (longer on
a weak signal) the first time a player opens each tool in a session.

### Diff 1 — `PRD/sections/non-functional-requirements.md` (NFR-014, line 239)

```diff
 - Constraints:
-  - each registered destination is behind a `React.lazy` boundary, so a visitor who opens one destination does not download the code of destinations they never open
+  - each registered destination is behind a `React.lazy` boundary, so the **initial** payload carries only the destination the visitor lands on; the code of other destinations never delays the first screen
+  - tiered background download: tier 1 is the landing destination, loaded as today. Tier 2: once the landing destination has rendered and the browser is idle, the code of every other registered destination downloads in the background (Life Tracker, Trade Balancer, Quick Question, In-Depth Question), so the first switch to any of them shows no load fallback. Tier 3, requested only after every tier-2 request has started: the card list `/data/cardMetadata.json` is downloaded and read once per page and shared by Quick Question, the In-Depth question flow and the Trade Balancer, instead of each fetching and parsing its own copy. A visitor who lands on Quick Question, In-Depth Question or the Trade Balancer already downloads the card list, so tier 3 adds no data for them; a visitor who lands on the Life Tracker downloads it in the background too, so their first switch to a card-search screen does not wait on it. Each of the three screens keeps its own loading state, failure message and search index over the shared list. Background download never mounts a destination, never fetches a destination's other data (scan data such as `cardhashes.bin` stays on first scan), and never fires its effects (the Trade Balancer's REQ-064 health-check ping still fires only when the balancer opens; keep-alive mounting, REQ-067, is unchanged). A download already finished or in flight is reused, never repeated. A failed background download is silent and leaves the destination, or the card list, to load on first open as before, retrying the download. Adding a destination to the tier-2 set is a registry-entry concern, not chunk configuration
+  - cost is measured, not estimated (live site, 2026-10-15, gzipped bytes over the wire): tier 2 from a Quick Question landing is about 36 KB — Life Tracker 8.1 KB, shared player-labels 0.5 KB, Trade Balancer 8.4 KB, In-Depth 18.7 KB; from a Life Tracker landing it is about 107 KB — Quick Question 4.6 KB, scan review 3.7 KB, shared conversation workspace 56.2 KB, scan 15.7 KB, In-Depth 18.7 KB, Trade Balancer 8.4 KB. Tier 3 adds nothing to a Quick Question, In-Depth or Trade Balancer landing, and about 1.96 MB, once per visit, to a Life Tracker landing. Out of scope: Brotli compression, caching headers, trimming the card list
```

```diff
-  - this is a **code**-splitting posture only; it neither replaces nor weakens the existing data-artifact lazy load (`cardhashes.bin` on first scan, NFR-010). The Trade Balancer no longer has a lazy-loaded price artifact — its prices are fetched per card from the backend and its only up-front data cost is the shared `cardMetadata` index (NFR-013, REQ-066)
+  - this is a **code**-splitting posture plus one shared data download, the tier-3 card list; it neither replaces nor weakens the existing data-artifact lazy load (`cardhashes.bin` on first scan, NFR-010), which is never part of the background download. The Trade Balancer no longer has a lazy-loaded price artifact — its prices are fetched per card from the backend and its only up-front data cost is the shared `cardMetadata` index (NFR-013, REQ-066), loaded once per page for all three screens that read it
```

```diff
-  - the `Suspense` fallback must not flash on every destination switch: keep-alive mounting (DEC-095, preserved by DEC-157) means a destination suspends only on first visit
+  - the `Suspense` fallback must not flash on every destination switch: keep-alive mounting (DEC-095, preserved by DEC-157) means a destination suspends only on first visit, and a destination whose code has already arrived from the background download does not suspend even then
```

```diff
 - Dependencies:
   - DEC-157
   - REQ-140
   - NFR-010
   - NFR-012
   - NFR-013
   - REQ-066
+  - REQ-064
+  - REQ-067
 - Notes:
```

### Diff 2 — `PRD/sections/shared-chrome/README.md` (Destination routing and the load fallback, line 91)

```diff
 - Built: each destination sits behind a `React.lazy` boundary with its **own**
   per-destination `Suspense` fallback (a single boundary around the outlet would
   blank already-loaded siblings). The fallback occupies the destination content
   region **inside** the existing shell — the shell, corner rail, and brand block
   stay mounted and visible; it never replaces or resizes the shell and never
   renders as a full-viewport takeover. It reserves the region so the shell does
   not jump height when the chunk resolves, and appears at most **once per
   destination per session** (keep-alive means a revisited destination is already
-  loaded). It stays quiet — no branded splash, progress bar, or motion beyond the
-  CSS-motion rules. (DEC-157, NFR-014)
+  loaded), and not at all for a destination whose code arrived from the background download before the
+  player opened it. It stays quiet — no branded splash, progress bar, or motion
+  beyond the CSS-motion rules. (DEC-157, NFR-014)
+- Built: tiered background download — tier 1 is the landing destination as
+  today. Tier 2: once it has rendered and the browser is idle, the code of every
+  other destination (Life Tracker, Trade Balancer, Quick Question, In-Depth
+  Question) downloads in the background, so a player's first switch to any tool
+  opens with no load fallback. Tier 3, after tier 2: the card list is downloaded
+  and read once and shared by Quick Question, In-Depth Question and the Trade
+  Balancer, on every landing including the Life Tracker. Code and the shared
+  card list only: no destination mounts, fetches its other data, or sends the
+  balancer's health-check ping (REQ-064) until the player opens it, and visited
+  destinations stay open (REQ-067). A failed background download is silent and
+  the destination loads on first open as before. Measured 2026-10-15 on the live
+  site: the first-open fallback was 0.2 s unthrottled and 0.7 s on a Slow 4G
+  phone profile; with the Life Tracker and Trade Balancer code already
+  downloaded, each was on screen in about 40 ms. (NFR-014)
```

### Diff 3 — `PRD/sections/screen-layout.md` (Destination load fallback row, line 73)

```diff
-| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback. Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
+| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback — and not at all for a destination whose code the background download has already fetched (every destination, once its code has arrived). Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
```

### Diff 4 — the Trade Balancer's wake-up ping wording (REQ-064; consequence of the verdict, added at define after the re-grade)

The ping's behaviour does not change: one request when the balancer opens,
never before. Seven hunks across five files. Six of them say the ping overlaps
the card-list download (four as "while the card list downloads", one as "with
the `cardMetadata` download", one as "overlaps the card-list download"); the
seventh (`trade-balancer/README.md:196`) says the list is loaded per screen.
With tier 3 the list has usually arrived before the balancer opens, so the
overlap is the player's typing, plus the download only when it has not
finished. These hunks say so. Every other line the widened grep finds is
dispositioned in `DESIGN-BRIEF.md`, `## Product truth dispositions`.

`PRD/sections/trade-balancer/README.md` (line 59):

```diff
 - Built: on open the balancer fires **one fire-and-forget warm-up request** to
-  the backend's existing health check (`GET /api/health`) beside its
-  `cardMetadata` load, so a cold backend wakes while the card list downloads
-  and the player types instead of that wait landing on the first card's price.
+  the backend's existing health check (`GET /api/health`) beside its read of
+  the shared `cardMetadata` list, so a cold backend wakes while the player
+  types — and while the list finishes downloading, when it has not already
+  arrived in the background (NFR-014 tier 3) — instead of that wait landing on
+  the first card's price.
   It carries no product data, renders no UI, and never blocks or errors search
   when it fails or when no backend is running. (REQ-064)
```

`PRD/sections/trade-balancer/README.md` (line 185):

```diff
 - First-card wait: the balancer's warm-up ping on open overlaps the backend's
   cold start (measured ~4.2 s cold against ~0.2 s warm on the live price route)
-  with the `cardMetadata` download and the player's typing, so the wait is
-  hidden rather than removed. A scheduled keep-warm ping is deliberately out of
+  with the player's typing, and with the `cardMetadata` download when the list
+  has not already arrived in the background (NFR-014 tier 3), so the wait is
+  hidden rather than removed. A scheduled keep-warm ping is deliberately out of
   scope. (REQ-064)
```

`PRD/sections/trade-balancer/README.md` (line 196):

```diff
 - Data footprint: no up-front price download — the balancer's only up-front
-  frontend cost is the shared `cardMetadata` index (REQ-174), the same list
-  MTG Assistant and Quick Lookup already load. A card's prices are fetched
+  frontend cost is the shared `cardMetadata` index (REQ-174), the same list
+  MTG Assistant and Quick Lookup read, loaded once per page and shared by all
+  three (NFR-014 tier 3). A card's prices are fetched
   from the backend once per card — on the suggestion tap on a manual search,
```

`PRD/sections/functional-requirements.md` (REQ-064, line 1512):

```diff
-  - when the view opens it issues **one fire-and-forget warm-up request** to the backend's existing health check (`GET /api/health`) alongside its `cardMetadata` load, so a cold backend wakes while the card list downloads and the player types instead of that wait landing on the first card's price fetch. It sends and reads no product data, renders no UI, and never blocks, disables, or surfaces an error on search when it fails or when no backend is running (mock-default local dev unaffected)
+  - when the view opens it issues **one fire-and-forget warm-up request** to the backend's existing health check (`GET /api/health`) alongside its read of the shared `cardMetadata` list, so a cold backend wakes while the player types — and while the list finishes downloading, when it has not already arrived in the background (NFR-014 tier 3) — instead of that wait landing on the first card's price fetch. It sends and reads no product data, renders no UI, and never blocks, disables, or surfaces an error on search when it fails or when no backend is running (mock-default local dev unaffected)
```

`PRD/sections/user-flows.md` (Trade Balancer flow, line 199):

```diff
-  1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them. On open the balancer also sends one fire-and-forget warm-up request to the backend's health check, so a cold backend wakes while the card list downloads and the player types; it shows nothing and is ignored if it fails (REQ-064).
+  1. The Trade Balancer opens with two sides (**Side A** and **Side B**), each an empty card list, and a running total per side plus the difference between them. On open the balancer also sends one fire-and-forget warm-up request to the backend's health check, so a cold backend wakes while the player types (and while the shared card list finishes downloading, when it has not already arrived in the background — NFR-014); it shows nothing and is ignored if it fails (REQ-064).
```

`PRD/sections/system-map.md` (Trade Balancer entry, line 564):

```diff
-- Summary: Ephemeral two-sided card-value comparison. The screen opens with only the shared `cardMetadata` index in hand and fires one fire-and-forget warm-up ping at the existing `GET /api/health` so a cold backend wakes while the card list downloads (REQ-064). Each side is a list of card entries built via scan or manual search, priced by a read-only backend fetch (`GET /api/cards/:oracleId/prices`, cached per session): a scanned card is added immediately and priced on add, while a manual search fetches that card's printings when the suggestion is tapped and adds the card with the printing the player picks. Each entry resolves to a specific printing (the picked printing on search, the scanned printing on scan, changeable via the same picker either way; the picker heads with the card's printing count, lists newest release first, region-scrolls, lazy-loads row images, and filters by set above 8 printings), with a foil toggle (non-foil ↔ `usd_foil`) whose mode auto-selects from the printing's available prices, a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices, and a failed price fetch, both default to $0 with a distinct color + caution-triangle indicator; a failed fetch also carries a retry affordance, and a pre-add fetch failure adds the card in that same state rather than blocking the add. Scanning is per-side and one camera at a time; when the camera is unavailable the surface closes, manual search stays fully functional, and the reason is surfaced (DEC-050). Printing choice is a pricing/display concern only — it never reaches prompt context, rulings, or any request payload, and the AI answer path (`POST /api/ask-ai`) is untouched. The snapshot is surfaced as date-level copy (`Prices as of 5 June 2026`) formatted from the response's ISO `snapshotDate`, never the raw timestamp, so it cannot read as a live quote; an unparseable value omits the line rather than printing raw artifact data (REQ-145).
+- Summary: Ephemeral two-sided card-value comparison. The screen opens with only the shared `cardMetadata` index in hand (loaded once per page and shared with the question tools, often already downloaded in the background — NFR-014) and fires one fire-and-forget warm-up ping at the existing `GET /api/health` so a cold backend wakes while the player types (REQ-064). Each side is a list of card entries built via scan or manual search, priced by a read-only backend fetch (`GET /api/cards/:oracleId/prices`, cached per session): a scanned card is added immediately and priced on add, while a manual search fetches that card's printings when the suggestion is tapped and adds the card with the printing the player picks. Each entry resolves to a specific printing (the picked printing on search, the scanned printing on scan, changeable via the same picker either way; the picker heads with the card's printing count, lists newest release first, region-scrolls, lazy-loads row images, and filters by set above 8 printings), with a foil toggle (non-foil ↔ `usd_foil`) whose mode auto-selects from the printing's available prices, a quantity/multiples, and one-tap removal. Side total = `Σ qty × (foil ? usdFoil : usd)`; the view shows each side's total and the live difference. Missing prices, and a failed price fetch, both default to $0 with a distinct color + caution-triangle indicator; a failed fetch also carries a retry affordance, and a pre-add fetch failure adds the card in that same state rather than blocking the add. Scanning is per-side and one camera at a time; when the camera is unavailable the surface closes, manual search stays fully functional, and the reason is surfaced (DEC-050). Printing choice is a pricing/display concern only — it never reaches prompt context, rulings, or any request payload, and the AI answer path (`POST /api/ask-ai`) is untouched. The snapshot is surfaced as date-level copy (`Prices as of 5 June 2026`) formatted from the response's ISO `snapshotDate`, never the raw timestamp, so it cannot read as a live quote; an unparseable value omits the line rather than printing raw artifact data (REQ-145).
```

`PRD/sections/integrations-and-data.md` (`GET /api/health` purposes, line 165):

```diff
 - uptime verification
-- the Trade Balancer's fire-and-forget warm-up ping when the screen opens, so the backend's cold start overlaps the card-list download instead of the first card's price fetch (REQ-064). No product data travels in either direction, the response is discarded, and a failure is ignored
+- the Trade Balancer's fire-and-forget warm-up ping when the screen opens, so the backend's cold start overlaps the player's typing — and the card-list download, when the list has not already arrived in the background (NFR-014 tier 3) — instead of the first card's price fetch (REQ-064). No product data travels in either direction, the response is discarded, and a failure is ignored
```

- Verdict: edit
- Reason: (owner, 2026-10-15, in session; transcribed by the driver) Widen from two tools to a tiered download so the player has everything they need when they hop from one screen to the next, with the first screen they open loading first. Tier 1: the screen the player lands on, exactly as today. Tier 2, once that screen is up and the phone is idle: the code for every other tool (Life Tracker, Trade Balancer, and the two question tools — this folds in follow-up F3). Tier 3: the card list (`/data/cardMetadata.json`), which Quick Question, the In-depth question flow, and the Trade Balancer all use — downloaded and read once, then shared by all three screens instead of each fetching and parsing its own copy (folds in the load-once part of follow-up F1). A player landing on a question screen already downloads the card list today, so tier 3 adds no data for them. Everything else stands: the background download opens no tool, the Trade Balancer's wake-up ping still fires only when the balancer opens (REQ-064), visited tools stay open (REQ-067), and a failed background download falls back to the normal first-open load. Brotli compression, caching headers, and trimming the list (rest of F1, F2) stay out of scope.

## Gate verdicts

Applied by `graph-gate-review` on 2026-10-15 (attempt 1: NFR-014 `edit`; attempt 2: blocker Q-014 `accept`). 2 items: 1 accept, 1 edit, 0 reject. The driver copies this table into `GRAPH-RUN.md`.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `NFR-014` | edit | "Widen from two tools to a tiered download so the player has everything they need when they hop from one screen to the next" — tier 1 landing screen, tier 2 code for every other tool, tier 3 shared card list; Brotli, caching headers, list trimming out of scope |
| `Q-014` | accept | "Q-014 yes, Life Tracker landings download it too." — tier 3 (the shared card list, about 1.96 MB) runs on a Life Tracker landing; Diffs 1-2 stand as written |

The finalized NFR-014 text is Diffs 1-3 above, already rewritten to the tiered download. Diff 4 and the cost lines in Diff 1 were added at define after the re-grade (QUALITY-CHECK.md findings 1 and 3); Diff 4's `integrations-and-data.md` hunk was added at the second define pass, after the second re-grade found it missing. Diffs 1-2 carry the accepted "yes" on Q-014 and need no change.

## Blocker questions

### Q-014 — does a player who opens the app on the Life Tracker also download the card list in the background?

**What this decides:** whether tier 3 (the shared card list, about 1.96 MB)
runs for a player whose first screen is the Life Tracker, or only for players
who land on a screen that already downloads it.

**In plain terms:** the card list is the file behind every "Add card" search —
in Quick Question, the In-depth question flow and the Trade Balancer. Today a
player who opens the app on one of those screens downloads it straight away. A
player who opens the app on the Life Tracker never downloads it unless they
later open one of those screens; then they wait for it ("Loading card list…" in
the balancer: about 0.7 s on Fast 4G, up to 9.7 s on a slow phone network,
measured on the live site). Your NFR-014 answer said the player should have
everything they need when they hop to the next screen, and also that tier 3
"adds no data" — true for a question-screen landing, not for a Life Tracker
landing, where it adds about 1.96 MB once per visit (measured 2026-10-15: a
Life Tracker landing today fetches no card list). **Yes** means a Life Tracker
player's first hop to a card-search screen never waits on the list, at the cost
of that download even if they only track life. **No** means a Life Tracker
landing keeps today's data use, and the list downloads (once, shared) when they
first open a card-search screen, so that first search can still wait on a slow
network.

**Recommendation:** yes. It is what your "everything they need when they hop"
answer asks for, the Life Tracker → Trade Balancer hop is the path you reported,
and on a slow network the list is the longest wait on it. 1.96 MB is what every
question-screen player already downloads today. No data-saver exception is
proposed.

**What happens if you say no:** tier 3 is skipped on a Life Tracker landing.
Diff 1's tier-3 sentence "a visitor who lands on the Life Tracker downloads it
in the background too, so their first switch to a card-search screen does not
wait on it" becomes "a visitor who lands on the Life Tracker does not download
it until they first open one of those three screens, as today"; the cost line
drops the 1.96 MB clause; Diff 2's "on every landing including the Life
Tracker" becomes "on every landing except the Life Tracker". Tier 2 (code) is
unaffected either way.

**Why it meets the genuine-blocker test (all three):** (1) the answers differ by
about 1.96 MB of data per visit for Life Tracker players, a data-handling
change; (2) the PRD points both ways — your NFR-014 verdict asks for everything
a hop needs, while NFR-013's pattern is that a tool's data must not cost players
who never open it, and the verdict's own "adds no data" premise does not cover
this landing; (3) building either version silently decides the other.

Answer `accept` for yes (recommended) or `reject` for no.

- Verdict: accept
- Reason: (owner, 2026-10-15, in session; transcribed by the driver) Q-014 yes, Life Tracker landings download it too.
