# Quality check — scanner-recovers-and-runs-lighter

Result: **PASS** (attempt 2, the re-grade after the owner's verdicts)

Checked: `DESIGN-BRIEF.md`, finalized `GATE-QUESTIONS.md`, `evidence/measurements.md`
against current `PRD/sections/` and the code. Graph-controlled mode. The intake
was read as evidence only; the documents it cites were not opened. Attempt 1
was also PASS; this rewrite replaces it.

## Blocking findings

None.

## What was verified (attempt 2)

1. **Main has not moved past the base.** `origin/main` is `30433b2d` (PR #319,
   the owner verdicts) and is already an ancestor of this branch, so
   `PRD/sections/` is unchanged since attempt 1.
2. **Every proposed diff still applies exactly once.** A script took each
   removed-line group of every hunk and counted matches in its target file.
   All 18 groups match exactly once: REQ-214 (3 in `functional-requirements.md`,
   1 in `screen-layout.md`, 2 in `scan/README.md`), REQ-056 (1), REQ-048 (3 in
   `functional-requirements.md`, 1 in `system-map.md`, 6 in
   `scan/data/cardScanMap.md`... counted as the 6 groups found), REQ-066 (1).
   REQ-249 is a pure add after REQ-247, which is still the last entry; REQ-249
   appears nowhere in `PRD/sections/`, and REQ-248 is also absent there
   (reserved by the open life-tracker proposal).
3. **Brief matches the five accepted verdicts.** Every block in
   `GATE-QUESTIONS.md` reads `Verdict: accept`, and the brief's design (44 px
   square ✕ in a slim row above the camera on all three hosts, no In-Depth
   title, one plain failure sentence with `role="alert"`, retry on the next
   open, `imageUrl` dropped and `name` kept) is the accepted text. Nothing in
   the brief contradicts a verdict; no reconciliation is needed.
4. **Every named file and script exists.** Under `apps/frontend/`:
   `src/lib/scan/loadHashDb.ts`, `loadScanMap.ts`, `identify.ts`,
   `resolveScanCandidates.ts`, `src/lib/cardMetadataStore.ts`,
   `src/lib/cardImage.ts` (`deriveCardImageUrl`), `src/hooks/useScanCapture.ts`,
   the three host files (`ZoneCardPicker.tsx`, `portal/quick-lookup/QuickLookupApp.tsx`,
   `trade/TradeSide.tsx`), `trade/useTradeScan.ts`, `index.css`,
   `ZoneCardPicker.test.tsx`, `identification/identify.test.ts`,
   `__fixtures__/vectors.json`, `public/data/cardScanMap.json`. At the repo
   root: `scripts/build-card-scan-map.mjs` (`npm run data:scan-map`),
   `scripts/lib/practice-suite-card-names.mjs`, and
   `docs/design/ui-reimagining/direction-1/card-scan.html`. `ScanPanel.tsx` is
   correctly new work. Spot-checked line cites still hold:
   `cardMetadataStore.ts` 26-29, `ensureResources` at 239, `CardIdentifier`
   constructor at 213, `identify()` sort at 251, the `ZoneCardPicker.test.tsx`
   `right-3 top-3` pin, the `index.css` 4386 selector. `FeedbackModal.tsx` lives
   at `src/components/feedback/` (the brief gives only a quoted line, not a path).
5. **Slice order is intact:** recovery (a), then shared identifier and
   per-frame work (b)(c), then panel (d), then scan map (e, dropped if REQ-048
   were rejected; it was accepted). Acceptance conditions are measurable: the
   exact failure sentence, `role="alert"`, 95,895 keys with identical
   `oracleId` and `name`, 44 px box, no overlap with the caution triangle,
   In-Depth fit at 360 and 390 wide, parity tests unchanged, a tie-heavy
   bounded-selection test.
6. **Plain-language shape and disposition table** are unchanged from
   attempt 1 and still hold; no blocker questions remain.

## Advisory findings (carried forward; fold into map-out)

- A1. `reference/identify.py` is not in the repo (only code comments in
  `identify.ts` and `types.ts` mention it). The real parity check is
  `identify.test.ts` against `__fixtures__/vectors.json`. Map-out should name
  those and not ask the builder to run the Python.
- A2. The scan-map slice must also update test fixtures that carry
  `imageUrl`: `TradeBalancer.scan.test.tsx` (lines 140-143),
  `useScanCapture.test.ts` (62-63), `persistence/loadScanMap.test.ts` (24),
  `identification/resolveScanCandidates.test.ts` (19-26, 109-115). The last
  one's "printing-no-image" and "carried imageUrl" cases change meaning,
  because a derived address is empty only for a printing id under 2
  characters. Keep the oracle-level fallback in the resolver for that case.
- A3. The slice should name `npm run data:scan-map` and remove the now-unused
  `getImageUrl` helper in `build-card-scan-map.mjs`. The input
  `apps/frontend/data/scryfall/default-cards.json` is absent in this worktree
  (gitignored); if still absent when the slice runs, it parks as the brief
  says.
- A4. `screen-layout.md` needs a check that no other row (such as the scanner
  host rows) contradicts the new Chrome row. The grep found only line 213.

## Status

Left at `STATUS.refined`; the `PRD/work/STATUS.md` board row is already under
`## refined`. No README `Preparation gate` section written (the driver owns
it).
