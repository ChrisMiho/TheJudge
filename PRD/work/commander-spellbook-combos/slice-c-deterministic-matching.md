# Slice C — Deterministic intent, matching, and ranking

## Status: planned

## Dependencies

- Slice B — consumes `CommanderSpellbookCatalog`, normalized variant/template types, and the shared empty catalog.

## Goal

Select at most five eligible Commander Spellbook variants deterministically for game and lookup requests, with quantity-aware distinct-instance assignment and complete prompt-ready annotations.

## Requirements

1. Add `intent.ts` exporting `hasExplicitComboIntent(question: string): boolean`. Normalize case/whitespace and use literal word/phrase boundaries for `combo`, `combos`, `infinite`, `go infinite`, `goes infinite`, `loop`, and `win condition`. Do not trigger on substrings or broad terms such as `synergy`, `interaction`, or `works with` alone.
2. Add `matcher.ts` exporting `selectCommanderSpellbookMatches({ request, context, catalog }): CommanderSpellbookMatch[]`. Keep it pure: no file reads, logging, network, prompt text, model call, or mutation of request/context/catalog.
3. Convert normalized prompt context into stable submitted instances (`zone + index + cardId + name`). Preserve `orderedStack` bottom-to-top order and canonical non-stack zone order. A stack instance may identity-match but is incompatible with every Commander Spellbook starting zone.
4. Candidate gathering uses only `variantIdsByOracleId` for submitted/attached oracle ids; it never scans the full corpus per request. Deduplicate candidate ids and resolve them in stable variant-id order before matching.
5. Flatten exact and template ingredient quantities into stable slots. For resolved template slots, build identity edges from `templateExpansionsById`; unresolved templates have no assignment edges. Use deterministic maximum-cardinality bipartite matching for compatible-zone edges, then an identity-only pass over remaining slots/instances for wrong-zone annotations. One submitted instance may satisfy at most one slot across both passes.
6. Emit non-overlapping annotations:
   - `presentExact` for compatible exact-card assignments;
   - `matchedTemplates` for compatible resolved-template assignments;
   - `wrongZone` for remaining identity assignments in incompatible zones, retaining exact/template kind and expected zones;
   - `missing` for unmatched exact or resolved-template slots, grouped back to quantities;
   - `unresolvedTemplates` for unresolved template slots/quantities.
7. `complete` means every quantity slot has a compatible assignment and no unresolved template. Mana availability, `mustBeCommander`, zone-state prose, legality, commander status, card state, and prerequisites are never evaluated; retain them only on the source variant for Slice D formatting.
8. Game eligibility:
   - without explicit intent, return complete candidates only and mark `trigger: "automatic"`;
   - with explicit intent, include complete then partial candidates and mark `trigger: "explicit"`;
   - detect submitted card names in the question by case-insensitive escaped literal matching with non-alphanumeric boundaries;
   - every partial candidate must cover every named submitted-card anchor; when no submitted name is present, every partial must overlap at least one submitted oracle identity.
9. Lookup eligibility requires explicit intent plus `context.card`. Every candidate contains that card exactly or through a resolved template. No attached card, no intent, or an unrelated attached card returns `[]`.
10. Rank lexicographically by: complete first; required-anchor coverage descending; compatible assigned slot count descending; missing/unresolved slot count ascending; popularity descending with null/non-finite treated as zero; stable variant id ascending. Slice to five only after the full comparator. Identical inputs must produce deeply equal results.
11. Add focused tests under outer suite `Backend - Ask AI`. Fixtures must include an exact/template overlap case where naïve greedy matching would fail, duplicate quantity with too few instances, stack wrong-zone behavior, multiple named anchors, null popularity, ties beyond five, and an unresolved template.

## Acceptance criteria

- [ ] `intent.test.ts` passes every approved positive phrase across case/punctuation variants and proves substring/broad-language non-triggers.
- [ ] `matcher.test.ts` proves a complete game candidate appears without combo language only when every quantity slot receives a distinct compatible instance.
- [ ] The matcher test proves maximum matching resolves an exact-plus-flexible-template overlap that a greedy allocator would misclassify, and proves no instance is reused.
- [ ] Explicit game tests prove complete-first behavior, partial annotations, all named anchors required for partials, and overlap seeding when no card name is mentioned.
- [ ] Lookup tests prove explicit-attached exact and template candidates, missing-piece annotations, and exclusion for no intent, no card, or unrelated card.
- [ ] Zone tests prove all six canonical upstream zones, stack-as-wrong-zone, compatible versus wrong-zone annotations, and grouped missing quantities.
- [ ] Ranking tests prove every comparator key in order, null popularity handling, stable variant-id ties, exact top-five truncation, and deep equality across repeated calls.
- [ ] Tests prove unresolved templates prevent complete classification but remain labeled on explicit partial candidates.
- [ ] A source scan confirms no legality, mana, commander, card-state, or prerequisite field influences eligibility/classification/ranking.
- [ ] `npm --workspace apps/backend run typecheck` passes without changing validation or public request/response types.

## Verification

```bash
npm --workspace apps/backend run test -- src/commanderSpellbook/intent.test.ts src/commanderSpellbook/matcher.test.ts
npm --workspace apps/backend run typecheck
git diff -- apps/backend/src/validation/askAiRequest.ts apps/backend/src/types/index.ts
```

The final `git diff` command is expected to show no Slice C changes to public contract files.

## Files touched

- `apps/backend/src/commanderSpellbook/intent.ts` (new)
- `apps/backend/src/commanderSpellbook/intent.test.ts` (new)
- `apps/backend/src/commanderSpellbook/matcher.ts` (new)
- `apps/backend/src/commanderSpellbook/matcher.test.ts` (new)
- `apps/backend/src/commanderSpellbook/types.ts` (extend only with match/annotation types consumed by matcher and formatter)
