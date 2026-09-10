status: refined

# trade-balancer-first-card-ux

Trade Balancer: pick the printing before adding, auto-select foil mode,
scrollable printing picker, and wake the API on open so the first card
prices fast.

See `IDEA.md` for problem/outcome/non-goals and prior-run matches, and
`intake/GRAPH-BRIEF.md` for the full measured brief handed off by
`/graph-kickoff` (evidence, converged design direction, PRD sections to
amend, slice sketch). The intake brief is a verbatim record that predates
the gate: where it disagrees with `GATE-QUESTIONS.md` or `DESIGN-BRIEF.md`,
those win. In particular its foil rule (decision 4, keep the player's current
toggle otherwise) and its `defaultFoilFor(printing, currentFoil)` helper
signature are superseded by the owner's gate verdicts — the foil mode is
re-derived from the printing's prices every time an entry receives a printing
(non-foil when `usd` exists, foil only when `usd` is null and `usd_foil` is
not), and the current toggle is never carried over; see the brief's
`### Foil mode follows the printing`.

`DESIGN-BRIEF.md` is the design record (scope, code verification, assumptions,
slice sketch, and the line-level disposition table under
`## Product-truth changes proposed` — 104 matched `PRD/sections/` lines, 37
amended, 50 not contradicted and 17 off-topic); `GATE-QUESTIONS.md` carries the twelve
proposed `PRD/sections/` amendments awaiting the owner's verdicts. No new stable
IDs are reserved.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (attempt 7, the build half's re-grade of the finalized proposal; attempts 5 and 6 FAILed on stale foil-rule text left behind by the owner's gate edit — in the brief, then in the pointer to the verbatim intake — each resolved by the owner; attempt 4 PASSed the pre-edit proposal; attempts 1–3 FAILed on unamended fetch-timing sentences since closed)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings: none
  Verified: README pointer carries the supersession note; no sentence outside the verbatim `intake/GRAPH-BRIEF.md` describes keeping the entry's current foil mode — the brief's foil section, A6, and slice B state the re-derive-every-time rule; intake untouched since kickoff commit `14f9dfb`; 56 removed diff lines across the 12 `GATE-QUESTIONS.md` blocks verbatim against live `PRD/sections/`, 0 mismatches; `git diff origin/main -- PRD/sections/` empty; 12/12 blocks carry the three plain-language lines, a complete diff, and a filled verdict (10 accept, 2 edit, matching `## Gate verdicts`); 11/11 assumptions evidence-backed (A6 cites the owner's verdict); slice sketch A–E names concrete files and test expectations; the three named constraints cite `TradeBalancer.scan.test.tsx`, the `buildPriceEntry` field set, and `scripts/lambda-package-budget.test.mjs`; amendment-set grep re-run: 41 hits, unchanged from attempt 4.
