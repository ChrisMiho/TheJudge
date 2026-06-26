# GAMEPLAN: scan-lock-acquisition-tuning

Make scanner acquisition diagnosable from live camera frame to first reliable identity vote, then use the evidence to run only stage-specific, reversible tuning. This package follows DEC-077 / REQ-057 and keeps one scanner behavior path.

See [DESIGN-BRIEF.md](DESIGN-BRIEF.md) for scope, validation conditions, and frozen boundaries.

## Architecture / data flow

```text
getUserMedia(constraints)
  -> MediaStreamTrack settings + native videoWidth/videoHeight
  -> hidden capture canvas at native frame size
  -> detectCard(frame, guide, maxDetectDimension)
      -> detector success/failure, corners, frame geometry
  -> FrameSelector.push(warpedCard)
      -> frame-quality score/reason
      -> selected current frame vs retained prior frame, or quality abstain
  -> CardIdentifier.identify(selectedFrame)
  -> resolveScanCandidatesRanked()
      -> best/runner-up names and distances, margin
  -> ScanStabilizer.push()
      -> votes accumulated/needed
      -> concrete vote/no-vote reason
  -> ScanConvergence + ScanDebugMetrics + debug export
  -> validation matrix evidence
```

## Slice map

| Slice | Objective | DEC/REQ | Primary files | Depends on |
| --- | --- | --- | --- | --- |
| A | Define the acquisition diagnostics model and pure vote-reason helpers | DEC-077 / REQ-057 | `apps/frontend/src/lib/scan/acquisitionDiagnostics.ts` | - |
| B | Thread camera + detector diagnostics through the scan surface and debug export | DEC-077 / REQ-057 | `ScanCameraSurface.tsx`, `ScanDebugOverlay.tsx` | A |
| C | Add selector, identity, and stabilizer vote diagnostics in the capture hook | DEC-077 / REQ-057 | `useScanCapture.ts`, `frameSelection.ts`, `stabilizer.ts` | A |
| D | Run reversible acquisition experiments behind diagnostics | DEC-077 / REQ-057 | `ScanCameraSurface.tsx`, `detector.ts`, `frameSelection.ts`, `tuning.ts` | B, C |
| E | Record validation evidence, PRD promotion checklist, and ship gates | DEC-077 / REQ-057 | PRD work docs | B, C, D |

B and C are parallel-ready after A because they instrument different halves of the pipeline. D is intentionally sequenced after diagnostic evidence exists. E is the validation and cleanup handoff.

## Diagnostic contract

The implementation should add one shared frame-level diagnostic shape that can represent both detector misses and identify attempts:

- capture: native frame size, relevant `MediaStreamTrack.getSettings()` fields where available, frame index/timestamp
- detector: success/failure, corners, guide rect, native frame geometry, `maxDetectDimension`, retry attempt when used
- frame selection: quality score/reason, selected current frame vs retained prior frame, selected frame age/index, quality abstain
- identity: best and runner-up resolved card names/distances, margin, unresolved-candidate state
- stabilizer: votes accumulated/needed, lock thresholds, accepted lock when applicable
- reason: `detector-miss`, `quality-abstain`, `unresolved-candidate`, `distance-above-lock`, `margin-below-min`, or `accepted-vote`

The shape is read-only. It must not participate in matching, voting, lock eligibility, API payloads, prompts, or backend behavior.

## Frozen - do not edit

- `apps/frontend/src/lib/scan/recipe.ts`
- `apps/frontend/src/lib/scan/identify.ts`
- `apps/frontend/public/cardhashes.bin`
- scan map artifacts
- `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider boundary, backend endpoints

`SCAN_STABILIZER_CONFIG.lockDistance` and `SCAN_STABILIZER_CONFIG.marginMin` stay fixed unless a separate confirmed decision follows diagnostic evidence.

## Verification checklist

- [ ] Slice A: pure diagnostic helpers classify every REQ-057 reason without DOM/camera dependencies.
- [ ] Slice B: debug-on scanning can display/export native capture settings and detector success/failure; debug-off scanning keeps the existing path and cost profile.
- [ ] Slice C: hook diagnostics report selector provenance, identity best/runner-up/margin, votes, and vote/no-vote reason without changing lock behavior.
- [ ] Slice D: each experiment is reversible, diagnostic-gated or evidence-backed, and leaves no product-facing scanner mode.
- [ ] Slice E: Mac-webcam baseline evidence is recorded; stand-assisted validation is recorded or explicitly marked pending.
- [ ] Frozen boundary check: `git diff --name-only` shows no edits to frozen recipe/bin/identify/API/backend surfaces.
- [ ] Full gate before ship: `npm run quality:check`.

## Test commands

```bash
# Focused frontend tests expected across slices
npm --workspace apps/frontend run test -- acquisitionDiagnostics
npm --workspace apps/frontend run test -- ScanCameraSurface ScanDebugOverlay
npm --workspace apps/frontend run test -- useScanCapture frameSelection stabilizer

# Full gate before cleanup
npm run quality:check
```
