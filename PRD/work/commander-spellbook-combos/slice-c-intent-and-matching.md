# Slice C — Combo intent detection and deterministic matching

## Status: planned

## Goal

Turn a submitted request plus the loaded catalog into at most five ranked,
fully annotated candidates — with no model call anywhere in the path.

## Requirements

1. `apps/backend/src/commanderSpellbook/intent.ts` is the single combo-intent
   detector: case-insensitive, word/phrase-boundary matching on `combo`, `combos`,
   `infinite`, `go infinite`, `goes infinite`, `loop`, `win condition`. Broad terms
   (`synergy`, `interaction`, `works with`) do not activate partial retrieval.
   Both the game and lookup paths import this one function.
2. `apps/backend/src/commanderSpellbook/zones.ts` holds the single `ZoneId` ⇄
   `H/B/C/E/G/L` map. The six non-stack `ZoneId` values map 1:1
   (`hand`→`H`, `battlefield`→`B`, `command`→`C`, `exile`→`E`, `graveyard`→`G`,
   `library`→`L`). TheJudge's `stack` zone has no Commander Spellbook equivalent:
   a card on the stack is never zone-compatible with any ingredient and is
   annotated wrong-zone rather than treated as absent.
3. `matcher.ts` implements assignment: every exact and template ingredient
   quantity must map to a **distinct** submitted card instance in a compatible
   starting zone. Quantities are multiset-aware; one instance never satisfies two
   slots. Instance identity comes from the submitted context, not `cardId`.
4. Game mode without explicit intent returns complete candidates only. An
   unresolved template can never count as satisfied for completeness.
5. Game mode with explicit intent ranks complete candidates first and may append
   partial candidates. Submitted card names mentioned in the question become
   required anchors; when none is named, submitted cards seed overlap ranking.
6. Lookup mode runs only with explicit intent **and** an attached card, and every
   candidate must contain that card as an exact ingredient or authoritative
   template match. No attached card, or no intent, retrieves nothing.
7. Every result distinguishes compatible-present, present-but-wrong-zone, missing
   exact, matched-template, and unresolved-template ingredients.
8. Each annotation carries the card state applicable to the zone its assigned
   instance actually occupies. Wrong-zone and missing annotations instead carry
   the **expected** zone's state. `mustBeCommander` travels with every annotation.
   Nothing here is validated — the request carries no tapped, counter, control, or
   commander-designation data.
9. Select at most five, ordered by: complete contextual match; required
   question-anchor coverage; compatible-zone coverage; fewer missing ingredients;
   popularity descending; stable variant id ascending.
10. No model call decides intent, eligibility, template satisfaction, or ranking.
    No legality validation, rules simulation, or hidden-state assumption enters
    this module (DEC-013).

## Acceptance criteria

- [ ] `"Does this combo go infinite?"`, `"is this a loop"`, `"win condition"`,
      and `"COMBOS"` all detect intent; `"good synergy"`, `"how does this
      interaction work"`, and `"works with my commander"` do not
- [ ] `"comboing"` and `"discombobulate"` do not match `combo` (boundary check)
- [ ] Game mode, no intent, all three ingredients present in compatible zones →
      one complete candidate returned
- [ ] Game mode, no intent, two of three ingredients present → no candidate
- [ ] Game mode, explicit intent, two of three present → partial candidate whose
      missing ingredient is named
- [ ] A variant needing 2× a card with only 1 instance submitted → remaining count
      reported missing, not satisfied
- [ ] Two distinct instances of the same `cardId` satisfy a 2× requirement; one
      instance never fills both slots
- [ ] Ingredient permitted only on battlefield, instance in graveyard → wrong-zone,
      and the candidate is not complete
- [ ] Instance on the stack → wrong-zone for every ingredient, never compatible
- [ ] Unresolved template present in a variant → that variant is never returned as
      complete, in any mode
- [ ] Lookup mode with intent and an attached card returns only variants containing
      that card; lookup with intent and no card returns nothing; lookup with a card
      and no intent returns nothing
- [ ] A question naming a submitted card restricts partial candidates to variants
      containing it; with no card named, submitted cards seed overlap ranking
- [ ] Matched instance on the battlefield carries the battlefield state string;
      the same ingredient when wrong-zone or missing carries the expected zone's
      state instead
- [ ] `mustBeCommander` present on every annotation kind, including missing
- [ ] Six variants eligible → exactly five returned, in the documented key order;
      two variants identical through popularity break by ascending variant id
- [ ] Identical request context and catalog produce identical selections and
      annotations across repeated calls

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook
npm --workspace apps/backend run typecheck
npm run lint
```

Vitest outermost `describe("Backend - Ask AI", …)`; nested suites name the area
(`Combo intent`, `Zone mapping`, `Candidate assignment`, `Ranking`).

## Files touched

- `apps/backend/src/commanderSpellbook/intent.ts` (new)
- `apps/backend/src/commanderSpellbook/intent.test.ts` (new)
- `apps/backend/src/commanderSpellbook/zones.ts` (new)
- `apps/backend/src/commanderSpellbook/zones.test.ts` (new)
- `apps/backend/src/commanderSpellbook/matcher.ts` (new)
- `apps/backend/src/commanderSpellbook/matcher.test.ts` (new)
