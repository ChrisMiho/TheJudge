---
status: ideation
---

# scan-spec

Write the current-state feature spec for Card Scanning — Phase A #4 of the
docs-refactor gameplan. Land it at `PRD/sections/scan/README.md` on the
DEC-168 template (the pattern `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, and `sections/trade-balancer/README.md`
already established for Phase A #1–#3). Scan is the gameplan's first
cross-cutting test: it is referenced by three feature-portal destinations,
so the spec must capture how it feeds each one, not just its own camera
screen. Consolidates current behavior only; kept draft and non-authoritative,
with `decisions.md` staying precedence #1.

## Backing sources (evidence, not yet read into a spec)

- `PRD/sections/decisions/scanning.md` — the domain file; DEC-050 through
  DEC-093 (recipe, camera capture, batch loop, lock-in, review/remove
  bubble, debug overlay, audio confirmation, fingerprint-corpus coverage,
  printing-art fidelity, real-world robustness/detector/acquisition tuning,
  responsive layout). Cross-domain decisions that also touch scan:
  DEC-068/DEC-076/DEC-079/DEC-081/DEC-092 (`personalization.md` /
  `ui-presentation.md` — palette reach, staged-flow compaction, motion
  baseline exclusions, guidance copy), DEC-157 (`navigation.md` — routing +
  the measured-import-graph `manualChunks` scan group shared by all three
  destinations)
- `PRD/sections/functional-requirements.md` — roughly twenty REQ entries
  covering the fingerprint-library build/lazy-load, the scan-to-metadata
  resolver, camera capture and detector, zone-picker scan integration,
  responsive hands-free auto-add, the debug overlay, audio confirmation,
  real-world robustness (query conditioning/best-frame selection),
  non-English/alt-art corpus coverage, scanned-printing art, detector
  robustness and fixture corpus, capture-framing guide, higher-resolution
  capture, positive in-zone cue, acquisition diagnostics, responsive
  scan-view layout, and the Quick Lookup entry requirement that names scan
  as one of its two card-input paths
- `PRD/sections/user-flows.md` — FLOW-006 (scan cards into a zone, the
  primary in-depth flow) plus the scan-input branches embedded in the Trade
  Balancer flow (build a two-sided trade) and the Quick Lookup flow
  (resolve one card by search or scan)
- `PRD/sections/non-functional-requirements.md` — NFR-010 (scan performance
  and footprint — lazy-load posture), NFR-014 (code-splitting; the scan
  surface's measured import-graph reach across three destinations), NFR-006
  (motion baseline; scan camera convergence/lock motion excluded)
- `PRD/sections/system-map.md` — the "## Card scanning" block: perceptual
  hash recipe, fingerprint-library build, scan-to-metadata resolver, camera
  capture & detector, scan lock-in control layer, scan UX in the zone
  picker, scan audio confirmation, scanner debug overlay, scan acquisition
  diagnostics, scan robustness conditioning, scan art fidelity — plus its
  own citations into the Trade Balancer and Quick Lookup entries showing
  scan reuse
- `PRD/sections/screen-layout.md` — the "#### Scan camera surface" row
  (fit/containment, DEC-090/DEC-160/REQ-129/DEC-052 family), the zone
  collection "Search / scan" row (DEC-050/REQ-125), and the shared
  card-image-presentation row that names "Scan review" as one of six
  surfaces (DEC-151/158/159, REQ-128/142)
- `PRD/sections/goals-and-non-goals.md` — scan framed as optional/outside
  the core product loop (DEC-050..053); pricing/printing disambiguation
  excluded from scan itself but in scope for Trade Balancer (DEC-087)

## How scan feeds each destination (the cross-cutting part)

Scan is not owned by one screen. Evidence that it is reused, not
reimplemented, per destination:

- **In-Depth** (its home surface) — `ZoneCardPicker` / `ZoneCollectionStep`;
  scan sits beside manual search as a batch, hands-free input into zone card
  collection (FLOW-006, DEC-050/052/056)
- **Quick Lookup** — `QuickLookupApp`; scan is one of two ways to resolve
  the optional single card before asking a question (DEC-107, FLOW-006
  engine reused, DEC-050/053)
- **Trade Balancer** — `TradeSide` / `useTradeScan`; scan is one of two ways
  to add a card to a trade side, with the scanned printing becoming the
  entry's default (DEC-070, DEC-087)
- Shared implementation proof: `apps/frontend/src/hooks/useScanCapture.ts`
  and `apps/frontend/src/components/ScanCameraSurface.tsx` are the measured
  import-graph membership that defines the NFR-014 `manualChunks` `scan`
  group in `vite.config.ts` — not a directory-name guess, a build-verified
  shared surface across all three destinations
- Identity boundary held constant across all three: scan resolves to an
  oracle-level `CardMetadataItem` (DEC-053) with the scanned printing's
  image carried as presentation only (DEC-070); prompt context, rulings,
  and stack/duplicate semantics stay owned by whichever destination
  consumes the resolved card, not by scan itself

The later spec must give this cross-destination feed its own section (or
equivalent structure) rather than describing scan only as an In-Depth
sub-feature — the exact shape is an authoring decision for refinement, not
decided here.

## Corpus — the `data/` bucket test

The gameplan's `data/` bucket membership test requires all four: an external
upstream source, a build/refresh command, a committed artifact, and content
that describes Magic, not TheJudge. Recording the check for each candidate,
not deciding the spec's structure:

- **Fingerprint library** (`cardhashes.bin` + `cardhashManifest.json`):
  external source (Scryfall card images); build/refresh command
  (`npm run data:scan-fingerprints`, resumable/budget-bounded per DEC-054);
  committed artifact (`apps/frontend/public/data/cardhashes.bin`, verified
  present); describes Magic, not TheJudge (perceptual-hash fingerprints of
  card art). All four hold.
- **Scan-to-metadata bridge** (`cardScanMap.json`): external source
  (Scryfall printing images/ids); build command
  (`scripts/build-card-scan-map.mjs`); committed artifact
  (`apps/frontend/public/data/cardScanMap.json`, verified present); content
  is `{ oracleId, name, imageUrl }` per printing — describes Magic printings,
  not TheJudge behavior. All four hold.

Both candidates qualify under the four-clause test, mirroring
trade-balancer's price-corpus precedent. Whether the later spec splits one
or both out into a `data/` subfile (as trade-balancer did for its single
corpus) or handles them differently is an authoring decision for refinement,
not decided here.

## Reference implementation

`PRD/sections/life-tracker/README.md`, `PRD/sections/user-feedback/README.md`,
and `PRD/sections/trade-balancer/README.md` (all DEC-168) are the worked
templates: `Status:` / `Backed by:` header, **What it is**, **How it works**,
**Measured bounds**, **Rejected alternatives and deferred scope**, **Where it
lives**. `trade-balancer/README.md` additionally shows the corpus/behavior
split shape (a `data/` subfile) for a feature with one corpus; scan is the
first spec that must also carry a "how it feeds each destination" structure,
since it is referenced by three destinations rather than one.

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, copied
  verbatim from `.worktrees/.graph-intake/graph-20260825-212621/`. Evidence
  only, not authority. Do not open the documents it cites (`workflow.md`,
  `workflow-decomposition.md`, `answers.md`) — their paths only are
  recorded, in that file.

## Non-goals

No product-behavior decisions here. No `apps/` code change. No edit to
`PRD/sections/decisions/scanning.md` or any other existing DEC/REQ/FLOW/NFR
body. No decision on which corpus candidate(s) get a `data/` split, or on
the exact structure of the cross-destination section.

## Next step

`/thejudge-refinement PRD/work/scan-spec/`
