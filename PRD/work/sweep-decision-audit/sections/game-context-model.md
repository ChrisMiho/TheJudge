# Sweep finding — game-context-model

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/game-context-model.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 10

## DEC-021 — absorbed
In-Depth's README states the frozen `{ question, gameContext }` request shape, with no top-level `stack`/`battlefieldContext` and no `card` field, and Quick Lookup's README documents `gameContext`/`card` as mutually exclusive across modes — the parent-model substance is fully present.

## DEC-023 — absorbed
In-Depth's Step 2 (Zone confirmation) describes the phase-preselected checklist the user can toggle, and the flow-wide "Back and Continue preserve everything entered" rule covers changes surviving navigation and phase changes adding zones without wiping cards.

## DEC-024 — absorbed
In-Depth documents submit gated on at least one card in at least one selected zone and `gameContext.zones` including only non-empty zone arrays with empty keys omitted, matching the decision's payload rule exactly.

## DEC-026 — absorbed
In-Depth Step 4 documents `ContextTarget` with player/card/none/freeform target kinds and states the public API never exposes the legacy `StackTarget`, matching the decision's shape.

## DEC-027 — partial
In-Depth's Step 1 captures only the UI-select half ("Selects show `Player N (Name)`... submitted API values stay fixed `PlayerLabel` strings"); missing from all 7 specs is that prompt text itself resolves player references (`activePlayer`, caster, owner, player targets) using the same `Player N (Name)` format, and the rule that empty/whitespace-only/label-identical display names are treated as unset.

## DEC-034 — absorbed
In-Depth's turn-phase enum and default (`main_1`) match, and its Rejected-alternatives section explicitly notes `stack_resolving` was removed by DEC-034.

## DEC-035 — absorbed
In-Depth's Step 2 and Measured Bounds state phase defaults preselect 2 zones per phase and empty zone keys are omitted from payload/prompt; the decision's per-phase zone mapping table is build-tuning detail not required at spec-doc level.

## DEC-037 — absorbed
In-Depth's Step 1 documents the inline combat sub-step selector defaulting to `declare_blockers`, submitted only when phase is combat, and Prompt Assembly documents `PHASE GUIDANCE` keying off the submitted `combatStep`.

## DEC-043 — absorbed
In-Depth's Step 1 documents the collapsible `ADDITIONAL GAME STATE` freeform `gameStateNotes` field (capped, control-character-guarded, omitted when blank), and Rejected Alternatives explicitly notes DEC-043 rejected structured sub-fields.

## DEC-102 — absorbed
Both In-Depth's Step 1 and Player Life Tracker's "One-way MTG Assistant seed" section document the additive optional `GameContext` per-player fields (`poison`, `experience`, `energy`, `commanderDamage`, `counters`) riding the frozen contract, matching the decision precisely.
