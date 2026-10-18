# Gate questions — scanner-recovers-and-runs-lighter

Ask: **Decide.** Five blocks below, one per requirement. Fill in each
`Verdict` with accept, edit or reject, and give a `Reason` for edit or reject.
The design behind them is `DESIGN-BRIEF.md`; the live measurements are
`evidence/measurements.md`.

## REQ-214 — the scanner's ✕ sits in the same place on all three tools, never over the camera

**What this decides:** where the scanner's exit ✕ sits in In-Depth, Quick
Question and Trade Balancer, and what it looks like.

**In plain terms:** today each tool draws its own ✕. In In-Depth it sits on
top of the camera picture, right over the yellow caution triangle — measured
live, the ✕ hides the triangle completely, so a player there can never open
the "scanning is experimental" note. Quick Question and Trade Balancer put the
✕ in a row above the camera, but Quick Question's is a 44 px square box and
Trade's a smaller 40 px circle. This change gives all three the same slim row
directly above the camera, with the ✕ at its right end lined up with the
camera's right edge, drawn as Quick Question's 44 px square box (the box the
mockup shows). The scanner rule already calls the ✕ "a square box carrying an
X ... above the camera's top-right corner on every host" (REQ-214); the
scan-layout rule already says the ✕ is "lifted out of the camera-feed overlay
into a slim control row above the frame" (REQ-068); and buttons must be at
least 44 px each way (REQ-096). The edit makes those words impossible to
misread. The tool's own title sits at the left of the row where it has one
(Quick Question "Scan a card", Trade "Scanning onto Side A"); In-Depth shows
the ✕ alone. This differs from the intake's suggestion of Trade's 40 px
circle, which is neither square nor 44 px.

**What happens if you say no:** the three tools keep their own ✕. In-Depth's
✕ keeps covering the caution triangle, and the shared-panel slice is limited
to loading, error and held-card plumbing.

