# Slice I — The scanner hook keeps only what screens use

## Status: planned

Depends on: none. Findings: Q-02, Q-11, Q-10 (scan part), Q-12 (scan part), U-12 (one constant).

## Goal

The scanner hook stops returning values no screen reads and drops a duplicate scan-map cache. Every scan resolves the same printing as today.

## Requirements

1. Record the base: frontend test count; for the Trade scan tests, the printing each scan resolves (the existing assertions already pin them; note the test names).
2. **Q-02.** `hooks/useScanCapture.ts` returns eight values no screen reads (returns about `:581-598`). Re-grep every consumer. Remove seven: `cameraStatus`, `resolvedCandidates`, `lockedCandidate`, `scanPhase`, `scanAcquisitionDiagnostic`, `rescan`, `acceptCandidate`, and any state that is only ever reset. **Keep `blockedNotice`** (follow-up 1 needs it).
3. **Q-11.** Trade's scanner reloads the scan map into its own ref only to resolve the scanned printing, and the scan hook caches a second promise over the module cache. Have `useScanCapture` resolve the scanned printing into the held entry; drop `useTradeScan`'s side channel and the per-hook promise. The module loaders' retry-after-failure rule (REQ-249) is unchanged: do not edit `loadScanResources` / `loadScanMap` behavior.
4. **Q-10 (scan part).** Move the `ScanCameraStatus` type to `lib/scan/types.ts`, breaking the type cycle `ScanCameraSurface -> ScanDebugOverlay -> useScanCapture`.
5. **Q-12 (scan part).** Delete `SURFACE_DISTANCE` and `MAX_SURFACED_CANDIDATES` from `lib/scan/tuning.ts` after a zero-reference grep.
6. **U-12 (one item).** `LOW_CONFIDENCE_ESCALATION_COUNT` in `useScanCapture.ts` is used only by a test: make it file-local, or move the test's value.
7. **Confinement.** The `ZoneCollectionStep.test.tsx` hook mock (about `:41-62`) may drop the removed fields; nothing else in card-search-owned files changes. File names `useScanCapture.ts` and `tuning.ts` stay (the scan spec names them).
8. Trim only dead-field assertions in `hooks/useScanCapture.test.ts`; keep every behavior assertion.

## Acceptance criteria

- [ ] I1. `useScanCapture` returns none of the seven removed values and still returns `blockedNotice`; no consumer breaks.
- [ ] I2. `useTradeScan` has no scan-map side channel; the scan hook has no per-hook scan-map promise; `loadScanMap` / `loadScanResources` are unchanged.
- [ ] I3. `ScanCameraStatus` lives in `lib/scan/types.ts` and the `ScanCameraSurface -> ScanDebugOverlay -> useScanCapture` type cycle is gone.
- [ ] I4. `SURFACE_DISTANCE` and `MAX_SURFACED_CANDIDATES` are deleted with zero references remaining.
- [ ] I5. `LOW_CONFIDENCE_ESCALATION_COUNT` is no longer an export used only by a test.
- [ ] I6. `useScanCapture.test.ts`, `TradeBalancer.scan.test.tsx`, `loadScanResources.test.ts`, `loadScanMap.test.ts` and the three hosts' scan tests pass; the same printing resolves for every scan in the Trade scan tests.
- [ ] I7. Full frontend suite is green; test count change (only trimmed dead-field assertions, no removed tests) is explained in the evidence log.
- [ ] I8. `npm --workspace apps/frontend run typecheck` exits 0.
- [ ] I9. `npm run lint` exits 0.
- [ ] I10. Of the card-search-owned files only the `ZoneCollectionStep.test.tsx` mock changed.

## Verification

```bash
npm --workspace apps/frontend run test -- scan
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run lint
git diff --name-only origin/main
```

## Reverted findings

None yet.

## Files touched

- `apps/frontend/src/hooks/useScanCapture.ts` and its test
- `useTradeScan` (re-read its path), `ScanCameraSurface`, `ScanDebugOverlay`
- `apps/frontend/src/lib/scan/types.ts`, `apps/frontend/src/lib/scan/tuning.ts`
- `ZoneCollectionStep.test.tsx` (hook mock only)
