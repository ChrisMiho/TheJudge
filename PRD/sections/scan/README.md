# Card Scanning — current-state feature spec

- Status: current-state feature spec — precedence #1 and Read-First #1 for what
  this feature does today. Decision bodies are retired: `PRD/sections/decisions.md`
  is now precedence #2, a historical index that resolves a cited `DEC` ID to a
  one-line summary, no longer an override. The cited `REQ`/`FLOW` remain the
  granular backing; keep this file correct in step with them as behavior changes,
  editing in place — never by recording a new decision.
- Backed by: DEC-050, DEC-051, DEC-052, DEC-053, DEC-054, DEC-055, DEC-056,
  DEC-057, DEC-058, DEC-059, DEC-060, DEC-061, DEC-062, DEC-065, DEC-069,
  DEC-070, DEC-071, DEC-072, DEC-073, DEC-074, DEC-077, DEC-083, DEC-090,
  DEC-093, DEC-076, DEC-078, DEC-082, DEC-068, DEC-087, DEC-107, DEC-157,
  DEC-151, DEC-158, DEC-160, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038,
  REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-047, REQ-048, REQ-049,
  REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, REQ-056, REQ-057, REQ-062,
  REQ-068, REQ-071, REQ-125, REQ-073, REQ-065, REQ-046, REQ-128, REQ-129,
  FLOW-006, FLOW-009, FLOW-011, NFR-010, NFR-014, NFR-006, NFR-001
- Corpus: scanning loads two committed Magic-data artifacts, each documented
  separately as a `data/` concern and not inlined here — the fingerprint
  library in `data/cardhashes.md` and the scan-to-metadata bridge in
  `data/cardScanMap.md`.

## What it is

An optional camera input path: the player points a phone or webcam at a Magic
card, the app recognizes it by its artwork on-device, and the recognized card
is added wherever the player is working — no typing. Scanning is not one screen
that belongs to one feature. It is a single shared camera surface and matching
engine reused by three feature-portal destinations: it batches cards into an
In-Depth zone, resolves the one optional card in Quick Question, and adds a
card to a side of the Trade Balancer. It runs entirely in the browser, makes
zero network calls at scan time, and changes nothing about the Ask AI contract.
Manual search is always the default and a permanent fallback; scanning never
becomes the only way to add a card. It sits outside the core product loop
(DEC-050) and is skippable everywhere it appears.

## How it works

### The camera surface (one shared scanner)

- Built: the scanner opens a full-screen camera surface with a card-shaped
  guide reticle (`745/1040`) and a dimmed surround; it auto-scans continuously
  and a manual **Capture** button is always available. (DEC-052, REQ-037,
  FLOW-006)
- Built: the camera is requested at a higher-resolution mode — `getUserMedia`
  with `width`/`height` `{ ideal: 1920/1080 }`, `facingMode { ideal: environment }`,
  and continuous focus where the track supports it — always using `ideal`
  (never `exact`), so a device that cannot honor it degrades gracefully to its
  best mode and a denied camera surfaces the existing `camera-error` path.
  (DEC-074, REQ-053)
- Built: identification runs fully on-device with no network calls; the
  fingerprint library and the metadata bridge are lazy-loaded only on first
  scan, so a user who never scans pays no startup cost. (DEC-051, NFR-010)

### Identifying a card (the engine)

- Built: a single authoritative TypeScript module hashes the card's artwork and
  matches it against the committed fingerprint library, returning a **ranked
  candidate list** best-first — art-level identity, not a single definitive
  printing. The same "recipe" (Region A crop → 64×64 resize → DCT perceptual
  hash) is used on-device and by the offline library build, so parity holds by
  construction. (DEC-051, DEC-053, REQ-034)
- Built: each candidate is bridged `printing id → oracle_id → committed
  CardMetadataItem`; duplicate oracle ids collapse to one candidate by best
  (lowest) distance, and candidates that do not resolve to committed metadata
  are dropped. Downstream identity stays **oracle-level** and unchanged — the
  scan never pushes a printing id into prompt context, rulings, or the request
  payload. (DEC-053, REQ-036)
- Built: the detector finds the card's 4-corner quad on a downscaled frame and
  perspective-warps from full resolution to the canonical image; detection is
  clutter-resistant (centered card-likeness scoring, not the largest quad
  anywhere) and **biased toward the on-screen guide** the player aligns to, so
  background clutter outside the reticle does not win selection. (DEC-072,
  DEC-073, REQ-050, REQ-052)