```diff
--- PRD/sections/functional-requirements.md (REQ-214)
-- Description: The shared camera scanner (FLOW-006) keeps its detection, lock and ding unchanged. A recognised card now waits in the scanner's own holding list instead of joining the destination the instant it is recognised; the list is shown by a top-right count pill, with Remove on each entry. A caution control naming scanning as experimental sits in the top-right from the moment the scanner opens — present before any card is held, independent of the holding list and the count pill — with its note opening only on tap. Closing the scanner (the "Exit scan" control, now a square box with an X above the camera's top-right corner) commits every held card to the zone or trade side it was opened from, in one step. The count pill, previously built only for In-Depth's zones, now appears on every host that scans: In-Depth's Cards station, Ask a Question, and Trade Balancer.
+- Description: The shared camera scanner (FLOW-006) keeps its detection, lock and ding unchanged. A recognised card now waits in the scanner's own holding list instead of joining the destination the instant it is recognised; the list is shown by a top-right count pill, with Remove on each entry. A caution control naming scanning as experimental sits in the top-right from the moment the scanner opens — present before any card is held, independent of the holding list and the count pill — with its note opening only on tap. Closing the scanner (the "Exit scan" control, a square box with an X in a slim row directly above the camera's top-right corner, never over the camera picture) commits every held card to the zone or trade side it was opened from, in one step. The count pill, previously built only for In-Depth's zones, now appears on every host that scans: In-Depth's Cards station, Ask a Question, and Trade Balancer. All three hosts render the scanner through one shared panel, so the row above the camera, the "Exit scan" box, the loading line and the error line look and sit the same everywhere.
@@ Acceptance Criteria
-  - the "Exit scan" control is a square box carrying an X, positioned above the camera's top-right corner on every host, with the accessible name "Exit scan" unchanged; the manual Capture control keeps the accessible name "Capture"
+  - the "Exit scan" control is a 44px square box with rounded corners carrying an X (the mockup's `.scan-exit` box), at the right end of a slim row directly above the camera frame, its right edge aligned with the camera frame's right edge — identical on every host, never inside or over the camera frame, and never overlapping the caution control or the count pill; the row carries the host's scanner title at its left where the host has one (Ask a Question "Scan a card", Trade Balancer "Scanning onto <side>") and only the box on In-Depth's Cards station (REQ-056); the accessible name "Exit scan" is unchanged; the manual Capture control keeps the accessible name "Capture"
+  - all three hosts render the scanner through one shared panel component: the row above the camera, the "Loading scan data..." line, the scan-data failure line (REQ-249) and the holding-list entries passed to the count pill are built once; each host passes only its title (if any), its destination label and its handlers
@@ Acceptance Criteria (tests line)
-  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, the hint line on every host, and that detection/lock/capture are unchanged
+  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, the hint line on every host, that on every host the "Exit scan" box renders outside the camera overlay in the row above it and does not overlap the caution control, and that detection/lock/capture are unchanged

--- PRD/sections/screen-layout.md (#### Scan camera surface, Chrome row)
-| Chrome | A square ✕ exit box sits above the camera's top-right corner on every host (accessible name "Exit scan"); a caution control (a yellow triangle) sits in the top-right from the moment the scanner opens, independent of the holding list, with its caution note opening only on tap; the count pill sits alongside it (the two always adjacent, never overlapping) once the pill appears on the first held card; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214); when the mockup's scanner page carries the hint line, one line of static text sits under the camera frame in the mockup's position — text, not a control, never overlapping the camera frame, the count pill or the review list (REQ-214, REQ-070) |
+| Chrome | One shared scanner panel on every host. A slim row sits directly above the camera frame: the host's scanner title at its left where it has one (none on In-Depth, REQ-056) and a 44px square ✕ exit box with rounded corners at its right (accessible name "Exit scan"), the box's right edge aligned with the camera frame's right edge — never inside or over the camera frame; a caution control (a yellow triangle) sits in the camera frame's top-right from the moment the scanner opens, independent of the holding list, with its caution note opening only on tap; the count pill sits alongside it (the two always adjacent, never overlapping) once the pill appears on the first held card; nothing covers the caution control or the pill; the opt-in Debug panel keeps its own bottom-left placement with a themed accent border (REQ-214, REQ-068); when the mockup's scanner page carries the hint line, one line of static text sits under the camera frame in the mockup's position — text, not a control, never overlapping the camera frame, the count pill or the review list (REQ-214, REQ-070) |

--- PRD/sections/scan/README.md (### Scan-screen layout and theming)
 - Built: the camera frame grows to fill available viewport height on tall
   phones (a bounded dynamic-viewport height below `md:`; a proportion-stable
   `aspect-[3/4]` fallback at `md:` and above), with the guide, lock outline, and
-  debug overlay scaling to the rendered frame and `object-cover` preserved. All
-  overlays — debug toggle, mute, Cardomancer attribution, the ✕ exit box, and
-  the count pill — keep non-overlapping bounds and hit areas at supported
-  widths. (DEC-065, DEC-090, REQ-068, NFR-001, REQ-214)
+  debug overlay scaling to the rendered frame and `object-cover` preserved. All
+  overlays — debug toggle, mute, Cardomancer attribution, the caution control,
+  and the count pill — keep non-overlapping bounds and hit areas at supported
+  widths, and the ✕ exit box sits outside the camera frame entirely, in the
+  slim row above it. (DEC-065, DEC-090, REQ-068, NFR-001, REQ-214)
 - Built: while scan is open the destination's own search input, card list, and
   outer staged-flow navigation are hidden; scan-local controls including
-  **Capture** remain, and **Exit scan** — a square box carrying an ✕, above the
-  camera's top-right corner on every host (accessible name unchanged) — is the
-  only path back to manual search or normal navigation; closing it commits the
-  holding list to the destination in one step. (DEC-076, REQ-056, REQ-214,
-  FLOW-006)
+  **Capture** remain, and **Exit scan** — a 44px square box carrying an ✕, at
+  the right end of a slim row directly above the camera's top-right corner,
+  identical on every host because all three share one scanner panel
+  (accessible name unchanged) — is the only path back to manual search or
+  normal navigation; closing it commits the holding list to the destination in
+  one step. The row carries the host's scanner title where it has one; In-Depth
+  shows the box alone. (DEC-076, REQ-056, REQ-068, REQ-214, FLOW-006)
```

