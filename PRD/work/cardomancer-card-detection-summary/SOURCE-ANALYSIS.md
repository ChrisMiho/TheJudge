status: active

> **Precedence note (added during refinement, 2026-06-19):** This file is the durable
> *algorithm/contract reference* — canonical constants, pipeline mechanics, parity gotchas,
> and DB format extracted from the friend's Cardomancer handoff. It is retained for
> implementers. Where this file's *product/scope/ownership* guidance differs from
> `DESIGN-BRIEF.md` (for example "consume a prebuilt DB first"), **`DESIGN-BRIEF.md` and the
> promoted `DEC-050..DEC-053` win.** TheJudge decided to own DB generation via a single
> shared TypeScript hash recipe (DEC-051), which supersedes the prebuilt-DB-first
> recommendation below. Treat the algorithm / constants / parity sections here as
> authoritative and the merge-gameplan / ownership prose as historical input.

# Cardomancer Card Detection Summary

## Purpose

This work note summarizes `/Users/chrismiho/Coding/Projects/cardomancer-card-detection`
for a later agent that will analyze TheJudge and create an implementation gameplan.
It is intentionally source-focused: it describes what Cardomancer already provides,
which parts are portable, which parts are unresolved, and which decisions TheJudge
must make before implementation.

## Source Package

- Source root: `/Users/chrismiho/Coding/Projects/cardomancer-card-detection`
- Primary docs:
  - `AGENT_HANDOFF.md` - narrative project brief, current status, port order, open decisions.
  - `SPEC.md` - portable contract for detector, hash, matching, DB format, validation.
  - `README.md` - quick start and package map.
- Reference implementation:
  - `reference/detect.py` - generic single-card detector and perspective warp.
  - `reference/identify.py` - query preprocessing, pHash matching, ranked candidates.
  - `reference/phash.py` - canonical perceptual hash oracle.
  - `reference/dbformat.py` - portable `cardhashes.bin` reader/writer.
  - `reference/build_db.py` - offline database builder from Scryfall PNGs.
- TypeScript scaffold:
  - `ts_scaffold/src/phash.ts` - DCT, median, bit packing; resize delegated to backend.
  - `ts_scaffold/src/dbformat.ts` - complete binary DB reader.
  - `ts_scaffold/src/identify.ts` - auto-levels, orientation, matching, ranking.
  - `ts_scaffold/src/backend.ts` - unimplemented image backend surface.
  - `ts_scaffold/test/run-vectors.ts` - golden-vector parity harness.
- Golden vectors:
  - `testdata/vectors/vectors.json`
  - `testdata/vectors/fixture_db.bin`
  - `testdata/vectors/inputs/*.png`

## Executive Summary

Cardomancer is a self-contained handoff for fully on-device Magic card identification
by artwork. The user captures one card, the detector finds a card-shaped quad in the
camera frame, the quad is perspective-warped to a canonical `745x1040` image, the
art region is perceptually hashed, and a local binary hash database returns a ranked
candidate list.

The package is designed for a React/TypeScript app, but the Python reference remains
the source of truth. The TypeScript scaffold already implements most parity-critical
identification math. The remaining implementation surface is image-stack dependent:
decode pixels, resize channel planes to `64x64` with a DB-compatible filter, and later
port the detector once TheJudge's camera/capture UX exists.

The algorithm identifies artwork, not a definitive printing. Reprints that share art
can be near-ties. The app must treat the ranked list as candidates and resolve printing
identity downstream using its own card metadata and UX.

## TheJudge Second-Pass Direction

TheJudge should treat card scanning as an optional faster input method for adding
cards to existing zone fields. It must not replace the current manual card search,
preview, owner, stack validation, enrichment, prompt, or backend flow.

Recommended product shape:

```text
manual path: user searches card name -> preview -> add to selected zone
scan path:   user scans one card -> ranked candidates -> preview -> add to selected zone
```

The scan path should feed the same `selectedCard` / `CardMetadataItem` shape the
manual autocomplete path already uses. Once a scanned candidate is selected, the
existing add-to-zone behavior should handle owner selection, duplicate stack blocking,
stack size limits, zone state, enrichment, and `GameContext` payload construction.

Runtime boundary:

- Card scanning should run inside the frontend/UI half of the project.
- Identification must not call the backend.
- `POST /api/ask-ai`, backend prompt assembly, and backend validation should remain
  unchanged.
- Scan artifacts should be static files loaded by the frontend when scanning is used,
  matching the current static `cardMetadata.json` pattern.

## Identity Strategy for TheJudge

Use two identity layers instead of changing TheJudge's core card model.

