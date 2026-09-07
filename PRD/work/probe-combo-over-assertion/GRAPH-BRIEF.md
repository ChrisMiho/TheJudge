# Graph-run brief — Stop Ask AI from asserting combos that aren't there

Self-contained intake for `graph-kickoff`. The investigate-first question — *is the
model inventing combos, and is it a data gap or an answer-shaping gap?* — is
**resolved with data below** (it's answer-shaping), so refinement can go straight to
a DESIGN-BRIEF.

## What the player gets

Honest combo answers. When a player attaches cards in Quick Question and asks "how
do these combo?", the app today will sometimes **confidently describe an infinite
combo that doesn't exist** — cards that need a third piece the player never
attached, or that don't interact at all. This makes the model verify every required
piece is actually present before claiming a working combo, and makes **"these cards
don't combo together" a valid, correct answer** it is willing to give. The player
stops being told they have a combo they don't have — the failure they'd most notice
and least forgive.

## Why (measured — do not re-derive)

The combo-context-validation investigation (500-case suite, 2026-08-31) found the
context is sufficient — 488/500 correct, **zero** missing-context gaps. Both hard
errors in 500 cases were the same failure: **the model fabricated an infinite combo
from cards that don't combo**, on the deliberately-unrelated negative family
(**2/50**):

- **Kiki-Jiki, Mirror Breaker + Voltaic Construct** — claimed an infinite loop, but
  Voltaic Construct untaps *artifact* creatures and Kiki-Jiki isn't an artifact.
  The loop can't start without a third card. The model asserted it anyway.
- **Abdel Adrian + Emiel the Blessed** — presented as an infinite combo "when you
  also have a mana rock" — it invented a third-card combo and framed the two
  attached cards as combining.

**Mechanism (measured, not guessed):** REQ-095's partial-combo context surfaces
*every* combo each attached card belongs to (working as designed), and the "how do
these combo?" framing primes the model to stitch a combo that isn't present. It is
the **highest-severity** failure mode even at a low 2/50 rate, because a player most
notices "the app told me I had a combo and I didn't."

**The gap in today's guard:** REQ-095 already instructs the model to "check each
ingredient's applicable card state and `mustBeCommander` against the submitted board
before asserting that a combo is live." But that guard is about the **zone/board
state of the ingredients of a *matched* combo**. It does **not** cover the model
**fabricating a combo whose required piece was never attached or matched at all** —
which is exactly what both failures did. That's the hole to close.

## Decisions already made — do not re-litigate

- **This is a prompt / answer-contract fix, not a data or retrieval gap** — the
  investigation confirmed none of the misses were missing context.
- **The owner wants to dig in** — this ships as a real feature with its own
  negative-combo measurement and regression guard, not a one-line prompt tweak.
- **Do not touch combo retrieval/selection** (REQ-094/095 candidate matching, the
  five-variant cap, the enrichment data). This is answer-shaping downstream of it.

## Design direction (converged — direction, not slices)

Two halves; map-out owns the slicing.

1. **Answer-contract change (prompt).** Shape the combo section instructions
   (`apps/backend/src/prompt/promptAssembly.ts`, the `COMMANDER SPELLBOOK COMBO
   CONTEXT` block) so the model must confirm **every required ingredient is
   actually present among the attached/matched cards** before asserting a working
   combo, and is explicitly told that answering **"these cards do not combo
   together"** (or "they'd combo only with an additional piece you haven't
   attached, X") is a correct, encouraged answer — not a failure to be helpful.
   This extends REQ-095's existing "check card state" instruction to cover the
   missing-piece / no-combo case.
2. **Measurement — a negative-combo test set.** A curated set of card pairs that do
   **not** combo (unrelated, and "needs a third piece"), scored for
   **false-combo-assertion rate**, so the fix is proven and guarded against
   regression. Reuse the negative-family case-generation from the
   combo-context-validation harness (the "unrelated" family already exists) rather
   than reinventing it.
   - **Natural instrument:** REQ-146's combo answer-quality A/B harness
     (`scripts/compare-combo-answer-quality.mjs`, `--confirm-live-calls`;
     `scripts/fixtures/combo-answer-quality-scenarios.json`) — REQ-146's own note
     says it "stays a two-leg combo A/B over curated combo scenarios," so a negative
     family fits it directly. The just-shipped answer-quality instrument
     (REQ-185–190) is the alternative pattern. **Refinement picks one** — do not
     build both.
   - Must score **both sides**: false-combo rate on negatives *and* that real
     combos (complete + partial, REQ-095) still answer correctly, so the fix
     doesn't teach the model to refuse genuine combos.

## Current-state PRD truth to amend

Name the files; do not edit here (refinement/graph-kickoff own the write). Decision
log retired — no new DEC; amend in place.

- `PRD/sections/functional-requirements.md`:
  - **REQ-095** (≈ line 2224, Commander Spellbook combo prompt enrichment) —
    strengthen the acceptance criteria: the model must not assert a working/live
    combo unless all required ingredients are present, and must plainly state when
    attached cards do not combo (or name the missing piece) rather than fabricate
    one. Today's criterion covers matched-ingredient card-state only.
  - **REQ-167** (≈ line 3844, multi-card Quick Question) — the "how do these
    combo?" surface this failure appears on; reference / cross-link.
  - **REQ-146** (combo answer-quality A/B harness) — extend to cover the negative
    family, if it's the chosen instrument.
  - Likely a **new REQ** owning "false-combo guard + negative-combo test set" as
    its own testable unit — refinement decides whether that's cleaner than growing
    REQ-095.

## Constraints (don't rediscover)

- **Don't suppress real combos.** The change must not make the model refuse or
  hedge genuine combos — partial-combo answers (REQ-095) must still name the
  missing role and stay helpful. Measure the true-positive side, not just the
  negative side.
- **Preserve the contract and boundaries** REQ-095 already fixes: plain-text
  `{ answer }` for live, exact combo section exposed under mock, no `AskAiRequest`/
  `AskAiResponse` field or endpoint change, unchanged section stack order, WotC
  authority over community combo data.
- **Live provider costs.** Negative-combo scoring needs live calls — gate behind
  `--confirm-live-calls`, print a dry-run cost estimate first. The full 500-case
  combo run cost ~$11; a focused negative set is far cheaper. Respect a spend
  ceiling refinement sets.
- **Mock-default must still work** — the harness and prompt-assembly tests run
  offline; no live call in any gate script.

## Evidence + reusable tooling

- Findings: `PRD/ideasForLater/combo-context-validation/FINDINGS.md` — "Findings
  #2" (over-assertion, both worked examples) and the 500-case negative family.
- Status synthesis: `PRD/work/probe-combo-context-status/PROBE.md`.
- The throwaway harness that generated the 500-case suite (incl. the "unrelated"
  negative family) lives on branch `thejudge-auto/semantic-rule-retrieval` at
  `origin` (`bcbcebc`) — `select-suite.mjs` (five scenario families),
  `assemble.mjs`, `run-live.mjs`. Reuse the negative-case generation approach.

## What the graph run should produce

A DESIGN-BRIEF that lands the prompt/answer-contract change plus a negative-combo
measurement. The REQ-095 (and possibly a new REQ) amendment, the combo-section
instruction change in `promptAssembly.ts` with prompt-assembly tests, a curated
negative-combo test set scored for false-combo-assertion rate through the chosen
instrument (REQ-146 harness or the answer-quality pattern — pick one at define),
and a regression guard that also proves real combos still answer correctly. The
"it's answer-shaping, not a data gap", "don't touch retrieval", and "the owner
wants a real feature with measurement" points are settled above — do not reopen.

## How to hand this off

/graph-kickoff "Stop Ask AI from asserting combos that aren't there — verify every combo piece is present and allow a plain no-combo answer" PRD/work/probe-combo-over-assertion/GRAPH-BRIEF.md
