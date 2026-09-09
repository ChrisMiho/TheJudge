# Slice E — Positional-int compact index in build and loader

## Status: planned

## Goal

The combo index stops repeating variant-id strings in every membership list
and instead lists each variant id once, so cold-start parsing of the fresh
index drops from ~47 MB of parsed JSON to ~12 MB — required, not optional,
since the fresh index is already twice today's committed size and grows
every weekly refresh.

## Requirements

1. `writeIndexArtifact` (in `scripts/build-commander-spellbook-combos.mjs`)
   writes `variantIds: string[]` once, in `variantId` order — every
   committed variant id, listed exactly once. A variant's integer position
   in this array becomes its id everywhere else in the index.
2. `byOracleId` and `byTemplateOracleId` membership lists change from arrays
   of variant-id strings to arrays of integer positions into `variantIds`.
3. The per-block `[offset, length]` directory (from slice A) stays as-is;
   per-variant `[blockIndex, lineIndex]` is not stored — it stays derived
   from position (`position >> 7`, `position & 127`), correct after any
   re-block.
4. `catalog.ts` builds a `Map<variantId, position>` at load and maps
   positions back to variant id strings, so the Maps it exposes today —
   `byOracleId` / `byTemplateOracleId` as `Map<oracleId, string[]>` — keep
   their exact `string[]` shape. The matcher (`matcher.ts` and anything
   consuming these Maps) is untouched; this is purely a wire-format change
   absorbed at load.
5. Template expansion metadata, unresolved-template metadata, and the
   source manifest keep their current shapes — unaffected by this
   compaction.

## Acceptance criteria

- [ ] E1 — the index writes `variantIds: string[]` once, in `variantId`
      order, with no variant id repeated elsewhere in the index
- [ ] E2 — `byOracleId` and `byTemplateOracleId` are written as arrays of
      integer positions, not variant-id strings
- [ ] E3 — `catalog.ts` maps positions back to variant ids at load, and
      `byOracleId` / `byTemplateOracleId` are still exposed as
      `Map<oracleId, string[]>` with byte-identical membership to
      pre-compaction output for the same fixture corpus
- [ ] E4 — the combo matcher and every consumer of these Maps is unchanged
      (no matcher-level test regression)
- [ ] E5 — `node --test scripts/build-commander-spellbook-combos.test.mjs`
      and the backend workspace catalog tests pass

## Verification

```bash
node --test scripts/build-commander-spellbook-combos.test.mjs
npm --workspace apps/backend run test -- catalog matcher
```

## Files touched

- `scripts/build-commander-spellbook-combos.mjs`
- `scripts/build-commander-spellbook-combos.test.mjs`
- `apps/backend/src/commanderSpellbook/catalog.ts`
- `apps/backend/src/commanderSpellbook/catalog.test.ts`
