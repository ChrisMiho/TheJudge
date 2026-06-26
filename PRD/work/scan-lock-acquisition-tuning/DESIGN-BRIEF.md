# DESIGN-BRIEF: scan-lock-acquisition-tuning

## Goal

Make scanner acquisition understandable and tunable: the scanner should get from live camera frame to first reliable identity vote with less hunting on the built-in Mac webcam, while preserving the expectation that a stand-assisted setup should be fast and highly consistent. This work follows the owner retest after the `3/13` stabilizer tuning: acquisition was still difficult, but once the card identified, lock happened quickly.

## Scope

This refinement adds a diagnostic-first acquisition pass, not another blind threshold change. The next implementation should instrument the capture -> detector -> frame selector -> identify -> stabilizer-vote path so each failed or slow acquisition can be attributed to a concrete stage.

Validation uses two capture conditions:

1. **Mac-webcam baseline:** built-in webcam, hand-held or lightly supported card, normal room lighting, card reasonably filling the guide. This is the minimum usability bar: usable without repeated distance/lighting hunting.
2. **Stand-assisted controlled setup:** fixed card/camera geometry, flat contrasting surface, stable lighting. This is the ideal bar: fast and highly consistent. If unavailable during implementation, record it as pending validation rather than treating Mac-only evidence as the ideal pass.

These are validation conditions only. The product keeps one scanner behavior path and one scan flow.

## Decisions

- **DEC-077** (`PRD/sections/decisions/scanning.md`) — scanner acquisition tuning is diagnostic-first and validated against Mac-webcam baseline plus stand-assisted controlled setup, while preserving one scanner behavior path and the frozen matching/lock precision boundary.

## Requirements / Flows

- **REQ-057** — scanner acquisition diagnostics and validation matrix.
- **FLOW-006** — edge case added: acquisition validation uses the Mac-webcam baseline and stand-assisted controlled setup as QA/diagnostic conditions, not separate user modes.
- **System map** — planned subsystem entry: Scan acquisition diagnostics.

## Diagnostic Data To Capture

- native capture resolution and relevant camera track settings where available
- detector success/failure, corners, and geometry
- frame-quality score and reason
- whether frame selection used the current frame or a retained prior frame
- best and runner-up identity names/distances, plus margin
- stabilizer votes accumulated/needed
- concrete vote/no-vote reason: detector miss, quality abstain, unresolved candidate, distance above `lockDistance`, margin below `marginMin`, or accepted vote

## Candidate Experiments After Diagnostics

- fix/verify continuous `focusMode` request support in `getUserMedia`
- temporarily simplify frame selection to current-frame-only to test whether the selector is choosing bad retained warps
- add adaptive higher detector-resolution retry after a low-confidence 640px pass, rather than always raising detector cost
- clean up positive/negative cue precedence so "good - hold steady" does not hide behind stale blur/condition signals when identity is actually close to voting

## Non-goals / Frozen Boundaries

- No product-facing scanner modes and no scan-stand hardware dependency for normal use.
- No change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, or backend endpoints.
- No scan-time network calls.
- No change to `recipe.ts`, the `CARDHSH1` bin format, `cardhashes.bin`, scan map artifacts, or `identify.ts`.
- Do not loosen `lockDistance` or `marginMin` as an acquisition shortcut without diagnostic evidence and a separate confirmed decision.
- No fingerprint rebuild or Region A recipe change in this package.

## Validation

- Mac-webcam baseline: owner/device evidence records whether a DB-registered card reaches a first reliable vote and lock without repeated hunting; if not, the blocking stage is identified from diagnostics.
- Stand-assisted setup: when available, the same scanner path is tested with the 3D-printed stand or equivalent fixed geometry; expected outcome is quick, consistent acquisition/lock.
- Automated coverage: focused tests for diagnostic fields/view-model behavior and any reversible experiment introduced by implementation.