- Verdict:
- Reason:

## REQ-056 — In-Depth's exit is in the row above the camera, not on the camera

**What this decides:** whether In-Depth's screen-compaction rule stops saying
the exit sits "on the camera surface".

**In plain terms:** an older In-Depth rule that trimmed the Cards screen while
scanning (REQ-056: hide search, the card list and the "Scan card" heading
while the camera is open) says "Exit scan is reachable on the camera surface
top-right". That wording is why In-Depth's ✕ was drawn over the camera, where
it now hides the caution triangle. This edit says the ✕ is in the slim row
directly above the camera, matching REQ-214 above, and keeps the heading
removed — In-Depth's row carries only the ✕.

**What happens if you say no:** REQ-056 keeps saying "on the camera surface",
which contradicts the REQ-214 edit; the build would have to leave In-Depth's ✕
over the camera.

```diff
--- PRD/sections/functional-requirements.md (REQ-056, Acceptance Criteria)
-  - **scan focus:** while scan is open, search input, scan entry button, zone card list, owner select, card preview, and outer staged-flow navigation/action buttons outside the camera surface are not in the document; the `Scan card` heading is removed; **Exit scan** is reachable on the camera surface top-right; the scan-local **Capture** button remains available; the low-confidence manual-search escalation prompt does not render; manual tap-to-capture remains available
+  - **scan focus:** while scan is open, search input, scan entry button, zone card list, owner select, card preview, and outer staged-flow navigation/action buttons outside the camera surface are not in the document; the `Scan card` heading is removed, so the slim row above the camera carries only the exit box; **Exit scan** is reachable from that row, above the camera's top-right corner and never over the camera frame (REQ-214, REQ-068); the scan-local **Capture** button remains available; the low-confidence manual-search escalation prompt does not render; manual tap-to-capture remains available
```

- Verdict:
- Reason:

## REQ-249 — scanning recovers from a failed download and says so in plain words

**What this decides:** what happens, and what the player reads, when the
scanner's data fails to download.

**In plain terms:** the first time a player opens a scanner, the app
downloads two large scan files (the 13 MB fingerprint library and the
6.5 MB scan map). Today, if that
download fails once — common on a weak game-store connection — scanning stays
broken in every tool until the page is reloaded, and the player reads raw text
such as `Could not load card hash DB: 503 Service Unavailable` (confirmed
live: the error stayed after the connection came back). With this change,
closing the scanner and opening it again, in any tool, tries the download
again; a file that already arrived is not downloaded twice. The player reads:
"Card scanning is unavailable right now — check your connection, then close
the scanner and open it again. You can still add cards with search." That
follows the app's other failure lines, such as the camera's "Camera
unavailable — check camera access. You can still add cards with search."
Screen readers announce the line in all three tools. Scan data still downloads
only when a player first scans, never in the background (NFR-014).

**What happens if you say no:** the download fix still ships as a bug fix,
because nothing in product truth says a failure should stick, but no rule
fixes the wording, and the build keeps today's raw error text.