- Built: card-back detection is descoped from the shipped UX — no canonical
  reference asset exists — so a scanned card back falls through the normal
  low-confidence path rather than prompting "Flip the card over". (DEC-055,
  FLOW-006)

### Locking and hands-free auto-add

- Built: a temporal stabilizer votes the top-1 oracle identity across a short
  rolling window, gated by a tight distance bound **and** a runner-up margin,
  emitting `searching` → `locking` → `locked`. On a confident lock the card is
  **auto-added** to the current destination via the existing add path with no
  Accept tap, and auto-scan immediately resumes for the next card. (DEC-055,
  DEC-056, DEC-057, REQ-040, FLOW-006)
- Built: lock thresholds are tuned toward **ease of lock** — a clearly-leading
  card locks readily — with the runner-up distinctness margin retained as the
  primary false-lock guard and one-tap removal as the safety net for a rare
  wrong add. An ambiguous frame keeps searching rather than committing.
  (DEC-059, DEC-058, REQ-040)
- Built: when an auto-add would hit the stack duplicate-block (`FLOW-004`) or
  the 10-card stack limit, a non-blocking notice shows and scanning continues;
  the card is not silently dropped. These blocks apply only where the
  destination is the stack — a trade side is a value list and does not apply
  them. (DEC-056, REQ-040)

### Confirmation, review, and correction

- Built: each successful auto-add fires a CSS-only thumbs-up popup that fades in
  and out (permitted under the NFR-006 motion carve-out) and plays a short
  "ding" (on by default). A top-left mute toggle silences the sound only, never
  the popup; the mute preference persists across reloads via `localStorage`
  (the first repo use, isolated in `lib/scan/audioPrefs.ts`, degrading to
  unmuted if storage is unavailable). (DEC-057, DEC-061, REQ-040, REQ-042)
- Built: a top-right **scanned-cards review bubble** shows the running count of
  this-session adds and expands to a viewport-capped 320px panel listing each
  card with a single-tap, no-confirmation **Remove**. It operates on the
  destination's own card list (no scan-only store), and each entry uses the
  shared container-relative image + corner-detail presentation. The corner detail
  popup fetches its descriptive fields on demand by oracle id (REQ-175, FLOW-024)
  when opened and the network allows, degrading gracefully offline; when no image
  is available the entry falls back to the card name only, with no fetch triggered
  by image failure, so the scan-review surface stays usable offline (DEC-078).
  (DEC-058, DEC-078, DEC-151, REQ-040, REQ-175, FLOW-006, FLOW-024)
- Built: the scan preview and the added card's thumbnail show the **scanned
  printing's** art — not the oracle-level representative image — so on-screen
  art matches the physical card; a missing printing image falls back to the
  oracle-level image. This is presentation only: `cardId`, the duplicate-stack
  key, prompt context, and rulings stay oracle-level. (DEC-070, REQ-048)
- Built: that oracle-level fallback image is itself the standard-print
  representative chosen by the committed metadata build's
  `choosePreferredCard` — biased toward a standard paper printing over
  special treatments (Secret Lair, promo, showcase, etc.) before the
  most-recent tiebreak, falling back to a special printing only when no
  standard printing exists for that oracle id. This is a metadata-build-time
  refinement of DEC-012 with no scan-engine or runtime impact; the scan path
  is otherwise unaffected because the scanned printing's own art (above)
  displays directly. (DEC-071, REQ-049)

### Real-world robustness

- Built: robustness under glare, dim or uneven light, camera shake, and finger
  occlusion is achieved by feeding the **unchanged** matching engine a cleaner,
  better-chosen query image — extended query-only conditioning (full
  auto-contrast, specular/glare suppression, white-balance normalization) and
  best-frame selection in the stabilizer window — never by loosening the lock
  gate. Finger occlusion is a frame-quality penalty only; there is no
  masked/partial-region hashing. (DEC-062, REQ-043)
- Built: the fingerprint corpus targets every paper gameplay printing carrying
  distinct artwork, **including non-English-only alt-art** (e.g. Japanese
  cards), and coverage is observable from the build so a "no match" can be
  attributed to a real gap rather than guessed at. This is the only
  scan-robustness lever permitted to touch the data build. (DEC-069, REQ-047)
