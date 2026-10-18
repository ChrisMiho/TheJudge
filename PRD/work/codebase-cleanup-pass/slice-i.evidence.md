# Slice I evidence

## Baseline (tip after slice H, 2026-10-18)

- Frontend: 155 files, 1668 tests pass. Scan tests (`npm --workspace apps/frontend run test -- scan`): 29 files, 263 tests.

## Changes

- Q-02: `useScanCapture` no longer returns `cameraStatus`, `resolvedCandidates`, `lockedCandidate`, `scanPhase`, `scanAcquisitionDiagnostic`, `rescan` or `acceptCandidate`; it still returns `blockedNotice`. Re-grep of every consumer: the only reader of any of them was a test (`useScanCapture.test.ts`) and the hook mock in `ZoneCollectionStep.test.tsx`. The states that were only ever set and reset (`cameraStatus`, `resolvedCandidates`, `lockedCandidate`, `scanPhase`, the diagnostic state) and the `ScanPhase` type are gone; `setCameraStatus` keeps its detector-nudge logic. `LOW_CONFIDENCE_ESCALATION_COUNT` (U-12) is no longer exported (nothing in the hook used it); the one test that loops on it declares its own `3`.
- Q-10 (scan part): `ScanCameraStatus` is defined in `lib/scan/types.ts`. The hook, `ScanPanel` and `useTradeScan` import it from there, so the type cycle `ScanCameraSurface -> ScanDebugOverlay -> useScanCapture -> ScanCameraSurface` is gone. `ScanCameraSurface.tsx` re-exports the type, because `ZoneCardPicker.tsx` (card-search brief) imports it from there and must not change.
- Q-12 (scan part): `SURFACE_DISTANCE` and `MAX_SURFACED_CANDIDATES` are deleted from `lib/scan/tuning.ts`; a grep of the whole repo outside `PRD/` finds no reference.
- `ZoneCollectionStep.test.tsx`: the hook mock drops the removed fields (the one confined-file change the slice allows).

## Tests

- Removed because they tested only the removed returns: `rescan() resets convergence and notice to a clean searching state`, and four acquisition-diagnostic tests (`reports quality-abstain ...`, `reports unresolved-candidate ...`, `reports distance and margin vote-gate ...`, `reports accepted-vote ...`). Each asserted nothing but `rescan()` or `scanAcquisitionDiagnostic`. The fifth diagnostic test (`does not let a stale detector-miss diagnostic hide a later close-to-voting identity state`) keeps its behaviour assertion (`convergence.inZone`) and loses its two diagnostic lines.
- Trimmed: the dead `scanPhase` and `lockedCandidate` lines from six other tests.
- Frontend after: 155 files, 1663 tests pass (1668 minus those five). Scan tests: 258 pass.

## Finding left unapplied: Q-11, the scanned-printing side channel (and the per-hook promise)

Q-11 asks `useScanCapture` to resolve the scanned printing into the held entry, so `useTradeScan` can drop its own `loadScanMap()` call and `scanMapRef`, and the hook can drop its own scan-resources promise. It is not applied, for three reasons, and the criterion I2 therefore stays false.

1. Its proof needs a card-search-owned test changed. `TradeBalancer.scan.test.tsx` replaces `useScanCapture` with its own double, mocks `loadScanMap`, waits in its `openScan` helper for `loadScanMapMock` to have been called, and the double hands `useTradeScan` the raw candidates it resolves the printing from. Moving the resolution into the hook means rewriting that double, dropping the helper's wait, and dropping the mock; the slice's confinement allows only the `ZoneCollectionStep.test.tsx` mock to change, and the brief's proof list names `TradeBalancer.scan.test.tsx` as passing.
2. The per-hook promise cannot go on its own. With injected loaders (every `useScanCapture` test) it is what makes the scan data load once per open and keeps REQ-249's retry-after-failure; the module-cached `loadScanResources` only covers the default path.
3. Reading the code to do it turned up what looks like a latent bug, which a faithful move would either copy or silently fix. In the real hook the held entry's `candidates` are the oracle-id voting candidates (`votingCandidates`, built from `ranked`), not the printing-id candidates from `identify`. `scannedPrintingIdForOracle(candidates, scanMap, oracleId)` looks each candidate up in the scan map, which is keyed by printing id, so with the real hook it finds nothing and Trade's scan never defaults to the scanned printing (DEC-070). The Trade scan test does not catch it, because its double feeds printing-id candidates straight to `useTradeScan`. The change that introduced it is `be04fb1b` (ui-reimagining-build, slice H, which moved candidates into the holding list). Fixing it would be a player-visible change (the price shown for a scanned card would follow the scanned printing), so it is left for the owner to decide; the one-word fix is to store `result.candidates` instead of `votingCandidates` on the held entry.

## After

- `npm --workspace apps/frontend run typecheck` and `npm run lint` exit 0. `git diff --name-only origin/main` lists, among card-search-owned files, only `ZoneCollectionStep.test.tsx`.

## Left in place (follow-up)

Inside the hook, the per-frame acquisition diagnostic (frame selection, identity and stabilizer parts) is still computed into a ref, and `recordAcquisitionDiagnostic` still feeds that ref; with `scanAcquisitionDiagnostic` removed nothing reads it. Removing it means changing the hosts' `onAcquisitionDiagnostic` wiring in `QuickLookupApp` and `ZoneCardPicker`, both card-search-owned.