```diff
--- PRD/sections/functional-requirements.md (new entry, after REQ-247)
+### REQ-249
+- Title: Card scanner recovers from a failed scan-data download, in plain words
+- Priority: high
+- Description: When the scanner's data — the fingerprint library `cardhashes.bin` or the scan map `cardScanMap.json` — fails to download, the failure lasts only until the player tries again. Closing the scanner and opening it again, from any of the three tools that scan (In-Depth's Cards station, Ask a Question, Trade Balancer), downloads the failed file again. The player reads one plain sentence that says what to do, never the raw error.
+- Acceptance Criteria:
+  - a failed download of either scan file is not remembered: the next time any scanner opens, in any tool, that file is requested again; a file that already arrived is reused, never downloaded twice; a download already in flight is shared, not repeated
+  - after a failure followed by a successful retry, the scanner identifies cards exactly as if the first attempt had succeeded, without a page reload
+  - while scan data has failed to load, the scanner panel shows exactly: "Card scanning is unavailable right now — check your connection, then close the scanner and open it again. You can still add cards with search." — the same sentence in all three tools, announced to assistive technology (`role="alert"`); the raw error text (status codes, file names) never reaches the player and goes to the browser console only
+  - manual search keeps working throughout, as before
+  - tests cover fail-then-succeed for each of the two scan files, fail-then-succeed through the scanner's open path, and that the player-facing line is the sentence above rather than the raw error
+- Constraints:
+  - scan data still downloads only when a player first opens a scanner; it never joins the background download (NFR-014, NFR-010)
+  - no automatic retry loop and no new retry control: the retry is the player closing and reopening the scanner
+  - no change to what a scan identifies, the lock gate, or the scan files' contents
+- Dependencies:
+  - REQ-214
+  - NFR-010
+  - NFR-014
+  - FLOW-006
+- Notes:
+  - reserved and proposed by the `scanner-recovers-and-runs-lighter` package (2026-10-18); REQ-248 is held by the open life-tracker-desktop-nav proposal

--- PRD/sections/scan/README.md (### The camera surface (one shared scanner))
 - Built: identification runs fully on-device with no network calls; the
   fingerprint library and the metadata bridge are lazy-loaded only on first
   scan, so a user who never scans pays no startup cost. (DEC-051, NFR-010)
+- Built: a failed download of either scan file lasts only until the player
+  tries again — closing the scanner and opening it again, in any tool,
+  requests the failed file again while reusing one that already arrived. Until
+  then the panel shows one plain sentence, "Card scanning is unavailable right
+  now — check your connection, then close the scanner and open it again. You
+  can still add cards with search.", announced to assistive technology; the
+  raw error never reaches the player. (REQ-249, NFR-014)
```

- Verdict:
- Reason:

## REQ-048 — the scan map stops storing image addresses; the picture comes from the printing id

**What this decides:** whether the scanned printing's picture may be built
from its printing id, dropping the `?<timestamp>` suffix Scryfall adds to its
image addresses, so the first scan downloads 1.23 MB less.

**In plain terms:** after a scan, the app shows the exact printing you
scanned (REQ-048). Today the scan map — the file that turns a recognised
printing into a card — stores a full Scryfall image address for each of its
95,895 printings. Every one of those addresses is the standard address built
from the printing id, plus a `?<timestamp>` cache-buster (a suffix that only
forces browsers to fetch a fresh copy after Scryfall changes a picture). The
card list and the Trade Balancer's printing picker already build their image
addresses from the printing id with no cache-buster (REQ-174, REQ-066). This
change does the same for scans: same picture, same address minus the suffix.
The scan map drops from 6.51 MB to 5.28 MB over the wire. The one cost: after
a future card-data refresh, a browser may show an older cached copy of a
scanned printing's picture until its cache expires — as every other card
picture in the app already does. Card names stay in the scan map, because the
local practice-suite tool (REQ-232) reads them for 405 cards the card list
leaves out. Dropping names too would reach 3.98 MB but needs a new committed
name file; this proposal does not do that.

**What happens if you say no:** the scan map keeps its full image addresses
and stays 6.51 MB; the scan-map slice is dropped and nothing else changes.

