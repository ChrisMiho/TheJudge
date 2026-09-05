# Slice A — INV-ENDPOINT: one canonical home for "one main product-facing endpoint"

## Status: done

## Goal

The rule "the core product exposes exactly one main product-facing backend
endpoint (`POST /api/ask-ai`), plus the single read-only card-detail
carve-out (`GET /api/cards/:oracleId`, REQ-175)" currently has an independent
copy in a dozen places across five files, two of which cite a **retired**
decision (DEC-010) as if it were the live rule. This slice makes NFR-004 the
one place that carries the full rule text, the carve-out, and the list of
every place it echoes; every other home becomes a short pointer.

## Requirements

1. Apply the accepted `INV-ENDPOINT` diff from
   `PRD/work/single-source-invariants/GATE-QUESTIONS.md` in full: rewrite
   NFR-004's constraint in `PRD/sections/non-functional-requirements.md` to
   carry the canonical rule text, the REQ-175 carve-out, and the echoed-in
   list (REQ-012, REQ-072, REQ-094, REQ-175, `goals-and-non-goals.md`,
   `overview.md`, `PRD/instructions/technical-design-rules.md`,
   `PRD/sections/quick-lookup/README.md`, `PRD/sections/in-depth/README.md`,
   `PRD/sections/integrations-and-data.md`, `PRD/README.md`), plus the
   retired DEC-010 index note.
2. Update every pointer home listed in the proposal's diff to keep its
   existing context line and append `canonical: NFR-004` (or the equivalent
   phrasing shown in the diff) instead of restating the rule:
   `PRD/sections/functional-requirements.md` (REQ-012 ~175, REQ-072 ~1677,
   REQ-094 ~2195, REQ-175 Description ~4020 and Constraints ~4031),
   `PRD/sections/goals-and-non-goals.md` (~39, ~75),
   `PRD/sections/overview.md` (~56), `PRD/README.md` (~145),
   `PRD/instructions/technical-design-rules.md` (~12, ~36),
   `PRD/sections/quick-lookup/README.md` (~158),
   `PRD/sections/in-depth/README.md` (~277-278),
   `PRD/sections/integrations-and-data.md` (~151, ~246).
3. The two pointers that currently cite retired DEC-010 as the live rule
   (`quick-lookup/README.md:158`, `in-depth/README.md:278`) must repoint to
   `canonical rule: NFR-004` and drop the DEC-010-as-live-rule phrasing,
   per the CLASS A scope test in `DESIGN-BRIEF.md`.
4. Do not edit the out-of-scope lines: the ~25 per-feature
   "no change to ... any product-facing endpoint" scope clauses; the bare
   DEC-010 traceability/Backed-by lines (`system-map.md:125,132,153`,
   `non-functional-requirements.md:99`, `in-depth/README.md:10,281`);
   `user-feedback/README.md:123` (closed-door rationale); the retired
   `decisions.md:51` DEC-010 index row.
5. Locate each edit by the quoted current text in the proposal's diff, not by
   trusting the line numbers (last verified 2026-09-04) — re-grep first if a
   quoted line has moved.

## Acceptance criteria

- [ ] A1 — `non-functional-requirements.md` NFR-004 carries the full canonical
      rule text (the answer endpoint, the REQ-175 carve-out) and an explicit
      echoed-in list naming all ten other homes, plus the retired-DEC-010 note
- [ ] A2 — `functional-requirements.md` REQ-012 constraint (~175) keeps its
      text and appends the NFR-004 pointer
- [ ] A3 — `functional-requirements.md` REQ-072 constraint (~1677) repoints
      away from citing DEC-010 as the live rule, to `canonical rule: NFR-004`
- [ ] A4 — `functional-requirements.md` REQ-094 constraint (~2195) carries
      the dual pointer (`one-endpoint rule canonical: NFR-004; rules-engine
      rule canonical: goals-and-non-goals.md Scope Notes`) — Slice C verifies
      this line, does not re-edit it
- [ ] A5 — `functional-requirements.md` REQ-175 Description (~4020) and
      Constraints (~4031) replace the frozen enumerated amendment list with
      the NFR-004 pointer
- [ ] A6 — `goals-and-non-goals.md` Shipped capabilities (~39) and Explicit
      Non-Goals (~75) each append the NFR-004 pointer
- [ ] A7 — `overview.md` Key Constraints (~56) appends the NFR-004 pointer
- [ ] A8 — `PRD/README.md` Implementation Snapshot (~145) appends the
      NFR-004 pointer
- [ ] A9 — `PRD/instructions/technical-design-rules.md` Allowed (~12) and
      Forbidden (~36) each append the NFR-004 pointer
- [ ] A10 — `PRD/sections/quick-lookup/README.md` (~158) repoints away from
      citing DEC-010 as the live rule, to `canonical rule: NFR-004`
- [ ] A11 — `PRD/sections/in-depth/README.md` (~277-278) repoints away from
      citing DEC-010 as the live rule, to `canonical rule: NFR-004`
- [ ] A12 — `PRD/sections/integrations-and-data.md` (~151, ~246) replace the
      frozen enumerated amendment list with the NFR-004 pointer
- [x] A13 — re-grep the endpoint pattern family and `grep -rniE 'DEC-010'`
      across `PRD/` and root `README.md`; every returned rule-stating line is
      NFR-004 or a listed pointer above; the out-of-scope traceability/
      Backed-by lines and `user-feedback/README.md:123` are unchanged; no
      unlisted rule-stating home remains (manual check — no test command
      applies to this docs-only slice)

### Re-grep observation: 2026-09-04 A13 — endpoint + DEC-010 families

Re-ran both patterns from the Verification block after all A1–A12 edits
landed. Endpoint-family grep: every non-canonical hit is either the new
NFR-004 canonical text itself, a pointer already edited above, a `POST
/api/ask-ai` mention inside a user-flow step or endpoint definition (not a
rule assertion), a per-feature "no change to ... any product-facing
endpoint" scope clause (`scan/data/cardScanMap.md:86`,
`trade-balancer/README.md:103`, `trade-balancer/data/cardPrintingPrices.md:109`),
or a retired `decisions.md` index row. `DEC-010` grep: remaining hits are the
new "Retired index row: DEC-010" note and the pre-existing NFR-004
Backed-by list, `system-map.md:125,132,153` Backed-by lists, `in-depth/README.md:10,281`
Backed-by/traceability lines, `user-feedback/README.md:123` closed-door
rationale, and the `decisions.md:51` retired index row itself — all confirmed
unchanged. No unlisted rule-stating home remains.

## Verification

```bash
grep -rniE '(one|single) (main )?product-facing (backend )?(endpoint|route)|POST /api/ask-ai' PRD/ README.md --include='*.md' | grep -v '/work/\|/receipts/\|/ideasForLater/'
grep -rniE 'DEC-010' PRD/ README.md --include='*.md' | grep -v '/work/\|/receipts/\|/ideasForLater/'
```

## Files touched

- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/overview.md`
- `PRD/README.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/integrations-and-data.md`
