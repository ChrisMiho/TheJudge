---
status: refined
---

# scan-detector-foil-robustness

Make the card-scan detector reliably lock the card outline for ornate / etched-foil / full-art printings (e.g. Japanese Strixhaven Mystical Archive `Akroma's Will`), which currently fail at `detectCard()` before matching ever runs.

See [IDEA.md](IDEA.md) for problem, outcome, and non-goals.

## Origin

Escalated from `scan-robustness-tuning` (now closed out) after owner on-device validation showed the failure is a detector shape-lock problem, not a corpus gap — reproduced on both the Japanese foil card and a plain non-Japanese English card, so it is a general detector-robustness issue. Full root-cause evidence: `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md`.

## Open dependency before shaping

- A real failing frame is needed for evidence-based detector tuning. `ScanCameraSurface` has no raw-frame export today, so either the owner supplies a photo of the failing scan, or a debug "export current frame" affordance is added under the existing DEC-060 / REQ-041 debug overlay first.