```diff
--- PRD/sections/functional-requirements.md (REQ-048, Acceptance Criteria and Constraints)
-  - the build-time bridge artifact `cardScanMap.json` carries a per-printing image so each printing id resolves to its own art; the entry shape becomes `{ oracleId, name, imageUrl }`, produced by `build-card-scan-map.mjs` from the same Scryfall printing object it already reads
-  - the scan candidate resolver (`resolveScanCandidatesRanked`, REQ-036) threads the best-distance printing's image through to the locked candidate alongside the resolved oracle-level `CardMetadataItem`
+  - each printing id resolves to its own art: the build-time bridge artifact `cardScanMap.json` keeps the entry shape `{ oracleId, name }`, produced by `build-card-scan-map.mjs` from the same Scryfall printing object it already reads, and the printing's image url is derived from the printing id through the app's single Scryfall image template (`deriveCardImageUrl`, REQ-174) — the same `normal`-size front-face address Scryfall serves, without Scryfall's `?<timestamp>` cache-buster suffix
+  - the scan candidate resolver (`resolveScanCandidatesRanked`, REQ-036) threads the best-distance printing's derived image through to the locked candidate alongside the resolved oracle-level `CardMetadataItem`
@@
-  - graceful fallback: when a printing image is missing/empty in the bridge, the card still previews and adds using the oracle-level `CardMetadataItem.imageUrl`; the DEC-053 collapse-by-best-distance and drop-unresolvable behavior is otherwise unchanged
+  - graceful fallback: when the derived printing image is empty, the card still previews and adds using the oracle-level image derived from `CardMetadataItem.imageId`; the DEC-053 collapse-by-best-distance and drop-unresolvable behavior is otherwise unchanged
@@ Constraints
-  - the bridge file grows by one URL per printing but stays lazy-loaded on first scan (NFR-010); app startup is unaffected for users who never scan
+  - the bridge file carries no image url and stays lazy-loaded on first scan (NFR-010); app startup is unaffected for users who never scan
+  - the committed `cardScanMap.json` is rebuilt by `build-card-scan-map.mjs`, never hand-edited; the rebuild keeps exactly the same printing ids with the same `oracleId` and `name` values (no card-data refresh rides along)

--- PRD/sections/system-map.md (### Scan art fidelity)
-- Summary: A scanned card displays the specific printing's art that was physically scanned by separating printing-level image presentation from oracle-level identity. `cardScanMap.json` entry shape extended to `{ oracleId, name, imageUrl }` (build-time). At scan time, `resolveScanCandidatesRanked` carries the best-distance printing's `imageUrl` through to the locked candidate; `useScanCapture` surfaces it alongside the oracle-level `CardMetadataItem`; `buildZoneCardFromMetadata` writes it to `ZoneCardItem.imageUrl` for the auto-added card only. The scan preview (`ScanReviewBubble`) and the zone thumbnail both show scanned art. Graceful fallback to oracle-level `CardMetadataItem.imageUrl` when the printing image is absent. Oracle identity, prompt context, rulings, and all scan-engine boundaries are untouched.
+- Summary: A scanned card displays the specific printing's art that was physically scanned by separating printing-level image presentation from oracle-level identity. `cardScanMap.json` entries are `{ oracleId, name }` (build-time); the printing's image url is derived from the printing id through `deriveCardImageUrl` (REQ-174's single template, no Scryfall cache-buster). At scan time, `resolveScanCandidatesRanked` carries the best-distance printing's derived image through to the locked candidate; `useScanCapture` surfaces it alongside the oracle-level `CardMetadataItem`; `buildZoneCardFromMetadata` writes it to `ZoneCardItem.imageUrl` for the auto-added card only. The scan preview (`ScanReviewBubble`) and the zone thumbnail both show scanned art. Graceful fallback to the oracle-level image derived from `CardMetadataItem.imageId` when the derived printing image is empty. Oracle identity, prompt context, rulings, and all scan-engine boundaries are untouched.

--- PRD/sections/scan/data/cardScanMap.md
 - **External upstream source:** Scryfall printing objects (printing ids, oracle
-  ids, card names, and per-printing image urls).
+  ids, and card names).
@@
-- **Describes Magic, not TheJudge:** each entry is per-printing Magic card
-  identity and image data — `{ oracleId, name, imageUrl }` — not TheJudge product
-  configuration or behavior.
+- **Describes Magic, not TheJudge:** each entry is per-printing Magic card
+  identity data — `{ oracleId, name }` — not TheJudge product configuration or
+  behavior.
@@ ## Where it comes from and how it is built
 - Built at data-build time by `scripts/build-card-scan-map.mjs` from the same
-  Scryfall printing objects the pipeline already reads; each entry's `imageUrl`
-  is that printing's own Scryfall image (DEC-070, REQ-048).
+  Scryfall printing objects the pipeline already reads. It stores no image url:
+  each printing's own Scryfall image is derived from its printing id at runtime
+  through `deriveCardImageUrl` (`lib/cardImage.ts`, REQ-174's single template,
+  without Scryfall's `?<timestamp>` cache-buster) (DEC-070, REQ-048).
@@ ## How the scanner uses it
-- The best-distance printing's `imageUrl` is threaded through to the locked
-  candidate so the scan preview and the added `ZoneCardItem.imageUrl` show the
-  **scanned printing's** art, not the oracle-level representative image. A
-  missing/empty printing image falls back to the oracle-level
-  `CardMetadataItem.imageUrl` (DEC-070, REQ-048).
+- The best-distance printing's image, derived from its printing id, is threaded
+  through to the locked candidate so the scan preview and the added
+  `ZoneCardItem.imageUrl` show the **scanned printing's** art, not the
+  oracle-level representative image. An empty derived image falls back to the
+  oracle-level image derived from `CardMetadataItem.imageId` (DEC-070, REQ-048).
@@ ## Artifact shape
-- `apps/frontend/public/data/cardScanMap.json` — a map keyed by Scryfall printing
-  id; each entry is `{ oracleId: string, name: string, imageUrl: string }`
-  (`imageUrl` `""` when the source has none). Follows the committed
-  `cardMetadata.json` static pattern (REQ-036, DEC-070).
+- `apps/frontend/public/data/cardScanMap.json` — a map keyed by Scryfall printing
+  id; each entry is `{ oracleId: string, name: string }`. Follows the committed
+  `cardMetadata.json` static pattern (REQ-036, DEC-070, REQ-048). Measured
+  2026-10-18: 95,895 entries, 11.21 MB raw / 5.28 MB gzip (was 21.57 MB /
+  6.51 MB with per-printing image urls). `name` is read by the local
+  practice-suite name lookup (REQ-232), not by the app.
@@ ## Runtime posture
-- **Lazy-loaded only on first scan** — it grows by one url per printing versus a
-  bare `{ oracleId, name }`, but loads only when scanning is first used, so app
-  startup stays unaffected and the growth stays within the NFR-010 lazy-load
-  posture (DEC-070, NFR-010).
+- **Lazy-loaded only on first scan** — it loads only when scanning is first
+  used, so app startup stays unaffected, within the NFR-010 lazy-load posture
+  (DEC-070, NFR-010).
```

