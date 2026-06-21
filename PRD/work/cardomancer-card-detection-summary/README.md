status: active — code complete + fingerprint library built; blocked on real-device validation

# cardomancer-card-detection

Optional on-device camera card scanner as an **alternate input path** into existing zone
card fields — alongside (never replacing) manual search. Ports the friend's proven
Cardomancer art-perceptual-hash engine into TypeScript, builds and owns its own fingerprint
library from the existing Scryfall pipeline, and adds a camera batch-scan UX inside
`ZoneCardPicker`. Frontend-only, zero network calls at scan time, no backend/API/prompt
change.

## Status

**Code complete + library built, not yet shippable.** All five slices' code is implemented
and `quality:check`-green, and the fingerprint library has now been built (see Outstanding #1
below — `cardhashes.bin` 97,311 entries / 13 MB, `cardhashManifest.json`, `cardhashSkiplist.json`
all on disk under `apps/frontend/public/data/`). The scanner is **still not validated
end-to-end** because real-device validation has not run. The `system-map.md` "Card scanning"
entries correctly remain `planned`; do **not** flip them to `shipped` and do **not** delete
this folder until the outstanding work below is complete.

`GAMEPLAN.md` holds the architecture, data flow, and verification checklist; `slice-a..e-*.md`
are the slice docs (note: their acceptance/ship checkboxes were never ticked even where code
landed — trust the per-slice Status line and the Outstanding work section here).

## Outstanding work (not yet implemented)

1. **Fingerprint library artifact — DONE (2026-06-20).** Built via
   `npm run data:scan-fingerprints` against the local `default-cards.json` snapshot
   (sha `07f75dc…`). On disk under `apps/frontend/public/data/`:
   `cardhashes.bin` (97,311 entries / 13,047,744 bytes), `cardhashManifest.json`, and
   `cardhashSkiplist.json` (12 permanent Scryfall 404 / non-canonical-size skips, parked).
   Includes dual-faced `__back` faces. Artifacts are committed alongside the scanner code.
   The resumable production build path shipped under `DEC-054` / `REQ-039`.

   **Known gap — `_card_back` reference absent.** The build runs with
   `apps/frontend/data/scryfall/card-images/card_back_reference.png` missing, so the
   `_card_back` fingerprint was never added to the library (it is not even in the skiplist —
   `planTargetEntryIds` only includes it when the reference image exists). This degrades
   cleanly: `CardIdentifier.isCardBack()` (`identify.ts:151`) returns `{ isBack: false,
   distance: 999 }` when the DB has no card back, so a scanned card back falls through to the
   normal low-confidence / no-match path instead of firing the dedicated "flip the card over"
   prompt (`DEC-052` / Slice E). To enable card-back detection: drop a canonical 745×1040
   `card_back_reference.png` into the image dir and re-run `npm run data:scan-fingerprints`
   (it will append `_card_back` to the existing bin). Tracked as remaining work below.
2. **Device validation + calibration tuning (gated on #1)** — can only run once the bin
   exists:
   - Slice D: real mobile captures produce a usable warp; plausible top-1 identification; a
     measured **detect-rate / top-1 accuracy** recorded.
   - Slice E: **NFR-010** budgets measured on a representative device (bin size, first-scan
     lazy-load time, memory, match latency).
   - Calibration constants (detector area fractions, confidence / card-back thresholds,
     low-confidence escalation count) finalized by outcome (`DEC-052`).
3. **`_card_back` reference fingerprint (small, independent of #2)** — add a canonical
   745×1040 `card_back_reference.png` under `apps/frontend/data/scryfall/card-images/` and
   re-run `npm run data:scan-fingerprints` to append `_card_back` to the live bin, enabling
   the "flip the card over" prompt. Until then card-back detection degrades to the
   low-confidence path (see Known gap under #1). Not a crash; not a merge blocker, but the
   card-back UX in Slice E is inert without it.

When #1, #2, and #3 are done, run `thejudge-cleanup` to promote truth (flip `system-map.md`
to `shipped`, update `integrations-and-data.md`), write the receipt, and delete this folder.

## Slices

| Slice | Objective | Requirements | Depends on | Parallel? |
| --- | --- | --- | --- | --- |
| [A](slice-a-identification-core.md) | Identification core + shared resize/hash recipe + regenerated golden vectors | REQ-034, DEC-051 | — | gate slice |
| [B](slice-b-fingerprint-library.md) | TheJudge-owned `cardhashes.bin` build + lazy load | REQ-035, NFR-010 | A | parallel w/ C, D |
| [C](slice-c-scan-resolver.md) | printing→oracle→`CardMetadataItem` resolver bridge | REQ-036, DEC-053 | A | parallel w/ B, D |
| [D](slice-d-camera-detector.md) | Camera capture + detector + perspective warp | REQ-037, DEC-052 | A | parallel w/ B, C |
| [E](slice-e-scan-ux.md) | Scan UX + batch loop in `ZoneCardPicker`; NFR-010 measured | REQ-038, DEC-052, NFR-010, FLOW-006 | B, C, D | final |

Dependency graph: `A → {B, C, D} → E`. B and C both touch the `data:build`/`data:scan`
wiring in `package.json` — coordinate that single edit (different scripts/artifacts, low
conflict). Slice E is the final slice (Ship gates + PRD promotion checklist).

**Progress:** Slice A done — identification core ported, `recipe.ts` resize/hash defined,
golden vectors regenerated from the recipe, `npm run quality:check` green. Slice B done —
`build-card-hashes.mjs` + `writeDb`/`loadHashDb.ts` implemented and round-trip verified via
`--self-test`; real `cardhashes.bin` production build deferred pending human-approved Scryfall
image download. Slice C done — `build-card-scan-map.mjs` builds `cardScanMap.json` from
local bulk JSON (95,895 entries), `resolveScanCandidates.ts` resolves/dedupes/ranks
candidates into `CardMetadataItem[]`, `npm run quality:check` green. Slice D done —
CV-free TypeScript detector, perspective warp, synthetic geometry tests, and standalone
camera surface added; automated `quality:check` green. Slice E done — scan entry point,
lazy scan-map/hash loading, batch candidate preview/add loop, card-back and low-confidence
UX, and scan flow tests added; automated `quality:check` green. Real-device outcome and
NFR-010 metrics remain deferred to the manual validation gate.

## Implementation map

| Surface | Path | Slice |
| --- | --- | --- |
| Shared hash recipe (resize + DCT pHash) | `apps/frontend/src/lib/scan/recipe.ts` | A |
| DB reader / identify / types | `apps/frontend/src/lib/scan/{dbformat,identify,types}.ts` | A |
| Parity tests + raw fixtures | `apps/frontend/src/lib/scan/*.test.ts`, `.../__fixtures__/` | A |
| Vector regeneration | `scripts/build-scan-vectors.mjs` | A |
| DB builder + lazy loader | `scripts/build-card-hashes.mjs`, `apps/frontend/src/lib/scan/loadHashDb.ts` | B |
| Hash artifacts | `apps/frontend/public/data/cardhashes.bin`, `cardhashManifest.json` | B |
| Scan-map builder + resolver | `scripts/build-card-scan-map.mjs`, `apps/frontend/src/lib/scan/resolveScanCandidates.ts` | C |
| Scan-map artifact | `apps/frontend/public/data/cardScanMap.json` | C |
| Camera + detector | `apps/frontend/src/lib/scan/detector.ts`, `apps/frontend/src/components/ScanCameraSurface.tsx` | D |
| Scan UX in picker | `apps/frontend/src/components/{ZoneCardPicker,ZoneCollectionStep}.tsx` | E |

## Key decisions

- **DEC-050** — scanning is optional, frontend-only, alternate input (reframes the prior
  "camera scanning out of scope" non-goal).
- **DEC-051** — parity by construction: one TS hash recipe used for both on-device hashing
  and TheJudge's own `cardhashes.bin` build; TheJudge owns/refreshes the library.
- **DEC-052** — capture & batch UX: continuous auto-scan + manual tap fallback; accept →
  re-scan loop; card-back flip prompt; non-blocking low-confidence escalation; exit.
- **DEC-053** — identity bridge: printing id → oracle_id → existing `CardMetadataItem`;
  ranked candidates (art-only ambiguity); dedupe by best distance.

## Requirements

- **REQ-034** — on-device identification core (parity-critical), golden-vector tested.
- **REQ-035** — TheJudge-owned fingerprint library build + lazy load.
- **REQ-036** — scan → `CardMetadataItem` resolver bridge.
- **REQ-037** — camera capture & detector (outcome-validated tuning).
- **REQ-038** — scan UX wired into `ZoneCardPicker` (batch loop, unhappy paths).
- **NFR-010** — scanning performance & footprint budgets.

## Build phasing (map-out formalizes slices)

1. Identification core (REQ-034) — no camera/network.
2. Library build + resolver (REQ-035, REQ-036).
3. Camera + detector (REQ-037).
4. Full scan UX in the picker (REQ-038, DEC-052; NFR-010 measured).

## PRD sections updated (by refinement)

- `sections/decisions.md` — DEC-050..DEC-053
- `sections/functional-requirements.md` — REQ-034..REQ-038
- `sections/non-functional-requirements.md` — NFR-010 (new); NFR-008 (clarified)
- `sections/goals-and-non-goals.md` — camera scanning reframed from non-goal
- `sections/integrations-and-data.md` — Card Scanning Data Strategy
- `sections/user-flows.md` — FLOW-006
- `sections/system-map.md` — "Card scanning" subsystem (planned)

## Source

- `IDEA.md` — original idea capture
- `DESIGN-BRIEF.md` — scoped decisions, requirements, non-goals (authoritative)
- `SOURCE-ANALYSIS.md` — durable algorithm/contract reference from the friend's Cardomancer
  handoff (constants, pipeline mechanics, parity gotchas, DB format). Product/ownership
  prose there is superseded by `DESIGN-BRIEF.md`.
- Friend's handoff package: `/Users/chrismiho/Coding/Projects/cardomancer-card-detection`
  (`SPEC.md`, `AGENT_HANDOFF.md`, `reference/`, `ts_scaffold/`, `testdata/vectors/`).
