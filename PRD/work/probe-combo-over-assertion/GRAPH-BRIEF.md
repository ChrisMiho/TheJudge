# Graph-run brief — Honest combo answers: walk it, name the gap, or explain the synergy

Self-contained intake for `graph-kickoff`. The investigate-first question — *is the
model inventing combos, and is it a data gap or an answer-shaping gap?* — is
**resolved with data below** (it's answer-shaping), so refinement can go straight to
a DESIGN-BRIEF. Reshaped 2026-09-10 with the owner: the answer is a three-tier
contract, not a "no combo" refusal, and the measurement is a small hand-read
spot-check, not a regression instrument.

## What the player gets

A player attaches cards in Quick Question and asks "how do these combo?". Today
the app will sometimes **confidently describe an infinite combo that doesn't
exist** — cards that need a third piece the player never attached, or cards that
don't interact at all. After this change the answer takes one of three shapes,
keyed off what the combo catalog actually found:

1. **Full combo present.** Walk the steps in order. Order of operations is the
   answer, not a yes/no. (This is what happens today and it works.)
2. **Partial combo, a piece missing.** Name the missing piece and its role, then
   explain how the present pieces sequence once it arrives. Never frame the
   attached cards as the combo.
3. **No catalogued combo.** Answer it as a synergy question: how do these cards
   interact, what triggers what, what order do you play them — grounded in the
   cards' own text. If nothing on the cards interacts, say so plainly and name
   what would make them interact.

The player stops being told they have a combo they don't have, and stops getting
a dead-end "no" when they attached the cards on purpose.

## Why (measured — do not re-derive)

The combo-context-validation investigation (500-case suite, 2026-08-31) found the
context is sufficient — 488/500 correct, **zero** missing-context gaps. Both hard
errors in 500 cases were the same failure: **the model fabricated an infinite combo
from cards that don't combo**, on the deliberately-unrelated negative family
(**2/50**):

- **Kiki-Jiki, Mirror Breaker + Voltaic Construct** — claimed an infinite loop, but
  Voltaic Construct untaps *artifact* creatures and Kiki-Jiki isn't an artifact.
  No interaction as attached. The honest tier-3 answer: "these don't interact;
  with an artifact creature that copies, they would."
- **Abdel Adrian + Emiel the Blessed** — presented as an infinite combo "when you
  also have a mana rock". They *do* interact (they flicker each other) and with a
  mana source it is a catalogued three-card combo. The honest answer is tier 2:
  "real synergy, not a two-card combo, the third piece is a mana source."

Both times the combo section was present and correctly listed each card's real
combos with their missing pieces. **The model had the evidence and stitched a
false answer anyway.** The "how do these combo?" framing primes it.

**The gap in today's guard:** the section's instruction line says "Before asserting
that a combo is live, assembled, or executable, check each ingredient's applicable
card state and its must-be-commander requirement against the submitted board"
(`apps/backend/src/commanderSpellbook/formatting.ts`, `COMBO_INSTRUCTION_LINES`;
REQ-095 criterion). That guards the **zone/board state of a matched combo's
ingredients**. It says nothing about the case where **no listed combo contains
all the attached cards** — which is exactly what both failures were.

## Decisions already made — do not re-litigate

- **This is a prompt / answer-contract fix, not a data or retrieval gap.**
- **Three tiers, keyed off the classification the section already produces**
  (complete / partial / none). No new classifier.
- **Say it in data, not advice.** When no candidate is classified complete —
  no catalogued combo has every piece present among the attached cards — the
  section adds one derived line stating that fact. A derived sentence beats a
  generic instruction because the model can't argue with a fact it was handed.
  The word **catalogued** is load-bearing: the catalog is incomplete, and this
  line must never become "they don't combo".
- **Tier 3 keeps the honesty guard, pointed the other way.** "Synergy" is a
  licence to dress up a non-interaction. A synergy claim must point at the
  specific card text or trigger that makes the interaction happen; if nothing
  interacts, say that and name what would.
- **The section fires with just the derived line when combo intent is explicit
  and no attached card belongs to any combo.** Today no candidates means no
  section, so the model would be fully on its own in exactly the framing that
  fails. Combo intent is REQ-094's existing deterministic detector (`combo`,
  `infinite`, `loop`, `win condition`…); broad words like `synergy` do not
  trigger it and do not get the section — a plain synergy question is already an
  ordinary rules/interaction question and stays one.
- **Measurement is a small hand-read spot-check, not a regression instrument.**
  2/50 → 0/50 is indistinguishable from luck; proving a rate drop would take
  hundreds of hand-certified negatives, and a guard on model output can never be
  a build gate (REQ-146's constraint). So: prompt-assembly tests prove the
  derived line and the tier instructions fire exactly when they should
  (offline, deterministic, in the gate), and one before/after live run over ~20
  pairs is hand-read and recorded in the receipt as a dated conclusion.
- **Do not touch combo retrieval/selection** (REQ-094/095 candidate matching, the
  five-variant cap, the enrichment data). This is answer-shaping downstream of it.

## Design direction (converged — direction, not slices)

- **Prompt (`formatting.ts`, `COMBO_INSTRUCTION_LINES` + section rendering).**
  - Replace the single "before asserting live" line with the three-tier
    contract: complete → walk the catalogued steps in order; partial → name the
    missing piece and its role, sequence the present pieces, never call the
    attached cards the combo; none → answer the interaction/sequencing question
    from card text, cite the text or trigger behind every synergy claim, and say
    plainly when nothing interacts and what would.
  - When no candidate is complete, render one derived line — wording along the
    lines of "No catalogued combo has every piece present among the attached
    cards." — placed before the candidate list (or alone, when there are no
    candidates and combo intent is explicit).
  - Keep the community-sourced / WotC-authority lines and the background-context
    line for automatic (non-intent) candidates unchanged.