- Verdict:
- Reason:

## REQ-066 — the Trade price rule's "don't touch the scan map" line is scoped to that change

**What this decides:** whether one constraint line in the Trade Balancer's
price-data rule is reworded so it no longer reads as a standing ban on
changing the scan map.

**In plain terms:** the rule that built the Trade Balancer's price data
(REQ-066) lists things that change left alone, starting "no change to
`cardScanMap.json`". The code still cites that line as the reason the scan
map keeps its image addresses. If you accept the REQ-048 block above, this
line would look like a contradiction. The edit says the price change made no
change to the scan map, and that the scan map's shape belongs to REQ-048.

**What happens if you say no:** the line stays as written. If REQ-048 is
accepted, the two rules read as if they disagree; if REQ-048 is rejected,
nothing is lost.

```diff
--- PRD/sections/functional-requirements.md (REQ-066, Constraints)
-  - no change to `cardScanMap.json`, `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, or the provider boundary; `cardMetadata.json` is slimmed and reused as the shared identity index per REQ-174; the backend gains the read-only price route per REQ-175
+  - this requirement makes no change to `cardScanMap.json` (its entry shape is owned by REQ-048), `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, or the provider boundary; `cardMetadata.json` is slimmed and reused as the shared identity index per REQ-174; the backend gains the read-only price route per REQ-175
```

- Verdict:
- Reason:

## Blocker questions

None. Each of the three open decisions is answered by current product truth
or the app's own patterns (see `DESIGN-BRIEF.md`, "Decisions — the assumption
ladder, applied fresh"); the blocks above put each answer in front of you.
