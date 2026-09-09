status: refined

# trade-balancer-first-card-ux

Trade Balancer: pick the printing before adding, auto-select foil mode,
scrollable printing picker, and wake the API on open so the first card
prices fast.

See `IDEA.md` for problem/outcome/non-goals and prior-run matches, and
`intake/GRAPH-BRIEF.md` for the full measured brief handed off by
`/graph-kickoff` (evidence, converged design direction, PRD sections to
amend, slice sketch).

`DESIGN-BRIEF.md` is the design record (scope, code verification, assumptions,
slice sketch, and the line-level disposition table under
`## Product-truth changes proposed` — 79 matched `PRD/sections/` lines, 35
amended and 44 not contradicted); `GATE-QUESTIONS.md` carries the twelve
proposed `PRD/sections/` amendments awaiting the owner's verdicts. No new stable
IDs are reserved.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/trade-balancer-first-card-ux

## Preparation gate

- Quality-check: FAIL (attempt 2; attempt 1's `overview.md:43` finding is closed)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings:
  1. `PRD/sections/trade-balancer/data/cardPrintingPrices.md:126-127` — the "Runtime posture" section still says a card's printings and prices are fetched only when that card is added to a side, cached per session (FLOW-025). The proposed REQ-065/FLOW-025 manual-search fetch (on suggestion tap, before add) contradicts this. The file's existing `GATE-QUESTIONS.md` block touches only the "Artifact shape" printing-order bullet, never this line.
  2. `PRD/sections/integrations-and-data.md:154` — the price endpoint's Purpose bullet still says it backs the Trade Balancer's **on-add** fetch, cached per session (FLOW-025). The file's existing block touches a neighbouring bullet plus the health-check and Data Strategy sections, never this line.
  Both are the failure mode attempt 1 caught on `overview.md:43`: a live backend-traffic-timing sentence the twelve blocks leave contradicted. Refinement's re-enumeration grep re-checked only the seven files with no block; it did not re-check every matching line inside the ten files that already had one.
  Verified clean: all twelve blocks' removed lines match current `PRD/sections/` text verbatim; the brief's not-contradicted calls for `goals-and-non-goals.md`, `scan/README.md`, `shared-chrome/README.md` hold; every block carries the three plain-language lines and a full diff; assumptions A1–A11 are evidence-cited; the slice sketch is map-out-ready; the named constraints each map to a test.