- Built: the `searching` state gives cause-aware guidance — a negative hint when
  conditions are poor ("too much glare — tilt the card", "hold steady", "move
  closer"), a detector nudge when no card is found, and a positive "good — hold
  steady" cue once a frame is good enough to lock — so the player finds the
  lockable zone instead of hunting blind. The generic "Searching for a card…"
  label was removed to keep the indicator box small. (DEC-062, DEC-073, DEC-074,
  DEC-093, REQ-054, REQ-071)
- Built: while `locking`, an affirmative outline is drawn on the detected card
  in the viewfinder — a "you're close — hold this angle" cue — reusing the
  existing `locking` state and detector corner geometry; it clears on
  `searching` or lock completion and adds no new control or threshold. (DEC-083,
  REQ-062)

### Diagnostics and the debug overlay

- Built: an opt-in debug overlay (toggle default off, resets each time the
  scanner opens) visualizes how the scanner perceives the card — a live outline
  of the detected region, the art-crop read region, and text metrics
  (best/runner-up distances, margin, votes accumulated/needed, phase, active
  `lockDistance`/`marginMin`). It is read-only from existing signals and its
  toggle sits outside the top-right review/remove hit area so it cannot
  intercept the correction path. (DEC-060, DEC-065, REQ-041)
- Built: while the overlay is enabled, the existing **Capture** button also
  exports the exact raw camera frame for detector tuning; with the overlay off
  (default) Capture behaves normally. Acquisition diagnostics extend across
  capture → detector → frame selector → quality → identity distance → vote
  reason, validated against a two-condition matrix (a hard Mac-webcam baseline
  and a stand-assisted controlled setup) that is a QA device, not a user-facing
  mode. (DEC-072, DEC-077, REQ-051, REQ-057)

### Scan-screen layout and theming

- Built: the camera frame grows to fill available viewport height on tall
  phones (a bounded dynamic-viewport height below `md:`; a proportion-stable
  `aspect-[3/4]` fallback at `md:` and above), with the guide, lock outline, and
  debug overlay scaling to the rendered frame and `object-cover` preserved. All
  overlays — debug toggle, mute, Cardomancer attribution, `Exit scan` row, and
  the review bubble — keep non-overlapping bounds and hit areas at supported
  widths. (DEC-065, DEC-090, REQ-068, NFR-001)
- Built: while scan is open the destination's own search input, card list, and
  outer staged-flow navigation are hidden; scan-local controls including
  **Capture** remain, and **Exit scan** (top-right on the camera surface) is the
  path back to manual search or normal navigation. (DEC-076, REQ-056, FLOW-006)
- Built: the scanner's accent visuals (reticle, lock/progress indicator,
  confirmation popup, review bubble) restyle with the selected app palette
  rather than fixed sky/emerald — an approved presentation-only exception to
  DEC-050's separate scoping that changes no capture, matching, or lock
  behavior. The lock indicator and the add-to-stack confirmation popup were
  among the previously-fixed emerald "semantic-green" states DEC-068 moved
  onto the palette app-wide; the dominant page background behind the staged
  scan screens stays neutralized to slate rather than palette-tinted, same as
  elsewhere in the app. (DEC-068, REQ-046)

## How scan feeds each destination

Scan is a shared input path, not a sub-feature of any one screen. The same
camera surface and engine feed three destinations; what differs is only where
the resolved card lands and what that destination does with it. The oracle-level
identity boundary (DEC-053) is held constant across all three — scan always
resolves to an oracle-level `CardMetadataItem`, and the scanned printing's image
travels as presentation only (DEC-070). Prompt context, rulings, stack/duplicate
semantics, and pricing stay owned by the consuming destination, never by scan.

### In-Depth zone collection — scan's home surface

- Built: a **Scan** entry point sits beside the manual search input on the zone
  card picker; the two share one non-wrapping row and Scan keeps the 44px touch
  floor. This is scan's batch, hands-free home: scan → lock → auto-add into the
  current zone → resume, card after card, until **Exit scan**. (DEC-050,
  REQ-038, REQ-125, FLOW-006)
- Built: an accepted scan reaches the existing preview/add/owner/duplicate-block/
  stack-limit path and produces the same `ZoneCardItem` as a manual add; owner
  comes from the sticky `pendingOwner` selector; stack cards land in scan order,
  bottom-to-top. Each auto-add is an independent instance keyed on `instanceId`,
  so scanning the same card twice yields two review entries and removal targets
  only the chosen one. (DEC-052, DEC-056, DEC-082, REQ-038)

