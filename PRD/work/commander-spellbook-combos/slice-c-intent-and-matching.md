# Slice C — Combo intent detection and deterministic matching

## Status: done

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

- [x] `"Does this combo go infinite?"`, `"is this a loop"`, `"win condition"`,
      and `"COMBOS"` all detect intent; `"good synergy"`, `"how does this
      interaction work"`, and `"works with my commander"` do not
- [x] `"comboing"` and `"discombobulate"` do not match `combo` (boundary check)
- [x] Game mode, no intent, all three ingredients present in compatible zones →
      one complete candidate returned
- [x] Game mode, no intent, two of three ingredients present → no candidate
- [x] Game mode, explicit intent, two of three present → partial candidate whose
      missing ingredient is named
- [x] A variant needing 2× a card with only 1 instance submitted → remaining count
      reported missing, not satisfied
- [x] Two distinct instances of the same `cardId` satisfy a 2× requirement; one
      instance never fills both slots
- [x] Ingredient permitted only on battlefield, instance in graveyard → wrong-zone,
      and the candidate is not complete
- [x] Instance on the stack → wrong-zone for every ingredient, never compatible
- [x] Unresolved template present in a variant → that variant is never returned as
      complete, in any mode
- [x] Lookup mode with intent and an attached card returns only variants containing
      that card; lookup with intent and no card returns nothing; lookup with a card
      and no intent returns nothing
- [x] A question naming a submitted card restricts partial candidates to variants
      containing it; with no card named, submitted cards seed overlap ranking
- [x] Matched instance on the battlefield carries the battlefield state string;
      the same ingredient when wrong-zone or missing carries the expected zone's
      state instead
- [x] `mustBeCommander` present on every annotation kind, including missing
- [x] Six variants eligible → exactly five returned, in the documented key order;
      two variants identical through popularity break by ascending variant id
- [x] Identical request context and catalog produce identical selections and
      annotations across repeated calls

## Verification evidence

Recorded 2026-08-11 on the implementation worktree.

- `npm --workspace apps/backend run test -- commanderSpellbook` — 60/60 pass
  across `intent.test.ts` (20), `zones.test.ts` (4), `catalog.test.ts` (11),
  `matcher.test.ts` (25).
- `npm --workspace apps/backend run typecheck` — clean.
- `npm run lint` — 0 errors.

### Design decisions inside the slice's latitude

Three points the slice doc left to implementation, resolved and pinned by tests
so slice D and E can depend on them:

1. **Exact ingredients claim instances before templates.** When a submitted card
   is both a named ingredient and a member of a template's authoritative oracle
   list, it fills the named slot. Otherwise a single instance could appear to
   satisfy two slots depending on iteration order.
2. **`ComboMatchInstance.zone` is optional.** A lookup-mode attached card is a
   card the user is *asking about*, not a card observed in a zone. Rather than
   fabricating a zone, an instance with no zone matches on identity and reports
   the ingredient's **expected** zone state. Game-mode instances always carry a
   zone, so this path never affects game matching.
3. **The anchor filter applies to partial candidates only.** The brief calls
   question-named cards "required anchors" while the acceptance criterion scopes
   the restriction to partials; a fully assigned candidate is self-evidently
   relevant, so it is ranked by anchor coverage but never filtered out by it.

### Wrong-zone vocabulary

`ComboIngredientAnnotation.wrongZones` uses TheJudge's `ZoneId` values rather
than Commander Spellbook's single-letter codes, because the stack has no upstream
equivalent and a card on the stack must still be reportable as wrongly zoned.
`permittedZones` and `occupiedZones` stay in the upstream vocabulary.

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
