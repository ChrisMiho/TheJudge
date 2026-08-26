# Graph run — scan-spec

- Run ID: `graph-20260825-212621`
- Profile: `unverified`
- Canary: `denied — hook live (universal: rm -rf; graph: nohup while lock held)`
- Autonomous base: `origin/thejudge-auto/scan-spec`
- Staging: `.worktrees/.graph-intake/graph-20260825-212621/`
- Current node: `review` (build done 2026-08-25 — PR #112 open, ship-ready)
- Next action: `/graph-run PRD/work/scan-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/scan-spec` pushed to origin (`git ls-remote` = 0d7b59d); lock taken (pid 27180); clean tree, no stash; universal canary denied (`rm -rf`), graph canary denied (`nohup` while lock held) | 2026-08-25 |
| 2 | shape | sonnet | ok | `0 → 35` | package `PRD/work/scan-spec/` created (IDEA.md, README.md, STATUS.ideation, intake/refactor-gameplan.md byte-identical); STATUS.md board row added; committed `91cd0ec`, pushed | 2026-08-25 |
| 3 | define | opus | ok | `0 → 41` | spec authored `PRD/sections/scan/README.md` (337 lines) + `PRD/sections/scan/data/{cardhashes,cardScanMap}.md` + `PRD/README.md` nav row + `DESIGN-BRIEF.md`; zero new stable IDs (derived view over existing DEC/REQ/FLOW/NFR); STATUS.refined; non-empty `PRD/sections/` diff → parks at define gate | 2026-08-25 |
| — | define-gate | (owner) | resolved | — | `graph-gate-review` walked the diff — 16/16 items accepted, 0 edits, 0 rejects; STATUS restored to refined; committed `5f3eeee` | 2026-08-25 |
| 4 | gate-qc | sonnet | ok | `0 → 15` | quality-check **PASS**, findings none; `DESIGN-BRIEF.md` validated against the accepted spec, corpus docs, and nav row; STATUS.refined unchanged. Resume re-proof: lock re-taken (pid 32334), graph canary denied (`nohup`) | 2026-08-25 |
| 5 | plan | sonnet | ok | `0 → 61` | GAMEPLAN + 2 verify-only slices — A (12 criteria): spec + 2 corpus docs vs. cited sources/DEC-168/committed artifacts; B (5 criteria): nav row + package diff-scope proof. Flagged bounded correction for slice A: `cardhashes.md` `~14 MB` → `~13 MB` (bin is 13,047,744 bytes). Runtime/browser risk none. STATUS.active; writes all inside `PRD/work/scan-spec/` + board | 2026-08-25 |
| 6 | build | sonnet | ok | `0 → 146` | worktree `.worktrees/implement-scan-spec`, head `thejudge-auto/scan-spec-work`; slice A **12/12** + slice B **5/5** criteria true (verified in worktree criteria files); 2 bounded corrections (`~14 MB`→`~13 MB`; removed a stray `~67px` card-back figure that belongs to Life Tracker, not DEC-055); **PR #112** OPEN (base `thejudge-auto/scan-spec` ← head `thejudge-auto/scan-spec-work`); STATUS.ship-ready. Write-scope: launch checkout byte-unchanged (`git status --porcelain` empty), all writes in worktree | 2026-08-25 |

## Gate verdicts

Walked via `graph-gate-review` on 2026-08-25. The `define` diff minted **zero new
stable IDs** (a derived view over existing DEC/REQ/FLOW/NFR), so the walk mapped
onto the spec's behavior sections, the two corpus docs, and the nav row — 16
items, in diff order. **16 accepted, 0 edited, 0 rejected.** No `PRD/sections/`
change applied; the run's text stands.

| Item | Verdict | Reason |
| --- | --- | --- |
| Spec framing (Status / Backed-by / Corpus header) | accept | — |
| What it is | accept | — |
| How it works — camera surface | accept | — |
| How it works — identifying (engine) | accept | — |
| How it works — locking & hands-free auto-add | accept | — |
| How it works — confirmation, review, correction | accept | — |
| How it works — real-world robustness | accept | — |
| How it works — diagnostics & debug overlay | accept | — |
| How it works — scan-screen layout & theming | accept | — |
| How scan feeds each destination (cross-cutting) | accept | — |
| Measured bounds | accept | — |
| Rejected alternatives & deferred scope | accept | — |
| Where it lives | accept | — |
| Corpus doc `data/cardhashes.md` | accept | — |
| Corpus doc `data/cardScanMap.md` | accept | — |
| `PRD/README.md` nav row | accept | — |

## Open gate

**RESOLVED 2026-08-25 via `graph-gate-review` — 16/16 items accepted, 0 edits, 0
rejects.** The complete diff below is retained as the evidence of what was walked.
Resume: `/graph-run PRD/work/scan-spec/` (re-enters at `gate-qc`).

Originally parked at the `define` gate — owner review of the `PRD/sections/` diff.

Node 3 (`define`) authored the Card Scanning current-state feature spec. This is
a new `PRD/sections/scan/` directory plus one navigation row in `PRD/README.md`.
Per the graph-run contract, any non-empty `PRD/sections/` diff parks for owner
review before the run proceeds to `gate-qc`.

- **New stable IDs minted: none.** The spec is a derived current-state view over
  existing DEC/REQ/FLOW/NFR entries — every ID it carries is a citation to an
  entry that already exists in `decisions.md` / `functional-requirements.md` /
  `user-flows.md` / `non-functional-requirements.md`, not a new definition. The
  gate walk therefore maps onto the spec's behavior sections rather than an ID
  list (expected for Phase A specs #2+, per the established pattern).
- **Files in the diff:** `PRD/sections/scan/README.md` (the spec, 337 lines),
  `PRD/sections/scan/data/cardhashes.md`, `PRD/sections/scan/data/cardScanMap.md`
  (both corpus docs passing the four-clause `data/` bucket test), and one row in
  `PRD/README.md`'s Section Inventory. `DESIGN-BRIEF.md` is the refinement record
  and is not product truth, so it is not part of this gate.
- **Resume command:** `/graph-gate-review PRD/work/scan-spec/` — walk the diff,
  take an accept/edit/reject verdict per behavior section, then it hands back
  `/graph-run PRD/work/scan-spec/`, which re-enters at `gate-qc`.

### Complete `PRD/sections/` diff

```diff
diff --git a/PRD/README.md b/PRD/README.md
index 12c37a9..3f60d41 100644
--- a/PRD/README.md
+++ b/PRD/README.md
@@ -45,6 +45,7 @@ For implementation work, read in this order:
 | `sections/life-tracker/` | draft | Derived, non-authoritative current-state feature spec for the Player Life Tracker, consolidating its decision/requirement/flow sources into one view (DEC-168) |
 | `sections/user-feedback/` | draft | Derived, non-authoritative current-state feature spec for the Feedback & Bug Report feature, consolidating its decision/requirement/flow sources into one view (DEC-168) |
 | `sections/trade-balancer/` | draft | Derived, non-authoritative current-state feature spec for the Trade Balancer, consolidating its decision/requirement/flow sources into one view; its price corpus is documented in the directory's `data/cardPrintingPrices.md` (DEC-168) |
+| `sections/scan/` | draft | Derived, non-authoritative current-state feature spec for Card Scanning — the cross-cutting camera input path shared by In-Depth, Quick Question, and Trade Balancer — consolidating its decision/requirement/flow sources into one view; its two committed Magic-data corpora are documented in the directory's `data/cardhashes.md` and `data/cardScanMap.md` (DEC-168) |
 
 ## Instruction Inventory
 
diff --git a/PRD/sections/scan/README.md b/PRD/sections/scan/README.md
new file mode 100644
index 0000000..f9f6f61
--- /dev/null
+++ b/PRD/sections/scan/README.md
@@ -0,0 +1,337 @@
+# Card Scanning — current-state feature spec
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
+  and Read-First #1. Correct this file against those sources, not the other
+  way around.
+- Backed by: DEC-050, DEC-051, DEC-052, DEC-053, DEC-054, DEC-055, DEC-056,
+  DEC-057, DEC-058, DEC-059, DEC-060, DEC-061, DEC-062, DEC-065, DEC-069,
+  DEC-070, DEC-072, DEC-073, DEC-074, DEC-077, DEC-083, DEC-090, DEC-093,
+  DEC-076, DEC-078, DEC-082, DEC-068, DEC-087, DEC-107, DEC-157, DEC-151,
+  DEC-158, DEC-160, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, REQ-039,
+  REQ-040, REQ-041, REQ-042, REQ-043, REQ-047, REQ-048, REQ-050, REQ-051,
+  REQ-052, REQ-053, REQ-054, REQ-056, REQ-057, REQ-062, REQ-068, REQ-071,
+  REQ-125, REQ-073, REQ-065, REQ-046, REQ-128, REQ-129, FLOW-006, FLOW-009,
+  FLOW-011, NFR-010, NFR-014, NFR-006, NFR-001
+- Corpus: scanning loads two committed Magic-data artifacts, each documented
+  separately as a `data/` concern and not inlined here — the fingerprint
+  library in `data/cardhashes.md` and the scan-to-metadata bridge in
+  `data/cardScanMap.md`.
+
+## What it is
+
+An optional camera input path: the player points a phone or webcam at a Magic
+card, the app recognizes it by its artwork on-device, and the recognized card
+is added wherever the player is working — no typing. Scanning is not one screen
+that belongs to one feature. It is a single shared camera surface and matching
+engine reused by three feature-portal destinations: it batches cards into an
+In-Depth zone, resolves the one optional card in Quick Question, and adds a
+card to a side of the Trade Balancer. It runs entirely in the browser, makes
+zero network calls at scan time, and changes nothing about the Ask AI contract.
+Manual search is always the default and a permanent fallback; scanning never
+becomes the only way to add a card. It sits outside the core product loop
+(DEC-050) and is skippable everywhere it appears.
+
+## How it works
+
+### The camera surface (one shared scanner)
+
+- Built: the scanner opens a full-screen camera surface with a card-shaped
+  guide reticle (`745/1040`) and a dimmed surround; it auto-scans continuously
+  and a manual **Capture** button is always available. (DEC-052, REQ-037,
+  FLOW-006)
+- Built: the camera is requested at a higher-resolution mode — `getUserMedia`
+  with `width`/`height` `{ ideal: 1920/1080 }`, `facingMode { ideal: environment }`,
+  and continuous focus where the track supports it — always using `ideal`
+  (never `exact`), so a device that cannot honor it degrades gracefully to its
+  best mode and a denied camera surfaces the existing `camera-error` path.
+  (DEC-074, REQ-053)
+- Built: identification runs fully on-device with no network calls; the
+  fingerprint library and the metadata bridge are lazy-loaded only on first
+  scan, so a user who never scans pays no startup cost. (DEC-051, NFR-010)
+
+### Identifying a card (the engine)
+
+- Built: a single authoritative TypeScript module hashes the card's artwork and
+  matches it against the committed fingerprint library, returning a **ranked
+  candidate list** best-first — art-level identity, not a single definitive
+  printing. The same "recipe" (Region A crop → 64×64 resize → DCT perceptual
+  hash) is used on-device and by the offline library build, so parity holds by
+  construction. (DEC-051, DEC-053, REQ-034)
+- Built: each candidate is bridged `printing id → oracle_id → committed
+  CardMetadataItem`; duplicate oracle ids collapse to one candidate by best
+  (lowest) distance, and candidates that do not resolve to committed metadata
+  are dropped. Downstream identity stays **oracle-level** and unchanged — the
+  scan never pushes a printing id into prompt context, rulings, or the request
+  payload. (DEC-053, REQ-036)
+- Built: the detector finds the card's 4-corner quad on a downscaled frame and
+  perspective-warps from full resolution to the canonical image; detection is
+  clutter-resistant (centered card-likeness scoring, not the largest quad
+  anywhere) and **biased toward the on-screen guide** the player aligns to, so
+  background clutter outside the reticle does not win selection. (DEC-072,
+  DEC-073, REQ-050, REQ-052)
+- Built: card-back detection is descoped from the shipped UX — no canonical
+  reference asset exists — so a scanned card back falls through the normal
+  low-confidence path rather than prompting "Flip the card over". (DEC-055,
+  FLOW-006)
+
+### Locking and hands-free auto-add
+
+- Built: a temporal stabilizer votes the top-1 oracle identity across a short
+  rolling window, gated by a tight distance bound **and** a runner-up margin,
+  emitting `searching` → `locking` → `locked`. On a confident lock the card is
+  **auto-added** to the current destination via the existing add path with no
+  Accept tap, and auto-scan immediately resumes for the next card. (DEC-055,
+  DEC-056, DEC-057, REQ-040, FLOW-006)
+- Built: lock thresholds are tuned toward **ease of lock** — a clearly-leading
+  card locks readily — with the runner-up distinctness margin retained as the
+  primary false-lock guard and one-tap removal as the safety net for a rare
+  wrong add. An ambiguous frame keeps searching rather than committing.
+  (DEC-059, DEC-058, REQ-040)
+- Built: when an auto-add would hit the stack duplicate-block (`FLOW-004`) or
+  the 10-card stack limit, a non-blocking notice shows and scanning continues;
+  the card is not silently dropped. These blocks apply only where the
+  destination is the stack — a trade side is a value list and does not apply
+  them. (DEC-056, REQ-040)
+
+### Confirmation, review, and correction
+
+- Built: each successful auto-add fires a CSS-only thumbs-up popup that fades in
+  and out (permitted under the NFR-006 motion carve-out) and plays a short
+  "ding" (on by default). A top-left mute toggle silences the sound only, never
+  the popup; the mute preference persists across reloads via `localStorage`
+  (the first repo use, isolated in `lib/scan/audioPrefs.ts`, degrading to
+  unmuted if storage is unavailable). (DEC-057, DEC-061, REQ-040, REQ-042)
+- Built: a top-right **scanned-cards review bubble** shows the running count of
+  this-session adds and expands to a viewport-capped 320px panel listing each
+  card with a single-tap, no-confirmation **Remove**. It operates on the
+  destination's own card list (no scan-only store), and each entry uses the
+  shared container-relative image + corner-detail presentation, falling back to
+  locally carried text/metadata when no image is available. (DEC-058, DEC-078,
+  DEC-151, REQ-040, FLOW-006)
+- Built: the scan preview and the added card's thumbnail show the **scanned
+  printing's** art — not the oracle-level representative image — so on-screen
+  art matches the physical card; a missing printing image falls back to the
+  oracle-level image. This is presentation only: `cardId`, the duplicate-stack
+  key, prompt context, and rulings stay oracle-level. (DEC-070, REQ-048)
+
+### Real-world robustness
+
+- Built: robustness under glare, dim or uneven light, camera shake, and finger
+  occlusion is achieved by feeding the **unchanged** matching engine a cleaner,
+  better-chosen query image — extended query-only conditioning (full
+  auto-contrast, specular/glare suppression, white-balance normalization) and
+  best-frame selection in the stabilizer window — never by loosening the lock
+  gate. Finger occlusion is a frame-quality penalty only; there is no
+  masked/partial-region hashing. (DEC-062, REQ-043)
+- Built: the fingerprint corpus targets every paper gameplay printing carrying
+  distinct artwork, **including non-English-only alt-art** (e.g. Japanese
+  cards), and coverage is observable from the build so a "no match" can be
+  attributed to a real gap rather than guessed at. This is the only
+  scan-robustness lever permitted to touch the data build. (DEC-069, REQ-047)
+- Built: the `searching` state gives cause-aware guidance — a negative hint when
+  conditions are poor ("too much glare — tilt the card", "hold steady", "move
+  closer"), a detector nudge when no card is found, and a positive "good — hold
+  steady" cue once a frame is good enough to lock — so the player finds the
+  lockable zone instead of hunting blind. The generic "Searching for a card…"
+  label was removed to keep the indicator box small. (DEC-062, DEC-073, DEC-074,
+  DEC-093, REQ-054, REQ-071)
+- Built: while `locking`, an affirmative outline is drawn on the detected card
+  in the viewfinder — a "you're close — hold this angle" cue — reusing the
+  existing `locking` state and detector corner geometry; it clears on
+  `searching` or lock completion and adds no new control or threshold. (DEC-083,
+  REQ-062)
+
+### Diagnostics and the debug overlay
+
+- Built: an opt-in debug overlay (toggle default off, resets each time the
+  scanner opens) visualizes how the scanner perceives the card — a live outline
+  of the detected region, the art-crop read region, and text metrics
+  (best/runner-up distances, margin, votes accumulated/needed, phase, active
+  `lockDistance`/`marginMin`). It is read-only from existing signals and its
+  toggle sits outside the top-right review/remove hit area so it cannot
+  intercept the correction path. (DEC-060, DEC-065, REQ-041)
+- Built: while the overlay is enabled, the existing **Capture** button also
+  exports the exact raw camera frame for detector tuning; with the overlay off
+  (default) Capture behaves normally. Acquisition diagnostics extend across
+  capture → detector → frame selector → quality → identity distance → vote
+  reason, validated against a two-condition matrix (a hard Mac-webcam baseline
+  and a stand-assisted controlled setup) that is a QA device, not a user-facing
+  mode. (DEC-072, DEC-077, REQ-051, REQ-057)
+
+### Scan-screen layout and theming
+
+- Built: the camera frame grows to fill available viewport height on tall
+  phones (a bounded dynamic-viewport height below `md:`; a proportion-stable
+  `aspect-[3/4]` fallback at `md:` and above), with the guide, lock outline, and
+  debug overlay scaling to the rendered frame and `object-cover` preserved. All
+  overlays — debug toggle, mute, Cardomancer attribution, `Exit scan` row, and
+  the review bubble — keep non-overlapping bounds and hit areas at supported
+  widths. (DEC-065, DEC-090, REQ-068, NFR-001)
+- Built: while scan is open the destination's own search input, card list, and
+  outer staged-flow navigation are hidden; scan-local controls including
+  **Capture** remain, and **Exit scan** (top-right on the camera surface) is the
+  path back to manual search or normal navigation. (DEC-076, REQ-056, FLOW-006)
+- Built: the scanner's accent visuals (reticle, lock/progress indicator,
+  confirmation popup, review bubble) restyle with the selected app palette
+  rather than fixed sky/emerald — an approved presentation-only exception to
+  DEC-050's separate scoping that changes no capture, matching, or lock
+  behavior. (DEC-068, REQ-046)
+
+## How scan feeds each destination
+
+Scan is a shared input path, not a sub-feature of any one screen. The same
+camera surface and engine feed three destinations; what differs is only where
+the resolved card lands and what that destination does with it. The oracle-level
+identity boundary (DEC-053) is held constant across all three — scan always
+resolves to an oracle-level `CardMetadataItem`, and the scanned printing's image
+travels as presentation only (DEC-070). Prompt context, rulings, stack/duplicate
+semantics, and pricing stay owned by the consuming destination, never by scan.
+
+### In-Depth zone collection — scan's home surface
+
+- Built: a **Scan** entry point sits beside the manual search input on the zone
+  card picker; the two share one non-wrapping row and Scan keeps the 44px touch
+  floor. This is scan's batch, hands-free home: scan → lock → auto-add into the
+  current zone → resume, card after card, until **Exit scan**. (DEC-050,
+  REQ-038, REQ-125, FLOW-006)
+- Built: an accepted scan reaches the existing preview/add/owner/duplicate-block/
+  stack-limit path and produces the same `ZoneCardItem` as a manual add; owner
+  comes from the sticky `pendingOwner` selector; stack cards land in scan order,
+  bottom-to-top. Each auto-add is an independent instance keyed on `instanceId`,
+  so scanning the same card twice yields two review entries and removal targets
+  only the chosen one. (DEC-052, DEC-056, DEC-082, REQ-038)
+
+### Quick Question (Quick Lookup)
+
+- Built: scan is **one of two ways** to resolve the optional single card before
+  asking a rules question — typed autocomplete search or camera scan, using the
+  same FLOW-006 engine — and card input is optional (the player may ask with no
+  card attached). A scan resolves to exactly one oracle-level `CardMetadataItem`;
+  only one card is active at a time, and there are no zones, stack, or
+  per-card enrichment controls. (DEC-107, REQ-073, FLOW-011)
+- Built: printing-level scan identity stays presentation-only and is not pushed
+  into the request, prompt, or rulings; the scan components are reused, not
+  forked. (DEC-053, REQ-073)
+
+### Trade Balancer
+
+- Built: scan is **one of two ways** to add a card to a trade side — scan or
+  manual name search. The **scanned printing** (its `Candidate.card_id`) becomes
+  the entry's default printing, and the player can change it to any other
+  printing of that card if the scanned print is wrong. Scanning is per-side and
+  one camera at a time. (DEC-087, DEC-070, REQ-065, FLOW-009)
+- Built: here the printing choice carries a **price**, but printing selection is
+  a pricing/display layer only — it never reaches prompt context, rulings, or a
+  request payload and does not reopen the oracle-level identity model. When the
+  camera is unavailable the surface closes with the reason surfaced and manual
+  search stays fully functional. (DEC-087, DEC-050, REQ-065)
+
+### One engine, three destinations
+
+- Built: the shared surface is proven by the build, not by directory naming. The
+  scan code shared across destinations is grouped into an explicit function-form
+  `manualChunks` `scan` group in `vite.config.ts`, and that group is **wider
+  than `src/lib/scan/**`**: `hooks/useScanCapture.ts` is reachable from
+  In-Depth, Quick Question, and the trade destination, and
+  `components/ScanCameraSurface.tsx` from Quick Question and trade. Chunk
+  membership is measured import-graph reachability from more than one
+  destination. (DEC-157, NFR-014)
+
+## Measured bounds
+
+Bounds travel with a surface only while that surface still exists in code;
+values that live in `tuning.ts` are outcome-validated calibration constants, not
+product truth, and are recorded here as the current shipped configuration.
+
+- Identification recipe (frozen, `recipe.ts`/`identify.ts`): Region A crop
+  `(30,105,715,520)`, 64×64 resize → DCT-II → top-left 16×16 → 32 bytes/channel
+  MSB-first, mean R/G/B Hamming on a 0..256 scale, match threshold 120,
+  two-orientation (0°/180°) matching, byte-exact pHash/DB-load parity gates.
+  (REQ-034, DEC-051)
+- Lock/convergence (`tuning.ts`, current trial): `lockDistance 78`,
+  `marginMin 14` (runner-up guard, held), stabilizer `windowSize 13 /
+  minVotes 3`, 3-frame best-frame selector, frame-quality accept threshold in
+  the ~0.45 band. (DEC-059, DEC-062, DEC-074, DEC-077, REQ-040)
+- Capture: requested `{ ideal: 1920×1080 }` environment-facing with continuous
+  focus and graceful fallback; the prior unconstrained default returned 640×480,
+  and the warp normalizes the card to the canonical 1040px height; detection
+  runs on a frame downscaled to `MAX_DETECT_DIMENSION` (640). (DEC-074, REQ-053)
+- Scan-screen layout: camera frame fills available viewport height (bounded
+  dynamic-viewport height below `md:`, `aspect-[3/4]` fallback at `md:`+);
+  overlays non-overlapping at ≤360 / 390 / 414px; scanned-cards review panel
+  capped at 320px and region-scrolls; review images size to their list-row
+  width under DEC-160 (no longer pixel-capped at 92×128px). (DEC-090, DEC-160,
+  REQ-068, REQ-129, `screen-layout.md`)
+- Performance/footprint: identification targets a fraction of a second per
+  identify on a mid-range mobile device; continuous auto-scan degrades
+  gracefully (throttle/drop frames) rather than freezing; library and bridge are
+  lazy-loaded on first scan. Formal on-device metrics were validated
+  qualitatively (owner acceptance / laptop-camera end-to-end), not recorded as a
+  counted table — flagged as an ambiguous bound rather than dropped. (NFR-010,
+  DEC-055)
+- Committed-artifact figures (fingerprint library `~14 MB`, `CARDHSH1` v1,
+  corpus `partial` at closeout) live with the corpus doc `data/cardhashes.md`,
+  not here.
+
+## Rejected alternatives and deferred scope
+
+- **One-tap Accept / Rescan on a presented card — closed door.** The first
+  shipped scanner presented one confident card for a one-tap Add with a Rescan
+  control. DEC-056 replaced it with hands-free auto-add and immediate resume;
+  Rescan is gone because there is no pending-accept state, and correction is the
+  one-tap review-bubble removal (DEC-058). This bound no longer attaches to any
+  surface. (DEC-056, DEC-058)
+- **Selectable top-3 candidate list while searching — closed door.** DEC-057
+  replaced the capped selectable list with a single non-selectable "locking on:
+  <name>" indicator; the player does not pick from a list. (DEC-057)
+- **In-scan low-confidence manual-search escalation prompt — closed door.**
+  DEC-076 removed the in-scan prompt; manual search is reached by **Exit scan**
+  while the camera is open. Manual tap-capture is unchanged. (DEC-076, DEC-052)
+- **Card-back "Flip the card over" prompt and the ~67px/strict edge cues —
+  closed door.** Card-back detection is descoped for want of a canonical
+  reference asset; the engine method and build support remain dormant, re-enable
+  by supplying the asset. (DEC-055)
+- **Loosening the lock gate as the robustness lever — closed door.** Robustness
+  is added query-side and detection-side (cleaner query, best-frame selection,
+  higher detector recall, guide prior, higher capture resolution); the identity
+  gate (`lockDistance`/`marginMin`) stays held so wrong auto-adds stay rare.
+  (DEC-062, DEC-072, DEC-074)
+- **Switching the corpus to the every-language `all-cards` bulk — closed door.**
+  Default Cards already covers every distinct illustration; `all-cards` is ~10×
+  the corpus of mostly-duplicate art that collapses through the oracle bridge,
+  adding cost with no distinct-art gain. (DEC-069)
+- **Overloading `cardScanMap.json` with pricing — closed door.** The Trade
+  Balancer uses a separate printing-price artifact rather than coupling
+  scan-identity resolution to trade pricing. (DEC-088)
+- **Recipe/geometry or `CARDHSH1` bin-format change — flagged escalation, out of
+  scope.** Any fix that genuinely needs the frozen Region A recipe or bin format
+  (forcing a full DB re-download/re-hash) is recorded as a separate escalation,
+  never folded into a robustness story. (DEC-069, DEC-072, DEC-074)
+- **Deferred, not cut:** a torch/flash toggle and explicit exposure control
+  (DEC-074), multi-card-per-frame detection (REQ-037), manual reorder of scanned
+  cards (`FLOW-002`), and re-enabling card-back detection once a reference asset
+  exists (DEC-055).
+
+## Where it lives
+
+The engine and control layer live under `apps/frontend/src/lib/scan/`
+(`recipe.ts`, `identify.ts`, `dbformat.ts`, `detector.ts`, `stabilizer.ts`,
+`tuning.ts`, `frameQuality.ts`, `frameSelection.ts`, `resolveScanCandidates.ts`,
+`loadScanMap.ts`, `audioPrefs.ts`, with golden and detector fixtures under
+`__fixtures__/`); the camera and overlay UI in
+`apps/frontend/src/components/` (`ScanCameraSurface.tsx`, `ScanCardOutline.tsx`,
+`ScanDebugOverlay.tsx`, `ScanReviewBubble.tsx`, `ZoneCardPicker.tsx`,
+`ZoneCollectionStep.tsx`) and `apps/frontend/src/hooks/useScanCapture.ts`. The
+three destinations consume it through `ZoneCollectionStep`/`ZoneCardPicker`
+(In-Depth), `components/portal/quick-lookup/QuickLookupApp.tsx` (Quick Question),
+and `components/trade/useTradeScan.ts` (Trade Balancer); the shared `scan`
+`manualChunks` group is declared in `vite.config.ts` (NFR-014). Build scripts
+`scripts/build-card-hashes.mjs` and `scripts/build-card-scan-map.mjs` emit the
+committed artifacts under `apps/frontend/public/data/`; the audio asset is
+`apps/frontend/public/assets/scanSuccess.wav`. See `PRD/sections/system-map.md`'s
+`## Card scanning` block for the full per-subsystem file list, and
+`PRD/sections/screen-layout.md`'s `#### Scan camera surface` and
+`#### In-Depth — Zone collection` rows for the layout bands. The two committed
+Magic-data artifacts are documented in `data/cardhashes.md` and
+`data/cardScanMap.md`.
diff --git a/PRD/sections/scan/data/cardScanMap.md b/PRD/sections/scan/data/cardScanMap.md
new file mode 100644
index 0000000..c37f475
--- /dev/null
+++ b/PRD/sections/scan/data/cardScanMap.md
@@ -0,0 +1,95 @@
+# Scan-to-metadata bridge corpus — `cardScanMap.json`
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
+  Read-First #1. Correct this file against those sources, not the other way
+  around.
+- Backed by: DEC-053, DEC-070, REQ-036, REQ-048, NFR-010
+- Feature that consumes it: `PRD/sections/scan/README.md`
+
+This is a **corpus doc**, not a behavior doc. It records the committed bridge
+artifact that turns an art match (a Scryfall printing id) into an oracle
+identity the rest of the app already understands, and carries the scanned
+printing's own image for display. It is kept separate from the feature spec so
+the behavior README describes what a player does, and the artifact's contents
+stay a `data/` concern rather than being inlined into that behavior.
+
+## Why it is a corpus, not a feature spec
+
+The docs-refactor `data/` bucket test requires all four clauses; this artifact
+passes each one:
+
+- **External upstream source:** Scryfall printing objects (printing ids, oracle
+  ids, card names, and per-printing image urls).
+- **Build/refresh command:** `scripts/build-card-scan-map.mjs`, part of the data
+  pipeline; the Scryfall source refresh is human-approved before it runs.
+- **Committed artifact:** `apps/frontend/public/data/cardScanMap.json`.
+- **Describes Magic, not TheJudge:** each entry is per-printing Magic card
+  identity and image data — `{ oracleId, name, imageUrl }` — not TheJudge product
+  configuration or behavior.
+
+## Why this is a second, separate corpus
+
+Scanning loads two distinct committed Magic-data artifacts, and this bridge is
+kept in its own `data/` doc alongside `cardhashes.md` rather than folded in with
+it. They are genuinely separate corpora: different upstream shapes (card
+**images** hashed into a binary library vs. printing **identity/image
+metadata**), different build scripts (`build-card-hashes.mjs` vs.
+`build-card-scan-map.mjs`), different artifact formats (a ~14 MB `CARDHSH1`
+binary vs. a JSON map), and different measured bounds. Each passes the four-clause
+`data/` test independently, so each is documented independently — the same
+corpus/behavior split the Trade Balancer applied to its single price artifact,
+applied here twice because scan has two corpora.
+
+## Where it comes from and how it is built
+
+- Built at data-build time by `scripts/build-card-scan-map.mjs` from the same
+  Scryfall printing objects the pipeline already reads; each entry's `imageUrl`
+  is that printing's own Scryfall image (DEC-070, REQ-048).
+- **Static, no runtime sync:** the on-device app only ever reads the committed
+  JSON; the resolver makes no runtime network call (DEC-053, REQ-036). **Do not
+  rebuild to read this doc** — regenerating requires the human-approved Scryfall
+  refresh.
+
+## How the scanner uses it
+
+- The engine returns a ranked candidate list of Scryfall printing ids. The
+  resolver (`resolveScanCandidatesRanked`) maps each `printing id → oracle_id →
+  committed CardMetadataItem`, collapses duplicate oracle ids to one candidate by
+  best (lowest) distance, and drops candidates that do not resolve to committed
+  metadata (DEC-053, REQ-036).
+- The best-distance printing's `imageUrl` is threaded through to the locked
+  candidate so the scan preview and the added `ZoneCardItem.imageUrl` show the
+  **scanned printing's** art, not the oracle-level representative image. A
+  missing/empty printing image falls back to the oracle-level
+  `CardMetadataItem.imageUrl` (DEC-070, REQ-048).
+- **Identity stays oracle-level.** Only the display image is printing-level;
+  `cardId`, the duplicate-stack key, prompt context, and rulings remain keyed on
+  the oracle id — no other printing-level data is pushed into `ZoneCardItem`,
+  prompt, or rulings. `imageUrl` is already omitted from LLM-facing prompt text
+  (REQ-030), so the scanned image has no effect on the Ask AI contract (DEC-070).
+
+## Artifact shape
+
+- `apps/frontend/public/data/cardScanMap.json` — a map keyed by Scryfall printing
+  id; each entry is `{ oracleId: string, name: string, imageUrl: string }`
+  (`imageUrl` `""` when the source has none). Follows the committed
+  `cardMetadata.json` static pattern (REQ-036, DEC-070).
+
+## Runtime posture
+
+- **Lazy-loaded only on first scan** — it grows by one url per printing versus a
+  bare `{ oracleId, name }`, but loads only when scanning is first used, so app
+  startup stays unaffected and the growth stays within the NFR-010 lazy-load
+  posture (DEC-070, NFR-010).
+- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
+  `POST /api/ask-ai`, or any product-facing endpoint (DEC-053, DEC-070).
+
+## Where it lives
+
+`scripts/build-card-scan-map.mjs` (build) →
+`apps/frontend/public/data/cardScanMap.json` (committed artifact); runtime read
+through `apps/frontend/src/lib/scan/` (`resolveScanCandidates.ts`,
+`loadScanMap.ts`) and surfaced by `hooks/useScanCapture.ts`. See
+`PRD/sections/system-map.md`'s `### Scan-to-metadata resolver` and
+`### Scan art fidelity` entries for the full machinery detail.
diff --git a/PRD/sections/scan/data/cardhashes.md b/PRD/sections/scan/data/cardhashes.md
new file mode 100644
index 0000000..73a59da
--- /dev/null
+++ b/PRD/sections/scan/data/cardhashes.md
@@ -0,0 +1,108 @@
+# Fingerprint library corpus — `cardhashes.bin`
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
+  Read-First #1. Correct this file against those sources, not the other way
+  around.
+- Backed by: DEC-051, DEC-054, DEC-069, REQ-035, REQ-039, REQ-047, NFR-010
+- Feature that consumes it: `PRD/sections/scan/README.md`
+
+This is a **corpus doc**, not a behavior doc. It records the committed
+fingerprint library the scanner matches against — where the card art comes from,
+how the library is built, and what one committed build holds. It is kept
+separate from the feature spec so the behavior README describes what a player
+does across the three scan destinations, and the artifact's contents stay a
+`data/` concern rather than being inlined into that behavior.
+
+## Why it is a corpus, not a feature spec
+
+The docs-refactor `data/` bucket test requires all four clauses; this artifact
+passes each one:
+
+- **External upstream source:** Scryfall card images (Default Cards,
+  `default-cards.json`), downloaded per-printing during the build.
+- **Build/refresh command:** `scripts/build-card-hashes.mjs`, run via
+  `npm run data:scan-fingerprints` (resumable/budget-bounded, DEC-054); every
+  run downloads images and is itself the explicit human approval — no
+  scheduled/automated refresh.
+- **Committed artifact:** `apps/frontend/public/data/cardhashes.bin` (plus its
+  manifest and the sidecar `cardhashSkiplist.json`).
+- **Describes Magic, not TheJudge:** the artifact is perceptual-hash
+  fingerprints of card artwork keyed by Scryfall printing id — Magic card art
+  data, not TheJudge product configuration or behavior.
+
+## Where it comes from and how it is built
+
+- Built offline by `scripts/build-card-hashes.mjs` from Scryfall Default Cards,
+  hashing each printing's art with the **same authoritative TypeScript recipe**
+  (`recipe.ts` `cropRegionA` + `phashRegionPacked`) the on-device scanner uses,
+  so parity between library and scanner holds by construction (DEC-051, REQ-035).
+- **Resumable by default (`data:scan-fingerprints`):** the run uses the existing
+  (or in-progress partial) bin as its record of already-fingerprinted entries,
+  diffs against the filtered Scryfall printing ids, downloads only missing images
+  to a **transient temp path**, hashes each, and **deletes it immediately** — so
+  the full corpus is fingerprinted across many short runs without ever retaining
+  the ~100 GB image corpus (DEC-054, REQ-039).
+- **Bounded and crash-safe:** optional `--limit N` / `--max-minutes M` budgets
+  (independent or combined); every bin/manifest write is atomic (temp file then
+  rename) and checkpointed every K entries, so a killed run resumes losslessly;
+  downloads are paced with `429`/`5xx` backoff honoring `Retry-After`; permanent
+  failures park an id after N attempts in the skip-list, `--retry-parked`
+  re-includes them (DEC-054, REQ-039).
+- **Non-destructive fresh rebuild:** `--fresh` (`data:scan-fingerprints:fresh`)
+  builds from scratch into a **new** file and never deletes or overwrites the
+  live bin; promotion to the live path is a deliberate manual step (DEC-054,
+  REQ-039).
+- **Coverage is measurable (DEC-069/REQ-047):** the gameplay/corpus inclusion
+  filter is a tested helper (`hashLibBuild.ts` `shouldIncludeScanPrinting`) so
+  legitimate art — including non-English-only alt-art — is not silently dropped,
+  and the operator can query coverage without network via
+  `data:scan-fingerprints --coverage-summary` / `--diagnose-id <id>` /
+  `--diagnose-illustration-id <id>`, plus manifest `targetCount` /
+  `fingerprintedTargetCount` / `missingCount` / `parkedCount` / `corpusStatus`.
+- **Static, no runtime sync:** the on-device app only ever reads the committed
+  bin; identification makes no runtime network call. **Do not rebuild to read
+  this doc** — regenerating requires the human-approved Scryfall image download.
+
+## Artifact shape
+
+- `apps/frontend/public/data/cardhashes.bin` — binary `CARDHSH1` v1 format read
+  by the TS DB reader (`dbformat.ts`), round-tripping byte-identical (REQ-034 /
+  DEC-051 parity gate). Each entry is a Scryfall printing id and its packed
+  per-channel DCT hash; `<id>`, `<id>__back`, and `_card_back` are distinct
+  entry ids.
+- A committed manifest carries the coverage counters above. The sidecar
+  `apps/frontend/public/data/cardhashSkiplist.json` tracks per-id attempt counts
+  and parked ids.
+- The card-back reference (`_card_back`) support is present but dormant: no
+  canonical reference asset ships, so card-back detection is inactive (DEC-055).
+
+## Measured bounds (current committed build)
+
+Read from the committed artifact; a future coverage-extending build moves these.
+
+- Format/size: `CARDHSH1` v1, ~14 MB on disk (loaded lazily; see runtime posture
+  below). The shipped artifact format/size is frozen — a recipe/geometry change
+  would force a full re-download/re-hash (DEC-054, REQ-039).
+- Corpus status at closeout: `partial` under DEC-054 — 97311/97323 fingerprinted;
+  closing the remaining gap is a human-approved coverage-extending build, not a
+  code change (`system-map.md`, DEC-069).
+
+## Runtime posture
+
+- **Lazy-loaded only on first scan** — app startup and every non-scanning path
+  are unaffected for a user who never scans (NFR-010). The library and the
+  scan-to-metadata bridge (`data/cardScanMap.md`) are the two artifacts the scan
+  surface pulls on first use.
+- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
+  `POST /api/ask-ai`, or any product-facing endpoint; identification is
+  frontend-only with zero scan-time network calls (DEC-050, DEC-051).
+
+## Where it lives
+
+`scripts/build-card-hashes.mjs` (build; `data:scan-fingerprints` /
+`data:scan-fingerprints:fresh`) → `apps/frontend/public/data/cardhashes.bin` +
+manifest + `cardhashSkiplist.json` (committed); runtime read through
+`apps/frontend/src/lib/scan/` (`dbformat.ts`, `recipe.ts`, `identify.ts`). See
+`PRD/sections/system-map.md`'s `### Fingerprint library build` and
+`### Identification core` entries for the full machinery detail.
```



## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly. Do not improvise around it.

Invocation parameters:
- `--branch thejudge-auto/scan-spec`
- `--run-id graph-20260825-212621`

Run the skill's full procedure:
1. Confirm no stop sentinel `.worktrees/.graph-stop` exists (refuse if it does).
2. Take the concurrency lock first (the script takes it — do not hand-write it). Report the `classifyLock()` state.
3. Issue the universal canary `CANARY_COMMAND` as a real Bash tool call and require the hook to DENY it. Record `classifyCanary()`'s `ledgerLine`.
4. After the lock is held, issue `GRAPH_CANARY_COMMAND` as a real Bash tool call and require the hook to DENY it (graph tier now armed). Record `classifyGraphCanary()`'s `ledgerLine`. An allowed graph canary is BLOCKED — stop and report.
5. Run `npm run graph:preflight -- --branch thejudge-auto/scan-spec --run-id graph-20260825-212621 --dry-run`, report the classification, resolved base, planned commands, and the `profile sentinel:` / `Profile:` lines.
6. If not blocked, re-run the identical command without `--dry-run`, same `--run-id`.
7. Confirm `git status --porcelain` is empty and `git branch --show-current` is `thejudge-auto/scan-spec`.

The working tree is already clean (I verified 0 changed files), so expect the auto-commit/stash path to be a no-op — but run the script and report exactly what it does, do not assume.

Report back, verbatim where the skill says verbatim:
- The `classifyLock()` state.
- Both canary ledger lines (universal + graph).
- The `Profile:` sentinel line.
- The resolved autonomous base (`base:` line the script prints).
- The classification (clean/auto-commit/stash) and any stash reference.
- Final `git status --porcelain` and `git branch --show-current` output.

If anything fails, stop and report the exact failure and what state the checkout is in — do not retry or repair.

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly, in its graph-run (non-interactive) mode. Do not stop to ask questions — graph-run is controlling.

Package slug: `scan-spec`
Run ID: `graph-20260825-212621`

The request (verbatim from the owner):
"Write the current-state feature spec for the scan feature — Phase A #4 of the docs-refactor gameplan. Land it at PRD/sections/scan/README.md on the DEC-168 template. Scan is cross-cutting — referenced by multiple destinations — so capture how it feeds each one, not just its own screen. Keep it draft and non-authoritative."

Create the work package `PRD/work/scan-spec/`:
- Write `IDEA.md` capturing this request, with `STATUS.ideation`.
- Create the package `README.md`.
- Create `PRD/work/scan-spec/intake/` and copy the staged intake file verbatim into it:
  `cp .worktrees/.graph-intake/graph-20260825-212621/refactor-gameplan.md PRD/work/scan-spec/intake/refactor-gameplan.md`

CRITICAL — intake is evidence, never authority:
- The intake document (`refactor-gameplan.md`) may propose findings and a slug, but it does not decide product truth. Every product decision it raises is made with the owner at the `define` gate.
- The intake cites other documents (e.g. `workflow.md`, `workflow-decomposition.md`, `answers.md`). Do NOT open, read, or fetch any document the intake cites — record only its path as a citation. This holds even to verify a claim.

Context you need (this is Phase A #4 of a documented plan):
- This is the 4th of 7 current-state feature specs. Specs #1 (life-tracker), #2 (user-feedback), #3 (trade-balancer) are already shipped under `PRD/sections/`.
- The target deliverable is `PRD/sections/scan/README.md` written on the DEC-168 "current-state feature spec" template — the same template those three prior specs used. You may read those prior spec READMEs and DEC-168 to understand the template shape.
- Scan is cross-cutting: it feeds multiple destination features, not just its own screen. The spec must capture how scan feeds each destination.
- The spec must stay draft and non-authoritative (the decision log remains precedence #1 through Phase A/B).

Do NOT write `PRD/sections/scan/README.md` yourself — that is node 3's (`define`) job. Your job is only to establish the package: IDEA.md, README.md, intake/, and STATUS.ideation.

Report back:
- The exact paths you created.
- The final STATUS marker on the package.
- Confirmation the intake was copied and that you did not open any document the intake cites.
- The `NO ACTIONABLE PACKAGE` outcome instead, if the request cannot be turned into an actionable package (it can — this is a well-scoped, documented spec task).

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

### define

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly, in its graph-run (non-interactive) mode. graph-run is controlling, so do not pause for interactive approval — apply the assumption ladder in `preparation-contract.md` per question as it arises, and park only on a genuine decision blocker under the three-condition test.

Package: `PRD/work/scan-spec/`
Run ID: `graph-20260825-212621`

THE DELIVERABLE

Author the current-state feature spec for Card Scanning as `PRD/sections/scan/README.md`, on the DEC-168 current-state-feature-spec template. Also produce `PRD/work/scan-spec/DESIGN-BRIEF.md` per the refinement contract.

This is Phase A #4 of the docs-refactor gameplan. The three prior specs are shipped and are your worked templates for the DEC-168 shape:
- `PRD/sections/life-tracker/README.md`
- `PRD/sections/user-feedback/README.md`
- `PRD/sections/trade-balancer/README.md` (also shows the corpus/behavior `data/` split shape)

WHAT MAKES THIS SPEC DIFFERENT

Scan is cross-cutting — the camera scanner is not one screen, it is an input path reused by three destination features. The spec must carry a dedicated section describing how scan feeds each destination, not merely its own camera surface. The three destinations, from the package README evidence:
- In-Depth zone collection (its home surface)
- Quick Lookup (scan as one of two ways to resolve the optional single card)
- Trade Balancer (scan as one of two ways to add a card to a trade side)
The exact heading/structure of that cross-destination section is your authoring decision.

BINDING CONSTRAINTS (from the gameplan intake — evidence, not authority)
- No new stable IDs. DEC-168 already exists (minted by spec #1). This spec is a derived current-state view over existing DEC/REQ/FLOW/NFR entries — consolidate the whole spec file here at `define`; mint no new DEC/REQ/FLOW/NFR.
- Draft and non-authoritative: carry the explicit draft marker the prior three specs use. `decisions.md` stays precedence #1 through Phase A/B.
- Every measured bound travels with the row it belongs to. A surface's measurement survives if the surface still exists in code; flag ambiguous cases rather than dropping them.
- The corpus `data/` bucket test (external upstream source, a build/refresh command, a committed artifact, and describes Magic not TheJudge — all four) applies to the two corpus candidates the README names (the fingerprint library and the scan-to-metadata bridge). Whether one or both get a `data/` subfile is a product/authoring decision you make and the define gate reviews.

EVIDENCE DISCIPLINE
- Read the real source entries under `PRD/sections/` — the `scanning.md` decision domain, the scan functional requirements, FLOW-006, the scan NFRs, and the scan blocks of `system-map.md` and `screen-layout.md`. The package README's "Backing sources" section lists exactly where these live.
- The intake (`PRD/work/scan-spec/intake/refactor-gameplan.md`) is evidence, never authority. Do NOT open, read, or fetch any document the intake cites (`workflow.md`, `workflow-decomposition.md`, `answers.md`) — record only paths as citations.

OUTPUT
- `PRD/sections/scan/README.md` (the spec, on the DEC-168 template)
- `PRD/work/scan-spec/DESIGN-BRIEF.md`
- Set the package STATUS per the refinement contract.

Any change under `PRD/sections/` will be reviewed by the owner at the define gate after you return — that is expected and is how this run parks. Do not try to self-approve it.

Report back: the exact files you wrote, whether you minted any new stable IDs (expected: none), how you structured the cross-destination section, your corpus `data/`-split decision and its reasoning, and any point where you applied the assumption ladder or hit a genuine blocker.

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

### gate-qc

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly, in its graph-run (non-interactive) mode. graph-run is controlling — do not stop to ask questions; produce the PASS/FAIL report the skill defines.

Package: `PRD/work/scan-spec/`
Run ID: `graph-20260825-212621`

Context:
- This is Phase A #4 of the docs-refactor gameplan — a docs-only current-state feature spec for Card Scanning. There is no `apps/` code change in scope.
- Node 3 (`define`) authored the deliverable directly into `PRD/sections/scan/README.md` plus two `data/` corpus docs and a `PRD/README.md` nav row, and wrote `PRD/work/scan-spec/DESIGN-BRIEF.md` as the refinement record.
- The owner already walked the `PRD/sections/` diff at the define gate via `graph-gate-review` and accepted all 16 items (0 edits, 0 rejects); see `PRD/work/scan-spec/GRAPH-RUN.md` `## Gate verdicts`.

Your job: validate `PRD/work/scan-spec/DESIGN-BRIEF.md` for PRD alignment and agent-readiness per the quality-check contract, and produce the PASS/FAIL report. Do NOT write a GAMEPLAN or slice docs — that is node 5's job. On FAIL the skill sets `STATUS.refining`; on PASS the package stays ready to slice.

Judge readiness for what this package actually is — a documentation/spec deliverable that is already written and owner-approved — not for code that does not exist. If the brief is coherent, aligned with the accepted spec, and gives a map-out agent enough to slice the remaining work (e.g. the `PRD/README.md` nav row and any diff-scope/verification slice, mirroring how the prior Phase A specs were sliced), that is a PASS.

Report back:
- The PASS or FAIL verdict.
- The exact findings list (none, or the complete issue list) in the shape the quality-check contract specifies for the `## Preparation gate` section.
- The `STATUS.*` marker state after you run.

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

### plan

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 5 (`plan`) of an autonomous graph run. Invoke the `thejudge-map-out` skill and follow it exactly, in its graph-run (non-interactive) mode. graph-run is controlling — do not stop to ask questions.

Package: `PRD/work/scan-spec/`
Run ID: `graph-20260825-212621`

Before writing any planning artifact, confirm the package README's `## Preparation gate` reads `Quality-check: PASS` (it does — node 4 recorded it). You cannot self-certify it.

Produce `GAMEPLAN.md` and the lettered slice docs (with a `slice-<letter>.criteria.json` per slice), and set `STATUS.active`.

CRITICAL CONTEXT — this is a docs-only spec run, and the deliverable is ALREADY WRITTEN:
- This is Phase A #4 of the docs-refactor gameplan. Node 3 (`define`) authored the entire deliverable directly into product truth and it is already committed on the autonomous base `origin/thejudge-auto/scan-spec` (commit 7cd4f41): `PRD/sections/scan/README.md` (the spec), `PRD/sections/scan/data/cardhashes.md` and `PRD/sections/scan/data/cardScanMap.md` (two corpus docs), and one `PRD/README.md` Section Inventory nav row.
- The owner already walked that `PRD/sections/` diff at the define gate via `graph-gate-review` and accepted all 16 items (0 edits, 0 rejects).
- So there is NO "write the spec" work left. Slicing it as authoring work would duplicate what already shipped.

The three prior Phase A specs (#1 life-tracker, #2 user-feedback, #3 trade-balancer) sliced this identical situation as VERIFY-ONLY slices. Mirror that shape unless you find a concrete reason not to:
- Slice A (verify-only): verify the already-committed `PRD/sections/scan/README.md` and the two `data/` corpus docs against their cited sources (the DEC/REQ/FLOW/NFR they name) and the DEC-168 template; verify each corpus doc's measured figures against the committed artifacts under `apps/frontend/public/data/` read directly (NO rebuild — rebuild needs a human-approved Scryfall download). Bounded correction only if something is actually wrong.
- Slice B (verify-only): verify the `PRD/README.md` nav row and prove the package-wide diff since the fork point touched nothing outside the licensed set (the scan spec + two corpus files, the one nav row, and `PRD/work/scan-spec/`).

Each criterion in every `criteria.json` must carry a real `evidence` block (command pattern, file paths, or `"manual": true`) per the map-out contract — the build node earns them by observed tool calls.

Runtime/browser risk: none — this package is documentation-only, no UI surface change, nothing browser-observable. State that in the GAMEPLAN's runtime section so no Playwright verification is required.

Report back: the slice letters and titles, the criteria count per slice, the `## Runtime / browser risk` verdict, and the final `STATUS.*` marker.

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

### build

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`) of an autonomous graph run. Invoke the `thejudge-implement-all` skill and follow it exactly, in its graph-run (non-interactive) mode. graph-run is controlling — do not stop to ask questions; complete every remaining slice in one unattended session.

Package: `PRD/work/scan-spec/`
Run ID: `graph-20260825-212621`

Branch inputs (both matter — do not derive your own):
- Autonomous base (PR base, already recorded in the package README `## Autonomous metadata`): `origin/thejudge-auto/scan-spec`. It already carries the shipped deliverable and all planning artifacts (pushed at commit 28c4ae2).
- Shared head branch for the PR (pass this as the skill's shared-branch input): `thejudge-auto/scan-spec-work`. This MUST be distinct from the base — the PR is `thejudge-auto/scan-spec-work` → `thejudge-auto/scan-spec`. Do not let the shared branch default to the base name.
- Worktree: `.worktrees/implement-scan-spec` (repo-local; never create a worktree outside `.worktrees/`).

Execute both slices to completion, earning every acceptance criterion in `slice-a.criteria.json` (A1–A12) and `slice-b.criteria.json` (B1–B5) by real observed tool calls — the boundary hook logs evidence from your actual commands, so run the verifications for real; do not hand-set any criterion to true.

Scope reminders for this docs-only spec package:
- Both slices are verify-only. The deliverable (`PRD/sections/scan/README.md` + the two `data/` corpus docs + the `PRD/README.md` nav row) is already committed on the base. Verify it against its cited DEC/REQ/FLOW/NFR sources, the DEC-168 template, and the committed data artifacts under `apps/frontend/public/data/` read directly. Do NOT rebuild any data artifact — a rebuild needs a human-approved Scryfall download.
- Slice A carries one bounded correction the plan flagged (criterion A9): `PRD/sections/scan/data/cardhashes.md` states the fingerprint library is `~14 MB`, but the committed `cardhashes.bin` is 13,047,744 bytes (~13 MB). Apply that factual correction inside the worktree so it rides the PR for owner review; keep the change bounded to that figure.
- No `apps/` code change. No runtime/browser verification — the GAMEPLAN records runtime/browser risk as none.
- All your writes must stay inside the worktree `.worktrees/implement-scan-spec/` (which mirrors the repo, so editing product files there is correct) or `PRD/work/scan-spec/`. Do not write elsewhere in the launch checkout.

When every criterion is true, open the pull request `thejudge-auto/scan-spec-work` → `thejudge-auto/scan-spec` showing the whole deliverable, and set `STATUS.ship-ready` per the skill.

Report back:
- The worktree path and the shared/head branch actually used.
- Per-slice: criteria all true (with the evidence), and the bounded correction applied.
- The PR number and URL, and its confirmed base and head branches.
- The final `STATUS.*` marker.
- Any path you wrote outside `.worktrees/implement-scan-spec/` or `PRD/work/scan-spec/` (expected: none).

Copy the `Working directory:` line above, unchanged, into every prompt you write to any subagent you dispatch.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the scan feature — Phase A #4 of the docs-refactor gameplan. Land it at PRD/sections/scan/README.md on the DEC-168 template. Scan is cross-cutting — referenced by multiple destinations — so capture how it feeds each one, not just its own screen. Keep it draft and non-authoritative. | answered-once | shape | — |
| current-state feature spec | answered-once | shape | — |
| Backing sources | answered-once | define | — |
| write the spec | answered-once | plan | — |