- **Section firing.** `preparation.ts` / `promptAssembly.ts`: with explicit combo
  intent and zero candidates, emit the section with the heading, the derived
  line, and the instruction lines. Without intent, no candidates still means no
  section (unchanged).
- **Tests.** Prompt-assembly / formatting unit tests for each tier's rendering,
  the derived line's presence exactly when no complete candidate exists, and the
  intent-and-empty firing case. Eval fixture goldens change only for these
  intentional additions.
- **Spot-check (live, once, hand-read).** ~20 pairs: negatives certified offline
  by the catalog (two cards sharing zero variants — the catalog can prove
  "no catalogued combo" without a human), plus the two real failures, plus a few
  complete and partial pairs so the true-positive side is watched. Run before
  and after the prompt change on the deployed model, `--confirm-live-calls`,
  dry-run cost first, ceiling ~$2. Score by hand, two columns: *asserted a
  working combo from the attached cards (y/n)* and, for no-combo pairs, *gave a
  grounded interaction or a dressed-up nothing*. Record the conclusion in the
  receipt. The scaffold is REQ-146's script (`scripts/compare-combo-answer-quality.mjs`,
  `scripts/fixtures/combo-answer-quality-scenarios.json`): its live gate and
  scenario shape fit; its with/without-enrichment axis does not, so the run is
  a before/after of the prompt change, not that A/B. Refinement decides whether
  that is a mode on the existing script or a sibling script — do not build a
  general instrument.

## Current-state PRD truth to amend

Name the files; do not edit here (refinement/graph-kickoff own the write). Decision
log retired — no new DEC; amend in place.

- `PRD/sections/functional-requirements.md`:
  - **REQ-095** (Commander Spellbook combo prompt enrichment) — the acceptance
    criterion "prompt instructions direct the model to check each ingredient's
    applicable card state … before asserting that a combo is live" grows into
    the three-tier answer contract; add the derived no-complete-candidate line
    and the explicit-intent-with-no-candidates firing rule; "no selected
    variants produces no combo section" becomes "…without explicit combo intent".
  - **REQ-094** — only if the intent-and-empty firing rule touches its "no
    section" wording; retrieval gates themselves are unchanged.
  - **REQ-167** (multi-card Quick Question) — the surface this appears on;
    cross-link only.
  - **REQ-146** — if the spot-check becomes a mode of its script, note it there;
    its constraints (never a gate, never auto-scored) already say the right thing.
- `PRD/sections/system-map.md` and `PRD/sections/quick-lookup/README.md` where
  they describe the combo section's instructions — refinement greps
  `COMMANDER SPELLBOOK COMBO CONTEXT`, `before asserting`, `combo section` and
  gives every hit a disposition.

## Constraints (don't rediscover)

- **Don't suppress real combos.** Tier 1 and tier 2 answers must stay as helpful
  as today; the spot-check watches the true-positive side for that reason.
- **Preserve the contract and boundaries** REQ-095 already fixes: plain-text
  `{ answer }` for live, exact combo section exposed under mock, no `AskAiRequest`/
  `AskAiResponse` field or endpoint change, unchanged section stack order, WotC
  authority over community combo data.
- **Mock-default must still work** — every test and gate script runs offline; the
  live spot-check is explicitly invoked and confirmation-gated.
- **The derived line is a catalog fact, not a game fact.** Wording must say
  "catalogued"; the model must not be told the cards cannot combo.

## Evidence + reusable tooling

- Findings: `PRD/ideasForLater/combo-context-validation/FINDINGS.md` — "Findings
  #2" (over-assertion, both worked examples) and the 500-case negative family.
- Status synthesis: `PRD/ideasForLater/combo-context-validation/HANDOFF.md`
  and the answer-quality receipt
  `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md`.
- The throwaway harness that generated the 500-case suite (incl. the "unrelated"
  negative family) lives on branch `thejudge-auto/semantic-rule-retrieval` at
  `origin` (`bcbcebc`) — `select-suite.mjs`, `assemble.mjs`, `run-live.mjs`.
  Reuse the negative-pair generation approach; certify pairs against the catalog.

## What the graph run should produce

A DESIGN-BRIEF that lands the three-tier answer contract in the combo section's
instructions, the derived no-complete-candidate line, the explicit-intent-with-no-
candidates firing rule, prompt-assembly tests for each, the REQ-095 (and touched
neighbours) amendment, and a ~20-pair before/after live spot-check whose hand-read
conclusion goes in the receipt. Likely slices: (A) instruction lines + derived
line + tests, (B) intent-and-empty firing + tests + golden updates, (C) spot-check
run + recorded conclusion + PRD amendments. The "answer-shaping not data", "three
tiers", "derived line", "small spot-check not an instrument", and "don't touch
retrieval" points are settled above — do not reopen them.

## How to hand this off

Hold until the rule-excerpt-cap-ten docs PR (#230) has merged, then:

/graph-kickoff "Honest combo answers — walk a full combo, name a missing piece, or explain the synergy; never invent a combo from the attached cards" PRD/work/probe-combo-over-assertion/GRAPH-BRIEF.md
