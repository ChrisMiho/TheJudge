# Slice B — Trim rulings artifact

## Status: planned

## Goal

Transform the raw Scryfall rulings bulk into a small, committed JSON map keyed by `oracle_id`, containing only WotC rulings for cards in `cardMetadata.json`.

## Depends on

- Slice A raw file **or** an existing committed `cardRulingsByOracleId.json` from a previous run (document which).
- [`apps/frontend/public/data/cardMetadata.json`](../../../apps/frontend/public/data/cardMetadata.json) must exist (`npm run data:build` for metadata if needed).

## Requirements

### New script: `scripts/build-card-rulings.mjs`

1. **Input:** `apps/backend/data/scryfall/rulings.json` (stream-parse JSON array).
2. **Filter:** `source === "wotc"` only.
3. **Group:** by `oracle_id` (string UUID).
4. **Intersect:** keep only oracle IDs that appear as `cardId` in `cardMetadata.json`.
5. **Sort:** per card, `published_at` descending (ISO date strings sort lexicographically).
6. **Output shape:**

```json
{
  "oracle-uuid-here": [
    { "publishedAt": "2020-04-17", "comment": "..." }
  ]
}
```

7. **Write:** `apps/backend/data/cardRulingsByOracleId.json` — **commit this file** to the repo.
8. **Stats:** log counts — parsed rows, wotc rows, cards with rulings, output bytes.

### Dropped data (intentional)

| Field / row | Reason |
| --- | --- |
| `source: "scryfall"` | Out of scope |
| Non-metadata `oracle_id` | User cannot select card in app |
| Scryfall ruling `id` | Not needed for lookup |
| Raw bulk file | Gitignored; not committed |

### Root `package.json`

- `data:build` runs metadata build **and** `build-card-rulings.mjs`.
- If raw `rulings.json` is missing but the committed artifact already exists, `build-card-rulings` should preserve or validate that artifact so `npm run data:build` works on clean checkout without network access.
- If both raw `rulings.json` and the committed artifact are missing, `build-card-rulings` should fail with a clear message pointing to slice A.

### Prerequisite: metadata oracle set

Build a `Set` of `cardId` from `cardMetadata.json` (each entry’s `cardId` is Scryfall `oracle_id` when available).

## Implementation notes

- Reuse streaming object parser patterns from [`scripts/build-card-metadata.mjs`](../../../scripts/build-card-metadata.mjs).
- Normalize `comment` whitespace (trim; collapse internal runs if needed).
- Empty comment lines: skip.
- Cards with zero WotC rulings after filter: omit from output map (do not emit `[]` keys unless you document a reason — prefer omit).

## Acceptance criteria

- [ ] `npm run data:build` produces `apps/backend/data/cardRulingsByOracleId.json`
- [ ] Committed artifact is reasonable size (intersect shrinks vs full bulk)
- [ ] Spot-check: a known card in metadata (e.g. Lightning Bolt) has expected ruling text if WotC data exists
- [ ] Script is idempotent (same input → same output)
- [ ] Root README updated in slice D (or here if B completes alone): documents `data:build` / refresh behavior

## Files

- `scripts/build-card-rulings.mjs` (new)
- [`package.json`](../../../package.json)
- `apps/backend/data/cardRulingsByOracleId.json` (new, committed)
- [`apps/frontend/public/data/cardMetadata.json`](../../../apps/frontend/public/data/cardMetadata.json) (read-only input)

## Next slice

[slice-c-backend-prompt.md](slice-c-backend-prompt.md)
