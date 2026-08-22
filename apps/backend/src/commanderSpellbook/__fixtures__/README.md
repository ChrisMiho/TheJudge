# Commander Spellbook fixtures

Sample raw refresh inputs for `scripts/build-commander-spellbook-combos.mjs`. Each
directory is a complete raw-input tree in the layout
`scripts/refresh-commander-spellbook-data.mjs` produces (DEC-162 — the bulk
export is one file, not a paginated cursor walk):

```
<dir>/refresh-manifest.json
<dir>/variants.json               { timestamp, version, variants: [...] }
<dir>/template-expansions/NNNNNN.json
```

| Directory | Covers |
|---|---|
| `raw-sample/` | one reviewed (`OK`) variant, one `EXAMPLE` variant, a multi-zone ingredient, a `2x` quantity, a `mustBeCommander` ingredient, a query-backed template, and an unresolved template. Card names are real so prompt fixtures read naturally, but every `oracleId` here is **synthetic** (`aaaaaaaa-…`, `bbbbbbbb-…`, `cccccccc-…`) and hand-authored for exact, stable assertions. |
| `raw-real-excerpt/` | a **verbatim** two-variant excerpt of a real `https://json.commanderspellbook.com/variants.json.gz` response (fetched 2026-08-22), byte-for-byte except trimmed to two variants — one with no template ingredients, one with a real query-backed template. This is what proves the build parses actual upstream bytes; a wire-format rename fails this fixture, not just the hand-authored one. |
| `raw-unrecognized-status/` | a status outside the upstream vocabulary — the build must exit non-zero |
| `raw-malformed-page/` | raw input with no `variants` array — the build must exit non-zero |

Truncated / syntactically invalid JSON is **not** committed here, because
`npm run format:check` parses every `.json` file in the repo. The build test
writes that case into a temp directory at run time instead.

## Upstream field notes

Verified against a **real** bulk-export response (2026-08-22), not just the
Python serializer source — DEC-162 exists because reading the serializer alone
missed this once already:

- Upstream renders **camelCase** on the wire: `oracleId`, `zoneLocations`,
  `manaNeeded`, `mustBeCommander`, `easyPrerequisites`, `notablePrerequisites`,
  `scryfallApi`, `battlefieldCardState` / `exileCardState` /
  `libraryCardState` / `graveyardCardState`, `bracketTag`, `variantCount`.
  Django REST Framework's `CamelCaseJSONRenderer` renames every serializer
  field at the render layer, below where the Python source declares them —
  the snake_case names in `spellbook/serializers/variant_serializer.py` never
  reach a client, on the bulk export or the paginated API alike.
- `Variant.Status` values are short codes. `OK` is `"OK"`; **`EXAMPLE` is
  `"E"`**, not `"EXAMPLE"`. The bulk export publishes only `OK` variants in
  practice; `EXAMPLE` rejection is retained defensively.
- For `EXAMPLE` variants upstream returns `null` for `description`,
  `manaNeeded`, `easyPrerequisites`, `notablePrerequisites`, `notes`, and all
  four `*CardState` fields — which is why the corpus is `OK`-only.
- Only battlefield, exile, graveyard, and library carry card state
  (`Ingredient.CARD_STATE_FIELDS`). Hand and command have no state field at
  all.
- `zoneLocations` serializes as a list of single-character zone codes drawn
  from `H`, `B`, `C`, `E`, `G`, `L`.
- Exact-card ingredients live under a variant's `uses[]`; template
  ingredients live under `requires[]`. `Template.scryfallApi` is the only
  authoritative expansion upstream publishes; no public serializer exposes
  `Template.replacements`.
- The bulk envelope is `{ timestamp, version, variants: [...] }` (plus an
  `aliases` key TheJudge does not read), not the paginated REST API's
  `{ count, next, previous, results: [...] }`.

## Card identity

`raw-sample/`'s card names are real so prompt fixtures read naturally, but its
`oracleId`s are synthetic and do not correspond to any real Scryfall oracle
identity. `raw-real-excerpt/`'s cards and oracle ids are real, verbatim from
upstream.