1. Scan/database identity: Scryfall printing `id`.
   - Cardomancer hashes are built from specific Scryfall PNGs.
   - The binary DB should keep printing IDs so candidates can be traced back to the
     exact image that produced each hash.
   - Do not rewrite the DB to emit oracle IDs directly; duplicate oracle IDs across
     many printings would make ranking, debugging, and reprint handling worse.

2. TheJudge gameplay identity: Scryfall `oracle_id`.
   - TheJudge already stores `CardMetadataItem.cardId` as an oracle-level ID in the
     committed metadata artifact.
   - Oracle-level identity is the correct prompt and rulings boundary for rules
     questions.
   - Do not migrate `ZoneCardItem.cardId`, prompt context, rulings lookup, or existing
     zone state to printing IDs only for scanning.

Bridge the two with a generated frontend artifact:

```text
Scryfall printing id -> oracle_id -> existing CardMetadataItem
```

The current Scryfall `default_cards` source already contains both `id` and `oracle_id`.
The data pipeline should emit a small scan map during build/refresh, for example:

```json
{
  "<scryfall-printing-id>": {
    "oracleId": "<oracle-id>",
    "name": "Counterspell"
  }
}
```

The scan resolver should:

- read ranked printing IDs from the Cardomancer identifier
- map each printing ID to `oracleId`
- look up the existing `CardMetadataItem` by `oracleId`
- collapse repeated oracle IDs by keeping the best distance
- return ranked metadata candidates to the picker UI
- drop candidates that cannot resolve to committed metadata

This keeps scanning compatible with the existing frontend state and backend payload
while preserving Cardomancer's printing-level traceability.

## Scryfall Data Strategy

The existing Scryfall bulk workflow is the right foundation, but it should emit one
additional scan artifact rather than change the current metadata contract.

Current local observations:

- `apps/frontend/data/scryfall/default-cards.json` is the raw Scryfall source and is
  large enough that transforms should remain streaming-oriented.
- `apps/frontend/public/data/cardMetadata.json` is the existing runtime metadata file.
- The runtime metadata is oracle-level and deduped for TheJudge's current search and
  prompt needs.

Recommended build outputs:

- keep `apps/frontend/public/data/cardMetadata.json`
- add `apps/frontend/public/data/cardScanMap.json`
- add `apps/frontend/public/data/cardhashes.bin`
- add `apps/frontend/public/data/cardhashManifest.json`

Important distinction:

- Scryfall bulk JSON is enough to build the printing-to-oracle scan map.
- Scryfall bulk JSON is not enough to build `cardhashes.bin`.
- The hash DB needs canonical Scryfall PNG pixels, downloaded and cached during a
  build/data-refresh step or imported as a prebuilt artifact.
- The browser must never download Scryfall card images at scan time to identify a card.

Recommended ownership:

- First implementation should support consuming a prebuilt Cardomancer-compatible
  `cardhashes.bin` plus generated TheJudge scan map.
- A later data-pipeline slice can decide whether TheJudge owns PNG downloading and DB
  generation directly or imports the DB from a separate build/release workflow.

## Recommended Merge Gameplan

This gameplan is intentionally parity-first. Camera UX should not be the first slice.

### Slice A - Document Product Decision and Data Contract

Goal: Promote the durable parts of this work note into PRD sections before code.

Requirements:

- Add a confirmed decision that card scanning is an optional frontend-only input path
  into existing zone card fields.
- Add a confirmed decision that scan DB rows use Scryfall printing IDs and TheJudge
  resolves them to oracle IDs before zone insertion.
- Add an open question only for unresolved DB ownership and camera/detector UX details.

Acceptance criteria:

- Product docs say manual search remains supported.
- Product docs say backend API and prompt contracts do not change.
- Product docs identify `cardScanMap.json`, `cardhashes.bin`, and manifest artifacts.

### Slice B - Port Identification Core With Golden Vectors

Goal: Bring over the pure TypeScript Cardomancer identification core before any camera
work.

Requirements:

- Add DB reader, pHash, auto-levels, crop, orientation matching, card-back check, and
  ranked candidate output.
- Implement or adapt a frontend-compatible image backend for golden-vector fixtures.
- Preserve byte-exact pHash behavior against Cardomancer vectors.

Acceptance criteria:

- DB vector test passes.
- pHash vector tests pass byte-for-byte.
- auto-levels vector test passes pixel-for-pixel.
- identify vector test matches candidate order, IDs, distances, `matched`, and
  `was_rotated`.

### Slice C - Add Scan Map Artifact and Candidate Resolver

Goal: Convert scan output into existing `CardMetadataItem` candidates.

Requirements:

