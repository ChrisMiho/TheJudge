# Slice A — Scryfall rulings download

## Status: planned

## Goal

Download the Scryfall **rulings** bulk file to a gitignored local path so slice B can trim and commit the artifact.

## Human approval gate (required)

**Do not run any download command until the product owner explicitly approves in chat.**

Before asking for approval, tell the human:

- You will fetch Scryfall bulk type `rulings` (~24 MB uncompressed per Scryfall docs).
- Whether `npm run data:refresh` will also re-download `default_cards` (~515 MB) or only rulings (prefer a rulings-only path if extending the script allows).
- Where the file will be saved: `apps/backend/data/scryfall/rulings.json`.

After approval, record in this file (below **Approval record**):

- Date (ISO)
- Approver name or “product owner”
- Exact command(s) run

If approval is denied, set status to **blocked** and stop; slices B/C may still proceed if `rulings.json` or committed `cardRulingsByOracleId.json` already exists.

## Requirements

1. Extend [`scripts/refresh-scryfall-data.mjs`](../../../scripts/refresh-scryfall-data.mjs) (or add a sibling script invoked by `data:refresh`) to:
   - `GET https://api.scryfall.com/bulk-data`
   - Find entry with `type === "rulings"`
   - Download `download_uri` to `apps/backend/data/scryfall/rulings.json` (use `.tmp` + rename pattern like default cards)
2. Add gitignore entry for:
   - `apps/backend/data/scryfall/rulings.json`
   - `apps/backend/data/scryfall/rulings.json.tmp` (if used)
3. Log to console: Scryfall `updated_at`, downloaded byte size, output path.
4. Do **not** commit the raw bulk file.

## Optional: default_cards in same run

If `data:refresh` still downloads `default-cards.json`, that also requires the same human approval in this slice (one approval can cover both if the human agrees).

## Commands (after approval only)

```bash
# Example — exact script name may differ after implementation
npm run data:refresh
# OR rulings-only helper if split:
# node scripts/refresh-scryfall-rulings.mjs
```

## Acceptance criteria

- [ ] Human approval recorded below
- [ ] `apps/backend/data/scryfall/rulings.json` exists locally
- [ ] File is gitignored
- [ ] No Scryfall download runs without approval in the implementing session

## Approval record

| Field | Value |
| --- | --- |
| Approved | _pending_ |
| Date | _pending_ |
| Commands run | _pending_ |
| Rulings file size | _pending_ |
| Scryfall `updated_at` | _pending_ |

## Files

- [`scripts/refresh-scryfall-data.mjs`](../../../scripts/refresh-scryfall-data.mjs)
- [`.gitignore`](../../../.gitignore)

## Next slice

[slice-b-trim-artifact.md](slice-b-trim-artifact.md)
