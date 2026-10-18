# Quality check — scanner-recovers-and-runs-lighter

Result: **PASS**

Checked: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md`
against current `PRD/sections/` and the code. Graph-controlled mode. The
intake was read as evidence only; the documents it cites were not opened.

## Blocking findings

None.

## What was verified

1. **Proposed diffs apply cleanly.** A script took each diff hunk's removed and
   context lines and counted matches in the target file. Every hunk matches
   exactly once: REQ-214 (3 hunks in `functional-requirements.md`, 1 in
   `screen-layout.md`, 1 in `scan/README.md`), REQ-056 (1), REQ-249 (the
   `scan/README.md` anchor, 1), REQ-048 (3 in `functional-requirements.md`, 1 in
   `system-map.md`, 6 in `scan/data/cardScanMap.md`), REQ-066 (1). REQ-249 is a
   pure add after REQ-247, which is the last entry (line 6574); REQ-249 appears
   nowhere in `PRD/sections/`. REQ-248 is also absent from `PRD/sections/`
   (reserved by the open life-tracker proposal, per the brief). Every proposed
   new or amended ID has its own block.
2. **Plain-language shape.** All five blocks carry "What this decides", "In
   plain terms" and "What happens if you say no", with REQ-068, REQ-096,
   REQ-174, REQ-066, REQ-232 and NFR-014 inlined in words. `Verdict:` and
   `Reason:` are blank in every block. `## Blocker questions` is present and
   says none, and the ladder in the brief supports that.
3. **Departures from the intake are grounded.**
   - The 44 px square ✕: REQ-068 says the exit control is "lifted out of the
     camera-feed overlay into a slim control row above the frame" and that
     tests cover it "renders outside the camera overlay". REQ-096 says primary
     targets are "at least 44px in each dimension". The mockup `.scan-exit` is
     44x44 with radius 0.7rem. `ZoneCardPicker.test.tsx` lines 176-184 do pin
     the ✕ inside the camera box with `absolute right-3 top-3`, which
     contradicts REQ-068. The measurements table backs the overlap claim.
   - Keeping `name`: `scripts/lib/practice-suite-card-names.mjs` falls back
     to the scan map's `{ oracleId, name }` for oracle ids that
     `cardMetadata.json` omits. Confirmed in the file header and
     `buildCardNameIndex`.
4. **Scan-map change.** The regenerating script is
   `scripts/build-card-scan-map.mjs`, run as `npm run data:scan-map`
   (`package.json` line 60). The only runtime reader of `imageUrl` is
   `resolveScanCandidates.ts` (lines 13, 23, 55-59). The brief names it, along
   with `CardScanMapEntry`. The brief says never hand-edit the artifact and
   never run `npm run data:refresh`, and it parks if the bulk file would
   change any entry.
5. **Per-frame change.** Scan results stay identical. The named check is
   `apps/frontend/src/lib/scan/identification/identify.test.ts` against
   `src/lib/scan/__fixtures__/vectors.json`, unchanged, plus a new test that
   bounded selection equals the full stable sort on a tie-heavy database.
6. **Disposition table covers every hit.** The four greps from the brief were
   re-run over `PRD/sections/`. Every hit appears in the table with a
   disposition, and every row marked "Edit" has a matching diff.
7. **Slice order and criteria.** Order is recovery (a), then shared identifier
   and per-frame work (b)(c), then panel (d), then scan map (e). Criteria are
   measurable: the failure line's exact sentence, `role="alert"`, 95,895 keys
   with identical `oracleId` and `name`, 44 px box, no overlap with the
   caution box, In-Depth fit at 360 and 390 wide.

## Advisory findings (not blocking; fold into map-out)

- A1. `reference/identify.py` is not in the repo. Only a code comment in
  `identify.ts` mentions it. The real parity check is
  `identify.test.ts` plus `__fixtures__/vectors.json`, which exist. Map-out
  should name those as the check and not ask the builder to run the Python.
- A2. The scan-map slice must also update test fixtures that carry
  `imageUrl`: `TradeBalancer.scan.test.tsx` (lines 140-143),
  `useScanCapture.test.ts` (62-63), `persistence/loadScanMap.test.ts` (24),
  `identification/resolveScanCandidates.test.ts` (19-26, 109-115). The
  last one's "printing-no-image" and "carried imageUrl" cases change meaning,
  because a derived address is empty only for a printing id under 2
  characters. Keep the existing oracle-level fallback in the resolver for that
  case.
- A3. The slice should name `npm run data:scan-map` and remove the now-unused
  `getImageUrl` helper in `build-card-scan-map.mjs`. If the gitignored input
  `apps/frontend/data/scryfall/default-cards.json` is absent, the slice parks
  as the brief says.
- A4. `screen-layout.md` needs a check that no other row (such as the scanner
  host rows) contradicts the new Chrome row. The grep found only line 213.

## Status

Left at `STATUS.refined`; the `PRD/work/STATUS.md` board row is already under
`## refined`. No README `Preparation gate` section written (the driver owns
it).
