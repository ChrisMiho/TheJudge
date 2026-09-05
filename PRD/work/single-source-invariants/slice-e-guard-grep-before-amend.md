# Slice E — GUARD-GREP-BEFORE-AMEND: the grep-before-amend guardrail

## Status: done

## Goal

The image-first-cards gate listed the one-endpoint rule's homes from memory,
cited a retired decision as the live rule, and missed two live copies — a
defect this whole package exists to fix once. This slice adds the durable
process rule that stops it from recurring: before writing or amending a
cross-cutting invariant (a rule asserted in 3+ files), enumerate its full
amendment set by `grep`, never from memory, and keep that set listed in the
rule's canonical home.

## Requirements

1. Apply the accepted `GUARD-GREP-BEFORE-AMEND` diff from
   `PRD/work/single-source-invariants/GATE-QUESTIONS.md` in full: add the new
   "Cross-cutting invariants (grep before amend)" subsection to
   `PRD/instructions/writing-rules.md` after "## Editing Rules", naming the
   image-first-cards D5 near-miss as the reason, the invariant-vs-scope-clause
   distinction, and the requirement to re-grep and refresh the canonical
   home's echoed-in list on every amendment.
2. Add the cross-reference bullet to `PRD/instructions/requirement-format.md`
   under "## Formatting Rules", pointing at the new `writing-rules.md`
   subsection.
3. Do not edit any `thejudge-*` skill file — skill trees are outside a graph
   run's write scope. Record the skill-side follow-up (referencing this rule
   from `thejudge-refinement` and gate-authoring) as a noted, non-blocking
   follow-up in this slice's evidence log, not as a criterion here.
4. Locate each edit by the quoted current text in the proposal's diff, not by
   trusting the line numbers (last verified 2026-09-04) — re-grep first if a
   quoted line has moved.

## Acceptance criteria

- [x] E1 — `writing-rules.md` carries the new "Cross-cutting invariants (grep
      before amend)" subsection, naming the image-first-cards D5 near-miss,
      the grep-before-amend rule, the invariant-vs-scope-clause distinction,
      and the re-grep-to-refresh requirement
- [x] E2 — `requirement-format.md` carries the cross-reference bullet to
      `writing-rules.md`'s new subsection
- [x] E3 — re-grep `PRD/instructions/` for "grep-before-amend" / "grep before
      amend" and confirm the rule is stated once (in `writing-rules.md`) with
      exactly one cross-reference (in `requirement-format.md`), not
      duplicated as independent text elsewhere (manual check — no test
      command applies to this docs-only slice)

### Re-grep observation: 2026-09-04 E3 — grep-before-amend / cross-cutting invariant family

Re-ran the Verification block pattern across `PRD/instructions/*.md` after
E1–E2 landed. The rule is stated once, in `writing-rules.md`'s new
"Cross-cutting invariants (grep before amend)" subsection (naming the
image-first-cards D5 near-miss, the grep-before-amend requirement, the
invariant-vs-scope-clause distinction, and the re-grep-to-refresh step), with
exactly one cross-reference bullet in `requirement-format.md`'s Formatting
Rules pointing back at it. No other instruction file states or duplicates
the rule independently. No `thejudge-*` skill file was touched by this
slice — the skill-side pointer (referencing this rule from
`thejudge-refinement` and gate-authoring) remains a noted, non-blocking
follow-up per `GATE-QUESTIONS.md`.

## Verification

```bash
grep -rniE 'grep[- ]before[- ]amend|cross-cutting invariant' PRD/instructions/*.md
```

## Files touched

- `PRD/instructions/writing-rules.md`
- `PRD/instructions/requirement-format.md`

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas — N/A,
      this package is documentation-only; no test or lint target covers
      `PRD/`; `npm run quality:check` run and green (436/436) after every
      slice
- [x] Public contract unchanged unless slice scoped a change — unchanged;
      no code, no API, no data contract touched by any slice in this package
- [x] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/single-source-invariants/` ready
      to delete — pending `thejudge-cleanup` after this PR merges
