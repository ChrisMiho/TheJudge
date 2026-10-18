# Gameplan — scanner-recovers-and-runs-lighter

Player terms first: a bad connection no longer breaks scanning until reload; a
phone does less work per scanned frame and holds less memory; the three
scanners share one panel with the exit ✕ in the same place, never over the
caution triangle; the first scan downloads 1.23 MB less.

Source of truth: `DESIGN-BRIEF.md` and the five accepted blocks in
`GATE-QUESTIONS.md` (REQ-214, REQ-056, REQ-249 new, REQ-048, REQ-066).
Build applies each block's `PRD/sections/` diff by intent, in the slice named
below, together with the code. Planning edits no `PRD/sections/` file.

## Slices (sequential)

| Slice | Name | Depends on | Applies |
| --- | --- | --- | --- |
| A | Recovery fix | none | REQ-249 |
| B | Shared identifier and per-frame work | A | none |
| C | One shared scanner panel | A, B | REQ-214, REQ-056 |
| D | Smaller scan map | B | REQ-048, REQ-066 |

Why sequential: A, B and C all touch `useScanCapture.ts` and the three host
files; the card-search cluster edits the same hosts, so it must not run
alongside (STATUS board lists no other active package). D could run beside C
in principle but shares `resolveScanCandidates.ts` with B, so it follows B and
runs last.

## Architecture and data flow

1. Player opens a scanner in any tool. `useScanCapture.openScan` calls
   `ensureResources`, which (after B) calls the module-level
   `loadScanResources()` in `lib/scan/`.
2. `loadScanResources()` loads `cardhashes.bin` (`loadHashDb`) and
   `cardScanMap.json` (`loadScanMap`), builds one `CardIdentifier`, caches its
   promise, and clears the cache on rejection (A). A newer in-flight attempt is
   never thrown away by an older failure (same rule as
   `lib/cardMetadataStore.ts` lines 26-29).
3. Each camera frame: `identify()` keeps the best ten by bounded top-N
   selection (ties stay lower-index-first), then
   `resolveScanCandidatesRanked` looks cards up in a per-card-list `WeakMap`
   lookup (B). After D, the scanned printing's image comes from
   `deriveCardImageUrl(printingId)`.
4. All three hosts render one `ScanPanel` (C): slim head row (optional title
   plus 44 px `.scan-exit` box), loading line, error line (`role="alert"`),
   camera surface, held-entries mapping into `ScanReviewBubble`.

## Cross-cutting rules

- Scan output stays identical. Parity check: `identify.test.ts`
  (`apps/frontend/src/lib/scan/identification/identify.test.ts`) against
  `apps/frontend/src/lib/scan/__fixtures__/vectors.json` passes unchanged.
  `reference/identify.py` does not exist in the repo; nobody runs Python (QC A1).
- Scan data still downloads only on first scan (NFR-014); no background
  preload, no retry loop, no new retry button.
- `cardScanMap.json` is regenerated only with `npm run data:scan-map`, never by
  hand, and no slice runs `npm run data:refresh` or any Scryfall download.
- Committed JSON must pass `npm run format:check`.
- Browser checks follow `PRD/instructions/runtime-process-hygiene.md`;
  captures go under `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`.

## Quality-check advisories folded in

- A1: slice B names `identify.test.ts` + `vectors.json` as the parity check.
- A2: slice D updates the four fixtures carrying `imageUrl`.
- A3: slice D names `npm run data:scan-map` and removes the unused
  `getImageUrl` helper in `scripts/build-card-scan-map.mjs`.
- A4: slice C checks every `screen-layout.md` scanner row against the new
  Chrome row.

## Verification checklist (whole package)

- [ ] `npm --workspace apps/frontend run test` green
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` green
- [ ] `npm run test:scripts` green
- [ ] Parity tests unchanged and green
- [ ] After a failed scan-data download, close-and-reopen recovers without reload (live check)
- [ ] ✕ is the same 44 px square box above the camera on all three scanners (live check)
- [ ] Scan map: same 95,895 keys, same `oracleId` and `name`, no `imageUrl`
- [ ] Every `PRD/sections/` diff in `GATE-QUESTIONS.md` applied once, by intent

## Promotion checklist (executed in cleanup)

The accepted `GATE-QUESTIONS.md` diffs are applied to `PRD/sections/` during
build in their slices; cleanup confirms they are present and promotes only a
leftover. Scan README "Where it lives" file lists gain `loadHashDb.ts`, the new
`loadScanResources` module and `ScanPanel.tsx` (slice B and C housekeeping).
