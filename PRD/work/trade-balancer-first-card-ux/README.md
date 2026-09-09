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
`## Product-truth changes proposed` — 104 matched `PRD/sections/` lines, 37
amended, 50 not contradicted and 17 off-topic); `GATE-QUESTIONS.md` carries the twelve
proposed `PRD/sections/` amendments awaiting the owner's verdicts. No new stable
IDs are reserved.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: FAIL (attempt 5, the build half's re-grade after the owner's two `edit` verdicts; attempt 4 PASSed the pre-edit proposal, attempts 1–3 FAILed on unamended fetch-timing sentences since closed)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings:
  1. `DESIGN-BRIEF.md` section "Foil mode follows the printing" (around lines 99–111; line 106 reads `otherwise → keep the entry's current toggle (a new entry starts off)`) still states the pre-edit foil rule. The owner's accepted edits on the `REQ-065` and `PRD/sections/trade-balancer/README.md` blocks in `GATE-QUESTIONS.md` say the foil mode is re-derived from the new printing's prices every time an entry receives a printing — non-foil when the printing has a `usd` price, foil only when `usd` is null and `usd_foil` is not — with no clause keeping the entry's current mode. Map-out reads the brief, so slice B would implement the superseded behaviour.
  2. Assumption A6 in `DESIGN-BRIEF.md` (line 153: foil auto-select never overrides a toggle the player already moved; only the initial mode for a printing changes) is false under the accepted rule — a printing change re-derives the mode and can override a toggled mode. The row needs rewriting to match the accepted rule, with its rung and evidence reconsidered.
  Verified on this attempt: both edited blocks state the owner's rule and agree with each other; 2 hunks' removed lines spot-checked verbatim against live `PRD/sections/` (`functional-requirements.md:1482-1491`, `trade-balancer/README.md:59-68`); 12/12 blocks carry the three plain-language lines and a complete diff; 10 of 11 assumptions evidence-backed (A6 is the exception above); slice sketch A–E map-out-ready apart from slice B inheriting the stale rule; the three named constraints cite concrete test files. The amendment-set completeness grep was not re-run (attempt 4 passed it and the set is unchanged).