### Quick Question (Quick Lookup)

- Built: scan is **one of two ways** to resolve the optional single card before
  asking a rules question — typed autocomplete search or camera scan, using the
  same FLOW-006 engine — and card input is optional (the player may ask with no
  card attached). A scan resolves to exactly one oracle-level `CardMetadataItem`;
  only one card is active at a time, and there are no zones, stack, or
  per-card enrichment controls. (DEC-107, REQ-073, FLOW-011)
- Built: printing-level scan identity stays presentation-only and is not pushed
  into the request, prompt, or rulings; the scan components are reused, not
  forked. (DEC-053, REQ-073)

### Trade Balancer

- Built: scan is **one of two ways** to add a card to a trade side — scan or
  manual name search. The **scanned printing** (its `Candidate.card_id`) becomes
  the entry's default printing, and the player can change it to any other
  printing of that card if the scanned print is wrong. Scanning is per-side and
  one camera at a time. (DEC-087, DEC-070, REQ-065, FLOW-009)
- Built: here the printing choice carries a **price**, but printing selection is
  a pricing/display layer only — it never reaches prompt context, rulings, or a
  request payload and does not reopen the oracle-level identity model. When the
  camera is unavailable the surface closes with the reason surfaced and manual
  search stays fully functional. (DEC-087, DEC-050, REQ-065)

### One engine, three destinations

- Built: the shared surface is proven by the build, not by directory naming. The
  scan code shared across destinations is grouped into an explicit function-form
  `manualChunks` `scan` group in `vite.config.ts`, and that group is **wider
  than `src/lib/scan/**`**: `hooks/useScanCapture.ts` is reachable from
  In-Depth, Quick Question, and the trade destination, and
  `components/ScanCameraSurface.tsx` from Quick Question and trade. Chunk
  membership is measured import-graph reachability from more than one
  destination. (DEC-157, NFR-014)

## Measured bounds

Bounds travel with a surface only while that surface still exists in code;
values that live in `tuning.ts` are outcome-validated calibration constants, not
product truth, and are recorded here as the current shipped configuration.

- Identification recipe (frozen, `recipe.ts`/`identify.ts`): Region A crop
  `(30,105,715,520)`, 64×64 resize → DCT-II → top-left 16×16 → 32 bytes/channel
  MSB-first, mean R/G/B Hamming on a 0..256 scale, match threshold 120,
  two-orientation (0°/180°) matching, byte-exact pHash/DB-load parity gates.
  (REQ-034, DEC-051)
- Lock/convergence (`tuning.ts`, current trial): `lockDistance 78`,
  `marginMin 14` (runner-up guard, held), stabilizer `windowSize 13 /
  minVotes 3`, 3-frame best-frame selector, frame-quality accept threshold in
  the ~0.45 band. (DEC-059, DEC-062, DEC-074, DEC-077, REQ-040)
- Capture: requested `{ ideal: 1920×1080 }` environment-facing with continuous
  focus and graceful fallback; the prior unconstrained default returned 640×480,
  and the warp normalizes the card to the canonical 1040px height; detection
  runs on a frame downscaled to `MAX_DETECT_DIMENSION` (640). (DEC-074, REQ-053)
- Scan-screen layout: camera frame fills available viewport height (bounded
  dynamic-viewport height below `md:`, `aspect-[3/4]` fallback at `md:`+);
  overlays non-overlapping at ≤360 / 390 / 414px; scanned-cards review panel
  capped at 320px and region-scrolls; review images size to their list-row
  width under DEC-160 (no longer pixel-capped at 92×128px). (DEC-090, DEC-160,
  REQ-068, REQ-129, `screen-layout.md`)
- Performance/footprint: identification targets a fraction of a second per
  identify on a mid-range mobile device; continuous auto-scan degrades
  gracefully (throttle/drop frames) rather than freezing; library and bridge are
  lazy-loaded on first scan. Formal on-device metrics were validated
  qualitatively (owner acceptance / laptop-camera end-to-end), not recorded as a
  counted table — flagged as an ambiguous bound rather than dropped. (NFR-010,
  DEC-055)
- Committed-artifact figures (fingerprint library `~13 MB`, `CARDHSH1` v1,
  corpus `partial` at closeout) live with the corpus doc `data/cardhashes.md`,
  not here.

## Rejected alternatives and deferred scope

