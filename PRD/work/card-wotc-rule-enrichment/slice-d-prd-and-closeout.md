# Slice D — PRD promotion and closeout

## Status: planned

## Goal

Record durable product decisions, update integration docs, verify quality gates, and remove this ephemeral work folder.

## Depends on

- Slices A, B, C complete (or A skipped with documented approval/raw-file note).

## Requirements

### `PRD/sections/decisions.md`

Add **DEC-###** (next available ID) covering at minimum:

- WotC rulings are injected into the backend prompt only (not shown in UI).
- Source: Scryfall bulk `rulings`, static committed map `apps/backend/data/cardRulingsByOracleId.json`.
- Filter: `wotc` source only; intersect with `cardMetadata` oracle IDs.
- Lookup at `preparePromptInput` on existing `POST /api/ask-ai` — no new endpoint.
- Prompt section title and placement (after zones, before SCOPE).
- Caps: per-card count, comment length, section budget; omission when no data.
- Scryfall download requires human approval for refresh workflows.

### `PRD/sections/integrations-and-data.md`

Under **AI Prompt Context Rules**, add bullets for:

- Official WotC rulings block (reference only; does not override user stack/state).
- Static file path and build commands (`data:build`, `data:refresh` after approval).
- `cardId` / `oracle_id` lookup semantics.

### Root `README.md`

- Document rulings artifact and that `data:refresh` downloads Scryfall data (approval for agents).
- Note committed `cardRulingsByOracleId.json` so CI works without download.

### Verification

```bash
npm run quality:check
```

Optional spot-check:

```bash
npm run dev
# Submit a stack with a card known to have WotC rulings; inspect logs if LOG_PAYLOADS / prompt diagnostics enabled
```

### Closeout per `doc-lifecycle.md`

1. Confirm [GAMEPLAN.md verification checklist](GAMEPLAN.md#verification-checklist) complete.
2. Update [README.md](README.md) slice table — all **complete** with date.
3. **Delete** entire folder `PRD/work/card-wotc-rule-enrichment/`.
4. Do **not** add this folder to `PRD/README.md` active work table unless navigation guidance changed (default: no link).

## Acceptance criteria

- [ ] DEC-### merged in `decisions.md`
- [ ] `integrations-and-data.md` updated
- [ ] Root `README.md` updated
- [ ] `quality:check` green
- [ ] Work folder deleted
- [ ] No stale references to this package in code comments (optional grep)

## Files

- [`PRD/sections/decisions.md`](../../sections/decisions.md)
- [`PRD/sections/integrations-and-data.md`](../../sections/integrations-and-data.md)
- [`README.md`](../../../README.md)
- This work package (delete when done)
