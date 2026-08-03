# Slice B — Fail-open runtime catalog loader

## Status: planned

## Dependencies

- Slice A — consumes and validates the exact `schemaVersion: 1` detail/index artifact pair produced there.

## Goal

Establish one typed, validated, warn-once runtime catalog boundary that turns valid committed artifacts into readonly lookup maps and disables only combo enrichment on artifact failure.

## Requirements

1. Add `apps/backend/src/commanderSpellbook/types.ts` as the single authoritative runtime definition for source metadata, exact/template ingredients, template expansion status/source, variant detail, catalog shape, and later match annotations. Reuse `ZoneId` and exclude `stack` for compatible starting zones rather than duplicating the request-zone vocabulary.
2. Add `apps/backend/src/commanderSpellbook/catalog.ts` exporting:
   - `EMPTY_COMMANDER_SPELLBOOK_CATALOG`;
   - `normalizeCommanderSpellbookCatalog(detailValue, indexValue)` for tests and eval-owned fixtures;
   - `loadCommanderSpellbookCatalog(combosPath, indexPath)` for startup file loading.
3. Validate both top-level objects, `schemaVersion === 1`, equal non-empty `snapshotId`, non-empty reviewed variants, unique variant ids, valid quantities/zones/statuses, existing variant references from the inverse index, resolved/unresolved template invariants, sorted/unique oracle and variant lists, and every template id referenced by a variant.
4. Normalize into readonly maps named `variantsById`, `variantIdsByOracleId`, and `templateExpansionsById`. Preserve source metadata and snapshot id on the catalog for diagnostics/startup counts. Never mutate parsed artifact arrays/objects.
5. Missing, empty, malformed, schema-mismatched, snapshot-mismatched, or cross-reference-invalid artifacts return `EMPTY_COMMANDER_SPELLBOOK_CATALOG`. Emit one `console.warn` per failing file path for the process lifetime, mirroring `cardRulings.ts` / `gameRules.ts`; repeat loads of the same failing path do not repeat the warning.
6. Loading is synchronous at backend startup only. This slice adds no request-time file read, network fallback, app/route wiring, prompt formatting, response field, or frontend code.
7. Add `catalog.test.ts` with outer suite `Backend - Ask AI`, using unique temporary directories per failure case and console spies restored after each test.

## Acceptance criteria

- [ ] `npm --workspace apps/backend run test -- src/commanderSpellbook/catalog.test.ts` loads a valid paired fixture into all three maps with preserved source/snapshot metadata and deterministic map/list order.
- [ ] The targeted test rejects missing detail, missing index, invalid JSON, empty variants, wrong schema version, mismatched snapshot ids, duplicate ids, dangling variant/template references, invalid zones/quantities/statuses, and resolved templates with empty oracle ids.
- [ ] Every rejected case returns the shared empty catalog and performs no partial normalization.
- [ ] Loading the same missing/corrupt path twice produces exactly one warning for that path; a distinct failing path produces its own warning.
- [ ] A source scan confirms `catalog.ts` uses only `node:fs` reads and contains no `fetch`, HTTP client, or runtime refresh path.
- [ ] `npm --workspace apps/backend run typecheck` passes with the new types and loader isolated from request/response schemas.

## Verification

```bash
npm --workspace apps/backend run test -- src/commanderSpellbook/catalog.test.ts
npm --workspace apps/backend run typecheck
rg -n "fetch|https?://" apps/backend/src/commanderSpellbook/catalog.ts
```

The final `rg` command is expected to return no matches.

## Files touched

- `apps/backend/src/commanderSpellbook/types.ts` (new)
- `apps/backend/src/commanderSpellbook/catalog.ts` (new)
- `apps/backend/src/commanderSpellbook/catalog.test.ts` (new)
