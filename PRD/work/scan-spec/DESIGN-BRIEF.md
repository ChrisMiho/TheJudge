# DESIGN-BRIEF — scan-spec

Phase A #4 of the docs-refactor gameplan. Author the current-state feature spec
for Card Scanning on the DEC-168 template, plus its corpus `data/` docs.

## Scope

- **Deliverable:** `PRD/sections/scan/README.md` — a derived, non-authoritative
  current-state view of Card Scanning, consolidating the scan decision domain,
  scan functional requirements, FLOW-006, the scan branches of FLOW-009 (Trade
  Balancer) and FLOW-011 (Quick Lookup), the scan NFRs, and the scan blocks of
  `system-map.md` / `screen-layout.md`.
- **Corpus split:** two `data/` subfiles — `data/cardhashes.md` (fingerprint
  library) and `data/cardScanMap.md` (scan-to-metadata bridge).
- **Navigation:** one `PRD/README.md` Section Inventory row for `sections/scan/`
  (per DEC-168, navigation only).
- Consolidates current behavior only. Kept draft and non-authoritative;
  `decisions.md` stays precedence #1.

## Non-goals (held)

- No new stable IDs. This spec is a derived view over existing
  DEC/REQ/FLOW/NFR entries; **zero** new DEC/REQ/FLOW/NFR/Q were minted.
- No `apps/` code change. No edit to `decisions/scanning.md` or any existing
  DEC/REQ/FLOW/NFR body.
- Not a re-decision of any product behavior — the define gate reviews the
  `PRD/sections/` diff.

## Authoring decisions (the two the gameplan left open)

### 1. Cross-destination section structure

