# Slice D - Reversible Acquisition Experiments

## Status: planned

## Goal

Use the new diagnostics to implement and evaluate small acquisition experiments that target the measured blocking stage.

## Requirements

1. Baseline first: before changing behavior, capture diagnostic evidence for at least the Mac-webcam condition using a DB-registered card. Record which stage blocks or slows first reliable voting.
2. Verify/fix continuous autofocus request support:
   - keep constraints fallback-friendly
   - request focus support only when the browser/device accepts it
   - report requested/applied focus setting in diagnostics when available
3. Add a current-frame-only selector trial that can be compared against the rolling selector:
   - no product-facing mode
   - reversible implementation, preferably a local tuning/config path used by tests and diagnostic runs
   - diagnostics must show whether the retained prior frame was hurting or helping
4. Add adaptive higher detector-resolution retry after a low-confidence 640px pass only if diagnostics indicate detector geometry or low-confidence identity is the bottleneck:
   - default first pass remains the current cheaper detector path
   - retry is bounded and observable in diagnostics
   - do not always raise detector cost
5. Clean up positive/negative cue precedence only when diagnostics show stale condition cues hide close-to-voting identity state. The rendered cue and diagnostic reason should point to the same stage.
6. Keep only evidence-backed changes at the end of the slice. Revert or leave disabled any experiment that does not improve acquisition evidence.

## Tests

- `apps/frontend/src/components/ScanCameraSurface.test.tsx` covers fallback-friendly focus constraints and applied settings diagnostics.
- `apps/frontend/src/lib/scan/frameSelection.test.ts` covers the current-frame-only trial path without changing the default rolling selector behavior.
- `apps/frontend/src/lib/scan/detector.test.ts` covers bounded adaptive retry behavior when implemented.
- `apps/frontend/src/hooks/useScanCapture.test.ts` covers cue precedence and diagnostic reason agreement.

## Acceptance criteria

- [ ] Baseline diagnostic evidence is recorded in the work package before experiment results.
- [ ] Focus constraint tests prove the request is fallback-friendly and records applied settings when available.
- [ ] Current-frame-only selector trial has focused tests and can be compared to rolling selector diagnostics without adding a user mode.
- [ ] Adaptive detector retry has tests showing no retry on normal pass, one bounded retry on eligible low-confidence/geometry cases, and diagnostic fields that identify the retry.
- [ ] Cue precedence tests cover a close-to-voting identity state with stale blur/condition signals.
- [ ] `lockDistance`, `marginMin`, `recipe.ts`, `identify.ts`, `cardhashes.bin`, scan map artifacts, backend contracts, and prompt/API files remain unchanged.

## Verification

```bash
npm --workspace apps/frontend run test -- ScanCameraSurface useScanCapture frameSelection detector acquisitionDiagnostics
npm --workspace apps/frontend run typecheck
git diff --name-only
```

## Files touched

- `PRD/work/scan-lock-acquisition-tuning/evidence-YYYY-MM-DD.md`
- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/hooks/useScanCapture.test.ts`
- `apps/frontend/src/lib/scan/frameSelection.ts`
- `apps/frontend/src/lib/scan/frameSelection.test.ts`
- `apps/frontend/src/lib/scan/detector.ts` only for bounded retry support, not broad detector retuning
- `apps/frontend/src/lib/scan/detector.test.ts`
- `apps/frontend/src/lib/scan/tuning.ts`
- `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts`

## Notes

This slice is deliberately evidence-gated. If diagnostics identify only one blocker, implement only the relevant experiment and document why the others were left pending.
