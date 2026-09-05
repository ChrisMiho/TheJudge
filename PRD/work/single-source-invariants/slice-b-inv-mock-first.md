# Slice B — INV-MOCK-FIRST: one canonical home for "mock provider by default locally"

## Status: done

## Goal

"Local development defaults to the mock AI provider; the live OpenAI provider
is opt-in via `ASK_AI_PROVIDER=openai` and is what production runs" is
restated across nine files. This slice makes `integrations-and-data.md:16`
(the AI-provider boundary spec, the most precise technical authority) the one
place that carries the full rule; every other home becomes a short pointer.

## Requirements

1. Apply the accepted `INV-MOCK-FIRST` diff from
   `PRD/work/single-source-invariants/GATE-QUESTIONS.md` in full: append the
   canonical rule text and echoed-in list to
   `PRD/sections/integrations-and-data.md:16`.
2. Update every pointer home: `PRD/sections/overview.md` (~31 Current
   Product Status, ~59 Key Constraints), `PRD/sections/goals-and-non-goals.md`
   (~38), `PRD/instructions/technical-design-rules.md` (~15-16, collapse to
   one line per the diff), `PRD/sections/in-depth/README.md` (~46, ~370),
   `PRD/sections/quick-lookup/README.md` (~29, ~279), `PRD/README.md`
   (~137, ~140), root `README.md` (~16).
3. Leave root `README.md:115` (the `ASK_AI_PROVIDER` env-var setup reference)
   unchanged — it is a setup reference, not a rule restatement.
4. Locate each edit by the quoted current text in the proposal's diff, not by
   trusting the line numbers (last verified 2026-09-04) — re-grep first if a
   quoted line has moved.

## Acceptance criteria

- [ ] B1 — `integrations-and-data.md:16` carries the full canonical
      mock-first rule text and the echoed-in list of the other seven homes
- [ ] B2 — `overview.md` Current Product Status (~31) and Key Constraints
      (~59) each append the `integrations-and-data.md` pointer
- [ ] B3 — `goals-and-non-goals.md` Shipped capabilities (~38) appends the
      pointer
- [ ] B4 — `technical-design-rules.md` Allowed Design Direction (~15-16)
      collapses to one line carrying the pointer, per the diff
- [ ] B5 — `in-depth/README.md` (~46 feature-summary, ~370 Provider-boundary
      "Built" restatement) each append the pointer
- [ ] B6 — `quick-lookup/README.md` (~29 feature-summary, ~279
      Provider-boundary "Built" restatement) each append the pointer
- [ ] B7 — `PRD/README.md` (~137 Current-product-status, ~140
      Current-Editorial-Notes) each append the pointer
- [ ] B8 — root `README.md` (~16 onboarding restatement) appends the pointer;
      `README.md:115` is confirmed unchanged
- [x] B9 — re-grep the mock-first pattern family across `PRD/` and root
      `README.md`; every returned rule-stating line is the canonical home or
      a listed pointer above; no unlisted rule-stating home remains (manual
      check — no test command applies to this docs-only slice)

### Re-grep observation: 2026-09-04 B9 — mock-first family

Re-ran the Verification block pattern after B1–B8 landed. Remaining hits are
the new `integrations-and-data.md:16` canonical text, the eight edited
pointer homes, per-feature implementation details that use `ASK_AI_PROVIDER`
without restating the mock-first rule (banner/debug-sidecar mechanics in
`functional-requirements.md`, `system-map.md`, `system-map/prompt-assembly.md`,
`shared-chrome/README.md`, `non-functional-requirements.md`,
`integrations-and-data.md:422,443`), setup/env references
(`README.md:69-71,115-116`), and retired `decisions.md` index rows
(DEC-017, DEC-033, DEC-085). `README.md:115` (the `ASK_AI_PROVIDER` env-var
doc) is confirmed unchanged. No unlisted rule-stating home remains.

## Verification

```bash
grep -rniE 'ASK_AI_PROVIDER|mock[- ]?(first|default)|mock provider' PRD/ README.md --include='*.md' | grep -v '/work/\|/receipts/\|/ideasForLater/'
```

## Files touched

- `PRD/sections/integrations-and-data.md`
- `PRD/sections/overview.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/README.md`
- `README.md` (root)
