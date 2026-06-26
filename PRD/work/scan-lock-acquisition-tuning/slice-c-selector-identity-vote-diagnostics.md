# Slice C - Selector Identity Vote Diagnostics

## Status: done

## Goal

Add selector, identity, and stabilizer vote diagnostics in `useScanCapture` so every detected frame explains whether it did or did not produce a reliable vote.

## Requirements

1. Extend `FrameSelector` output so callers can tell whether the selected frame is the current frame or a retained prior frame. Include enough sequence/age metadata for debug output without changing selection behavior.
2. Extend `useScanCapture` diagnostics for quality abstains:
   - frame-quality score
   - condition reason
   - selector source `abstain`
   - vote/no-vote reason `quality-abstain`
3. Extend `useScanCapture` diagnostics after identification:
   - resolved best and runner-up card names/distances
   - margin
   - unresolved candidate state when `identify()` returns no resolvable ranked card
   - current stabilizer votes and votes needed
4. Use Slice A helper logic to report `unresolved-candidate`, `distance-above-lock`, `margin-below-min`, or `accepted-vote`.
5. Keep `ScanStabilizer` lock behavior unchanged. If stabilizer internals need to expose additional read-only detail, add tests proving existing lock/no-lock behavior is unchanged.
6. Ensure stale negative capture hints do not hide a close-to-voting identity state in diagnostics; the diagnostic reason and rendered cue precedence should agree.

## Tests

- `apps/frontend/src/lib/scan/frameSelection.test.ts` covers current-frame, retained-prior, and abstain provenance.
- `apps/frontend/src/hooks/useScanCapture.test.ts` covers quality abstain, unresolved candidate, distance gate, margin gate, accepted vote, and debug metric threading.
- `apps/frontend/src/lib/scan/stabilizer.test.ts` is updated only if read-only stabilizer state changes are needed.
- `apps/frontend/src/components/ScanDebugOverlay.test.tsx` covers the new selector/identity/vote diagnostic rows.

## Acceptance criteria

- [ ] A quality-abstaining frame reports `quality-abstain`, quality score, condition reason, and no identity candidate.
- [ ] A detected/quality-acceptable frame with no resolved ranked candidate reports `unresolved-candidate`.
- [ ] A best candidate over `lockDistance` reports `distance-above-lock` with best distance and threshold.
- [ ] A best candidate under `lockDistance` but below `marginMin` reports `margin-below-min` with margin and threshold.
- [ ] A confident voting frame reports `accepted-vote` and correct votes accumulated/needed without changing the number of frames required to lock.
- [ ] A retained-prior selector choice is distinguishable from a current-frame choice in tests.

## Verification

```bash
npm --workspace apps/frontend run test -- useScanCapture frameSelection stabilizer acquisitionDiagnostics
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/hooks/useScanCapture.test.ts`
- `apps/frontend/src/lib/scan/frameSelection.ts`
- `apps/frontend/src/lib/scan/frameSelection.test.ts`
- `apps/frontend/src/lib/scan/stabilizer.ts` only if a read-only state detail is necessary
- `apps/frontend/src/lib/scan/stabilizer.test.ts` only if `stabilizer.ts` changes
- `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts`
- `apps/frontend/src/components/ScanDebugOverlay.tsx`
- `apps/frontend/src/components/ScanDebugOverlay.test.tsx`

## Notes

This slice explains the acquisition bottleneck after a card outline exists. It must not loosen `lockDistance`, `marginMin`, or the hash/identify boundary.
