# Idea: the app shouldn't claim a combo that isn't there

**Player problem.** A player attaches cards and asks "how do these combo?" When
the cards don't combo together, the model sometimes says they do anyway. This
is the worst way for a combo answer to go wrong: "the app told me I had a combo
and I didn't."

**Evidence (2026-08-31, gpt-4.1).** The combo probe asked 500 combo questions.
Of 50 questions on cards that don't combo, 2 got a made-up combo:

- **Kiki-Jiki, Mirror Breaker + Voltaic Construct.** The model claimed an
  infinite loop. Voltaic Construct untaps only *artifact* creatures, and
  Kiki-Jiki isn't an artifact, so the loop needs a third card.
- **Abdel Adrian + Emiel the Blessed.** The model called them an infinite combo
  "when you also have a mana rock," inventing a third card and presenting the
  two attached cards as the combo.

**What's already in place.** REQ-095 tells the model to check every combo piece
against the attached cards before calling a combo live. Both failures happened
with that guard in place. Nobody has re-tested on Luna.

**Cheapest next step.** Re-run the 50 unrelated-card cases on Luna. If false
combos still show up, shape the prompt so the model says "these don't combo
together" when that's the answer. The probe also found that 6 of 100
partial-combo answers named the missing piece vaguely, which is worth tightening
in the same pass.

**Where the full probe lives.** The full report, `combo-context-validation`, is
in git history at `16d51806` and in
`TheJudge-backups/prd-work-archive-2026-10-14/`. The test harness and its
generated cases stay on branch `thejudge-auto/semantic-rule-retrieval` at
`origin` (`bcbcebc`).
