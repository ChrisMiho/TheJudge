status: refined

# cardomancer-card-detection

Optional on-device camera card scanner as an **alternate input path** into existing zone
card fields — alongside (never replacing) manual search. Ports the friend's proven
Cardomancer art-perceptual-hash engine into TypeScript, builds and owns its own fingerprint
library from the existing Scryfall pipeline, and adds a camera batch-scan UX inside
`ZoneCardPicker`. Frontend-only, zero network calls at scan time, no backend/API/prompt
change.

## Status

Refined and ready for `thejudge-quality-check`. Decisions and requirements are promoted to
the `sections/` truth layer; the `system-map.md` entry is `planned` until code ships.

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
