# GAMEPLAN — scan-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverables are already written and committed
on the autonomous base at commit `7cd4f41`:
`PRD/sections/scan/README.md` (337 lines, DEC-168 template — the behavior
spec), `PRD/sections/scan/data/cardhashes.md` (108 lines — the fingerprint-
library corpus doc), `PRD/sections/scan/data/cardScanMap.md` (95 lines — the
scan-to-metadata bridge corpus doc), and the one `PRD/README.md` Section
Inventory row for `sections/scan/`. The define gate already walked and the
owner already accepted all 16 items (0 edits, 0 rejects), 2026-08-25.

This is the same shape as Phase A #2 (user-feedback-spec) and #3
(trade-balancer-spec): refinement wrote the whole spec at `define` because
DEC-168 already existed, so there is nothing left to author. It diverges from
#3 in two ways: scan carries **two** corpus docs, not one (the fingerprint
library and the scan-to-metadata bridge are genuinely separate pipelines), and
scan is the first spec in this gameplan reused by **three** feature-portal
destinations rather than one, so it carries a fourth structural section — "How
scan feeds each destination" — that #1–#3 did not need. Both slices below are
verify-only: confirm the committed content is correct and complete against its
sources, the two committed data artifacts, and the DEC-168 template, and prove
the package's diff never left its licensed scope.

## Architecture / data flow

Not applicable — no runtime component, no code path, no data flow change.
This is a documentation-verification task over already-committed
`PRD/sections/` content, including two read-only checks of committed data
artifacts (`cardhashes.bin` + `cardhashManifest.json`, `cardScanMap.json`) —
never a rebuild, which would need a human-approved Scryfall image download.

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify `PRD/sections/scan/README.md`, `PRD/sections/scan/data/cardhashes.md`, and `PRD/sections/scan/data/cardScanMap.md` against their cited sources (the scan DEC/REQ/FLOW/NFR set, plus cross-domain DECs and the system-map/screen-layout entries), the DEC-168 template, and — for each corpus doc's measured figures — the committed artifact itself, read directly. Close any confirmed, sourced gap with a bounded additive correction only. | none |
| B | Verify the `PRD/README.md` Section Inventory row, then prove the whole package's diff since its fork point touched nothing outside the licensed set (no `apps/`, no existing DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`/`goals-and-non-goals.md` edit). | none |

Parallel-ready: A checks the spec+corpus content against their sources and the
two artifacts; B checks the diff's shape and the nav row. Neither reads or
depends on the other's output.

## Known candidate findings for slice A

Map-out time checks over the committed files and the two artifacts found one
thing worth recording so the implementing agent does not have to re-derive it,
and confirmed several others clean:

1. **`cardhashes.md`'s "~14 MB" figure — likely needs a bounded correction.**
   The committed artifact `apps/frontend/public/data/cardhashes.bin` is
   13,047,744 bytes on disk (confirmed via `ls -la` and the committed
   `cardhashManifest.json`'s `byteSize` field, which also reads
   `13047744`) — that is ~13.0 MB (SI) / ~12.4 MiB, not ~14 MB. Slice A must
   independently re-confirm this against the manifest and file size, then
   apply a bounded correction to the one figure in `cardhashes.md`'s
   "Measured bounds" section if the discrepancy holds — this is inside the
   package's licensed scope (the corpus doc itself), unlike a source-file
   staleness finding.
2. **Corpus-status figures — verified, no gap.** `cardhashManifest.json`
   reads `version 1`, `count 97311`, `coverage.targetCount 97323`,
   `coverage.fingerprintedTargetCount 97311`, `coverage.missingCount 12`,
   `coverage.parkedCount 0`, `coverage.corpusStatus "partial"` — every one of
   these matches `cardhashes.md`'s "partial at closeout: 97311/97323" claim
   exactly. Slice A must still independently re-confirm this; no correction
   is expected here.
3. **`cardScanMap.json` entry count and shape — verified, no gap.** The
   committed artifact has 95,895 entries, each shaped
   `{ oracleId, name, imageUrl }` (spot-checked one entry) — matching
   `cardScanMap.md`'s artifact-shape description exactly. No figure count is
   claimed for this file in the corpus doc beyond the shape itself, so there
   is nothing further to reconcile here.
