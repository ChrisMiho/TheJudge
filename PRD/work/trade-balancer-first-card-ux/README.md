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
slice sketch); `GATE-QUESTIONS.md` carries the twelve proposed `PRD/sections/`
amendments awaiting the owner's verdicts. No new stable IDs are reserved.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/trade-balancer-first-card-ux

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings:
  1. `PRD/sections/overview.md:43` ("Prices come from a read-only backend fetch … made only when a card is added") is a live assertion about the balancer's backend traffic that the 10-block amendment set in `GATE-QUESTIONS.md` does not cover; it is contradicted by the proposed REQ-064 warm-up ping and the REQ-065/FLOW-025 fetch-on-suggestion-tap change. No `overview.md` block exists in `GATE-QUESTIONS.md`. Everything else checked out: all 10 diffs' removed lines match current `PRD/sections/` text verbatim, every block carries the three plain-language lines and a full diff, assumptions A1–A11 are evidence-cited, the slice sketch is map-out-ready, and the named constraints are each backed by a test.
