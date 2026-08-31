# Lookup phrasing glossary

Backed by: DEC-108, REQ-168

## Purpose

Quick Question's off-domain guardrail is one instruction line in the assembled
prompt (`promptAssembly.ts`, `buildLookupPromptText`) — never a classifier or a
separate detection step. That line used to over-fire: asking about a "combo"
came back as "combo isn't a mechanic," even though *combo* is everyday Magic
language. This doc is the maintained list of common Magic phrasing the
guardrail instruction now treats as in-domain, so the owner and future
contributors can see what is covered and extend it without guessing.

Each entry below names the category, its example phrases, and what the phrase
actually means in Magic — a glossary meant to be read standalone, not a bare
word list. The "not found in the rules corpus" refusal persona stays reserved
for input that is genuinely not about Magic at all (DEC-108).

## Categories

### Combo terminology

- **Example phrases:** combo, infinite combo, goes infinite, go infinite, win
  condition.
- **What it means:** a *combo* is a small set of cards or abilities that,
  played together, produce a powerful or game-ending result — for example,
  producing unlimited mana, dealing unlimited damage, or winning the game
  outright. "Goes infinite" or "go infinite" describes a loop of actions that
  can repeat without a hard limit once assembled. A "win condition" is
  whatever piece of the board or combo is meant to actually end the game.

### Deck-strategy descriptors

- **Example phrases:** aggro, control, ramp, tempo, stax.
- **What it means:** these describe a deck's overall game plan, not a rules
  term or card ability:
  - *Aggro* (aggressive) — built around dealing damage quickly, usually with
    cheap creatures, to end the game before the opponent stabilizes.
  - *Control* — built around answering threats (removal, counterspells) and
    taking over the game in its later turns.
  - *Ramp* — built around accelerating available mana faster than the normal
    one-land-per-turn rate, to cast bigger spells ahead of schedule.
  - *Tempo* — built around trading resources for board and time advantage,
    pressuring the opponent while staying a step ahead, rather than
    committing to a slow long game.
  - *Stax* — built around taxing or locking down what every player (including
    its own caster) can do, denying resources rather than attacking directly.

### Mechanic-adjacent community slang

- **Example phrases:** wheel, mill, blink, sacrifice outlet.
- **What it means:**
  - *Wheel* — an effect that has each player discard their hand and draw a new
    one (often up to seven cards), refilling everyone's hand at once.
  - *Mill* — putting cards from a library into a graveyard without drawing
    them, usually to try to deck out an opponent or to fuel graveyard
    strategies.
  - *Blink* — temporarily exiling a permanent (usually a creature) and
    returning it to the battlefield, which re-triggers its enters-the-
    battlefield abilities.
  - *Sacrifice outlet* — a repeatable effect that lets its controller
    sacrifice a permanent (usually a creature) at will, as a cost or effect of
    an ability.

## Maintenance

This list is not exhaustive — it is the committed starting set REQ-168 shipped
with. Add a category here, with its own plain-language explanation, whenever a
real player question surfaces another common-but-unofficial term the guardrail
wrongly refuses; then mirror the new terms into the single instruction line in
`promptAssembly.ts`'s `buildLookupPromptText`. Never add a detection branch,
classifier, or log signal for this — the guardrail stays exactly one
instruction line (DEC-108).

## Where it lives

The instruction line this glossary backs is
`apps/backend/src/prompt/promptAssembly.ts` (`buildLookupPromptText`'s
`INSTRUCTIONS` section). Eval coverage for the reworded guardrail lives under
`apps/backend/src/eval/fixtures/quick-lookup-off-domain.*` (still refuses
genuinely off-domain input) and `apps/backend/src/eval/fixtures/quick-lookup-phrasing-answered.*`
(pins that a common Magic-adjacent phrase is answered, not refused). See
`PRD/sections/quick-lookup/README.md`'s "Off-domain guardrail" section for the
shipped behavior and `PRD/sections/system-map/prompt-layout-spec.md` for where
this instruction sits among the rest of the assembled prompt.