- **One-tap Accept / Rescan on a presented card — closed door.** The first
  shipped scanner presented one confident card for a one-tap Add with a Rescan
  control. DEC-056 replaced it with hands-free auto-add and immediate resume;
  Rescan is gone because there is no pending-accept state, and correction is the
  one-tap review-bubble removal (DEC-058). This bound no longer attaches to any
  surface. (DEC-056, DEC-058)
- **Selectable top-3 candidate list while searching — closed door.** DEC-057
  replaced the capped selectable list with a single non-selectable "locking on:
  <name>" indicator; the player does not pick from a list. (DEC-057)
- **In-scan low-confidence manual-search escalation prompt — closed door.**
  DEC-076 removed the in-scan prompt; manual search is reached by **Exit scan**
  while the camera is open. Manual tap-capture is unchanged. (DEC-076, DEC-052)
- **Card-back "Flip the card over" prompt — closed door.** Card-back
  detection is descoped for want of a canonical reference asset. The dormant
  engine detector (`isCardBack()`) was removed as dead code; the `_card_back`
  id is still excluded from the searchable set. Re-enable now requires
  reimplementing the detector as well as supplying the asset. (DEC-055)
- **Loosening the lock gate as the robustness lever — closed door.** Robustness
  is added query-side and detection-side (cleaner query, best-frame selection,
  higher detector recall, guide prior, higher capture resolution); the identity
  gate (`lockDistance`/`marginMin`) stays held so wrong auto-adds stay rare.
  (DEC-062, DEC-072, DEC-074)
- **Switching the corpus to the every-language `all-cards` bulk — closed door.**
  Default Cards already covers every distinct illustration; `all-cards` is ~10×
  the corpus of mostly-duplicate art that collapses through the oracle bridge,
  adding cost with no distinct-art gain. (DEC-069)
- **Overloading `cardScanMap.json` with pricing — closed door.** The Trade
  Balancer uses a separate printing-price artifact rather than coupling
  scan-identity resolution to trade pricing. (DEC-088)
- **Recipe/geometry or `CARDHSH1` bin-format change — flagged escalation, out of
  scope.** Any fix that genuinely needs the frozen Region A recipe or bin format
  (forcing a full DB re-download/re-hash) is recorded as a separate escalation,
  never folded into a robustness story. (DEC-069, DEC-072, DEC-074)
- **Deferred, not cut:** a torch/flash toggle and explicit exposure control
  (DEC-074), multi-card-per-frame detection (REQ-037), manual reorder of scanned
  cards (`FLOW-002`), and re-enabling card-back detection, which now needs a
  reimplemented engine detector as well as a reference asset (DEC-055).

## Where it lives

The engine and control layer live under `apps/frontend/src/lib/scan/`
(`recipe.ts`, `identify.ts`, `dbformat.ts`, `detector.ts`, `stabilizer.ts`,
`tuning.ts`, `frameQuality.ts`, `frameSelection.ts`, `resolveScanCandidates.ts`,
`loadScanMap.ts`, `audioPrefs.ts`, with golden and detector fixtures under
`__fixtures__/`); the camera and overlay UI in
`apps/frontend/src/components/` (`ScanCameraSurface.tsx`, `ScanCardOutline.tsx`,
`ScanDebugOverlay.tsx`, `ScanReviewBubble.tsx`, `ZoneCardPicker.tsx`,
`ZoneCollectionStep.tsx`) and `apps/frontend/src/hooks/useScanCapture.ts`. The
three destinations consume it through `ZoneCollectionStep`/`ZoneCardPicker`
(In-Depth), `components/portal/quick-lookup/QuickLookupApp.tsx` (Quick Question),
and `components/trade/useTradeScan.ts` (Trade Balancer); the shared `scan`
`manualChunks` group is declared in `vite.config.ts` (NFR-014). Build scripts
`scripts/build-card-hashes.mjs` and `scripts/build-card-scan-map.mjs` emit the
committed artifacts under `apps/frontend/public/data/`; the audio asset is
`apps/frontend/public/assets/scanSuccess.wav`. See `PRD/sections/system-map.md`'s
`## Card scanning` block for the full per-subsystem file list, and
`PRD/sections/screen-layout.md`'s `#### Scan camera surface` and
`#### In-Depth — Zone collection` rows for the layout bands. The two committed
Magic-data artifacts are documented in `data/cardhashes.md` and
`data/cardScanMap.md`.
