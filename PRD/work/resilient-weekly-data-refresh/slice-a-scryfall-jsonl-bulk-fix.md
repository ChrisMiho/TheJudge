# Slice A — Scryfall JSONL bulk download fix

## Status: planned

## Goal

Make `data:refresh` download the Scryfall `default_cards` and `rulings` bulk data
again by reading `jsonl_download_uri` and converting the gzipped JSONL into the
JSON array the downstream builders already consume.

## Requirements

1. `createBulkDownloadTargets` (`scripts/refresh-scryfall-data.mjs`) reads
   `record.jsonl_download_uri` for each bulk config, falling back to
   `record.download_uri` when a record still carries it (forward-safe), and only
   throws "Could not find … download URI" when neither is present.
2. The download path decompresses the gzip JSONL and writes a JSON **array** to
   the existing `outputPath` (`default-cards.json`, `rulings.json`) — one array
   element per JSONL line — so `build-card-metadata`, `build-card-detail-by-oracle-id`,
   and `build-card-rulings` consume it unchanged.
3. Conversion streams line-by-line (never buffers the whole ~600MB decompressed
   document as one string) and writes to the temp path then renames, preserving
   the atomic-write pattern already used.
4. Empty/blank trailing lines are skipped; malformed lines fail the download
   (they must not silently truncate the corpus).

## Acceptance criteria

- [ ] A1: `createBulkDownloadTargets` returns the target when a record has only
  `jsonl_download_uri`, still works when a record has only `download_uri`, and
  throws only when neither is present (unit test over a fixture payload).
- [ ] A2: a JSONL→array stream conversion helper turns a small multi-line JSONL
  fixture into a valid JSON array parseable by `JSON.parse`, skipping blank lines
  (unit test).
- [ ] A3: `node --test scripts/refresh-scryfall-data.test.mjs` passes.
- [ ] A4: no test performs a live network fetch (fetch is injected/mocked).

## Verification

```bash
node --test scripts/refresh-scryfall-data.test.mjs
```

## Files touched

- `scripts/refresh-scryfall-data.mjs`
- `scripts/refresh-scryfall-data.test.mjs`
- possibly `scripts/lib/` (a small JSONL streaming helper, if extracted for reuse)
