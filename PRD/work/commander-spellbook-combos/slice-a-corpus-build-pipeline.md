# Slice A — Corpus refresh and build pipeline

## Status: done

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

- [x] `node scripts/build-commander-spellbook-combos.mjs` run twice over the same
      committed sample raw inputs produces byte-identical artifacts
- [x] A sample input containing one `OK` and one `EXAMPLE` variant emits exactly
      the `OK` variant; the `EXAMPLE` variant appears in neither artifact
- [x] An input with `status: "PENDING"` (or any unrecognized value) exits non-zero
      with a message naming the offending status and variant id
- [x] An ingredient permitting both battlefield and graveyard retains two distinct
      state strings under two zone keys; neither is concatenated or dropped
- [x] `mustBeCommander` survives per ingredient; an ingredient in hand or command
      carries no state key rather than an empty string
- [x] A query-backed template expands to a deduplicated sorted oracle-id list; a
      template with no query and no mapping appears in the index with its
      unresolved marker and no expansion list
- [x] Running the build with the raw input directory absent leaves existing
      committed artifacts unmodified (`git diff --exit-code` on both paths) and
      exits 0
- [x] Running the build with a truncated/invalid raw page leaves existing
      committed artifacts unmodified and exits non-zero
- [x] No `imageUrl`, price, or printing id appears anywhere in either artifact
- [x] `npm run data:build` includes the combo build and stays green with no raw
      inputs present — see the pre-existing-chain note in the evidence below
- [x] `apps/backend/data/commander-spellbook/` is gitignored; `git status --porcelain`
      is clean after a refresh run
- [ ] **Owner action:** one approved production refresh executed and the two real
      artifacts committed, with the snapshot timestamp, upstream attribution, and
      any upstream license notice present in the manifest. Record the run date and
      variant count in this slice's verification evidence. Slices B–E do not wait
      on this.

## Verification evidence

Recorded 2026-08-11 on the implementation worktree.

- `node --test scripts/build-commander-spellbook-combos.test.mjs` — 22/22 pass.
- `npm run test:scripts` — 34/34 pass.
- `npm run quality:check` — green (0 lint errors; the 7 `react-refresh` warnings
  are pre-existing frontend ones on files this slice does not touch).
- Committed artifacts are the **empty bootstrap corpus** (`variantCount: 0`,
  `snapshotAt: null`): detail 304 B, index 384 B. Real combo data lands only via
  the owner-approved refresh, so no community data is fabricated here. The
  loader's fail-open path treats an empty corpus as "no matches".

### Upstream schema, verified from source

Read via `gh api` against `SpaceCowMedia/commander-spellbook-backend`, not the
docs site:

- `Variant.Status` values are **short codes**: `OK` is `"OK"` but **`EXAMPLE` is
  `"E"`**, not the string `"EXAMPLE"`. `public_statuses()` is `(OK, EXAMPLE)`, so
  those two are the only values the public API serves. The build's recognized
  vocabulary is the full upstream set `N, D, NR, OK, E, R, NW`; only `OK` is
  accepted, and anything outside the set fails loudly.
- No public serializer exposes `Template.replacements` — `TemplateSerializer`
  ships only `id`, `name`, `scryfall_query`, `scryfall_api`. So the requirement 8
  "authoritative explicit replacement mappings" branch has no upstream source and
  is inert by construction: `scryfall_api` is the only expansion path, and a
  template without it stays unresolved. Nothing is hand-authored.
- Only battlefield/exile/graveyard/library carry card state
  (`Ingredient.CARD_STATE_FIELDS`); hand and command have no state field at all.

### `npm run data:build` note

The combo build is wired as the last link of the chain and is green. The
aggregate command still exits 1 in a fresh checkout, at the **first** link:
`build-card-metadata.mjs` throws on the missing gitignored bulk input
`apps/frontend/data/scryfall/default-cards.json`. That script is untouched by
this slice (`git diff HEAD -- scripts/build-card-metadata.mjs` is empty), so the
failure is pre-existing and unrelated. Verified the combo link by running the
chain from step 2:
`node scripts/build-card-rulings.mjs && node scripts/build-game-rules.mjs && node scripts/build-card-prices.mjs && node scripts/build-commander-spellbook-combos.mjs`
— exit 0, with every step degrading gracefully and preserving its artifact.

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
