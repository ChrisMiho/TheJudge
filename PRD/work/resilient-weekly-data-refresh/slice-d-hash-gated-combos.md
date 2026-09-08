# Slice D — Hash-gated combo reuse (final)

## Status: done

## Goal

The weekly run reuses the committed combo artifacts unless the card-identity set or
the combo template set changed; when either changed, it runs a full re-expansion of
every template and rewrites the marker. All bundled in the one command.

## Requirements

1. **Card-identity hash**: a deterministic hash over the sorted, de-duplicated set
   of Scryfall `oracle_id`s present in the freshly downloaded `default_cards`.
   Computed from data the run already parses; excludes all volatile fields
   (prices, images, etc. — identity only).
2. **Template-set hash**: a deterministic hash over the sorted set of distinct
   combo templates (template id + Scryfall query) from the variant export
   (`collectTemplates` already enumerates these).
3. **Committed marker** `apps/backend/data/commanderSpellbookComboSource.meta.json`
   stores both hashes (and, for human legibility, the export version/timestamp as
   non-authoritative context). It is git-tracked and travels with the `.gz`
   artifacts.
4. **Gate**: when both hashes equal the marker, the run performs no Scryfall
   template expansion and no combo rebuild, leaving
   `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
   byte-unchanged. When either differs, the run performs a **full re-expansion of
   every template** (not a subset), rebuilds both artifacts, and rewrites the
   marker to the new hashes.
5. **Safety**: if either hash cannot be computed (missing/unreadable input), treat
   it as changed and run the full refresh — never skip on missing inputs.
6. Refreshing combos remains human-approved network access (REQ-093/DEC-162); no
   test hits the live network.

## Acceptance criteria

- [ ] D1: card-identity hash is stable for the same oracle-id set regardless of
  order and unchanged by a price-only edit; changes when an oracle id is
  added/removed (unit test).
- [ ] D2: template-set hash is stable for the same template set and changes when a
  template id or query is added/changed (unit test).
- [ ] D3: both hashes match the marker ⇒ no template expansion call and no combo
  rebuild; the two `.gz` artifacts are left untouched (unit test over injected
  effects).
- [ ] D4: either hash differs ⇒ full template re-expansion runs and the marker is
  rewritten to the new hashes (unit test).
- [ ] D5: a missing/unreadable marker or uncomputable hash ⇒ treated as changed,
  full refresh runs (unit test).
- [ ] D6: `npm run quality:check` is green.

## Verification

```bash
node --test scripts/refresh-commander-spellbook-data.test.mjs scripts/refresh-scryfall-data.test.mjs
npm run quality:check
```

## Files touched

- `scripts/refresh-scryfall-data.mjs` (orchestration: compute card-identity hash,
  drive the gate)
- `scripts/refresh-commander-spellbook-data.mjs` (template-set hash; expansion gate)
- `scripts/build-commander-spellbook-combos.mjs` (skip rebuild + reuse committed
  `.gz` when the marker matches; rewrite marker when it rebuilds)
- `apps/backend/data/commanderSpellbookComboSource.meta.json` (new committed marker)
- corresponding `*.test.mjs`

## PRD promotion (applied at cleanup, from GATE-QUESTIONS.md)

- REQ-195 amend (combo hash-gating reference + the fail-loud criterion from Slice B).
- REQ-196 new (reserved id) — hash-gated combo reuse.
- integrations-and-data.md "Commander Spellbook Combo Data Strategy" — the
  hash-gated `data:refresh` line.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change (no runtime/API/UI change)
- [ ] No secrets committed
- [ ] Durable outcomes promoted (REQ-195 amend, REQ-196 new, integrations amend);
  `PRD/work/resilient-weekly-data-refresh/` ready to delete
