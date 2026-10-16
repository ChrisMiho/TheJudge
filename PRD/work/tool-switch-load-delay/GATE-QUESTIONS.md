# Gate questions — tools open without the "Loading…" screen

**Decide:** one slot below, an amendment to an existing requirement (NFR-014,
the code-splitting rule). No new stable ID. No blocker.

Every diff is against `PRD/sections/` at `ed3e96b8`. Line numbers are where the
hunk starts today. Evidence: `evidence/measurements.md`. The full reasoning is
in `DESIGN-BRIEF.md`.

## NFR-014 — Life Tracker and Trade Balancer download in the background so they open instantly

**What this decides:** whether the app may download the Life Tracker's and
the Trade Balancer's code in the background while the player is still on the
screen they opened, so the first switch to either tool shows no "Loading…"
screen.

**In plain terms:** the app is split into one download per tool so the first
screen loads fast. Today's rule (NFR-014) says a player who opens one tool
never downloads the code of a tool they never open, so the first time they
switch to the Life Tracker or the Trade Balancer they wait on a "Loading…"
screen while that tool downloads. Measured on the live site, that wait is 0.2 s
on a good connection and 0.7 s on a slow phone network. The change lets the
app fetch those two tools' code (about 17 KB, less than one card image) once
the first screen is up and the phone is idle. The first screen still loads
exactly as fast as today. The background download fetches code only: it does
not open the tool, does not download the tool's data, and does not send the
Trade Balancer's wake-up ping to the server (REQ-064 — that ping still goes
only when the player opens the balancer). If the background download fails,
nothing shows and the tool loads the normal way when opened. The two question
tools are not included; that is offered separately. This does not shorten the
Trade Balancer's "Loading card list…" wait on a slow network (up to about 9 s,
measured) — that is the card list's size, offered separately too.

**What happens if you say no:** the rule stands, each tool still downloads on
its first open, and the "Loading…" screen keeps showing for 0.2–0.7 s (longer on
a weak signal) the first time a player opens each tool in a session.

### Diff 1 — `PRD/sections/non-functional-requirements.md` (NFR-014, line 239)

```diff
 - Constraints:
-  - each registered destination is behind a `React.lazy` boundary, so a visitor who opens one destination does not download the code of destinations they never open
+  - each registered destination is behind a `React.lazy` boundary, so the **initial** payload carries only the destination the visitor lands on; the code of other destinations never delays the first screen
+  - background warm-up: once the landing destination has rendered and the browser is idle, the code of every destination marked for warm-up in its registry entry downloads in the background, so the first switch to it shows no load fallback. Today Life Tracker and Trade Balancer are marked; Quick Question and In-Depth Question are not. Warm-up downloads code only — it never mounts the destination, never fetches that destination's data, and never fires its effects (the Trade Balancer's REQ-064 health-check ping still fires only when the balancer opens). A warm-up already finished or in flight is reused, never repeated. A failed warm-up is silent and leaves the destination to load on first open as before, retrying the download. Marking a destination is a registry-entry field, not chunk configuration
+  - warm-up cost is measured, not estimated: about 17 KB gzipped from a Quick Question landing (Life Tracker 8.1 KB, shared player-labels 0.5 KB, Trade Balancer 8.4 KB; 2026-10-15 build). A destination whose warm-up would pull a large shared chunk the landing destination does not already use is not marked without measuring that cost first
```

```diff
-  - the `Suspense` fallback must not flash on every destination switch: keep-alive mounting (DEC-095, preserved by DEC-157) means a destination suspends only on first visit
+  - the `Suspense` fallback must not flash on every destination switch: keep-alive mounting (DEC-095, preserved by DEC-157) means a destination suspends only on first visit, and a warmed destination whose code has already arrived does not suspend even then
```

```diff
 - Dependencies:
   - DEC-157
   - REQ-140
   - NFR-010
   - NFR-012
+  - REQ-064
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
+  loaded), and not at all for a warmed destination whose code arrived before the
+  player opened it. It stays quiet — no branded splash, progress bar, or motion
+  beyond the CSS-motion rules. (DEC-157, NFR-014)
+- Built: background warm-up — once the landing destination has rendered and the
+  browser is idle, the Life Tracker's and the Trade Balancer's code download in
+  the background (each registry entry carries the warm-up mark; the two question
+  destinations are unmarked), so a player's first switch to either opens with no
+  load fallback. Code only: neither destination mounts, fetches data, or sends
+  the balancer's health-check ping (REQ-064) until the player opens it. A failed
+  warm-up is silent and the destination loads on first open as before. Measured
+  2026-10-15 on the live site: the first-open fallback was 0.2 s unthrottled and
+  0.7 s on a Slow 4G phone profile; with the code already downloaded the tool was
+  on screen in about 40 ms. (NFR-014)
```

### Diff 3 — `PRD/sections/screen-layout.md` (Destination load fallback row, line 73)

```diff
-| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback. Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
+| Notes | DEC-157, NFR-014, DEC-095. Appears at most **once per destination per session** — keep-alive mounting means a revisited destination is already loaded and shows no fallback — and not at all for a destination warmed in the background (Life Tracker, Trade Balancer) once its code has arrived. Keep it quiet and minimal; this is a sub-second chunk fetch, not a data-loading state, so it must not introduce a branded splash, progress bar, or motion beyond the existing CSS-motion rules (NFR-006). Do not invent vertical fill for the empty region |
```

- Verdict:
- Reason:
