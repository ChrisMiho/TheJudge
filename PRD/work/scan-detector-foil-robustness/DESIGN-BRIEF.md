# DESIGN-BRIEF: scan-detector-foil-robustness

## Goal

Make the card-scan **detector** (`apps/frontend/src/lib/scan/detector.ts` `detectCard`) reliably find and lock the 4-corner card outline under hard real-world conditions, so cards that currently fail at `detectCard()` (returning `null` → status `no-card`) reach the existing, unchanged warp → Region A crop → fingerprint match → stabilizer lock pipeline. This is purely a card-finding fix upstream of matching — the corpus already contains the failing cards (`included` + `fingerprinted`).

## Root cause (carried from receipt)

`scan-robustness-tuning` (closed) traced two reported failures to a detector shape-lock problem, reproduced on two physically different cards:
- ornate / etched-foil full-art Japanese Strixhaven Mystical Archive `Akroma's Will` (`soa/66`)
- a plain non-Japanese English card held centered (2026-06-25)

So the failure is **language- and corpus-agnostic** — general detector robustness, not foil-specific (despite the slug). Likely mechanisms: foil reflections inject spurious internal edges failing `SOLIDITY_MIN 0.65`/`RECTANGULARITY_MIN 0.7`; low outer-border contrast against the play surface makes Canny (`CANNY_LO/HI 30/90`) miss the boundary; no 4-corner contour passes the gates. Full evidence: `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md`.

## Key design pivot

A detected quad **never auto-adds** a card — the temporal stabilizer's distance+margin vote (`lockDistance 78`/`marginMin 14`, DEC-059) is the precision guard. So detector **recall** can be raised aggressively without risking wrong auto-adds; over-detection costs at most a wasted frame. Owner-directed posture: **loosen first, tighten if it gets too loose.**

## Scope (broad — owner directed "as large as it needs to be")

In `detector.ts` (and `tuning.ts` where a constant belongs there):
1. **Calibration** — loosen/adapt the existing gates against the fixture corpus: `CANNY_LO/HI`, `SOLIDITY_MIN`, `RECTANGULARITY_MIN`, `ASPECT_TOLERANCE`, `MIN/MAX_AREA_FRAC`, morphology iterations.
2. **Foil/glare-tolerant edge sourcing** — strengthen the multi-channel edge combination so speculars and internal foil edges don't starve the outer-border contour.
3. **Low-contrast-border fallback path** — a secondary detection assist (e.g. adaptive thresholding) that runs **only when the primary pipeline finds nothing**, for cards whose border barely contrasts the table.
4. **Frame-export + fixture corpus** (evidence tooling, REQ-051) — see below.
5. **Condition-aware "can't find a card" feedback** — a persistent `no-card` surfaces a user nudge (reusing the DEC-057/DEC-062 searching-state feedback path) instead of silent failure.

### Evidence basis

The detector is tuned against a **diverse committed fixture corpus**, not one device's frame (every camera differs):
- **Backbone:** synthetic degradation of the already-committed clean Scryfall art (glare/specular, low-contrast border vs. surface, perspective skew, foil-like highlights) — owned, license-clean, deterministic, parameterizable, spans many "cameras" on purpose.
- **Realism layer:** downloaded real-world card-on-table photos (human-approval network posture; prefer clearly-usable/owned sources).
- **Owner device:** an optional raw-frame export. **Reuses the existing scan Capture button** — while the opt-in debug overlay (DEC-060/REQ-041) is enabled, Capture additionally saves/downloads the exact frame it grabbed. Overlay off (default) → Capture is unchanged, no new control (DEC-065 no-clutter intent).

## Decisions

- **DEC-072** (new, `decisions/scanning.md`) — detection-side robustness via raised `detector.ts` recall, stabilizer lock gate as the precision guard, validated against the fixture corpus + debug-gated frame export; Region A recipe + `CARDHSH1` bin frozen with escalation-if-needed. Refines DEC-052/DEC-055; complements DEC-062 (query-only) and DEC-069 (corpus); supersedes none.
- Builds on: DEC-052/DEC-055 (detect→warp stage), DEC-059 (lock gate it must not touch), DEC-058 (one-tap removal safety net), DEC-060/DEC-065 (debug overlay it reuses), DEC-062/DEC-069 (downstream levers it complements).

## Requirements

- **REQ-050** (new) — detector robustness for hard real-world captures (the five levers + outcome validation).
- **REQ-051** (new) — detector fixture corpus + debug-gated Capture-button raw-frame export.
- Existing referenced: REQ-037 (camera capture/detector), REQ-041 (debug overlay, reused), NFR-010 (scan perf/footprint).

## Flows

- **FLOW-006** (Scan cards into a zone) — two edge cases added: hard-capture detector recall + condition-aware no-card nudge (DEC-072); debug-gated Capture frame export (DEC-072/DEC-065). No new FLOW.

## Non-goals / frozen boundaries

- No change to Region A recipe geometry (`recipe.ts` `cropRegionA`/`phashRegionPacked`) or the `CARDHSH1` bin format — these force a full DB re-download/re-hash; a fix that genuinely needs them is **flagged-and-recorded as a separate escalation, never folded in** (DEC-069 precedent).
- No change to `identify.ts` distance/orientation, the stabilizer lock/identity gate (`lockDistance`/`marginMin`, DEC-059), or DEC-051/REQ-034 byte-exact pHash + DB-load parity.
- No OCR/text recognition. No corpus rebuild (cards are already fingerprinted).
- Scanning stays frontend-only, zero network calls at scan time; no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or any product-facing endpoint.
- Do not loosen the identity gate as a detection lever; detection recall and identity precision are separate.

## Validation

Outcome-based (DEC-052/DEC-055/DEC-059 precedent): before/after **detect-then-lock rate** across the committed fixture corpus and on-device, with the previously-failing cards now reaching lock, and **no new false auto-adds**. Detector gate/threshold and fixture-degradation values are calibration constants, not product open questions.

## Open questions

None blocking. Fixture-image licensing is handled by preferring synthetic-degraded owned art + owner captures and only committing clearly-usable downloads — a constraint in REQ-051, not an open question.
