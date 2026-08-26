# Idea — scan-spec

Product truth for Card Scanning is scattered across
`PRD/sections/decisions/scanning.md` (DEC-050 through DEC-093, roughly two
dozen entries), around twenty REQ entries in `functional-requirements.md`
(fingerprint build, camera capture/detector, zone-picker integration, debug
overlay, audio confirmation, robustness/acquisition tuning, printing-art
fidelity), FLOW-006, NFR-010/NFR-014, plus the multi-subsection "## Card
scanning" block in `system-map.md` and the "Scan camera surface" +
shared-card-image rows in `screen-layout.md`. Reading current scan behavior
today means walking a decision log rather than reading one page. This package
writes the current-state feature spec at `PRD/sections/scan/README.md`, on
the DEC-168 template already established by `sections/life-tracker/README.md`,
`sections/user-feedback/README.md`, and `sections/trade-balancer/README.md`.

Unlike the first three Phase A specs, scan is the gameplan's chosen
cross-cutting test case: it is the first spec for a feature referenced by
**three** feature-portal destinations rather than owning one screen —
In-Depth's zone collection step (its home surface, `ZoneCardPicker` /
`ZoneCollectionStep`), Quick Lookup's optional single-card input
(`QuickLookupApp`), and the Trade Balancer's per-side card entry
(`TradeSide` / `useTradeScan`) — all three sharing `useScanCapture.ts` and
`ScanCameraSurface.tsx` (confirmed by NFR-014's measured-import-graph
`manualChunks` scan group and DEC-157's routing decision). The spec must
describe how scan feeds each destination's entry point and add-flow, not
just its own camera screen.

Scan also carries at least one corpus candidate: the fingerprint library
(`cardhashes.bin` + manifest, built from Scryfall images by
`npm run data:scan-fingerprints`) and possibly `cardScanMap.json` (the
printing-art bridge, built by `scripts/build-card-scan-map.mjs`). Both look
like `data/`-bucket candidates under the gameplan's four-clause test
(external upstream source, a build/refresh command, a committed artifact,
and it describes Magic, not TheJudge) — the same shape trade-balancer's price
corpus already exercised — but confirming that and any corpus/behavior split
is a decision for refinement (node 3, `define`), not this package.

This package consolidates current behavior and identifies backing sources
only — it does not change or re-decide any product behavior. The spec is
written draft and non-authoritative: `decisions.md` stays precedence #1 and
Read-First #1 through Phase A/B; any conflict between the new spec and a
cited DEC/REQ/FLOW/NFR is resolved in the spec's favor by correcting the
spec, not the source. Out of scope: deciding new scan behavior, editing
`PRD/sections/decisions/scanning.md` or any other decision body, and touching
`apps/` code — this is Phase A #4 of the docs-refactor gameplan
(`PRD/work/adhoc/refactor-gameplan.md`, `PRD/work/adhoc/PROGRESS.md`),
following the pattern Phase A #1 (`life-tracker`), #2 (`user-feedback`), and
#3 (`trade-balancer`) already established.

## Prior run

Keyword "scan" against the request and intake material matches every
already-shipped scan receipt below. These are shipped tuning/bug-fix history
for the feature this spec consolidates, not spec-writing precedent (the
spec-writing precedent is `trade-balancer-spec-2026-08-26.md`,
`user-feedback-spec-2026-08-25.md`, and `life-tracker-spec-2026-08-25.md`,
cited in **Reference implementation** in the package README instead).

- `PRD/instructions/receipts/card-scan-lockin-fix-2026-06-22.md` — shipped;
  card-scan lock-in fix + card-detection closeout.
- `PRD/instructions/receipts/card-scan-robustness-2026-06-24.md` — shipped;
  card-scan robustness pass.
- `PRD/instructions/receipts/mobile-scan-layout-2026-07-03.md` — shipped;
  responsive scan-view layout closeout (DEC-090).
- `PRD/instructions/receipts/scan-audio-confirmation-2026-06-23.md` —
  shipped; audio "ding" confirmation on auto-add (DEC-061).
- `PRD/instructions/receipts/scan-camera-desktop-sizing-regression-2026-07-04.md`
  — shipped; desktop sizing + searching-label regression fix.
- `PRD/instructions/receipts/scan-capture-quality-2026-06-26.md` — shipped;
  higher-resolution capture request + in-zone capture cue (DEC-074).
- `PRD/instructions/receipts/scan-debug-icon-overlap-2026-06-24.md` —
  shipped; debug-toggle overlap fix.
- `PRD/instructions/receipts/scan-detector-foil-robustness-2026-06-25.md` —
  partial (detector recall + guide prior shipped; on-device
  detect-then-lock validation reassigned to `scan-capture-quality`/DEC-074).
- `PRD/instructions/receipts/scan-duplicate-card-identity-2026-06-30.md` —
  shipped; per-instance `instanceId` identity fix for duplicate scan/manual
  adds.
- `PRD/instructions/receipts/scan-fingerprint-incremental-build-2026-06-19.md`
  — shipped; resumable, budget-bounded fingerprint-library build (DEC-054).
- `PRD/instructions/receipts/scan-lock-acquisition-tuning-2026-06-26.md` —
  shipped; lock-acquisition tuning pass.
- `PRD/instructions/receipts/scan-lock-on-outline-2026-06-30.md` — shipped;
  positive lock-on alignment outline (DEC-083).
- `PRD/instructions/receipts/scan-printing-fidelity-2026-06-25.md` —
  shipped; scanned-printing art fidelity (DEC-070).
- `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md` —
  partial — planned tuning levers shipped; two reported failures traced to
  an upstream detector-geometry root cause escalated to a separate package
  (out of this package's scope).
- `PRD/instructions/receipts/scan-ux-responsiveness-2026-06-23.md` —
  shipped; scan UX/responsiveness closeout.

## Non-goals

- No new or changed scan behavior — DEC-050 through DEC-093 are not touched.
- No edits to `PRD/sections/decisions/scanning.md`,
  `functional-requirements.md`, `user-flows.md`, `non-functional-requirements.md`,
  or any other existing DEC/REQ/FLOW/NFR body.
- No GAMEPLAN, slice docs, or DESIGN-BRIEF from this shape step — those come
  from `thejudge-refinement` and `thejudge-map-out`.
- No `apps/` code change; this is a documentation-only package.
- No decision here about whether one or two corpus artifacts qualify for the
  `data/` bucket, or how a corpus/behavior split is structured — this package
  only identifies the candidates and the test to apply; that is authored at
  refinement.
- No decision here about exactly how a three-destination "how scan feeds
  each destination" section is structured — this package only establishes
  that it is required; the shape is an authoring decision for refinement.