Chose a dedicated top-level section, **"How scan feeds each destination"**, with
a lead paragraph establishing the held identity boundary (oracle-level identity
per DEC-053; scanned printing image as presentation only per DEC-070), then one
`Built:`-marked subsection per destination — **In-Depth zone collection**
(scan's home surface), **Quick Question (Quick Lookup)**, **Trade Balancer** —
and a closing **"One engine, three destinations"** subsection carrying the
NFR-014 measured import-graph proof (the `manualChunks` `scan` group wider than
`src/lib/scan/**`, reaching `useScanCapture.ts` and `ScanCameraSurface.tsx` from
more than one destination). This keeps scan's own camera/engine behavior in
**How it works** and treats the reuse story as first-class rather than framing
scan as an In-Depth sub-feature — the distinctive requirement for this spec.

Rationale: the three destinations differ only in where the resolved card lands
and what the destination does with it (zone batch add / optional single lookup
card / priced trade entry); the surface and engine are identical. A per-
destination subsection makes each landing explicit while the lead paragraph and
closing subsection prevent the reader from mistaking any destination for the
owner of the identity model.

### 2. Corpus `data/` split — both candidates get a subfile

Both named corpus candidates independently pass all four `data/` clauses
(external upstream source, build/refresh command, committed artifact, describes
Magic not TheJudge), so **both** were split into their own `data/` docs rather
than one or neither.

Rationale: they are genuinely separate corpora, not one artifact viewed twice —
different upstream shapes (card **images** hashed into a binary library vs.
printing **identity/image** metadata), different build scripts
(`build-card-hashes.mjs` vs. `build-card-scan-map.mjs`), different artifact
formats (~14 MB `CARDHSH1` binary vs. a JSON map), and different measured bounds
(corpus fingerprint counts / `partial` status vs. per-printing entry shape).
Folding them into one doc would blur two independent pipelines. This mirrors the
Trade Balancer precedent (behavior README + a single `data/` corpus doc),
applied twice because scan has two corpora. The behavior README's `Corpus:`
header line points at both.

## Measured-bound handling (DEC-168 rule)

A bound travels with its surface only while that surface still exists; a bound
whose surface was replaced is dropped and named as a closed door; an ambiguous
bound stays and is flagged.

- **Survive (surface exists):** the frozen identification recipe constants
  (Region A crop, hash geometry, thresholds, REQ-034); the current `tuning.ts`
  lock/convergence values (`lockDistance 78` / `marginMin 14` /
  `windowSize 13` / `minVotes 3` / 3-frame best-frame, DEC-059/062/074/077); the
  capture request (`ideal 1920×1080`, prior 640×480 default, canonical 1040px
  warp, `MAX_DETECT_DIMENSION 640`, DEC-074); scan-screen layout bounds
  (viewport-height frame + `md:` fallback, 320px review panel, DEC-090/160/068).
- **Dropped as closed doors** under Rejected alternatives: one-tap Accept/Rescan
  (DEC-056/058), the selectable top-3 list (DEC-057), the in-scan escalation
  prompt (DEC-076), card-back prompt and cues (DEC-055).
- **Flagged ambiguous (kept):** NFR-010 device performance — formal per-device
  metrics were validated qualitatively (owner acceptance / laptop-camera
  end-to-end), never recorded as a counted table. Kept in Measured bounds and
  explicitly flagged rather than dropped.
- Committed-artifact figures (library ~14 MB / `CARDHSH1` v1 / corpus `partial`
  97311/97323) are recorded in `data/cardhashes.md`, not the behavior README.

## Assumption ladder applications (graph-run controlling)

Per `preparation-contract.md`, uncertainty was resolved from the first
authoritative source; no question met the three-condition genuine-blocker test.
Material assumptions:

- **"Quick Lookup" destination = "Quick Question" in code.** The gameplan and
  README name the destination "Quick Lookup"; `system-map.md`, NFR-014, and the
  registry label it "Quick Question" (`quick-lookup` route). Treated as the same
  destination (ladder #1/#2: active PRD + tested build config). The spec uses
  "Quick Question (Quick Lookup)".
- **Backed-by ID set.** Assembled from the entries actually consolidated and
  cited, including cross-domain DECs that govern described scan behavior
  (DEC-076 chrome hide, DEC-068/REQ-046 scanner palette, DEC-157/NFR-014
  routing+chunk, DEC-087/REQ-065 trade input, DEC-107/REQ-073 lookup input,
  DEC-078/151/158/160 review presentation, DEC-082 per-instance review). Ladder
  #1: cited from live sources; no ID minted.
- **`data/` filenames.** `cardhashes.md` and `cardScanMap.md` mirror the
  committed artifact basenames (`cardhashes.bin`, `cardScanMap.json`), matching
  the trade-balancer precedent (`cardPrintingPrices.md` ← `cardPrintingPrices.json`).
  Ladder #3: established local pattern.
- **PRD/README Section Inventory row.** Added per DEC-168's explicit impact
  bullet, formatted like the three prior spec rows. Navigation only.

No genuine decision blocker was hit. No `Q-###` created.

## PRD alignment

- Precedence unchanged: `decisions.md` stays #1; the spec's draft marker names
  the cited `DEC`/`REQ`/`FLOW` as the winner on conflict.
- No source moved, deleted, retired, reordered, or renumbered.
- `system-map.md` keeps its shallow four-field shape and gains no `Details:`
  pointer (a feature spec is a player-facing view, not a DEC-048 subsystem file).

## Backing sources (evidence, read into this spec)

- `PRD/sections/decisions/scanning.md` (DEC-050–093 scan domain)
- `PRD/sections/functional-requirements.md` (REQ-034–057, REQ-062/068/071,
  REQ-073, REQ-125, REQ-065, REQ-046, REQ-128/129)
- `PRD/sections/user-flows.md` (FLOW-006; scan branches in FLOW-009, FLOW-011)
- `PRD/sections/non-functional-requirements.md` (NFR-010, NFR-014, NFR-006,
  NFR-001)
- `PRD/sections/system-map.md` (`## Card scanning` block; Quick Lookup / Trade
  balancer / Feature portal scan-reuse citations)
- `PRD/sections/screen-layout.md` (`#### Scan camera surface`,
  `#### In-Depth — Zone collection` rows)
- Templates: `PRD/sections/life-tracker/README.md`,
  `PRD/sections/user-feedback/README.md`,
  `PRD/sections/trade-balancer/README.md` (+ its `data/cardPrintingPrices.md`);
  template contract DEC-168.

Intake `PRD/work/scan-spec/intake/refactor-gameplan.md` is evidence only; the
documents it cites (`workflow.md`, `workflow-decomposition.md`, `answers.md`)
were not opened, per the refinement contract.

## Files written

- `PRD/sections/scan/README.md`
- `PRD/sections/scan/data/cardhashes.md`
- `PRD/sections/scan/data/cardScanMap.md`
- `PRD/README.md` (one Section Inventory row)
- `PRD/work/scan-spec/DESIGN-BRIEF.md` (this file)

## Gate

Changes under `PRD/sections/` are reviewed by the owner at the define gate. No
self-approval. New stable IDs minted: none.
