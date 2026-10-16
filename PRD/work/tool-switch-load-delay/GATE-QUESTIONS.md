# Gate questions — tools open without the "Loading…" screen

**Decide:** one slot below, an amendment to an existing requirement (NFR-014,
the code-splitting rule). No new stable ID. No blocker.

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
code for every other tool, including both question tools. Tier 3: the card
list (`/data/cardMetadata.json`), which Quick Question, the In-depth question
flow and the Trade Balancer all use; it is downloaded and read once and shared
by the three screens instead of each fetching and parsing its own copy. A
player landing on a question screen already downloads the card list today, so
tier 3 adds no data for them. The first screen still loads exactly as fast as
today. The background download opens no tool; the Trade Balancer's wake-up ping
to the server (REQ-064) still goes only when the player opens the balancer;
visited tools stay open (REQ-067); and if a background download fails, nothing
shows and the tool loads the normal way when opened. Out of scope, offered
separately: Brotli compression, caching headers, and trimming the card list.

**What happens if you say no:** the rule stands, each tool still downloads on
its first open, and the "Loading…" screen keeps showing for 0.2–0.7 s (longer on
a weak signal) the first time a player opens each tool in a session.

### Diff 1 — `PRD/sections/non-functional-requirements.md` (NFR-014, line 239)

```diff
 - Constraints:
-  - each registered destination is behind a `React.lazy` boundary, so a visitor who opens one destination does not download the code of destinations they never open
+  - each registered destination is behind a `React.lazy` boundary, so the **initial** payload carries only the destination the visitor lands on; the code of other destinations never delays the first screen
+  - tiered background download: tier 1 is the landing destination, loaded as today. Tier 2: once the landing destination has rendered and the browser is idle, the code of every other registered destination downloads in the background (Life Tracker, Trade Balancer, Quick Question, In-Depth Question), so the first switch to any of them shows no load fallback. Tier 3: the card list `/data/cardMetadata.json` is downloaded and read once and shared by Quick Question, the In-Depth question flow and the Trade Balancer, instead of each fetching and parsing its own copy; a visitor who lands on a question destination already downloads it, so tier 3 adds no data for them. Background download never mounts a destination, never fetches a destination's other data, and never fires its effects (the Trade Balancer's REQ-064 health-check ping still fires only when the balancer opens; keep-alive mounting, REQ-067, is unchanged). A download already finished or in flight is reused, never repeated. A failed background download is silent and leaves the destination to load on first open as before, retrying the download. Adding a destination to the tier-2 set is a registry-entry concern, not chunk configuration
+  - cost is measured, not estimated: tier 2 from a Quick Question landing is about 17 KB gzipped for Life Tracker (8.1 KB), shared player-labels (0.5 KB) and Trade Balancer (8.4 KB) plus the question tools' chunks; from a Life Tracker or Trade Balancer landing the question tools add a shared conversation workspace (56.2 KB) and the scan chunk (15.5 KB) (2026-10-15 build). Out of scope: Brotli compression, caching headers, trimming the card list
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
+  - REQ-064
+  - REQ-067
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
+  opens with no load fallback. Tier 3: the card list is downloaded and read once
+  and shared by Quick Question, In-Depth Question and the Trade Balancer. Code and
+  the shared card list only: no destination mounts, fetches its other data, or
+  sends the balancer's health-check ping (REQ-064) until the player opens it, and
+  visited destinations stay open (REQ-067). A failed background download is
+  silent and the destination loads on first open as before. Measured 2026-10-15
+  on the live site: the first-open fallback was 0.2 s unthrottled and 0.7 s on a
+  Slow 4G phone profile; with the code already downloaded the tool was on screen
+  in about 40 ms. (NFR-014)
```

### Diff 3 — `PRD/sections/screen-layout.md` (Destination load fallback row, line 73)

```diff
-| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback. Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
+| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback — and not at all for a destination whose code the background download has already fetched (every destination, once its code has arrived). Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
```

- Verdict: edit
- Reason: (owner, 2026-10-15, in session; transcribed by the driver) Widen from two tools to a tiered download so the player has everything they need when they hop from one screen to the next, with the first screen they open loading first. Tier 1: the screen the player lands on, exactly as today. Tier 2, once that screen is up and the phone is idle: the code for every other tool (Life Tracker, Trade Balancer, and the two question tools — this folds in follow-up F3). Tier 3: the card list (`/data/cardMetadata.json`), which Quick Question, the In-depth question flow, and the Trade Balancer all use — downloaded and read once, then shared by all three screens instead of each fetching and parsing its own copy (folds in the load-once part of follow-up F1). A player landing on a question screen already downloads the card list today, so tier 3 adds no data for them. Everything else stands: the background download opens no tool, the Trade Balancer's wake-up ping still fires only when the balancer opens (REQ-064), visited tools stay open (REQ-067), and a failed background download falls back to the normal first-open load. Brotli compression, caching headers, and trimming the list (rest of F1, F2) stay out of scope.

## Gate verdicts

Applied by `graph-gate-review` on 2026-10-15 (1 block: 0 accept, 1 edit, 0 reject). The driver copies this table into `GRAPH-RUN.md`.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `NFR-014` | edit | "Widen from two tools to a tiered download so the player has everything they need when they hop from one screen to the next" — tier 1 landing screen, tier 2 code for every other tool, tier 3 shared card list; Brotli, caching headers, list trimming out of scope |

The finalized NFR-014 text is Diffs 1-3 above, already rewritten to the tiered download.