- Extend the data build to emit printing ID to oracle ID scan map from Scryfall bulk
  data.
- Build an oracle ID lookup from existing `cardMetadata.json` at runtime.
- Resolve ranked Cardomancer candidates into deduped metadata candidates.
- Preserve best scan distance per oracle ID for diagnostics and candidate ordering.

Acceptance criteria:

- A known Scryfall printing ID maps to the expected existing metadata item.
- Multiple printings for the same oracle ID collapse to one candidate.
- Unresolvable scan candidates are ignored without breaking the picker.
- No backend route or request schema changes are introduced.

### Slice D - Wire Scan Results Into Existing Zone Picker

Goal: Add scanning as an alternate selection path in the current zone collection UI.

Requirements:

- Add a scan entry point beside or near the existing card search input.
- When scan candidates are available, show them as selectable card metadata candidates.
- Selecting a scan candidate should populate the same preview used by manual search.
- The existing add button, owner selection, duplicate stack blocking, and stack limit
  should handle the selected card unchanged.

Acceptance criteria:

- Manual search still works.
- Scan candidate selection reaches the existing preview and add flow.
- Added scanned cards produce the same `ZoneCardItem` shape as manually added cards.
- Existing zone collection tests are extended rather than replaced.

### Slice E - Camera and Detector UX

Goal: Add live or captured-image scanning only after the identification and resolver
layers are proven.

Requirements:

- Decide the browser image stack and detector strategy.
- Decide whether the first UX is live camera scanning or guided single-photo capture.
- Tune detector area fractions to the chosen UX.
- Validate on representative mobile captures.

Acceptance criteria:

- Real captures produce usable canonical card images.
- Identification top candidates are plausible after detector warp.
- Card-back and no-match states are handled without adding backend calls.
- Performance is measured on target mobile devices.

## Implementation Guardrails

- Do not change `AskAiRequest`, `GameContext`, backend prompt assembly, or backend
  provider boundaries for scanning.
- Do not replace manual autocomplete; scanning is an alternate input path.
- Do not make runtime network calls to Scryfall or TheJudge backend during
  identification.
- Do not force printing-level identity into zone state or prompts.
- Do not build printing disambiguation, set/collector selection, price lookup, grading,
  or multi-card detection in the first implementation plan.
- Keep scan artifacts lazy-loaded so users who never scan do not pay the startup cost.

## Remaining Open Questions After Second Pass

1. Image stack and resize parity.
   - The pHash resize must match the DB builder.
   - Prefer a browser/frontend image path with Lanczos-compatible resize.
   - If the frontend cannot reproduce Lanczos, rebuild both DB and vectors with the
     chosen filter before trusting distances.

2. Hash DB ownership.
   - Decide whether TheJudge generates `cardhashes.bin` from downloaded Scryfall PNGs
     or imports a prebuilt artifact.
   - The first implementation can consume a prebuilt DB and defer full PNG download
     pipeline ownership.

3. Camera/capture UX.
   - Decide live camera vs guided single-photo capture.
   - Tune detector area fractions after choosing the UX.

4. Card-back handling.
   - Decide whether card backs show a specific "flip the card" state or a generic
     no-match / low-confidence candidate state.

5. Performance budgets.
   - Measure `cardhashes.bin` size, scan map size, lazy-load time, memory use, and
     match latency on target mobile devices.

## Pipeline

1. Camera frame enters as RGB or BGR pixels at any frame size.
2. Detector finds the best single card-shaped quad.
3. Perspective warp maps the quad to canonical `745x1040`.
4. Query-only auto-levels applies a per-channel black-point stretch.
5. Region A is cropped from the canonical image.
6. pHash runs per RGB channel for both upright and `180deg` orientations.
7. Matching compares packed hashes against local `cardhashes.bin`.
8. The result is `{ matched, was_rotated, candidates }`, where candidates are sorted
   by ascending perceptual distance.

## Canonical Constants

- Card image size: `745x1040`
- Card aspect ratio: `1040 / 745 ~= 1.396`
- Region A: `(x1=30, y1=105, x2=715, y2=520)`
- Region A size: `685x415`
- Hash size: `16x16 = 256 bits` per color channel
- Hash channels: `R`, `G`, `B`
- Packed hash bytes per card: `3 * 32 = 96`
- Resize target before DCT: `64x64`
- Reference resize filter: PIL `LANCZOS`
- Match threshold: `120` on a `0..256` mean-channel Hamming scale
- Card-back threshold: `100`
- Back-face suffix to strip on output: `__back`
- Special DB card-back id: `_card_back`
- DB magic/version: `CARDHSH1` / `1`

## Detector Mechanics

