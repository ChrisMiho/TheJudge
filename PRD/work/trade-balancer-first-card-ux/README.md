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

- Quality-check: FAIL (attempt 6, the build half's re-grade after the owner fixed the brief; attempt 5 FAILed on the brief's own stale foil passages, since fixed; attempt 4 PASSed the pre-edit proposal; attempts 1–3 FAILed on unamended fetch-timing sentences since closed)
- Checked artifact: `PRD/work/trade-balancer-first-card-ux/DESIGN-BRIEF.md`
- Findings:
  1. `intake/GRAPH-BRIEF.md` — the kickoff intake document, copied verbatim — still states the pre-edit foil rule at decision 4 (line 32: keep the player's current toggle otherwise) and names a `defaultFoilFor(printing, currentFoil)` helper signature at line 41 that carries a current toggle forward. The owner's accepted rule (REQ-065 and trade-balancer README blocks in `GATE-QUESTIONS.md`; `DESIGN-BRIEF.md` foil section and A6) re-derives the mode from the printing's prices every time and never carries the current toggle. This README's pointer sentence sends readers, including map-out, to the intake file for converged design direction and the slice sketch, so the stale rule can still reach a slice.
  Verified on this attempt: `DESIGN-BRIEF.md` foil section, A6, and slice B agree with the accepted rule (no keep-current language); 56 removed diff lines across all 12 blocks verbatim against live `PRD/sections/`, 0 mismatches; `git diff origin/main -- PRD/sections/` empty; 12/12 blocks carry the three plain-language lines, a complete diff, and a filled verdict (10 accept, 2 edit); 11/11 assumptions evidence-backed; slice sketch A–E map-out-ready; the three named constraints cite concrete test files; screen-layout block consistent with DEC-149/REQ-126.
