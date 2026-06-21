# Slice E — Scan UX integrated into the zone picker

## Status: code done — NFR-010 measurement + end-to-end validation pending

**Implemented & verified:** scan entry point, lazy scan-map/hash loading, batch
preview/add/re-scan loop, card-back + low-confidence UX, scan-flow tests (`quality:check`-green).
**Not done (gated on the fingerprint library existing):** end-to-end scan on a real device and
NFR-010 budgets measured/recorded (bin size, first-scan lazy-load time, memory, match latency).

## Depends on

Slice B (lazy `cardhashes.bin` loader), Slice C (resolver), Slice D (camera + detector).
This is the final slice.

## Goal

Add a **Scan** entry point beside the existing search input in `ZoneCardPicker` and implement
the batch accept-and-rescan loop, feeding the existing preview → add → owner → duplicate-block
→ stack-limit path. Manual search remains the default and a permanent fallback. Measure
NFR-010 budgets. (`REQ-038`, `DEC-052`, `NFR-010`, `FLOW-006`.)

## Requirements

1. Scan entry point **beside** the search input in `ZoneCardPicker.tsx` (props threaded from
   `ZoneCollectionStep.tsx`); manual search/autocomplete untouched.
2. Batch loop (`DEC-052` / `FLOW-006`): open camera (`ScanCameraSurface`, Slice D) → on a
   candidate, lazy-load the DB on first scan (Slice B) → `identify` → `resolveScanCandidates`
   (Slice C) → ranked candidate(s) populate the **same** `selectedCard` / `CardSelectionPreview`
   a typed suggestion uses → **Accept** runs the existing `handleAddSelectedCard`
   (`validateZoneCardAdd`, `buildZoneCardFromMetadata`, owner, duplicate-block, stack-limit) →
   camera **immediately re-opens to scanning** for the next card → **Back/Exit** closes the
   camera and returns to zone collection. The zone's existing card list shows the running count.
3. Unhappy paths:
   - Detected card back → "Flip the card over" prompt; scanning continues.
   - Low confidence → scanning continues, manual capture stays available; after a few
     consecutive low-confidence attempts a **non-blocking** prompt offers manual name entry
     (the existing search) without stopping the scan. The attempt count / thresholds are
     calibration constants (`DEC-052`).
   - Ranked candidate selection (art-shared reprints) lets the user pick among resolved
     candidates before Accept.
4. Stack cards land in scan order (bottom-to-top); manual reorder stays out of scope
   (`FLOW-002`). Duplicate-stack block inherited unchanged (`FLOW-004`).
5. Extend (do not replace) existing zone-collection tests (`App.zoneFlow.test.tsx`,
   `ZoneCardPicker`/`ZoneCollectionStep` tests) to cover: manual search still works; an accepted
   scan candidate reaches preview + add; scanned cards produce the same `ZoneCardItem` shape.
6. Measure and record NFR-010 budgets on a representative device: `cardhashes.bin` size,
   first-scan lazy-load time, memory use, match latency; confirm startup pays no scan cost.

## Acceptance criteria

- [ ] Manual search/autocomplete works exactly as before (regression test green).
- [ ] A Scan entry point sits beside the search input and opens the camera surface.
- [ ] An accepted scan candidate reaches the existing `CardSelectionPreview` and add flow.
- [ ] Added scanned cards produce the same `ZoneCardItem` shape as manually added cards.
- [ ] Batch loop works: Accept adds and re-opens scanning; Exit returns to zone collection;
      running count updates.
- [ ] Card-back prompt, low-confidence non-blocking escalation, and ranked candidate selection
      behave per `DEC-052`; scan continues through unhappy paths.
- [ ] Existing zone-collection tests are extended, not replaced.
- [ ] NFR-010 budgets measured and recorded; app startup performs no scan-library fetch.
- [ ] No change to `AskAiRequest`, `GameContext`, prompt assembly, backend, or any endpoint.
- [ ] `npm run quality:check` green.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ZoneCardPicker src/App.zoneFlow
npm run quality:check
# NFR-010: run the app, scan on a representative device, record size/latency/memory
npm run dev:mock
```

## Files touched

- `apps/frontend/src/components/ZoneCardPicker.tsx` (Scan entry point + candidate wiring)
- `apps/frontend/src/components/ZoneCollectionStep.tsx` (scan state + batch loop orchestration)
- `apps/frontend/src/components/ScanCameraSurface.tsx` (consumed from Slice D)
- a scan-flow hook if state warrants (e.g. `apps/frontend/src/hooks/useScanCapture.ts`)
- `apps/frontend/src/App.zoneFlow.test.tsx`, `ZoneCardPicker`/`ZoneCollectionStep` tests (extended)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (`AskAiRequest`, `GameContext`, endpoints) — confirmed
- [ ] No secrets committed (no card-image downloads committed beyond shipped artifacts)
- [ ] Durable outcomes promoted; `PRD/work/cardomancer-card-detection-summary/` ready to delete

## PRD promotion checklist (executed at cleanup — `thejudge-cleanup`)

The refinement step already promoted `DEC-050..053`, `REQ-034..038`, `NFR-010`, `FLOW-006`,
and the `sections/` edits. At cleanup, verify and finalize:

- [ ] `sections/system-map.md` "Card scanning" subsystem flips `planned` → `shipped` (gate:
      code wired in under `apps/` + receipt written — `doc-lifecycle.md`).
- [ ] `sections/integrations-and-data.md` Card Scanning Data Strategy reflects the shipped
      artifacts (`cardhashes.bin`, `cardhashManifest.json`, `cardScanMap.json`) and the
      human-approved image-download build step as implemented.
- [ ] Any calibration constants finalized in Slice D/E (detector area fractions, confidence /
      low-confidence thresholds, manual-entry escalation count, NFR-010 measured budgets) are
      recorded where durable, not left only in the deleted work folder.
- [ ] Cleanup receipt written at
      `PRD/instructions/receipts/cardomancer-card-detection-summary-<YYYY-MM-DD>.md`.
- [ ] `PRD/work/cardomancer-card-detection-summary/` deleted after promotion.
