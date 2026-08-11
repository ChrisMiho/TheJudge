# Commander Spellbook Combo Enrichment — Design Brief

## Status

- Product design: approved 2026-08-02
- Scope expansion approved 2026-08-11 (card state capture + answer-quality measurement)
- Work package: refined
- Quality check: PASS 2026-08-11
- Next gate: `$thejudge-map-out PRD/work/commander-spellbook-combos/`

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
  - `apps/backend/data/commanderSpellbookCombos.json` — source manifest plus trimmed variant details
  - `apps/backend/data/commanderSpellbookComboIndex.json` — inverse oracle membership, template expansion membership, unresolved-template metadata
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
- Upstream serializes snake_case; committed artifacts use TheJudge's camelCase naming.
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

- deterministic paginated build, `OK`-only status filtering with `EXAMPLE` rejection, source metadata, and stable serialization
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

- Commander Spellbook API: `https://backend.commanderspellbook.com/`
- Developer API documentation: `https://spacecowmedia.github.io/commander-spellbook-backend/api.html`
- Domain model: `https://spacecowmedia.github.io/commander-spellbook-backend/domain-model.html`
- Backend source/license: `https://github.com/SpaceCowMedia/commander-spellbook-backend`
- Authoritative ingredient/variant schema: `backend/spellbook/serializers/variant_serializer.py`; zone vocabulary in `backend/spellbook/models/ingredient.py`