Source: `reference/detect.py`, matching `SPEC.md` section 3.

The detector is a generic single-card detector extracted from a fixed-rig sorter.
The old rig-specific staging polygon and absolute pixel bounds were removed. The
portable detector uses frame-relative area bounds and selects the largest valid
card-shaped quad.

Detector flow:

1. Split the frame into gray, B, G, and R channels.
2. Gaussian-blur each channel with a `3x3` kernel.
3. Run Canny with thresholds `(30, 90)`.
4. Primary pass: OR the B/G/R edge maps, then run the morph cascade with iterations
   `1`, then `3` if needed.
5. Fallback pass: run the morph cascade independently on gray/B/G/R, collect valid
   candidates, reject background-merged outliers larger than `median_area * 1.15`,
   then keep the largest remaining candidate.
6. Shape filters require:
   - area between `MIN_AREA_FRAC * frameArea` and `MAX_AREA_FRAC * frameArea`
   - solidity at least `0.65`
   - aspect ratio within `35%` of `1.396`
   - rectangularity at least `0.70`
   - `approxPolyDP` simplifies to exactly 4 points at epsilon `2%`, `4%`, `6%`, or `8%`
7. If no exact four-corner polygon survives but a contour passes the other filters,
   the detector falls back to the contour's `minAreaRect` box.
8. Outward refinement searches up to about `40px` outside each side to snap from the
   inner frame edge to the outer card edge.
9. Refinement is rejected if refined area / original area is outside `[0.98, 1.30]`.
10. Perspective warp orders corners, guards landscape orientation, maps to
    `(0,0)`, `(744,0)`, `(744,1039)`, `(0,1039)`, and rotates if still landscape.

Detector tuning constants:

- `ASPECT_TOLERANCE = 0.35`
- `SOLIDITY_MIN = 0.65`
- `RECTANGULARITY_MIN = 0.70`
- `CANNY_LO = 30`
- `CANNY_HI = 90`
- `MIN_AREA_FRAC = 0.05`
- `MAX_AREA_FRAC = 0.95`

The detector is not expected to be bit-exact across image libraries or OpenCV builds.
Validate it by outcome: real captures should detect a usable quad and produce correct
top-1 identification after warp and hash.

## Identification Mechanics

Sources: `reference/identify.py`, `reference/phash.py`, `ts_scaffold/src/identify.ts`,
and `ts_scaffold/src/phash.ts`.

Identification expects a canonical `745x1040` card image. It does not find the card
inside a larger frame; that is detector responsibility.

Preprocessing:

- Convert input to RGB.
- Apply auto-levels to the full query image only.
- Never auto-level database images during DB build.
- Auto-levels is a per-channel black-point stretch:
  - compute the `0.5` percentile value for each channel
  - if `lo < 1`, leave that channel unchanged
  - otherwise map values below `lo` to `0`
  - map values at/above `lo` with `(v - lo) * 255 / (255 - lo)`, clamped to `[0,255]`
- Crop Region A after auto-levels.

pHash:

- Run once per RGB channel on Region A.
- Resize the channel plane to `64x64` with the same filter used to build the DB.
- Reference uses PIL `LANCZOS`.
- Compute 2D unnormalized DCT-II as `D @ P @ D.T`.
- Take the top-left `16x16` low-frequency block.
- Compute median across all 256 coefficients, including the DC coefficient.
- Set bit when `coefficient > median`.
- Read bits row-major.
- Pack bits MSB-first into `32` bytes per channel.

Matching:

- Hash both the auto-leveled upright image and its `180deg` rotation.
- For each DB row, compute `popcount(query XOR db)` per channel.
- Distance is the mean of R/G/B channel Hamming distances, on a `0..256` scale.
- Choose the orientation whose best candidate has the lower distance.
- Sort candidates by distance.
- `matched` is `true` when best distance is `<= 120`.
- Strip `__back` from returned card ids.
- Optionally reject card backs by comparing both query orientations to `_card_back`;
  reject when distance is `<= 100`.

## Database Format and Build Pipeline

Sources: `reference/dbformat.py` and `reference/build_db.py`.

The shipping database is a little-endian binary file, not JSON or numpy `.npz`.
The app should load `cardhashes.bin` locally with no network call at identification
time.

Binary layout:

```text
0   char[8]  magic = "CARDHSH1"
8   uint32   version = 1
12  uint32   hash_bytes_per_channel = 32
16  uint32   channels = 3
20  uint32   entry_count
24  repeated entries:
    uint16      id_len
    char[]      id UTF-8
    uint8[96]   hash = R[32] || G[32] || B[32]
```

Build inputs:

