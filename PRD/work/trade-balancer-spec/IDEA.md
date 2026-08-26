# Idea — trade-balancer-spec

Product truth for the Trade Balancer feature is scattered across
`PRD/sections/decisions/trade-balancer.md` (DEC-087, DEC-088), REQ-064–066,
REQ-145, NFR-013, FLOW-009, plus the `system-map.md` and `screen-layout.md`
entries, so reading current behavior means walking a decision log rather than
reading one page. This package writes the current-state feature spec at
`PRD/sections/trade-balancer/README.md`, on the DEC-168 template established
by `sections/life-tracker/README.md` and `sections/user-feedback/README.md`,
so an agent or the owner can read what the feature does today in one place.
Unlike the first two Phase A specs, this feature carries a **corpus**: the
committed printing-level price artifact
`apps/frontend/public/data/cardPrintingPrices.json`. The gameplan's `data/`
bucket membership test (external upstream source, a build/refresh command, a
committed artifact, and it describes Magic, not TheJudge) holds on all four
counts for that artifact, so the later authoring step must split the corpus
out of the behavior doc rather than describing it inline. This package
consolidates current behavior and identifies backing sources only — it does
not change or re-decide any product behavior. The spec is written draft and
non-authoritative: `decisions.md` stays precedence #1 and Read-First #1, and
any conflict between the new spec and a cited `DEC`/`REQ`/`FLOW` is resolved
in the spec's favor by correcting the spec, not the source. Out of scope:
deciding new trade-balancer behavior, editing
`PRD/sections/decisions/trade-balancer.md` or any other decision body, and
touching `apps/` code — this is Phase A #3 of the docs-refactor gameplan
(`PRD/work/adhoc/refactor-gameplan.md`, `PRD/work/adhoc/PROGRESS.md`), the
same pattern Phase A #1 (`life-tracker`) and #2 (`user-feedback`) already
established.

## Prior run

- `PRD/instructions/receipts/card-trade-balancer-2026-08-03.md` — shipped the
  Trade Balancer feature itself (DEC-087/088, price-artifact build script,
  `TradeBalancer.tsx` and friends, `trade-balancer` destination). This is the
  behavior this spec consolidates, not a spec-writing precedent.

## Non-goals

- No new or changed trade-balancer behavior — DEC-087/088 are not touched.
- No edits to `PRD/sections/decisions/trade-balancer.md`,
  `functional-requirements.md`, `user-flows.md`, `non-functional-requirements.md`,
  or any other existing DEC/REQ/FLOW body.
- No GAMEPLAN, slice docs, or DESIGN-BRIEF from this shape step — those come
  from `thejudge-refinement` and `thejudge-map-out`.
- No `apps/` code change; this is a documentation-only package.
- No decision here about how exactly the corpus/behavior split is
  structured (e.g. a `data/` subfile vs. a dedicated section) — that is
  authored at refinement, this package only identifies that a split is
  required and why.
