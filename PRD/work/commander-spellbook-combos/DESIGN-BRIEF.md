# Commander Spellbook Combo Enrichment — Design Brief

## Status

- Product design: approved 2026-08-02
- Scope expansion approved 2026-08-11 (card state capture + answer-quality measurement)
- Corpus source + wire-format correction approved 2026-08-12 (see `## Amendments`)
- Work package: refined
- Quality check: PASS 2026-08-11 — **superseded**; the 2026-08-12 amendment must be re-checked
- Next gate: `$thejudge-quality-check PRD/work/commander-spellbook-combos/`

## Amendments

### 2026-08-12 — corpus source and wire format

Slices A–F were implemented and marked `done`, and the package reached `ship-ready`, before
this was found. **That status was false**: the corpus build could not parse a single real
upstream variant. The package was reopened rather than shipped or cleaned up.

**Finding.** The build read seven snake_case fields upstream never emits — `oracle_id`,
`zone_locations`, `mana_needed`, `must_be_commander`, `easy_prerequisites`,
`notable_prerequisites`, `scryfall_api`. Django REST Framework's `CamelCaseJSONRenderer`
renames every serializer field at the render layer, below where fields are declared, so
reading upstream's `VariantSerializer` did not reveal it. Verified by running the real
`build-commander-spellbook-combos.mjs` against real bulk bytes: it fails on the first
variant with `variant 215-3430--85--200 has status OK but mana_needed is not a string`.

**Why it survived every gate.**

- `PRD/sections/integrations-and-data.md` asserted the snake_case claim as product truth, so
  the implementation followed the PRD faithfully into the defect. That line is now corrected.
- The 22 build tests passed because the committed fixtures were hand-authored in the same
  incorrect casing (`zone_locations` x10, `must_be_commander` x10, `oracle_id` x8) — they
  validated against a schema that has never existed.
- The committed corpus was an empty bootstrap artifact (`variantCount: 0`), so no code path
  ever met real data.

**Separately, the paginated source proved unusable.** Upstream's load balancer throttled a
sustained cursor walk with a bodiless `429` carrying no `Retry-After` after 13,600 variants;
the quota resets in roughly six minutes. The refresh script had no retry handling and
discarded all 136 downloaded pages on failure.

**Decisions taken (owner-approved 2026-08-12), recorded as DEC-162.**

1. **Bulk export as sole source.** `https://json.commanderspellbook.com/variants.json.gz` —
   105,448 reviewed `OK` variants, ~26 MB, downloads in under a second, unthrottled,
   regenerated daily, and carries its own `timestamp`/`version` for provenance. The paginated
   walk is removed rather than kept as a fallback.
2. **Wired into `data:refresh`.** Invoking that command is REQ-093's explicit human approval,
   matching the standard already applied to the ungated Scryfall and Comprehensive Rules
   downloads in the same script. The standalone combo script keeps `--confirm-live-calls`.
3. **Gzipped committed artifacts, full coverage.** Measured on a 6,000-variant sample: the
   trimmed corpus is ~1,066 B/variant uncompressed (~112 MB) and ~62 B/variant gzipped
   (~6.5 MB, 17.2x). No popularity cap — 61% of variants have zero tracked deck popularity,
   and those are precisely the obscure pairings an explicit combo question tends to name.
4. **Fixtures derived from real upstream responses**, never hand-authored, so a future rename
   fails the suite instead of passing it.

**Blast radius for re-mapping.** Slice A is invalidated outright. Slice B is affected by
gunzip-on-load and by 105,448 variants rather than the ~30,000 its cold-start measurement
assumed. Slice C is affected by that same scale. Slice D is likely intact. Slice E is intact —
its eval catalog is deliberately independent of the production artifact. Slice F needs curated
scenarios pointing at real oracle ids; its current scenarios reuse the eval fixtures' synthetic
ids, which appear in no corpus and would make both A/B legs produce identical prompts.

**Carried forward, uncommitted.** A retry/backoff fix for `refresh-commander-spellbook-data.mjs`
(`Retry-After` support, exponential backoff with full jitter) plus 15 tests for a script that
previously had none. The retry helper stays useful for Scryfall template expansion, which does
paginate; the resume-from-staged-pages half is superseded by the bulk source.

## Outcome

Add Commander Spellbook as a community-sourced, backend-only prompt enrichment corpus. TheJudge compiles public reviewed variants into committed static artifacts, matches them deterministically against submitted oracle identities/quantities/zones, and supplies at most five relevant variants to the existing Ask AI prompt.

The feature is intentionally not a visible combo discovery surface. It exists to improve answers when the submitted game context already contains a complete combo candidate or when the user explicitly asks about combos and needs missing pieces identified.

## 2026-08-11 scope expansion

Three changes, driven by the upstream schema in `spellbook/serializers/variant_serializer.py`:

1. **`OK`-only corpus.** `EXAMPLE` variants are rejected. Upstream returns `null` for `description` (the steps), `mana_needed`, `easy_prerequisites`, `notable_prerequisites`, `notes`, and all four card-state fields whenever `status == EXAMPLE`. Those variants structurally cannot carry the context this feature depends on.
2. **Card state captured, surfaced, and honestly labeled.** Per-ingredient card state is retained zone-scoped, rendered for the zone a matched instance actually occupies, and paired with an instruction telling the model to verify it. No candidate is ever labeled "complete".
3. **Answer quality is measured.** An opt-in, human-reviewed live-provider A/B establishes whether the enrichment earned its place. Informational only.

## Approved scope

### Data pipeline

- `scripts/refresh-commander-spellbook-data.mjs` (planned) performs the human-approved retrieval of public Commander Spellbook variants/templates plus authoritative Scryfall template expansions into gitignored raw inputs.
- `scripts/build-commander-spellbook-combos.mjs` (planned) emits:
  - `apps/backend/data/commanderSpellbookCombos.json.gz` — source manifest plus trimmed variant details
  - `apps/backend/data/commanderSpellbookComboIndex.json.gz` — inverse oracle membership, template expansion membership, unresolved-template metadata
- Only reviewed `OK` variants enter the committed corpus; `EXAMPLE` is rejected.
- Because the corpus is `OK`-only, every committed variant carries non-null steps, prerequisites, mana needed, and card state. A null in those fields is an artifact-integrity failure, not expected data — the runtime loader enforces this.
- Cards join on Commander Spellbook `oracle_id` → TheJudge `cardId`; printing identity is excluded.
- Query-backed templates expand through the authoritative Scryfall URL supplied upstream. Authoritative explicit mappings are used when available. A template with neither remains unresolved.
- TheJudge does not implement Scryfall query parsing or a manual template-replacement fork.
- Failed/partial refreshes never overwrite a valid committed snapshot. Runtime never calls Commander Spellbook or Scryfall.

### Ingredient state contract

- Card state is stored **zone-scoped**, never collapsed into one string. Upstream exposes `battlefield_card_state`, `exile_card_state`, `graveyard_card_state`, and `library_card_state` separately; an ingredient may permit several starting zones at once, so one field would be lossy.
- The hand and command zones carry no state upstream.
- `mustBeCommander` is retained per ingredient.
- Upstream renders **camelCase** on the wire (`oracleId`, `zoneLocations`, `mustBeCommander`, `*CardState`); DRF's `CamelCaseJSONRenderer` renames serializer fields above the model, so snake_case never reaches a client (DEC-162).
- The upstream starting-zone vocabulary is exactly `H`, `B`, `C`, `E`, `G`, `L`.

### Intent gate

- A shared case-insensitive word/phrase-boundary detector recognizes narrow terms such as `combo`, `combos`, `infinite`, `go infinite`, `goes infinite`, `loop`, and `win condition`.
- Broad language such as `synergy`, `interaction`, and `works with` does not activate partial combo retrieval by itself.
- Intent classification is deterministic; no extra model call is introduced.

### Game-mode matching

- Without explicit combo intent, retrieve complete candidates only.
- A complete candidate assigns every exact/template ingredient quantity to distinct submitted card instances in compatible Commander Spellbook starting zones.
- One card instance cannot satisfy multiple slots; quantities use multiset semantics.
- Unresolved templates cannot satisfy completeness.
- With explicit combo intent, complete candidates rank first and partial candidates may follow.
- Submitted card names mentioned in the question become required anchors. If none is named, submitted cards seed overlap ranking.
- Partial results label compatible present, wrong-zone, missing exact, matched-template, and unresolved-template ingredients.

### Lookup-mode matching

- Retrieval requires explicit combo intent and an attached card.
- Each candidate contains the attached card as an exact ingredient or authoritative template match.
- Missing pieces are included and labeled so the user's combo question can still be answered.
- No attached card, or no combo intent, means no combo corpus retrieval.

### State annotation

- Each match annotation carries the card state applicable to the zone its assigned instance actually occupies.
- Wrong-zone and missing annotations instead carry the **expected** zone's state, so the model can see what the ingredient would require.
- `mustBeCommander` travels with every annotation.
- None of this is validated. The submitted request carries no tapped, counter, control, or commander-designation data, so state can only ever be surfaced to the model.

### Ranking

Select at most five variants, ordered by:

1. complete contextual match
2. required question-anchor coverage
3. compatible-zone coverage
4. fewer missing ingredients
5. Commander Spellbook popularity descending
6. stable variant id ascending

## Prompt contract

Eligible results render in `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED`, after card/rules/rulings enrichment and before conversation history plus the current question.

Each entry includes:

- classification and stable Commander Spellbook reference
- present, wrong-zone, missing, template-matched, and unresolved ingredients
- per-ingredient applicable card state and `mustBeCommander`
- produced effects and combo steps
- mana needed, easy/notable prerequisites, and notes when available

**Classification never uses the bare word "complete."** A fully assigned candidate renders as all pieces present with card state explicitly unverified; a candidate with gaps renders as partial with its missing pieces named.

Instructions explicitly state:

- Commander Spellbook is community catalog data, not official WotC rules
- inclusion is not proof of legality or executability
- official card text, WotC rulings, and Comprehensive Rules remain authoritative
- partial candidates must identify missing/incorrectly zoned pieces
- automatically supplied complete context is used only when relevant to the actual question
- the model must check each ingredient's applicable card state and `mustBeCommander` against the submitted board before asserting a combo is live, assembled, or executable

`AskAiRequest`, Zod schemas, success/error responses, provider selection, and `POST /api/ask-ai` remain unchanged.

## Answer-quality measurement

- A dedicated script — planned `scripts/compare-combo-answer-quality.mjs` — answers curated combo scenarios twice against the configured live provider — catalog loaded, then combo enrichment disabled — and writes both answers side by side for human review.
- Enrichment is disabled through **backend runtime configuration only**: the `COMBO_ENRICHMENT_ENABLED` backend env flag (enabled by default), read where prompt assembly consults the catalog rather than latched at module load, so one process can answer both legs. No request field, response field, Zod schema, route, or provider-selection change.
- The script refuses to contact the provider without an explicit `--confirm-live-calls` flag, mirroring the corpus refresh's network gate.
- Raw output is gitignored under `output/combo-answer-quality/`, matching the existing `output/prompt-preview/` convention. Only the dated human-reviewed conclusion becomes durable history, carried into the cleanup receipt.
- Never in `npm run quality:check`, never asserted against a golden, never a build gate.
- Reviewed before this package ships; does not block shipping.

## Failure behavior

- No match → omit the section entirely.
- Missing, empty, or malformed artifacts → omit combo enrichment, warn once per process/path, and continue the normal Ask AI request.
- A committed variant with null steps, prerequisites, mana, or card state → artifact-integrity failure, handled as a corrupt artifact.
- Unresolved template → cannot complete automatic matching; may appear only as unresolved context on an explicitly requested partial candidate.
- No runtime fallback to Commander Spellbook or Scryfall.

## Verification focus

- deterministic build from the bulk export, `OK`-only status filtering with `EXAMPLE` rejection, source metadata, and stable serialization
- the build parses real upstream bytes: at least one fixture is a verbatim excerpt of a real bulk response, so a wire-format rename fails the suite rather than passing it
- zone-scoped card state retained per ingredient without collapsing multi-zone ingredients
- query-backed/explicit template expansion and unresolved-template preservation
- quantity-aware distinct-instance assignment and centralized zone mapping
- state annotation resolves to the matched instance's zone, and to the expected zone for wrong-zone/missing entries
- narrow intent positives plus broad-language non-triggers
- game complete/non-intent and game partial/explicit branches
- lookup explicit-attached and unrelated/no-card exclusion branches
- missing/wrong-zone annotations and stable top-five ranking
- rendered classification never emits the bare word "complete"
- the state-verification instruction is present in both prompt modes
- fail-open missing/corrupt artifact behavior, including null editorial fields
- prompt ordering, community-source guardrails, mock exposure, and intentional eval goldens
- an executed, human-reviewed answer-quality comparison with its conclusion recorded

## Non-goals

- visible Known Combos list/detail UI
- combo browser or feature-portal destination
- find-my-combos/decklist analysis
- bracket estimation
- runtime Commander Spellbook/Scryfall calls
- public combo mirror/API
- manual template mappings
- legality, mana, commander status, card-state, hidden-state, or deterministic executability validation
- changing the Ask AI HTTP contract or adding an endpoint
- automated answer-quality gating in `quality:check`, and a general answer-quality baseline across the whole fixture corpus

## Product-truth references

- DEC-116 — static corpus and retrieval/prompt boundaries
- DEC-161 — answer-quality measurement is opt-in, human-reviewed, and never a gate
- REQ-093 — committed Commander Spellbook combo corpus
- REQ-094 — deterministic intent/context matcher
- REQ-095 — bounded community-sourced prompt enrichment
- REQ-146 — combo enrichment answer-quality comparison
- FLOW-015 — end-to-end combo enrichment flow
- DEC-013 — no deterministic rules/legality simulation
- DEC-021 / DEC-106 — existing game/lookup request modes
- DEC-029 / DEC-030 / DEC-046 — existing official rulings/rules enrichment authority

## External source references

- **Bulk export (the corpus source): `https://json.commanderspellbook.com/variants.json.gz`** — also served from `https://spellbook-prod.s3.amazonaws.com/variants.json`; produced by `backend/spellbook/tasks/export_variants.py`
- Commander Spellbook API (no longer a corpus source; rate-limited): `https://backend.commanderspellbook.com/`
- Developer API documentation: `https://spacecowmedia.github.io/commander-spellbook-backend/api.html`
- Domain model: `https://spacecowmedia.github.io/commander-spellbook-backend/domain-model.html`
- Backend source/license: `https://github.com/SpaceCowMedia/commander-spellbook-backend`
- Authoritative ingredient/variant schema: `backend/spellbook/serializers/variant_serializer.py`; zone vocabulary in `backend/spellbook/models/ingredient.py`. **These give field names in snake_case; the wire renames them.** The renderer is `backend/backend/settings.py` `DEFAULT_RENDERER_CLASSES` → `CamelCaseJSONRenderer`. Confirm any field name against a real response before relying on it.
