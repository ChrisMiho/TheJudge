---
status: active
---

# scan-detector-foil-robustness

Make the card-scan detector reliably lock the card outline for ornate / etched-foil / full-art printings (e.g. Japanese Strixhaven Mystical Archive `Akroma's Will`), which currently fail at `detectCard()` before matching ever runs.

See [IDEA.md](IDEA.md) for problem, outcome, and non-goals.

## Origin

Escalated from `scan-robustness-tuning` (now closed out) after owner on-device validation showed the failure is a detector shape-lock problem, not a corpus gap — reproduced on both the Japanese foil card and a plain non-Japanese English card, so it is a general detector-robustness issue. Full root-cause evidence: `PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md`.

## Refinement result

- Product truth is now shaped in `DESIGN-BRIEF.md`, `DEC-072`, `REQ-050`, `REQ-051`, and `FLOW-006`.
- The prior frame-export dependency is resolved in scope: while the opt-in debug overlay is enabled, the existing scan **Capture** button additionally exports the exact raw camera frame for detector tuning (REQ-051).

## Implementation map

- `GAMEPLAN.md` defines the detector-boundary architecture, data flow, frozen boundaries, and verification checklist.
- Slices are implementation-ready and intentionally keep evidence capture, fixture tooling, detector recall, UI feedback, and ship evidence separated.
- A, B, and D are parallel-ready; Slice C is sequential after B so detector tuning has a reproducible outcome bar; Slice E aggregates A–D for ship evidence.

## Slice table

| Slice | File | Objective | Dependencies | Status |
| --- | --- | --- | --- | --- |
| A | `slice-a-debug-gated-frame-export.md` | Reuse existing Capture to export the raw frame only while Debug is enabled. | None | planned |
| B | `slice-b-detector-fixture-corpus.md` | Add committed detector fixtures, provenance, deterministic generation/loading, and eval baseline. | None | planned |
| C | `slice-c-detector-recall-tuning.md` | Raise `detectCard()` recall via detector-only tuning, stronger edge sourcing, and fallback detection. | B | planned |
| D | `slice-d-no-card-nudge.md` | Show a persistent detector-failure nudge through the existing searching-state path. | None | planned |
| E | `slice-e-evidence-and-ship-gates.md` | Record outcome evidence, verify frozen boundaries, and prepare cleanup promotion. | A, B, C, D | planned |
