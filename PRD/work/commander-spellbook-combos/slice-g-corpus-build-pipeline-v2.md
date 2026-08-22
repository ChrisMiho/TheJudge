# Slice G — Corpus build pipeline: bulk export, camelCase, lazy-access storage

## Status: planned

## Goal

Replace slice A outright. Make the build pipeline parse real upstream data
correctly, source it from the unthrottled bulk export instead of the
throttled paginated walk, wire the refresh into `data:refresh`, and emit the
detail artifact in the lazy-access storage format slice H depends on.

## Requirements

1. REQ-093, DEC-162 — bulk export (`https://json.commanderspellbook.com/variants.json.gz`)
   is the sole variant source; the paginated REST walk is removed.
2. REQ-093, DEC-162 — the build reads upstream's actual **camelCase** wire
   field names, never the snake_case names its Python serializers declare.
3. REQ-093, DEC-162 — invoking `npm run data:refresh` is the human approval
   REQ-093 requires; the combo download runs inside that chain, not only
   behind the standalone script's own `--confirm-live-calls`.
4. REQ-093 — build fixtures are derived from a real upstream response, never
   hand-authored, so a future wire-format rename fails the suite instead of
   passing it silently.
5. Slice H's lazy per-variant loader needs the detail artifact laid out as
   individually-gzip-compressed records with a byte-offset directory — this
   slice is what emits that layout; it is not an optimization slice H can
   retrofit on its own.

## Acceptance criteria

- [ ] G1 — `scripts/refresh-commander-spellbook-data.mjs`'s `VARIANTS_ENDPOINT`
      is the bulk export URL; the paginated cursor walk and its
      resume-from-staged-pages machinery for variants are removed.
- [ ] G2 — the retry/backoff helpers (`backoffDelayMs`, `parseRetryAfterMs`,
      `RETRYABLE_STATUSES`) are retained and still exercised by the Scryfall
      template-expansion calls, which still paginate.
- [ ] G3 — `scripts/build-commander-spellbook-combos.mjs` reads `zoneLocations`,
      `card.oracleId`, `mustBeCommander`, and `template.scryfallApi` — the
      snake_case reads at the equivalent of the current `zone_locations`
      (`:115,117`), `card.oracle_id` (`:137,139`), `must_be_commander`
      (`:153,183`), and `template.scryfall_api` (`:169,172`) call sites are
      gone, and the existing partial `mana_needed`/`easy_prerequisites`/
      `notable_prerequisites` → camelCase map is completed rather than
      duplicated.
- [ ] G4 — running the build against a fixture built from a **real** upstream
      bulk-export excerpt succeeds and produces a non-empty corpus; a fixture
      still in the old snake_case shape fails the build loudly.
- [ ] G5 — `apps/backend/src/commanderSpellbook/__fixtures__/` fixtures are
      regenerated from real upstream bytes, not hand-authored.
- [ ] G6 — the detail artifact
      (`apps/backend/data/commanderSpellbookCombos.json.gz`) is emitted as
      concatenated, individually-gzip-compressed per-variant JSON records —
      not one gzip stream wrapping a single JSON array.
- [ ] G7 — the index artifact
      (`apps/backend/data/commanderSpellbookComboIndex.json.gz`) carries a
      `variantId → { offset, length }` byte-offset directory into the detail
      artifact, alongside the existing oracle-membership and
      template-expansion data.
- [ ] G8 — `npm run data:refresh` runs the combo download as one step of its
      existing chain (alongside Scryfall bulk data, rulings, and Comprehensive
      Rules); the standalone `data:refresh-combos` script is unchanged and
      still refuses to run without `--confirm-live-calls`.
- [ ] G9 — a build-side test asserts the eval catalog's (slice E, untouched)
      variant/ingredient key shape matches the real build's output key shape,
      so slice E stays a valid conformance reference without ever being
      pointed at production data.
- [ ] G10 — a failed or empty refresh/build never overwrites a valid committed
      snapshot (existing behavior, reconfirmed against the new source).

## Verification

```bash
node scripts/build-commander-spellbook-combos.mjs
npm run test:scripts
npm --workspace apps/backend run typecheck
npm run lint
```

## Files touched

- `scripts/refresh-commander-spellbook-data.mjs`
- `scripts/build-commander-spellbook-combos.mjs`
- `scripts/refresh-scryfall-data.mjs` (adds the combo step to the `data:refresh` chain)
- `package.json` (`data:refresh` wiring, if the chain isn't already scripted entirely inside `refresh-scryfall-data.mjs`)
- `apps/backend/src/commanderSpellbook/__fixtures__/*`
- `apps/backend/data/commanderSpellbookCombos.json.gz`, `apps/backend/data/commanderSpellbookComboIndex.json.gz` (regenerated from fixture-scale input during this slice; the real production corpus is a separate owner-approved action, see slice J)
