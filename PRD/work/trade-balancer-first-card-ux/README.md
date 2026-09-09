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

- Quality-check: PASS (attempt 4; attempts 1–3 FAILed on unamended fetch-timing sentences at `overview.md:43`, `cardPrintingPrices.md:126-127`, `integrations-and-data.md:154`, and `functional-requirements.md:4052`, each closed by the following refinement attempt)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings: none
  Verified: the brief's quoted narrow grep returns 41 hits, all 41 in the disposition table; 56 removed diff lines across the 12 `GATE-QUESTIONS.md` hunks match live `PRD/sections/` text verbatim, 0 mismatches; an independent broader grep found no on-topic balancer fetch-timing, default-printing, foil-default, picker, or backend-traffic assertion missing from the table; `functional-requirements.md:4052` and `:4056` fall inside the REQ-065 and REQ-064 hunks, `:1437` supports its not-contradicted row; table arithmetic 37 + 50 + 17 = 104 holds; all 12 blocks carry the three plain-language lines, a complete diff, and Verdict/Reason slots; 5 code-verification claims spot-checked against worktree source match; slice sketch A–E is map-out-ready; the named constraints are testable. Non-blocking note: the row labelled `trade-balancer/README.md:116-118` sits at file line 119 (label drift; hunk text matches).
