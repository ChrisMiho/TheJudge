# Slice B — Catalog loader for the block layout

## Status: done

## Goal

`apps/backend/src/commanderSpellbook/catalog.ts` reads a combo variant's
detail by decoding only its own block, using the block layout and directory
slice A wrote — so a lookup's resident memory stays bounded to one ~230 KB
block, matching DEC-162.

## Requirements

1. `readVariantDetail` computes a variant's position (from the loaded
   `variantIds` list / a `Map<variantId, position>` built at load), derives
   its block index (`position >> 7`) and line index (`position & 127`),
   looks up that block's `{ offset, length }` from the index's block
   directory, reads that byte range from
   `apps/backend/data/commanderSpellbookComboBlocks.br` through a file
   handle, brotli-decodes just that block, splits on newline, and parses the
   one line at the computed line index.
2. Per-variant validation (whatever shape checks run today on a decoded
   variant) and the existing 64-entry LRU cache are preserved unchanged.
3. The load-time structural check changes from whatever it validated for
   per-variant gzip to: every block directory entry's `[offset, length]`
   fits inside the blocks file (no range exceeds file size, no negative or
   overlapping-past-EOF range).
4. Optional: cache the last decoded block, since up to five combos can enter
   one prompt and adjacent lookups may share a block. This is a measured
   optimization, not a contract — keep it only if it measurably helps;
   dropping it is not a slice failure.
5. In-memory Maps (`byOracleId`, `byTemplateOracleId`) and every route
   response stay byte-identical to today — this slice changes storage
   access, not any exposed shape or behavior.
6. This slice reads the index shape slice A wrote (block directory present;
   membership still keyed by variant id string — the positional-int
   compaction lands in slice E, which will touch this same loader again).

## Acceptance criteria

- [x] B1 — `readVariantDetail` reads only the requested variant's block byte
      range (not the whole file), brotli-decodes that one block, and
      returns the correct variant by position/line arithmetic
- [x] B2 — the 64-entry LRU cache and per-variant validation are preserved
      unchanged in behavior
- [x] B3 — the load-time structural check validates every block directory
      range fits inside the blocks file
- [x] B4 — `byOracleId` / `byTemplateOracleId` Maps and route responses are
      byte-identical to pre-slice output for the same fixture corpus
- [x] B5 — `node --test apps/backend/src/commanderSpellbook/catalog.test.ts`
      (or the workspace test runner) passes

## Verification

```bash
npm --workspace apps/backend run test -- catalog
```

## Files touched

- `apps/backend/src/commanderSpellbook/catalog.ts`
- `apps/backend/src/commanderSpellbook/catalog.test.ts`
