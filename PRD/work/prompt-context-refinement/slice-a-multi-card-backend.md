# Slice A — Multi-card lookup: backend contract, prompt, retrieval, combo matching

## Status: done

## Goal

Quick Question's lookup request carries a bounded list of up to 5 cards
instead of one optional card; the backend enriches every attached card
(metadata + WotC rulings), scores rule retrieval over the question plus all
attached cards, and combo enrichment qualifies-on-any-one with attached-card
coverage ranking, explaining a complete combo or naming the missing piece for
a partial one. Backend-only; the pre-submit UI ships in slice B.

## Requirements

REQ-167 (backend acceptance criteria), REQ-094 (amended `mode: "lookup"`
criterion), REQ-095 (verify existing rendering covers the new complete/partial
classification — no new criterion expected).

1. `askAiRequest.ts` — the lookup branch's optional single `card` becomes a
   bounded list (`cards`, max 5, `lookupCardReferenceSchema` per entry, no
   zone/owner/caster/targets/context-notes fields). Zero cards and exactly one
   card behave identically to today.
2. `types/index.ts` — `LookupPromptContext.card?: LookupPromptCard` becomes
   `cards?: LookupPromptCard[]`.
3. `context.ts` — `buildLookupPromptContext` normalizes the card array
   (replace `normalizeLookupCard` with an array-aware equivalent).
4. `preparation.ts` — `prepareLookupPromptInput`: `cardsForRulings` collects
   every attached card; the System 3 query
   (`buildQueryTokensFromParts`) scores over every attached card's oracle text
   + type line, not just one; `resolveLookupComboCandidates` builds one
   `ComboMatchInstance` per attached card (zero, one, or up to five).
5. `commanderSpellbook/matcher.ts` — for `mode: "lookup"`: a candidate
   qualifies when it contains at least one attached card as an exact
   ingredient or authoritative template match (qualify-on-any-one); candidates
   covering more attached cards rank ahead of those covering fewer
   (attached-card coverage), before popularity. A candidate is **complete**
   when every ingredient slot is filled by a match somewhere in the attached
   set (REQ-094's zone-compatibility and required-quantity/distinct-instance
   checks do not apply — lookup carries no zones or per-card quantities), and
   **partial** when it qualifies but at least one slot is unmatched. Selection
   order: complete before partial, attached-card coverage descending, fewer
   missing ingredients, popularity descending, variant id ascending. Zero
   cards attached retrieves no combo data; exactly one card attached is
   identical to today (coverage is uniform, ordering collapses to today's
   popularity/variant-id).
6. `commanderSpellbook/formatting.ts` — verify REQ-095's existing
   present/missing rendering already covers the new lookup complete/partial
   classification (zone-specific rows render empty for lookup); "what would
   fill the missing role" is the missing ingredient's own name (exact) or
   template/category description (template) from the combo catalog — never a
   card recommendation.
7. Eval fixtures under `apps/backend/src/eval/fixtures/`: multi-card lookup
   (metadata + rulings + System 3 query pinned), a multi-card combo-complete
   case, a multi-card combo-partial case (missing role named), plus the
   existing single-card and no-card lookup fixtures re-verified unchanged.

## Acceptance criteria

- [x] A1 — The lookup request schema accepts an optional bounded list of at
  most 5 oracle-level cards in place of the single optional `card`; a 6th card
  is rejected by validation.
- [x] A2 — Zero cards attached and exactly one card attached produce output
  identical to today's no-card and single-card lookup (metadata, rulings,
  System 3 query, combo retrieval).
- [x] A3 — With 2+ cards attached, per-card full metadata and per-card WotC
  rulings appear for every attached card, and the System 3 supplemental
  retrieval query is built from the question plus every attached card's
  oracle text and type line.
- [x] A4 — Combo retrieval for `mode: "lookup"` qualifies a candidate on
  containing at least one attached card, ranks candidates covering more
  attached cards ahead of those covering fewer (before popularity), and
  classifies a candidate complete only when every ingredient slot is filled
  somewhere in the attached set.
- [x] A5 — A complete lookup combo candidate's rendered answer explains the
  assembled combo; a partial candidate names each missing ingredient and
  describes what would fill that role (its own identity/template/category
  from the combo catalog) — never a card recommendation.
- [x] A6 — Eval fixtures cover multi-card lookup (metadata/rulings/System 3
  query), multi-card combo-complete, and multi-card combo-partial; existing
  single-card and no-card lookup goldens are unchanged.
- [x] A7 — `npm --workspace apps/backend run test`, `npm --workspace
  apps/backend run test:eval`, and `npm run quality:check` all pass.

## Verification

```bash
npm --workspace apps/backend run test
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/validation/askAiRequest.ts`, `askAiRequest.test.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/prompt/context.ts`, `context.test.ts`
- `apps/backend/src/prompt/preparation.ts`, `preparation.test.ts`
- `apps/backend/src/commanderSpellbook/matcher.ts`, `matcher.test.ts`
- `apps/backend/src/commanderSpellbook/formatting.ts`, `formatting.test.ts`
- `apps/backend/src/prompt/comboPromptIntegration.test.ts`
- `apps/backend/src/eval/fixtures/quick-lookup-*`,
  `apps/backend/src/eval/fixtures/commander-spellbook-lookup-*` (new
  multi-card + combo-complete/partial fixtures; existing goldens re-verified)
