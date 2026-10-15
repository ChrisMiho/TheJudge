# Quality check — ask-box-prefilled-text

Attempt 1, graph mode (`graph-20261015-034607`, node `gate-qc`). Graded: `DESIGN-BRIEF.md` plus the proposed truth in `GATE-QUESTIONS.md` against `PRD/sections/` at `97c8ea8a`.

**Verdict: FAIL** (one finding, returned to refinement).

## Findings

1. **The clearing rule is ambiguous when only part of the carried work changes.** The brief ("clear the question, the cards and the `lookup` Draft only if they are unchanged since the carry") reads as all-or-nothing. The REQ-206 diff says "a question or card changed on Ask a Question after the carry is new staging and is kept", which reads as per-item. Criterion 5 tests only "text or the cards" changed, never one without the other. So a player who edits the question but leaves the carried cards (or the reverse) gets an undefined result: do the untouched cards leave the stage, or stay? Also undefined: what counts as "changed" (any difference from the carried snapshot, including emptying the box or a whitespace-only edit), and whether a box the player emptied after the carry still gets its Draft removed. Fix: state one rule in the brief, in the REQ-206 criterion and in the quick-lookup sentence (recommended: all-or-nothing, compare cards and trimmed question to the carried snapshot; any difference keeps everything and the Draft), and add a criterion that edits only the question, and only the cards, each keep both.

## Checked and fine

- Code claims match: the early return on `carry.cards.length === 0` is at `MtgAssistantApp.tsx` 235-238 (carry-with-question dropped); `clearDraft("game")` at ~359 and ~399; `QuickLookupApp.tsx` `clearDraft("lookup")` at 153 (first answer) and 222 (empty staging on leave).
- REQ-206 block: has "What this decides", "In plain terms", "What happens if you say no"; Verdict and Reason are blank. Diff anchors match current text: `functional-requirements.md` lines 5358, 5362, 5388, and the `quick-lookup/README.md` line 42 Entry bullet.
- REQ-108 ("Draft for that attempt is cleared on first successful answer", line 2683; auto-hydrate on reload) is not contradicted; criteria 4 and 8 preserve restore of an unsent, uncarried question.
- Criteria 1-4 and 6-8 are testable as written, including desktop (96px, label `display: block`) and phone (35px, label `display: none`) In-depth states. The In-depth Context spacing finding is out of scope by design.
- No new REQ/FLOW/screen; no screen-layout row needed (no new screen or overlay).
