# Quality check — ask-box-prefilled-text

Attempt 2, graph mode (`graph-20261015-034607`, node `gate-qc`). Graded: `DESIGN-BRIEF.md` plus the proposed truth in `GATE-QUESTIONS.md` (after define attempt 2, `84c424a7`) against `PRD/sections/`, which is unchanged by design.

**Verdict: FAIL** (one finding, returned to refinement). Attempt-1 findings 1 and 2 are resolved.

## Attempt-1 findings

1. Carry-clearing rule: resolved. One rule (all or nothing, trimmed question plus card-id set compared with the latest tap's snapshot) is worded identically in the brief, the REQ-206 criterion and the quick-lookup README sentence. "Changed" is defined (state comparison, undone edit counts as unchanged, spaces-only is not a change, an emptied box is). Criteria 5, 6, 7, 8 and 9 cover question-only, cards-only (add and remove), emptied box, spaces-only and a second tap.
2. Type, clear, reload path: resolved. It is in the brief's root cause (fact 3) with live evidence (`evidence/measurements.md` section 5, P1 to P5, plus 5a for In-depth), a rule (Draft follows the box), testable criteria 10 to 13, and REQ-108 and FLOW-017 slots that agree with each other and with REQ-206.

## Findings

1. **Tapping In-depth a second time leaves In-depth's question box undefined.** Criterion 9 ("the latest tap wins") only checks that Ask a Question ends up cleared. It never says what In-depth's question box holds after the second tap when the first tap already put a question there (or a walk already started). Does the second carry replace the first question? Does it count as the same "carried attempt" or a new one, which decides which answer triggers the clear? A builder has to guess, and a test cannot assert the player-visible result. Fix: state in the brief and the REQ-206 criterion that a later tap replaces the carried question in In-depth's box (and that the answer to that attempt is the one that triggers the clear), and extend criterion 9 to assert In-depth's question box and the request text after the second tap.

## Checked and fine

- Anchors match current text: `functional-requirements.md` lines 2674, 2698, 5358, 5362, 5388; `user-flows.md` lines 396, 406, 414; `quick-lookup/README.md` Entry bullet at 42 to 46. No other `PRD/sections` text states a Draft write timing that the REQ-108 and FLOW-017 amendments would contradict (`user-flows.md` 401 and 408 stay consistent).
- Code claims match: early return on `carry.cards.length === 0` at `MtgAssistantApp.tsx` 235-238; `clearDraft("game")` at 359 and 399; `clearDraft("lookup")` at `QuickLookupApp.tsx` 153 and 222; `snapshotMidFlightDraft` at 214, called at 183, 234 (Menu-leave) and 252 (`selectedCards` effect, with a first-pass skip); In-depth equivalents at 372, 413, 795. No `pagehide` or `beforeunload` save in either file. The brief's "~229" and "~247" are a few lines off (actual 234 and 252); the brief marks them approximate, so not a finding.
- Each GATE-QUESTIONS.md block has "What this decides", "In plain terms" with a recommendation, "What happens if you say no", a complete diff, and blank Verdict and Reason.
- The Draft-follows-every-change rule names both destinations (Ask a Question and In-depth details), matching FLOW-017 and DEC-138; "nothing is staged" is defined for each.
- Criteria 1 to 8 and 10 to 16 are testable as written, including desktop (label `display: block`, about 96px) and phone (label `display: none`, about 35px) In-depth states, which match the measurements table.
- No new REQ, FLOW, screen or overlay, so no `screen-layout.md` row is needed. The In-depth Context spacing finding is out of scope by design.
