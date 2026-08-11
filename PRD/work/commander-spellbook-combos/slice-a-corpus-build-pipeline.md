# Slice A — Corpus refresh and build pipeline

## Status: planned

## Goal

Produce the two committed Commander Spellbook artifacts from a human-approved
network refresh through a deterministic offline build.

## Requirements

1. `scripts/refresh-commander-spellbook-data.mjs` retrieves paginated public
   variants and templates plus authoritative Scryfall template expansions into
   gitignored raw inputs under `apps/backend/data/commander-spellbook/`. It never
   runs as a side effect of another script and is not part of `data:build`.
2. `scripts/build-commander-spellbook-combos.mjs` reads only local raw inputs and
   emits `apps/backend/data/commanderSpellbookCombos.json` (source manifest +
   trimmed variant detail) and `apps/backend/data/commanderSpellbookComboIndex.json`
   (inverse oracle membership, template expansion membership, unresolved-template
   metadata).
3. Accept `status === "OK"` only; reject `EXAMPLE`. An unrecognized status value
   fails the build loudly rather than being silently dropped.
4. Retain per variant: exact-card ingredients, quantities, permitted starting
   zones, per-ingredient zone-scoped card state, per-ingredient `mustBeCommander`,
   template ingredients, produced effects, step description, mana needed,
   easy/notable prerequisites, notes, popularity, stable source URL. Omit price,
   image, bracket, and unrelated site payload fields.
5. Card state is a zone-scoped map — `battlefield`/`exile`/`graveyard`/`library`
   keys projected from `*_card_state` — never collapsed into one string. Hand and
   command carry no state. An ingredient permitting several zones keeps each
   zone's state independently.
6. Project upstream snake_case onto TheJudge camelCase. Zone vocabulary is exactly
   `H`, `B`, `C`, `E`, `G`, `L`.
7. Join cards on `oracle_id` → `cardId`. No printing-level identity enters either
   artifact.
8. Expand query-backed templates through the authoritative Scryfall URL supplied
   upstream, deduplicating oracle ids across all result pages; use authoritative
   explicit replacement mappings when upstream exposes them. A template with
   neither is retained and marked unresolved. Do not parse Scryfall query syntax
   and do not hand-author a replacement map.
9. Deterministic output for identical raw inputs, including stable variant-id and
   oracle-id tie-breaks in every array and object key order.
10. A failed or partial refresh never overwrites a valid committed artifact; a
    build with no fresh raw input validates and preserves the prior snapshot and
    exits 0, matching `build-game-rules.mjs`'s degrade-gracefully posture.
11. Add `apps/backend/data/commander-spellbook/` to `.gitignore`. Wire the build
    (not the refresh) into `npm run data:build`.

## Acceptance criteria

- [ ] `node scripts/build-commander-spellbook-combos.mjs` run twice over the same
      committed sample raw inputs produces byte-identical artifacts
- [ ] A sample input containing one `OK` and one `EXAMPLE` variant emits exactly
      the `OK` variant; the `EXAMPLE` variant appears in neither artifact
- [ ] An input with `status: "PENDING"` (or any unrecognized value) exits non-zero
      with a message naming the offending status and variant id
- [ ] An ingredient permitting both battlefield and graveyard retains two distinct
      state strings under two zone keys; neither is concatenated or dropped
- [ ] `mustBeCommander` survives per ingredient; an ingredient in hand or command
      carries no state key rather than an empty string
- [ ] A query-backed template expands to a deduplicated sorted oracle-id list; a
      template with no query and no mapping appears in the index with its
      unresolved marker and no expansion list
- [ ] Running the build with the raw input directory absent leaves existing
      committed artifacts unmodified (`git diff --exit-code` on both paths) and
      exits 0
- [ ] Running the build with a truncated/invalid raw page leaves existing
      committed artifacts unmodified and exits non-zero
- [ ] No `imageUrl`, price, or printing id appears anywhere in either artifact
- [ ] `npm run data:build` includes the combo build and stays green with no raw
      inputs present
- [ ] `apps/backend/data/commander-spellbook/` is gitignored; `git status --porcelain`
      is clean after a refresh run
- [ ] **Owner action:** one approved production refresh executed and the two real
      artifacts committed, with the snapshot timestamp, upstream attribution, and
      any upstream license notice present in the manifest. Record the run date and
      variant count in this slice's verification evidence. Slices B–E do not wait
      on this.

## Verification

```bash
node scripts/build-commander-spellbook-combos.mjs
npm run test:scripts
npm run data:build
git diff --exit-code apps/backend/data/commanderSpellbookCombos.json apps/backend/data/commanderSpellbookComboIndex.json
```

Script-level tests are `node --test` (not Vitest), so the Vitest naming
convention does not apply to `scripts/*.test.mjs`.

## Files touched

- `scripts/refresh-commander-spellbook-data.mjs` (new)
- `scripts/build-commander-spellbook-combos.mjs` (new)
- `scripts/build-commander-spellbook-combos.test.mjs` (new)
- `apps/backend/src/commanderSpellbook/__fixtures__/` (new — sample raw pages: OK
  variant, EXAMPLE variant, multi-zone ingredient, query template, unresolved
  template, malformed page)
- `apps/backend/data/commanderSpellbookCombos.json` (new, committed artifact)
- `apps/backend/data/commanderSpellbookComboIndex.json` (new, committed artifact)
- `.gitignore`
- `package.json` (`data:build` chain)
