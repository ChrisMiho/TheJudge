# Receipt — scan-robustness-tuning

- **Date:** 2026-06-25
- **Slug:** scan-robustness-tuning
- **Status:** partial — planned tuning levers (Slices A & B) shipped; the two reported user-facing scan failures were **not** closed because owner on-device validation traced both to an upstream detector-geometry root cause that is out of this package's scope (escalated to a new work package).

## Outcome summary

The package set out to fix two reported scan failures via two in-scope levers:

1. **Corpus coverage** (Slice A — DEC-069 / REQ-047): make scan corpus coverage measurable and audit the build inclusion filter so non-English / alt-art gameplay printings are not silently dropped.
2. **Glare recalibration** (Slice B — calibration under DEC-062 / REQ-043): rebalance query-side / frame-quality glare constants in `tuning.ts`, no lock-gate change.

Both levers shipped with tests. **Slice C (owner validation) is blocked/unresolved**: on-device retest showed the scanner *never locks onto the card's shape*, i.e. `detectCard()` returns `null` and the warp + fingerprint + stabilizer pipeline never runs. This is the **detector geometry** (`detector.ts`), which both DESIGN-BRIEF and GAMEPLAN list as a frozen CV-geometry escalation — explicitly not a lever in this package. Neither glare conditioning nor corpus coverage can address it, since both run strictly downstream of detection.

## Root-cause evidence (carried forward — work folder deleted)

- Pipeline order verified in `ScanCameraSurface.tsx:130-145`: `detectCard(rawFrame)` runs first; on `null` → status `no-card`, and `onCapture → identify → frameQuality → conditioning → stabilizer lock` never runs.
- Failure reproduced on two physically different cards:
  - **Akroma's Will**, Strixhaven Mystical Archive, Japanese (ornate / etched-foil full-art). Scryfall printing id `5f0c0b37-056f-4c49-b5d7-e25534117e17` (`soa/66`), illustration id `7ae79614-a310-47a7-986f-576a1790622f`, oracle id `fd949f82-fc10-4e37-8aa9-6c7569fe3c55`. Sibling id `988b5c67-1521-4bff-aff5-b3536c20aa5c` (`soa/131`).
  - A plain **non-Japanese / English card** held centered (2026-06-25 follow-up) — same shape-lock failure, confirming the issue is language- and corpus-agnostic.
- Corpus refuted as cause: `data:scan-fingerprints --diagnose-id 5f0c0b37-056f-4c49-b5d7-e25534117e17` reports `included` + current corpus target + `fingerprinted`. A clean Scryfall PNG of `soa/66` identifies `Akroma's Will` at distance `2.67`. Nothing is missing from the DB for these cards.
- Likely detector mechanisms (to evaluate in the follow-up package, all out of scope here): foil reflections add spurious internal edges failing `SOLIDITY_MIN 0.65` / `RECTANGULARITY_MIN 0.7`; low outer-border contrast vs. the play surface makes Canny (`CANNY_LO/HI 30/90`) miss the boundary; no stable 4-corner contour passes the gates.
- Investigation blocker for the follow-up: there is **no frame-export affordance** in `ScanCameraSurface` (no `toBlob`/`toDataURL`/download), so the debug overlay only draws corners when a card is already found. A raw failing frame (owner photo or a new "export current frame" affordance) is needed before detector levers can be tuned.

## Actions taken (cleanup)

- [x] Compared each slice's acceptance criteria vs codebase: Slice A done, Slice B done, Slice C unresolved (detector escalation).
- [x] Confirmed durable truth DEC-069 / REQ-047 already promoted in `sections/decisions/scanning.md`, `sections/decisions.md` (router), and `sections/functional-requirements.md` (no new promotion needed).
- [x] Updated `sections/system-map.md` "Fingerprint library build" — coverage diagnostics/measurability flipped from planned to shipped (corpus remains `partial` under DEC-054 pending a human-approved coverage build).
- [x] Recorded the detector shape-lock failure as a **Known limitation** on the `sections/system-map.md` "Camera capture & detector" entry (shipped-reality fact), with mechanisms, frozen boundaries, and pointer to the follow-up package.
- [x] Wrote this receipt.
- [x] Deleted `PRD/work/scan-robustness-tuning/`.
- No DEC/REQ `Status:` field edited (shipped-vs-planned lives in the catalog only).
- No `all-cards` switch, no Region A / recipe / `dbformat` / `stabilizer` / `identify` change, no lock-gate change, no runtime network/API/prompt/provider change, no Scryfall download / coverage-extending build.

## Files created / updated / deleted

**Created:**
- `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md` (this receipt)

**Updated (durable):**
- `PRD/sections/system-map.md` — "Fingerprint library build" planned→shipped coverage-diagnostics note; "Camera capture & detector" Known-limitation note for the detector shape-lock failure.

**Shipped earlier under this package (code/artifacts/tests, already committed-or-staged in branch):**
- `scripts/build-card-hashes.mjs` (no-network diagnostics: `--coverage-summary`, `--diagnose-id`, `--diagnose-illustration-id`; coverage counts)
- `apps/frontend/src/lib/scan/hashLibBuild.ts` + `hashLibBuild.test.ts` (inclusion helper `shouldIncludeScanPrinting`)
- `apps/frontend/src/lib/scan/tuning.ts` (`QUERY_GLARE_LUMA_THRESHOLD` 240→232, `FRAME_QUALITY_GLARE_LUMA_THRESHOLD` 235→232)
- `apps/frontend/public/data/cardhashManifest.json` (coverage counts)
- focused scan tests (`identify`, `frameQuality`, `frameSelection`, `useScanCapture`, `ScanCameraSurface`, `ScanDebugOverlay`)

**Deleted (ephemeral):**
- `PRD/work/scan-robustness-tuning/` (entire folder: `README.md`, `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `slice-a/b/c-*.md`, `ESCALATION-detector-shape-lock.md`). Evidence preserved in this receipt.

## Verification

- Slice A & B automated gates last run green on a real machine (Slice C evidence, 2026-06-25 Claude pass): focused scan suite `hashLibBuild` + `identify` + `frameQuality` + `frameSelection` + `useScanCapture` + `ScanCameraSurface` + `ScanDebugOverlay` = 89 passed; `data:scan-fingerprints --self-test` round-trip OK; `npm run typecheck` clean; `npm run quality:check` EXIT 0 (frontend 370, backend 218).
- Frozen-boundary diff empty for `recipe.ts`, `dbformat.ts`, `stabilizer.ts`, `identify.ts`, Ask AI request/schema/types, prompt/context assembly, backend provider code, and backend routes.
- This cleanup changed only PRD docs (system-map + receipt); no code touched, so the above suite state is unchanged.

## Follow-up (new work package)

Detector-robustness package targeting `detector.ts` shape-lock on ornate/foil/low-contrast-border printings. First likely slice: add a frame-export / debug-capture affordance to obtain a raw failing frame, then evaluate detector levers (Canny thresholds, solidity/rectangularity gates, foil-glare-tolerant edge sourcing, adaptive/closing morphology, low-contrast-border assist). Region A recipe geometry and `CARDHSH1` bin format stay frozen.
