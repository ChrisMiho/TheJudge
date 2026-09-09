# Slice A — Combo block layout + index directory in the build script

## Status: done

## Goal

`scripts/build-commander-spellbook-combos.mjs` groups the sorted combo
variants into fixed 128-variant blocks, brotli-compresses each block as one
member, and writes the combined index's block directory — so a combo detail
lookup can later decode one ~230 KB block instead of holding or scanning the
whole corpus.

## Requirements

1. `serializeVariantDetail` groups variants (in `variantId` order) into
   blocks of 128; records inside a block are newline-delimited JSON, one
   variant per line. Each block is brotli-compressed as one member
   (`BROTLI_PARAM_QUALITY = 11`, `BROTLI_PARAM_SIZE_HINT` set to the block's
   raw byte length, no `dictionary` option). The function returns the
   concatenated buffer of all block members, the block directory
   (`[{ offset, length }]` byte ranges into that buffer, in block order),
   and each variant's integer position (its index in the sorted variant
   list — block `p >> 7`, line `p & 127`).
2. Build writes the concatenated buffer to
   `apps/backend/data/commanderSpellbookComboBlocks.br`.
3. `writeIndexArtifact` writes `apps/backend/data/commanderSpellbookComboIndex.json.br`
   — minified, brotli-compressed (same fixed params) — carrying the block
   directory plus everything the index carries today (oracle/template
   membership, template expansion metadata, unresolved-template metadata,
   source manifest). Membership stays keyed by variant id **string** in this
   slice; the positional-int compaction is slice E, not here.
4. `trimCommittedArtifacts` re-blocks instead of splicing: filter the
   variant list to survivors, re-run the block serializer over the filtered
   sorted list, and rewrite both the blocks file and the index through the
   same code path a fresh build uses.
5. Brotli params are fixed and named constants, not zlib defaults, so
   identical raw input yields identical bytes across Node 22 (CI), 24
   (Lambda), and 26 (local).

## Acceptance criteria

- [x] A1 — `serializeVariantDetail` groups variants into 128-variant NDJSON
      blocks in `variantId` order, one brotli member per block
- [x] A2 — build writes `apps/backend/data/commanderSpellbookComboBlocks.br`
      as the concatenation of those brotli block members
- [x] A3 — build writes `apps/backend/data/commanderSpellbookComboIndex.json.br`
      carrying a block directory (`blocks: [{ offset, length }]`) that
      correctly locates each block inside the blocks file
- [x] A4 — `--trim-committed` re-blocks (filter survivors → re-serialize →
      rewrite) rather than splicing, and its test passes
- [x] A5 — brotli quality and size-hint params are fixed, named constants
      with no `dictionary` option (grep confirms no `zlib.constants.*DICTIONARY*`
      usage and explicit `BROTLI_PARAM_QUALITY` / `BROTLI_PARAM_SIZE_HINT`)
- [x] A6 — `node --test scripts/build-commander-spellbook-combos.test.mjs`
      passes

## Verification

```bash
node --test scripts/build-commander-spellbook-combos.test.mjs
grep -n "BROTLI_PARAM_QUALITY\|BROTLI_PARAM_SIZE_HINT" scripts/build-commander-spellbook-combos.mjs
```

## Files touched

- `scripts/build-commander-spellbook-combos.mjs`
- `scripts/build-commander-spellbook-combos.test.mjs`
