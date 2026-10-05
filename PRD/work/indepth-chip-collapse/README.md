status: ship-ready

Intake origin: .worktrees/.graph-intake/graph-20261004-234937 (probe-indepth-chip-collapse), copied verbatim to intake/.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (build-half re-grade, 2026-10-05, after gate-review applied the owner's REQ-206 edit)
- Checked artifact: `PRD/work/indepth-chip-collapse/DESIGN-BRIEF.md`
- Findings: none. Three non-blocking notes carried to build: (1) anchor-ask-composer (PR #262) has MERGED — the current REQ-206 line (functional-requirements.md:5245) carries its rewrite (ring-based character budget, live region, downward growth), so the proposed diff's frozen replace-anchor no longer matches char-for-char; build substitutes only the sub-clause `(labelled or icon-only at each width as the mockup shows)` with the state-aware wording and leaves the rest of the line intact; (2) DESIGN-BRIEF Material assumption 4 is stale (it says anchor-ask-composer is not yet built) — informational only, build treats the merged text as the base; (3) the collapse is scoped to the textarea being focused (or the box holding text), not a bare `.q-box:focus-within` — the owner's edit verdict. The CSS hook is `apps/frontend/src/styles/flow.css` line 281, `@media (max-width: 479px) { .q-box .deep .lbl … }`.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-206` | edit | "`:focus-within` fires for any descendant control, which would collapse the label the instant a keyboard user tabs onto the chip itself ... Scoping to the text field keeps the label visible while tabbing across the controls" |

### Brief reconciliation

- grep: `grep -nE 'focus-within' DESIGN-BRIEF.md README.md GATE-QUESTIONS.md`
- `DESIGN-BRIEF.md` Material assumption 3 — said the build expresses the trigger as `.q-box:focus-within` -> now says textarea-focused (not a bare `:focus-within`) or non-empty (REQ-206 edit)
- `README.md` Preparation gate finding (2) — said build decides on scoping -> now records the owner's verdict resolved it to textarea focus
- `GATE-QUESTIONS.md` REQ-206 Notes bullet — already carries the textarea-scoped hint; acceptance-criteria line unchanged
- Re-grep: remaining `focus-within` hits are only the negated "not a bare `.q-box:focus-within`" phrasings.

## Slices

| Slice | Doc | Scope | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-chip-collapse-css.md` | flow.css state rule + tests + live browser check (done) | none |
| B | `slice-b-req206-promotion.md` | REQ-206 sub-clause substitution + Notes bullet; ship gates (done) | A |

Implementation map: GAMEPLAN.md. Build note: anchor-ask-composer (#262) has merged; apply REQ-206 by intent as a sub-clause substitution, not the frozen replace-anchor.
