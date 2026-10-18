# Design brief — Scanner recovers and runs lighter

Ask: **Decide** — five product-truth answers wait in `GATE-QUESTIONS.md`
(where the scanner's ✕ sits, what the player reads when scan data fails, and
whether the scan map drops Scryfall's image cache-buster). Everything else in
this brief follows from current product truth.

## What the player gets

- **Scanning comes back after a bad connection.** Today, if the first scan
  download fails once, card scanning stays broken in every tool until the page
  is reloaded, and the player reads raw text such as
  `Could not load card hash DB: 503 Service Unavailable`. After this change,
  closing the scanner and opening it again retries the download, and the
  player reads plain words that say what to do. Confirmed live:
  `evidence/measurements.md`, "Failed scan-data download".
- **Phones do less work per scanned frame and hold less memory.** The card
  identifier (the in-memory copy of all 97,311 card fingerprints the scanner
  compares against) is built once per page and shared by all three scanners,
  instead of once per scanner and again on every In-Depth Cards visit. Each
  camera frame skips a full sort of 97,311 results to keep the best ten.
  What a scan finds does not change.
- **One scanner panel, one exit.** In-Depth, Quick Question and Trade Balancer
  share one panel. The exit ✕ is the same 44 px square box in the same place on
  all three — in a slim row directly above the camera's top-right corner, never
  over the camera picture. Today In-Depth's ✕ sits on top of the caution
  triangle and hides it completely (measured live at phone and desktop width).
- **The first scan downloads less.** The scan map (the file that turns a
  recognised printing into a card) shrinks from 6.51 MB to 5.28 MB over the
  wire.

## The five changes

### (a) A failed scan-data download no longer sticks

Player terms: a failed download is a temporary problem, not a session-long
one. The scanner panel shows: "Card scanning is unavailable right now — check
your connection, then close the scanner and open it again. You can still add
cards with search." The raw error goes to the browser console only. The
message is announced to screen readers (`role="alert"`) in all three tools;
Quick Question lacks this today (measured live).

Design:

- `lib/scan/loadHashDb.ts` and `lib/scan/loadScanMap.ts` clear their cached
  promise when it rejects, the way `lib/cardMetadataStore.ts` (lines 26-29)
  already does for the card list: a failed attempt clears the shared load only
  if it is still the current attempt, so a newer in-flight attempt is never
  thrown away.
- `hooks/useScanCapture.ts` `ensureResources` (from line 239) resets
  `resourcesPromiseRef` on rejection, so the next `openScan` retries.
- Retry happens on the next open of any scanner, in any tool. A download that
  succeeded stays cached; only the failed one is fetched again. No automatic
  retry loop and no new "Try again" button (smallest reversible scope).
- `openScan` and `identify` set the player-facing sentence (one shared
  constant) instead of `caught.message`.
- Tests: one fail-then-succeed test per loader, one for `ensureResources`
  (first open fails, second open succeeds, identifier built), and one
  asserting the player sees the plain sentence, never the raw text.
- Product truth: new REQ-249 (see gate questions). NFR-014's retry sentence
  covers the background card-list and code downloads only; it says scan data
  "stays on first scan" and never mentions scan-data failure, so no live rule
  covers this today.

### (b) The card identifier is built once and shared

Player terms: opening a second scanner, or returning to In-Depth's Cards
station, no longer rebuilds 9.3 MB of fingerprints (about 25 ms on desktop,
3-6× slower on phones), and memory holds one copy instead of up to three.

Design:

- One module-level `loadScanResources()` (in `lib/scan/`) loads the hash
  database and scan map, builds one `CardIdentifier`, and hands every scanner
  the same `{ identifier, scanMap }`. It caches its promise and clears it on
  rejection, the same rule as (a).
- `useScanCapture`'s default dependencies use it; tests still inject their own
  loaders through the existing `dependencies` parameter.
- `CardIdentifier`'s constructor (`lib/scan/identify.ts` lines 213-226) stops
  copying each fingerprint into its own `Uint8Array` and then into a second
  buffer. It counts the searchable entries, preallocates one buffer, and
  copies in one pass (or uses a view of the decoded buffer when no
  `_card_back` entry is present — the live bin holds none). Ids and order are
  unchanged.
- Product truth: none. NFR-010 already asks scanning to be fast and light on
  phones; scan output is unchanged.

### (c) Less work per scanned frame, results unchanged

Player terms: nothing visible changes except that a phone has more headroom
at the scanner's three frames per second.

Design:

- `identify()` (`identify.ts` line 251) replaces the full index sort with a
  bounded top-N selection that keeps ties in lower-index-first order — exactly
  what the stable sort returns today.
- `resolveScanCandidatesRanked` (`resolveScanCandidates.ts` line 40) caches
  the card-id lookup map per card-list array in a `WeakMap` instead of
  rebuilding a 34,639-entry map on every identified frame.
- Check: the identification parity tests —
  `apps/frontend/src/lib/scan/identification/identify.test.ts`, which compare
  against `__fixtures__/vectors.json`, the expected output generated from the
  Python reference `reference/identify.py` (`identify.ts` "Mirrors
  reference/identify.py") — pass **unchanged**. Add one test that the bounded
  selection equals the full sort on a tie-heavy synthetic database.
- Product truth: none (REQ-034's frozen recipe and parity gates are untouched).

### (d) One shared scanner panel

Player terms: the three scanners look and behave the same at the top. A slim
row sits directly above the camera. The ✕ sits at its right end, its right
edge lined up with the camera's right edge, as a 44 px square box with
rounded corners — the box Quick Question uses today and the mockup draws.
Quick Question keeps its heading "Scan a card" and Trade Balancer its
"Scanning onto <side>" in that row. In-Depth shows the ✕ only, because
REQ-056 removed In-Depth's scan heading to save height. The caution triangle
and count pill stay inside the camera's top-right corner, now uncovered
everywhere. Loading text, the error line and the held-cards list behave the
same in all three.

Design:

- One `ScanPanel` host component owns the head row (optional title + ✕),
  the "Loading scan data..." line, the error line (`role="alert"`), the camera
  surface and the held-entries mapping into `ScanReviewBubble`. Each tool
  passes its title (or none), destination label and handlers. The engine
  (`ScanCameraSurface`, `ScanReviewBubble`, `useScanCapture`) is already
  shared and is not changed by this slice.
- Hosts: `components/ZoneCardPicker.tsx` (lines 262-304),
  `components/portal/quick-lookup/QuickLookupApp.tsx` (lines 547-582),
  `components/trade/TradeSide.tsx` (lines 243-288).
- CSS: the head-row rules move off the Trade-only `.side .scan-head` /
  `.side .scan-title` scope; the ✕ uses the `.scan-exit` box everywhere. Quick
  Question's desktop column rule
  `.page-content-narrow-fit:has(> .idq > .flow-head .scan-exit)`
  (`index.css` ~4386) must keep matching after the markup moves.
- Tests: `ZoneCardPicker.test.tsx` lines 176-184 pin the ✕ inside the camera
  box (`absolute right-3 top-3`). That pin contradicts REQ-068 ("the exit-scan
  control is lifted out of the camera-feed overlay into a slim control row
  above the frame"; "tests cover that the exit control renders outside the
  camera overlay"). It is rewritten to assert the REQ-068 rule, on all three
  hosts, plus that the ✕ does not overlap the caution triangle.
- Fit: In-Depth gains a slim row above the camera. REQ-068 requires the exit
  row and Capture button to stay visible without page scroll on tall phones;
  the build measures In-Depth at 360 and 390 wide.
- Product truth: amend REQ-214 and REQ-056 (see gate questions). REQ-068 and
  REQ-096 (44 px touch targets) already require this and need no edit.

### (e) A smaller scan map

Player terms: the first scan downloads 1.23 MB less (6.51 → 5.28 MB gzip).
The scanned printing's picture is the same file from the same Scryfall
address; only the `?<timestamp>` suffix Scryfall adds to force a fresh copy
goes away, matching how every other card image in the app is already built.

Design:

- `scripts/build-card-scan-map.mjs` emits `{ oracleId, name }` per printing
  instead of `{ oracleId, name, imageUrl }`. `resolveScanCandidatesRanked`
  derives the scanned printing's image from the printing id through
  `deriveCardImageUrl` (`lib/cardImage.ts`), the one template REQ-174 already
  uses. `CardScanMapEntry` loses `imageUrl`.
- Measured: every one of the 95,895 committed `imageUrl` values equals that
  template plus `?<timestamp>` (0 mismatches, 0 empty), so the derived address
  matches today's for every printing.
- `name` stays: the local practice-suite name lookup
  (`scripts/lib/practice-suite-card-names.mjs`, REQ-232) reads it for the 405
  cards that `cardMetadata.json` leaves out. The intake's "`name` is never
  read" holds for the app, not for the repo.
- The committed artifact is rebuilt by the script, never hand-edited. The
  build input `apps/frontend/data/scryfall/default-cards.json` is gitignored
  and absent from a fresh worktree. The rebuilt map must have exactly the
  committed map's 95,895 keys with identical `oracleId` and `name` values.
  If the local bulk file would change any entry, the build stops and parks
  rather than refreshing card data. It never runs `npm run data:refresh`.
- Product truth: amend REQ-048 and REQ-066 (see gate questions).

## Slice order

1. **Recovery fix** — (a). Smallest and highest value: loaders, the hook,
   the shared sentence, Quick Question's `role="alert"`, tests. Applies REQ-249.
2. **Shared identifier and per-frame work** — (b) and (c). `identify.ts`,
   `resolveScanCandidates.ts`, `loadScanResources`, the hook's defaults.
   Parity tests unchanged.
3. **Shared panel** — (d). The three host files, CSS, tests. Applies REQ-214
   and REQ-056.
4. **Scan map** — (e). Build script, rebuilt artifact, resolver, corpus doc.
   Applies REQ-048 and REQ-066. Dropped if REQ-048 is rejected.

## Decisions — the assumption ladder, applied fresh

The ladder (`PRD/instructions/preparation-contract.md`): take the first
source that answers — (1) live PRD, (2) tested behaviour and public
contracts, (3) local code patterns, (4) the smallest reversible scope,
(5) keep what the player sees unless the request changes it, (6) no new
dependency, endpoint or data contract without scope. The intake's
recommendation was an input, not the answer.

### 1. Where the ✕ sits on all three tools

- Rung 1 answers it. REQ-214: "a square box carrying an X, positioned above
  the camera's top-right corner on every host". REQ-068: the exit control is
  "lifted out of the camera-feed overlay into a slim control row above the
  frame", with tests that it "renders outside the camera overlay". REQ-096:
  primary targets "at least 44px in each dimension". The mockup
  (`docs/design/ui-reimagining/direction-1/card-scan.html`) draws "a plain box
  with an ✕ in the corner above the camera" as the 44 px `.scan-exit`.
- Result: a slim row above the camera on all three, the ✕ as Quick
  Question's 44 px rounded-square box. In-Depth's in-camera ✕ is a regression
  against REQ-068.
- Disagrees with the intake, which recommended Trade's 40 px round
  `.icon-round`. A 40 px circle is neither square (REQ-214) nor 44 px
  (REQ-096).
- In-Depth gets no title in that row (rung 1/5: REQ-056 removed the "Scan
  card" heading there).
- Not a blocker: the PRD answers it. Proposed as REQ-214 and REQ-056 edits so
  the owner sees the clarified wording.

### 2. What the player reads when scan data fails

- Rung 1: no live wording exists for a scan-data failure.
- Rung 3 answers it: the app's failure lines name what is unavailable, say
  what to do, and point at the fallback — "Camera unavailable — check camera
  access. You can still add cards with search." (`trade/useTradeScan.ts`
  line 13); "Card search is unavailable. You can still ask without a card."
  (`QuickLookupApp.tsx` line 265); "We couldn't send that. Check your
  connection and try again" (`FeedbackModal.tsx` line 251).
- Result: "Card scanning is unavailable right now — check your connection,
  then close the scanner and open it again. You can still add cards with
  search." One sentence for all three tools (all three offer search, and the
  scan spec says manual search is always the fallback).
- Retry on the next open, no new button (rung 4).
- Not a blocker. Proposed as new REQ-249.

### 3. Whether scan images may drop Scryfall's cache-buster

- Rung 1: REQ-048 fixes the scan map shape as `{ oracleId, name, imageUrl }`.
  REQ-174 already derives the card list's images from the printing id with no
  cache-buster, and REQ-066 does the same for the Trade printing picker.
- Rung 3: `deriveCardImageUrl` is the single image template; the scan map is
  the only place still carrying full Scryfall addresses.
- Rung 5: the player sees the same picture from the same address. The only
  loss: after a future data refresh, a browser may keep an older cached copy of
  a printing image until its cache expires — the same as every other card
  image in the app today.
- Rung 4 and 6 settle the shape: keep `name`. Dropping it too reaches the
  smallest map (3.98 MB) but breaks the REQ-232 name lookup for 405 cards
  unless a new committed name file is added — a new data contract with no
  scope behind it.
- Result: drop `imageUrl`, keep `name` (5.28 MB). This differs from the
  intake, which named the `printingId → oracleId` shape and called the
  drop-`name` option decision-free; that option changes REQ-048's shape and
  REQ-232's name source.
- Not a blocker. Proposed as REQ-048 and REQ-066 edits.

### Other material assumptions

- REQ-249 is the next free id: `PRD/sections/` tops out at REQ-247, and REQ-248
  is reserved by the open life-tracker-desktop-nav proposal (PR #317, branch
  `thejudge-auto/life-tracker-desktop-nav`). REQ-249 appears nowhere in
  `PRD/` or on that branch.
- The camera picture still renders under the error line when scan data
  fails (seen live). That is out of scope here (keep the fix to the
  symptom); it can be offered as a separate change.
- Side observations from the live run, out of scope: Quick Question's camera
  frame ends 10 px below an 800 px desktop window; Trade Balancer's camera
  runs below the phone window inside its side panel.
- Scan README "Where it lives" file lists gain `loadHashDb.ts`, the new
  `loadScanResources` module and `ScanPanel.tsx` at build — housekeeping
  that follows the code, no owner decision.

## Constraints

- Scan data stays out of the background preload (NFR-014: "scan data such
  as `cardhashes.bin` stays on first scan"). Nothing here changes when scan
  data downloads.
- Committed data artifacts are rebuilt by script, never hand-edited.
- Never run `npm run data:refresh` (it downloads from the network).
- Scan identification output stays identical; the parity tests are the check.
- The card-search cluster ("one card search box") edits the same three files
  (`QuickLookupApp.tsx`, `ZoneCardPicker.tsx`, `TradeSide.tsx`). The two must
  not run at the same time. Today `PRD/work/STATUS.md` lists no other active
  package.

## Non-goals

- No change to what a scan identifies, the lock gate, the recipe, or the
  `CARDHSH1` file format.
- No change to when scan data downloads.
- No change to the camera surface internals, the caution note, the count
  pill or the holding-list rules (REQ-214's other criteria).
- No automatic retry loop or new retry button.
- No new committed data file.

## Amendment set — line-level grep over `PRD/sections/`

Searches run: `exit scan|✕ exit|✕ box|scan-exit`;
`scan panel|scanner panel|scan-panel|scan-head`;
`caution control|caution triangle|yellow triangle` (price-caution hits
excluded); `cardScanMap|scan map|scan-map`;
`Loading scan data|Could not load|scan data|scan resources|hash DB|retry`
(scan/hash lines); the `REQ-066` entry; the scanner rows of
`screen-layout.md`. One row per hit.

| Hit | What it says | Disposition |
|---|---|---|
| `user-flows.md:137` | Exit scan "a square ✕ box above the camera's top-right corner" (In-Depth) | No edit — still true |
| `user-flows.md:158` | "the ✕ box above the camera's top-right corner" | No edit — still true |
| `user-flows.md:201` | Trade: "a square ✕ box above the camera's top-right corner" | No edit — still true |
| `user-flows.md:136` | caution control in the frame's top-right, pill beside it | No edit — unchanged |
| `user-flows.md:564` | Trade oracle id resolved "via ... the scan map for a scan" | No edit — map keeps `oracleId` |
| `screen-layout.md:213` | Scanner Chrome row: ✕ box above the camera's top-right on every host; caution + pill | **Edit — REQ-214 block** |
| `screen-layout.md:113` | card-detail notes row (retry wording hit) | No edit — unrelated |
| `system-map.md:300` | resolver lives in `resolveScanCandidates.ts` + `cardScanMap.json` | No edit — still true |
| `system-map.md:323` | "Closing the scanner (✕ exit box, top-right)" summary | No edit — still true |
| `system-map.md:327` | history note: Exit scan moved under REQ-214 | No edit — history |
| `system-map.md:361` | Scan art fidelity: shape `{ oracleId, name, imageUrl }` | **Edit — REQ-048 block** |
| `system-map.md:362` | art fidelity lives in build script + map | No edit — still true |
| `system-map.md:543`, `:564` | Quick Question / Trade summaries (retry wording hit) | No edit — unrelated |
| `system-map.md:565` | Trade price lives-in (scan-map hit) | No edit — unrelated |
| `decisions.md:131` | DEC-090 (retired) lifted Exit scan into a row above the frame | No edit — retired index |
| `functional-requirements.md:751` | REQ-038 old batch loop "Exit scan returns to zone collection" | No edit — unaffected |
| `functional-requirements.md:1220` | REQ-056: "**Exit scan** is reachable on the camera surface top-right" | **Edit — REQ-056 block** |
| `functional-requirements.md:1300` | REQ-058 tests line (scan-panel hit) | No edit — unrelated |
| `functional-requirements.md:1651` | REQ-068 note: old `right-3 top-3` Exit scan was a root cause | No edit — REQ-068 already requires the row above the frame |
| `functional-requirements.md:1030` | REQ-048: map shape `{ oracleId, name, imageUrl }` | **Edit — REQ-048 block** |
| `functional-requirements.md:1259` | REQ-057 constraint: no change to recipe/bin | No edit — recipe and bin untouched |
| `functional-requirements.md:1568` | REQ-066: scanned printing resolves via the scan map | No edit — still true |
| `functional-requirements.md:1575` | REQ-066 constraint "no change to `cardScanMap.json`" | **Edit — REQ-066 block** |
| `functional-requirements.md:5612` | REQ-214 description: square box with an X above the top-right; caution top-right | **Edit — REQ-214 block** |
| `functional-requirements.md:5618` | REQ-214 criterion: square box above the top-right on every host | **Edit — REQ-214 block** |
| `functional-requirements.md:5619` | REQ-214 caution criterion | No edit — unchanged |
| `functional-requirements.md:5641` | REQ-214 build note listing the three hosts | No edit — history note |
| `functional-requirements.md:6170` | REQ-232 names from `cardScanMap.json` for cards `cardMetadata` omits | No edit — `name` kept (would need an edit if REQ-048 were edited to drop `name`) |
| `functional-requirements.md:6195` | REQ-232 measurement note | No edit — unaffected |
| `functional-requirements.md:778`, `:781`, `:923`, `:1302`, `:1537`, `:1542`, `:2327`, `:4604`, `:6002`, `:6175` | retry/fetch wording hits in hash-build, palette, price, eval entries | No edit — unrelated |
| `scan/README.md:21` | corpus pointer to `data/cardScanMap.md` | No edit |
| `scan/README.md:111` | caution control sits in the scanner's top-right | No edit — unchanged |
| `scan/README.md:206-208` | all overlays incl. "the ✕ exit box" keep non-overlapping bounds | **Edit — REQ-214 block** |
| `scan/README.md:211-215` | Exit scan "a square box carrying an ✕, above the camera's top-right corner on every host" | **Edit — REQ-214 block** |
| `scan/README.md:241` | Exit scan commits held cards (In-Depth) | No edit |
| `scan/README.md:347` | manual search reached by Exit scan | No edit |
| `scan/README.md:363` | closed door: no pricing in `cardScanMap.json` | No edit |
| `scan/README.md:389`, `:396` | build scripts and corpus docs | No edit |
| `scan/README.md` (no hit) | no live rule for scan-data failure | **Add — REQ-249 block** |
| `scan/data/cardScanMap.md:1`, `:24`, `:26`, `:38`, `:90-91` | title, build command, artifact path | No edit — still true |
| `scan/data/cardScanMap.md:46-48` | build: "each entry's `imageUrl` is that printing's own Scryfall image" | **Edit — REQ-048 block** |
| `scan/data/cardScanMap.md:74-77` | shape `{ oracleId, name, imageUrl }` | **Edit — REQ-048 block** |
| `scan/data/cardScanMap.md` (lines 22-29, 61-65, 81-84, same topic) | upstream fields, image threading, "grows by one url per printing" | **Edit — REQ-048 block** |
| `scan/data/cardhashes.md:50-54`, `:108` | build retry/backoff; corpus pointer | No edit — build-time, unrelated |
| `integrations-and-data.md:309`, `:313` | bridge maps printing id → oracle id; generated offline | No edit — still true |
| `in-depth/README.md:207` | Exit scan "a square ✕ box above the camera's top-right corner" | No edit — still true |
| `trade-balancer/README.md:75` | "a square ✕ box above the camera's top-right corner" | No edit — still true |
| `trade-balancer/README.md:105`, `:218` | foil re-fetch; no pricing in the scan map | No edit |
| `quick-lookup/README.md:80` | "the scanner's own Exit scan box is the only commit path" | No edit — still true |
| `non-functional-requirements.md:221` | Trade price retry | No edit — unrelated |
| `non-functional-requirements.md:240` | NFR-014: scan data stays on first scan; background-download retry | No edit — unchanged; REQ-249 covers scan data |

## Evidence

- Live measurements and screenshots: `evidence/measurements.md`;
  screenshots under `.playwright-mcp/` (gitignored, local only).
- Intake (evidence, not authority): `intake/GRAPH-BRIEF-scanner.md`. Its
  cited documents were not opened; paths recorded only:
  `PRD/work/probe-codebase-health-pass/FINDINGS-data-and-clients.md`
  (D-01, D-03, D-04, D-06) and
  `PRD/work/probe-codebase-health-pass/FINDINGS-ui-and-personalities.md`
  (U-02).
- Code confirmed by direct reading: `lib/scan/loadScanMap.ts` 7-18,
  `lib/scan/loadHashDb.ts` 8-21, `lib/cardMetadataStore.ts` 26-34,
  `hooks/useScanCapture.ts` 239-259 and 274-288, `lib/scan/identify.ts`
  209-258, `lib/scan/resolveScanCandidates.ts` 35-64,
  `scripts/build-card-scan-map.mjs`, `scripts/lib/practice-suite-card-names.mjs`,
  the three host panels, `index.css` scanner rules,
  `ZoneCardPicker.test.tsx` 176-184.
