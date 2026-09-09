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

- Quality-check: FAIL (attempt 3; attempts 1–2's findings on `overview.md:43`, `cardPrintingPrices.md:126-127`, `integrations-and-data.md:154` are closed)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings:
  1. `PRD/sections/functional-requirements.md:4052` is a live, unamended fetch-timing sentence: the price companion is loaded at startup with no runtime network call, and the balancer fetches one card's prices **on add** and caches per session (FLOW-025). REQ-065, FLOW-009, and FLOW-025's proposed diffs move the manual-search fetch to the suggestion tap, before the add, so this sentence is contradicted. No `GATE-QUESTIONS.md` block's diff touches it. Same failure mode as attempts 1 and 2.
  2. The line-level disposition table's row for `functional-requirements.md:4051-4052` says not contradicted because the request and response shapes are unchanged. That reason addresses line 4051 (response shape) only; it never engages with line 4052's on-add timing claim.
  3. The enumeration's completeness claim (every hit in all 14 files is a row below) is false: the topic grep restricted to those 14 files returns 343 hits against 79 table rows. Most of the gap is generic-word noise in unrelated passages, but `functional-requirements.md:4052` is a genuine on-topic miss, and `functional-requirements.md:1437` (REQ-063's own non-goal — no backend health/status endpoint or runtime provider-mode fetch — cited by assumption A8 and directly relevant to the REQ-064 warm-up block) is absent from the table. The checker judged 1437 not substantively contradicted (REQ-063 scopes it to the mock-mode banner's own signal), but its omission shows the claim was not verified.
  Verified clean: every hunk's removed lines match current `PRD/sections/` text verbatim across 9 files, 0 mismatches; 8 spot-checked not-contradicted rows hold; REQ-063/A8 reasoning holds on substance; all 12 blocks carry the three plain-language lines and a full diff; slice sketch A–E is map-out-ready; the named constraints are testable.
