---
name: cardomancer-card-detection
description: Optional on-device camera card scanner as an alternate input path into existing zone fields, parity-built and TheJudge-owned
metadata:
  type: project
---

# DESIGN-BRIEF — cardomancer-card-detection

## Scope

Add an **optional, fully on-device card scanner** as an alternate way to add a card to a
zone, sitting beside the existing manual search and feeding the *same* preview-and-add
path. The scanner ports the friend's proven Cardomancer art-identification engine
(perceptual hash of the card artwork → ranked candidate list) into TypeScript, builds and
owns its own fingerprint library from the existing Scryfall pipeline, and surfaces a
camera capture UX (continuous auto-scan + manual tap fallback, batch accept-and-rescan
loop) inside `ZoneCardPicker`. Identification runs frontend-only with **zero network
calls** and **no change** to `AskAiRequest`, prompt assembly, the backend, or any API.

This brief covers the full feature (the friend's slices A–E), with the camera/detector
layer built last. Implementation phasing is summarized below; `thejudge-map-out` produces
the formal slice docs.

## Problem being solved

Adding cards to zones is typed-only today (`FLOW-001` step 3, `Card search & metadata`
subsystem). At a live table, typing each card name is slow, and the friction discourages
players from feeding TheJudge a complete board before asking — which weakens the prompt
context the product depends on. A proven on-device art-identification engine exists and
can turn "point the camera at the card" into the add action, in batch.

## Truth-layer reconciliation (read first)

This feature **changes standing product truth**: `goals-and-non-goals.md` currently lists
"camera scanning" as an Explicit Non-Goal and an Intentional Constraint, and `NFR-008`
frames scanning as future-only and *not in the core product*. `DEC-050` reframes this:
camera scanning is **not part of the core product loop**, but **is** a scoped, optional,
frontend-only feature. The core-product framing (`GOAL-001..003`, the flow-validation
assistant) is unchanged — scanning is a convenience input, not a new core goal. The
non-goal and constraint entries are amended accordingly; `NFR-008`'s "leave room for
future scanning" intent is now realized by this package.

## Decisions

- **DEC-050** — Card scanning is an **optional, separately-scoped, frontend-only alternate
  input path** into existing zone card fields, not a replacement for manual search and not
  part of the core product loop. It must reuse the existing select → preview → add → owner
  → duplicate-block → stack-limit path and produce the same `ZoneCardItem` output. It must
  not change `AskAiRequest`, `GameContext`, prompt assembly, backend provider boundaries,
  or add any product-facing endpoint. Supersedes the blanket "camera scanning is out of
  scope" non-goal/constraint in `goals-and-non-goals.md` and clarifies `NFR-008`.

- **DEC-051** — **Parity by construction.** The 64×64 resize + perceptual-hash ("the
  recipe") is implemented **once** in TypeScript as the single authoritative module, used
  both on-device at scan time **and** by TheJudge's own offline build that generates the
  fingerprint library (`cardhashes.bin`). Identical code on both sides eliminates the
  resize-filter parity risk by construction; golden parity vectors are regenerated from the
  TS recipe. TheJudge **owns and refreshes** the library via the existing data pipeline
  (no dependence on the friend re-exporting, no runtime Scryfall fetch). This supersedes
  the SOURCE-ANALYSIS "consume a prebuilt DB first" recommendation.

- **DEC-052** — **Capture & batch UX.** The scanner opens a camera screen that performs
  **continuous auto-scan** with an always-available **manual tap-to-capture** fallback,
  showing a card-shaped guide overlay. On a candidate, the user taps **Accept** to add the
  card to the current zone; the camera then **immediately re-opens to scanning** for the
  next card (a batch accept-and-rescan loop). A **Back/Exit** control closes the camera and
  returns to zone collection. A detected **card back** prompts "Flip the card over." On
  **low confidence**, scanning continues and the manual capture stays available; after a
  few consecutive low-confidence attempts a **non-blocking** prompt offers manual name
  entry (the existing search) without stopping the scan. The "few attempts" count, the
  detector area fractions, and confidence thresholds are calibration constants validated by
  outcome (detect-rate / top-1 accuracy on real captures), not product open questions.

- **DEC-053** — **Identity model & resolution.** A scan match is art-level and therefore
  **printing-level** (shared art across reprints means several printings can match), so the
  engine returns a **ranked candidate list**, not a single answer. Scan results resolve
  through `Scryfall printing id → oracle_id → existing CardMetadataItem` (keyed by
  `cardId`, which is the oracle id in TheJudge's metadata). Duplicate oracle ids collapse to
  one candidate keyed by best (lowest) distance; candidates that cannot resolve to committed
  metadata are dropped. The resolved candidate(s) feed the existing picker preview exactly
  like a typed suggestion. The bridge data is a build-time static artifact, consistent with
  the committed `cardMetadata.json` pattern; no runtime network call resolves identity.

## Requirements

- **REQ-034** (new) — *On-device identification core (parity-critical).* Port the
  Cardomancer identification core to TypeScript as a single authoritative module: binary
  DB reader (`cardhashes.bin`), the canonical per-channel DCT perceptual hash
  (median-includes-DC, MSB-first packing), query-only auto-levels, Region A crop, both-
  orientation (0°/180°) matching with mean R/G/B Hamming distance, match threshold (120),
  card-back rejection (threshold 100), `__back` suffix stripping, and ranked candidate
  output. Acceptance: golden-vector parity tests run under `npm test` (Vitest) and pass —
  DB load (ids/count/byte lengths), pHash byte-for-byte, auto-levels pixel-for-pixel, and
  end-to-end identify (candidate order, ids, distances, `matched`, `was_rotated`) — using
  vectors regenerated from this module's recipe. No camera and no network required for
  these tests. The resize + hash "recipe" is exported for reuse by the DB builder (REQ-035).

- **REQ-035** (new) — *TheJudge-owned fingerprint library + lazy load.* Add a build step
  (alongside `data:build` / `data:refresh`) that produces `cardhashes.bin` + a manifest
  from Scryfall card images using the **same** TS recipe as REQ-034, excluding non-gameplay
  layouts (art_series, planar, scheme, vanguard, oversized, memorabilia, substitute/
  checklist, minigame) and including a `_card_back` reference entry. The library and bridge
  artifacts ship under `apps/frontend/public/data/` and are **lazy-loaded only when the
  user first scans** (never block app startup). Network download of card images requires
  explicit human approval before the command runs (same policy as the Scryfall/CR refresh).
  Acceptance: build emits a versioned `cardhashes.bin` + manifest from local inputs; the
  frontend loads it on first scan only; round-trips byte-identical to the TS DB reader.

- **REQ-036** (new) — *Scan → metadata resolver.* Add a frontend resolver that maps ranked
  engine candidates (printing ids) to existing `CardMetadataItem` records via a build-time
  printing-id → oracle-id bridge artifact, collapses duplicate oracle ids keeping best
  distance, drops unresolvable candidates, and returns ranked `CardMetadataItem` candidates
  to the picker. Acceptance: a known printing id resolves to the expected metadata item;
  multiple printings of one oracle id collapse to a single candidate; unresolvable
  candidates are ignored without breaking the picker; no backend route or request-schema
  change is introduced.

- **REQ-037** (new) — *Camera capture & detector.* Add a camera capture surface (live
  video via the browser camera API) with a card-shaped guide overlay that detects the card
  quad, perspective-warps it to the canonical 745×1040 image, and feeds REQ-034. Supports
  continuous auto-scan and manual tap capture (DEC-052). Detector area fractions and
  capture thresholds are tuned and validated **by outcome**, not bit-equality. Acceptance:
  representative real mobile captures produce a usable canonical image and a plausible
  top-1 identification after warp; card-back and no-match states are handled without any
  backend call; a measured detect-rate / top-1 accuracy check on a representative capture
  set is recorded.

- **REQ-038** (new) — *Scan UX integrated into the zone picker.* Add a **Scan** entry point
  beside the existing search input in `ZoneCardPicker`. Implement the batch loop: scan →
  Accept (adds via the existing add path) → camera re-opens → Exit returns to zone
  collection; the zone's existing card list shows the running count as cards are added.
  Card-back prompt ("Flip the card over"), low-confidence escalation to manual entry after
  a few misses (non-blocking, scan continues), and ranked candidate selection feed the
  existing preview/add/owner/duplicate-block/stack-limit behavior unchanged. Stack cards
  land in scan order (bottom-to-top); manual reorder remains out of scope (`FLOW-002`).
  Acceptance: manual search still works unchanged; an accepted scan candidate reaches the
  existing preview and add flow; added scanned cards produce the same `ZoneCardItem` shape
  as manually added cards; existing zone-collection tests are extended, not replaced.

- **NFR-010** (new) — *Scanning performance & footprint.* Lazy-loaded library never blocks
  app startup; users who never scan pay no startup cost. Identification should feel near-
  instant on a mid-range mobile device (target a fraction of a second per identify).
  `cardhashes.bin` size, lazy-load time, memory use, and match latency are measured on a
  representative device and recorded as acceptance evidence. Continuous auto-scan must
  degrade gracefully (drop frames / throttle) rather than freeze the UI on slower devices.

## Non-goals

- No replacement for manual card search (it remains the default and a permanent fallback).
- No backend involvement in identification; no change to `AskAiRequest`, `GameContext`,
  prompt assembly, provider boundary, or any product-facing endpoint.
- No printing disambiguation (set symbol, collector number, frame/border, foil), grading,
  condition, or pricing at scan time.
- No multi-card-per-frame detection (single card per capture).
- No runtime network calls during identification, and no runtime metadata/library sync.
- No duplicate-card support (scan inherits the existing duplicate-stack block, `FLOW-004`).
- No manual reorder of zone/stack cards (`FLOW-002` constraint unchanged).

## Compliance with `technical-design-rules.md`

- Frontend-only, on-device, static lazy-loaded artifact — matches "local static metadata
  file for card search" and "no runtime metadata refresh/sync."
- Adds no product-facing endpoint; backend untouched.
- Single authoritative TS "recipe" reused by both hasher and builder — satisfies the
  "reuse before creating / single authoritative definition" rule (no FE↔build duplication).
- Inherits stack ordering and duplicate-block; no rules engine, legality, or board-state
  simulation introduced.

## Build phasing (map-out formalizes the slices)

1. **Identification core** (REQ-034) — TS recipe + matching, proven against regenerated
   golden vectors under `npm test`. No camera, no network.
2. **Library build + resolver** (REQ-035, REQ-036) — TheJudge-owned `cardhashes.bin` build
   and the printing→oracle→`CardMetadataItem` bridge; lazy-loaded.
3. **Camera + detector** (REQ-037) — live capture + warp producing canonical images;
   outcome-validated tuning.
4. **Full scan UX** (REQ-038, DEC-052) — Scan entry point, batch accept/rescan loop,
   card-back + low-confidence handling, exit; wired into `ZoneCardPicker`. NFR-010 budgets
   measured here.

Each phase is independently verifiable; the proven-but-risky hash math comes first and the
fuzzy camera work comes last.

## PRD sections updated (promoted during refinement)

- `sections/decisions.md` — DEC-050, DEC-051, DEC-052, DEC-053 added (Status: confirmed).
- `sections/functional-requirements.md` — REQ-034, REQ-035, REQ-036, REQ-037, REQ-038 added.
- `sections/non-functional-requirements.md` — NFR-010 added; NFR-008 note clarified.
- `sections/goals-and-non-goals.md` — camera scanning moved out of Explicit Non-Goals;
  Intentional Constraints line amended; planned optional-scanning capability noted.
- `sections/integrations-and-data.md` — Card Scanning Data Strategy added (artifacts,
  identity bridge, on-device/no-network constraint, human-approved image download).
- `sections/user-flows.md` — FLOW-006 (scan cards into a zone, batch loop) added.
- `sections/system-map.md` — "Card scanning" subsystem added, Status: planned.

## Open questions

None. The genuinely empirical items (detector area fractions, confidence/low-confidence
thresholds, the manual-entry escalation count, and performance budgets) are calibration
values validated by outcome and recorded as slice acceptance criteria (REQ-037, REQ-038,
NFR-010), not product ambiguities.
