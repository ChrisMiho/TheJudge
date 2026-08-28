# Idea

**Problem:** The In-Depth destination has no consolidated current-state spec.
Its decision, requirement, and flow sources are scattered across
`PRD/sections/`, unlike the six other Phase A destinations (Player Life
Tracker, Feedback & Bug Report, Trade Balancer, Card Scanning, Quick Lookup,
shared chrome), which already have a derived, non-authoritative DEC-168
current-state spec at `PRD/sections/<feature>/README.md`. In-Depth is the
largest and most entangled of the seven — it is the primary MTG Assistant
loop (staged zone flow + Ask AI) — so its absence is the last gap in the
docs-refactor gameplan's Phase A.

**Outcome:** A draft, non-authoritative current-state feature spec for
In-Depth lands at `PRD/sections/in-depth/README.md`, built on the DEC-168
template the six earlier specs established, consolidating In-Depth's cited
decision/requirement/flow sources into one view without changing any
authoritative source or shipped behavior.

**Non-goals:** This package does not change In-Depth product behavior, does
not edit or supersede any DEC/REQ/FLOW body, does not resolve any open
question, and does not decide scope for the docs-refactor gameplan beyond
this one spec. Every product decision the intake raises is made with the
owner at the define gate, not inferred here.

## Prior run

- `PRD/instructions/receipts/life-tracker-spec-2026-08-25.md`
- `PRD/instructions/receipts/user-feedback-spec-2026-08-25.md`
- `PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md`
- `PRD/instructions/receipts/scan-spec-2026-08-26.md`
- `PRD/instructions/receipts/quick-lookup-spec-2026-08-27.md`
- `PRD/instructions/receipts/shared-chrome-spec-2026-08-27.md`
