# Commander Spellbook fixtures

Sample raw refresh inputs for `scripts/build-commander-spellbook-combos.mjs`. Each
directory is a complete raw-input tree in the layout
`scripts/refresh-commander-spellbook-data.mjs` produces:

```
<dir>/refresh-manifest.json
<dir>/variants/page-NNNN.json
<dir>/template-expansions/NNNNNN.json
```

| Directory | Covers |
|---|---|
| `raw-sample/` | one reviewed (`OK`) variant, one `EXAMPLE` variant, a multi-zone ingredient, a `2x` quantity, a `mustBeCommander` ingredient, a query-backed template, and an unresolved template |
| `raw-unrecognized-status/` | a status outside the upstream vocabulary — the build must exit non-zero |
| `raw-malformed-page/` | a page whose `results` array is missing — the build must exit non-zero |

Truncated / syntactically invalid JSON is **not** committed here, because
`npm run format:check` parses every `.json` file in the repo. The build test
writes that case into a temp directory at run time instead.

## Upstream field notes

Verified against `spellbook/serializers/variant_serializer.py` and
`spellbook/models/ingredient.py`:

- `Variant.Status` values are short codes. `OK` is `"OK"`; **`EXAMPLE` is `"E"`**,
  not `"EXAMPLE"`. The public API only ever serves those two.
- For `EXAMPLE` variants upstream returns `null` for `description`, `mana_needed`,
  `easy_prerequisites`, `notable_prerequisites`, `notes`, and all four
  `*_card_state` fields — which is why the corpus is `OK`-only.
- Only battlefield, exile, graveyard, and library carry card state
  (`Ingredient.CARD_STATE_FIELDS`). Hand and command have no state field at all.
- `zone_locations` serializes as a list of single-character zone codes drawn from
  `H`, `B`, `C`, `E`, `G`, `L`.
- `Template.scryfall_api` is the only authoritative expansion upstream publishes;
  no public serializer exposes `Template.replacements`.

## Card identity

Card names are real so prompt fixtures read naturally, but every `oracle_id` here
is synthetic (`aaaaaaaa-…`, `bbbbbbbb-…`, `cccccccc-…`) and does not correspond to
any real Scryfall oracle identity.