4. **File-existence spot check — no gap found.** Every file named in the
   spec's "Where it lives" section under `apps/frontend/src/lib/scan/` and
   `apps/frontend/src/components/` was confirmed present in the tree at
   map-out time (`find apps/frontend/src/lib/scan -maxdepth 1 -type f`);
   `useScanCapture.ts` was confirmed reachable from `ZoneCardPicker.tsx`,
   `QuickLookupApp.tsx`, and `useTradeScan.ts` (three destinations), and
   `ScanCameraSurface.tsx` from `ZoneCardPicker.tsx`, `QuickLookupApp.tsx`,
   and `TradeSide.tsx`/`useTradeScan.ts` — corroborating the "One engine,
   three destinations" section's NFR-014 claim. Slice A still re-confirms
   this independently rather than trusting this pre-scout.

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- `PRD/sections/scan/README.md`'s `Backed by:` line names exactly the ID set
  recorded in the file's header (DEC-050 through DEC-093 subset, DEC-068,
  DEC-076, DEC-078, DEC-082, DEC-087, DEC-107, DEC-151, DEC-157, DEC-158,
  DEC-160, the REQ-034–REQ-129 subset named in the header, FLOW-006,
  FLOW-009, FLOW-011, NFR-001, NFR-006, NFR-010, NFR-014).
- `PRD/sections/scan/data/cardhashes.md`'s `Backed by:` line names exactly
  DEC-051, DEC-054, DEC-069, REQ-035, REQ-039, REQ-047, NFR-010.
- `PRD/sections/scan/data/cardScanMap.md`'s `Backed by:` line names exactly
  DEC-053, DEC-070, REQ-036, REQ-048, NFR-010.
- Every **How it works** bullet in the spec traces to its cited source's
  actual text; the "How scan feeds each destination" section correctly
  describes all three destinations (In-Depth zone collection, Quick Question
  / Quick Lookup, Trade Balancer) and the closing "One engine, three
  destinations" NFR-014 proof; every measured figure in both corpus docs
  traces to its committed artifact, read directly.
- Every stable ID token present in any of the three files (beyond each file's
  own Backed-by set) resolves to a real, pre-existing ID in its home file —
  no minted ID.
- **Where it lives** in all three files names every file `system-map.md` and
  the tree confirm belongs to the feature.
- `git diff` since the package's fork point (`0d7b59d`, confirmed at map-out
  time to equal `git merge-base HEAD origin/main`) shows no change under
  `apps/`, and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
  `system-map.md`, `screen-layout.md`, or `goals-and-non-goals.md`.
- `PRD/README.md` has exactly one Section Inventory row for `sections/scan/`.

## Runtime / browser risk

None. This package is documentation-only — no UI surface change, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `git diff --stat` /
`git diff` structural checks against the PRD markdown files and the source
files the spec cites, plus two direct, read-only inspections of the committed
`cardhashes.bin` (via its manifest `cardhashManifest.json` and `ls -la`) and
`cardScanMap.json` (via Python's stdlib `json` module or `jq`) — never
`npm run data:scan-fingerprints` / `data:scan-fingerprints:fresh` / any
Scryfall network refresh. This matches how life-tracker-spec,
user-feedback-spec, and trade-balancer-spec before it were verified, extended
here to two artifacts since scan is the first Phase A spec with two `data/`
files.

## Fork-point reference

This branch (`thejudge-auto/scan-spec`) forked from `origin/main` at
`0d7b59d` (Merge PR #111, the trade-balancer-spec close). Confirmed at
map-out time: `git merge-base HEAD origin/main` resolves to `0d7b59d`, and
`git diff --stat 0d7b59d..HEAD -- . ':!PRD/work'` touches exactly
`PRD/README.md` (+1 line), `PRD/sections/scan/README.md` (new, 337 lines),
`PRD/sections/scan/data/cardhashes.md` (new, 108 lines), and
`PRD/sections/scan/data/cardScanMap.md` (new, 95 lines) — nothing under
`apps/`, nothing in any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
`system-map.md`, `screen-layout.md`, or `goals-and-non-goals.md`.

## Next step

`/thejudge-implement PRD/work/scan-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/scan-spec/ slice A` (Codex). Slice B may run
before, after, or alongside A — no ordering dependency.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by this
skill.
