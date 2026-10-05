status: refined

Intake origin: .worktrees/.graph-intake/graph-20261004-234937 (probe-indepth-chip-collapse), copied verbatim to intake/.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/indepth-chip-collapse/DESIGN-BRIEF.md`
- Findings: none blocking. Three non-blocking notes carried to build: (1) anchor-ask-composer (owner-action, docs PR #249 merged) rewrites the same REQ-206 acceptance line — apply this as a sub-clause substitution and re-read REQ-206 before applying; (2) the `:focus-within` selector also fires on chip/mic/send focus — resolved by the owner's REQ-206 `edit` verdict: scope the collapse to the textarea being focused (or the box holding text); (3) the proposed REQ-206 Notes "owner signed off" bullet must track the owner's actual verdict (gate-review keeps it in step).

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
