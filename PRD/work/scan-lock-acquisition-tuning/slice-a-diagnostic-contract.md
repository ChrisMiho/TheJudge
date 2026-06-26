# Slice A - Diagnostic Contract

## Status: done

## Goal

Define a shared, framework-free acquisition diagnostic model and pure helper logic for classifying vote/no-vote reasons.

## Requirements

1. Add a new scan diagnostic module, preferably `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts`, that exports the frame-level diagnostic types used by the scan surface, capture hook, debug overlay, and tests.
2. Represent every REQ-057 stage without requiring DOM, React, camera, or backend dependencies:
   - native capture resolution and relevant track settings
   - detector outcome, corners, guide, and geometry
   - frame-quality score/reason
   - frame selector provenance: current frame, retained prior frame, or abstain
   - best/runner-up identity names and distances, plus margin
   - stabilizer votes accumulated/needed
   - vote/no-vote reason
3. Define the canonical reason union as:
   - `detector-miss`
   - `quality-abstain`
   - `unresolved-candidate`
   - `distance-above-lock`
   - `margin-below-min`
   - `accepted-vote`
4. Add a pure helper that derives the identity/stabilizer reason from resolved candidate metrics and the active `SCAN_STABILIZER_CONFIG` thresholds. The helper must not mutate stabilizer state or call `identify()`.
5. Keep diagnostics additive and read-only. Do not alter matching, voting, lock thresholds, backend contracts, or prompt/API types.

## Tests

- `apps/frontend/src/lib/scan/acquisitionDiagnostics.test.ts` covers all reason helper branches and verifies the module has no DOM/React dependency.
- `apps/frontend/src/lib/scan/stabilizer.test.ts` remains the behavioral lock/no-lock safety net if helper expectations mirror stabilizer gates.

## Acceptance criteria

- [ ] `acquisitionDiagnostics.ts` exports typed diagnostic stages and reason helpers that can be imported without React or DOM globals.
- [ ] Unit tests cover all six vote/no-vote reasons, including a runner-up margin failure and an unresolved candidate after detection/quality pass.
- [ ] The helper uses supplied threshold values; it does not import or change `SCAN_STABILIZER_CONFIG.lockDistance` / `marginMin` as hidden mutable state.
- [ ] No files under backend, prompt assembly, provider contracts, `recipe.ts`, `identify.ts`, `cardhashes.bin`, or scan map artifacts are touched.

## Verification

```bash
npm --workspace apps/frontend run test -- acquisitionDiagnostics
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts`
- `apps/frontend/src/lib/scan/acquisitionDiagnostics.test.ts`
- `apps/frontend/src/lib/scan/types.ts` only if an existing shared type must be reused more explicitly

## Notes

This slice is the dependency for B and C. It should not thread diagnostics into React yet; keep it pure so the later slices can consume one stable contract.