- Canonical Scryfall PNGs, expected at `745x1040`.
- File names use Scryfall id:
  - `<scryfall_id>.png`
  - `<scryfall_id>__back.png` for back faces
  - optional `card_back_reference.png`
- Optional Scryfall bulk JSON for filtering non-gameplay cards.

Build behavior:

- Crop Region A from each image.
- Compute pHash without auto-levels.
- Exclude problematic non-gameplay layouts such as `art_series`, `planar`, `scheme`,
  `vanguard`, oversized cards, memorabilia "Card" types, substitute/checklist cards,
  and minigame sets.
- Add `_card_back` if a card-back reference image exists.
- Emit `cardhashes.bin` and `manifest.json`.

TheJudge should decide whether this DB is generated inside TheJudge scripts, imported
as a prebuilt artifact, or produced by a separate build/release workflow.

## Existing TypeScript Scaffold

The scaffold is useful implementation source, not just pseudocode.

Already implemented:

- `readDb(bytes)` parses `cardhashes.bin`.
- DCT-II, median, and MSB-first pHash packing are implemented.
- `autoLevels`, `rotate180`, `cropRegionA`, Hamming distance, orientation choice,
  ranking, match threshold, card-back check, and `__back` canonicalization are
  implemented.
- `run-vectors.ts` validates DB parsing, auto-levels, pHash, and end-to-end identify
  against golden fixtures.

Unimplemented:

- `ImageBackend.loadRgb(file)` - decode PNG/JPEG or camera frame to an RGB image.
- `ImageBackend.resizeToGray64(plane)` - parity-critical resize to `64x64`.
- `detect.ts` - intentionally absent; port from `reference/detect.py` only after
  TheJudge chooses its image stack and camera/capture UX.

The scaffold's port order is:

1. DB reader.
2. pHash parity.
3. matching and auto-levels.
4. detector.

For TheJudge, that suggests the first implementation plan should prioritize the
frontend image-backend abstraction, pixel decoding, and resize parity before camera
UI or detector polish.

## Validation Strategy

Use Cardomancer's golden vectors before attempting live camera work.

Required parity checks:

- DB format: load `fixture_db.bin`; assert ids, count, and hash byte lengths.
- pHash: load each PNG input in `vectors.json`, hash R/G/B, and compare expected hex
  byte-for-byte.
- Auto-levels: compare `autolevels_in.png` to `autolevels_out.png` pixel-for-pixel.
- Identify: run `query_card_10.png` against `fixture_db.bin` and compare candidate
  order, ids, distances, `matched`, and `was_rotated`.

Detector validation should use real TheJudge captures:

- detect-rate on representative device frames
- top-1 identification accuracy after warp
- false card-back rejection rate
- failure behavior when no card or multiple cards appear
- performance on target devices

## Original Open Decisions Reconciled

The first-pass handoff listed several TheJudge decisions. After second-pass review:

- Resolved: scanning is an alternate card-input path into existing zone fields, not a
  replacement for manual search.
- Resolved: Cardomancer candidate IDs remain Scryfall printing IDs.
- Resolved: TheJudge gameplay/prompt identity remains oracle-level.
- Resolved: a generated frontend scan map bridges printing IDs to existing
  `CardMetadataItem` records.
- Still open: image stack and resize parity.
- Still open: production `cardhashes.bin` ownership and refresh workflow.
- Still open: camera/capture UX and detector tuning.
- Still open: card-back UI copy/state.
- Still open: lazy-load, memory, and match-latency budgets on mobile devices.

## Non-Goals From Cardomancer

Do not include these in the first implementation gameplan unless TheJudge explicitly
adds scope:

- printing disambiguation by set symbol, collector number, frame, border, or foil
- grading or condition detection
- sorting hardware or motion control
- price/enrichment lookup at identification time
- multi-card detection
- network calls during identification

## Handoff Notes for the Later TheJudge Agent

- Start by locating TheJudge's current card metadata shape, autocomplete/search path,
  frontend image/camera stack, runtime constraints, and build scripts.
- Compare those findings to the scaffold API: `RgbImage`, `Plane`, `HashDb`,
  `CardIdentifier`, and `ImageBackend`.
- Build the implementation gameplan around testable parity slices before any live
  camera UX slice.
- Preserve the second-pass identity bridge: scan DB rows return Scryfall printing IDs,
  which resolve through a generated frontend map to existing oracle-level
  `CardMetadataItem` records.
- Treat `reference/phash.py` and `reference/identify.py` as correctness oracles.
- Treat `reference/detect.py` as an algorithm source that may need library-specific
  adaptation and outcome-based tuning.
- Preserve the hard constraint that identification runs on-device without network
  calls.
