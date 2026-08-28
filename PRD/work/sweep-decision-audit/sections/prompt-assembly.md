# Sweep finding — prompt-assembly
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/prompt-assembly.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 3

## DEC-025 — absorbed
in-depth/README.md:285-286 states every prompt includes the static MTG reference block and merged zone-scope sentence, citing DEC-025 directly; quick-lookup/README.md:155-157 confirms the reference block is always-on in lookup mode too, and :165-167 explicitly notes the zone-scope sentence is structurally omitted there because lookup mode carries no game state — the decision's scope-sentence/reference-block substance is present everywhere it applies.

## DEC-036 — absorbed
in-depth/README.md:287-291 places `PHASE GUIDANCE` between general context and the zone sections, ties combat-specific guidance to `combatStep` with a generic fallback, and states it is never omitted for a valid phase and adds no rules-validation behavior — matching DEC-036's Impact and Notes; quick-lookup/README.md:165-170 correctly documents `PHASE GUIDANCE` as structurally absent in lookup mode (no `turnPhase` exists there), consistent with the decision's scope.

## DEC-042 — absorbed
in-depth/README.md:292-298 states every card in every populated zone emits full metadata (oracleText, manaCost, manaValue, typeLine, colors, supertypes, subtypes, contextNotes), the empty-oracle-text fallback string verbatim, and that non-stack sections omit `caster` while stack keeps stack-specific fields — matching DEC-042's field list and Impact bullets; :381-382 and :384 capture the `EFFECTIVELY_UNLIMITED_CHARS = 1,000,000` constant and its DEC-030-cap amendment. quick-lookup/README.md:159-161 confirms the same per-card full-metadata formatting (DEC-042/REQ-030) is reused for the lookup-mode attached card.
