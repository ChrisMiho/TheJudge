# Slice D — Persistent No-Card Nudge

## Status: planned

## Goal

Surface a condition-aware user nudge when detection persistently cannot find a card outline, reusing the existing searching-state feedback path (REQ-050, DEC-057/DEC-062).

## Requirements

1. Detect sustained `no-card` status without changing the detector or the stabilizer identity gate.
2. Reuse the existing convergence/searching indicator area instead of adding a new scan control.
3. Keep manual capture and manual search available.
4. The nudge is action-oriented for detection failure (improve card edges/contrast/position) and must not leak raw status text such as "No card found".
5. The nudge resets when a card is detected, the scan closes, or scan state resets.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- src/hooks/useScanCapture.test.ts` verifies repeated `no-card` status produces a searching-nudge signal and resets on recovery/close.
- [ ] `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx` verifies the nudge renders while searching after sustained detector failure.
- [ ] Same component test verifies raw status copy (e.g. "No card found") is still not shown.
- [ ] Manual check: camera pointed away → persistent failure shows the nudge; detected card → normal searching/locking copy returns.
- [ ] Manual check: no new button/control appears; debug/review controls remain non-overlapping.

## Verification

```bash
npm --workspace apps/frontend run test -- src/hooks/useScanCapture.test.ts
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/hooks/useScanCapture.test.ts`
- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
