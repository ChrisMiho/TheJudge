# Commander Spellbook Combo Enrichment — Design Brief

## Status

- Product design: approved 2026-08-02
- Work package: refined
- Next gate: `$thejudge-quality-check PRD/work/commander-spellbook-combos/`

## Outcome

Add Commander Spellbook as a community-sourced, backend-only prompt enrichment corpus. TheJudge compiles public reviewed variants into committed static artifacts, matches them deterministically against submitted oracle identities/quantities/zones, and supplies at most five relevant variants to the existing Ask AI prompt.

The feature is intentionally not a visible combo discovery surface. It exists to improve answers when the submitted game context already contains a complete combo candidate or when the user explicitly asks about combos and needs missing pieces identified.

## Approved scope

### Data pipeline

- `scripts/refresh-commander-spellbook-data.mjs` (planned) performs the human-approved retrieval of public Commander Spellbook variants/templates plus authoritative Scryfall template expansions into gitignored raw inputs.
- `scripts/build-commander-spellbook-combos.mjs` (planned) emits:
  - `apps/backend/data/commanderSpellbookCombos.json` — source manifest plus trimmed variant details
  - `apps/backend/data/commanderSpellbookComboIndex.json` — inverse oracle membership, template expansion membership, unresolved-template metadata
- Only public reviewed `OK` / `EXAMPLE` variants enter the committed corpus.
- Cards join on Commander Spellbook `oracleId` → TheJudge `cardId`; printing identity is excluded.
- Query-backed templates expand through the authoritative Scryfall URL supplied upstream. Authoritative explicit mappings are used when available. A template with neither remains unresolved.
- TheJudge does not implement Scryfall query parsing or a manual template-replacement fork.
- Failed/partial refreshes never overwrite a valid committed snapshot. Runtime never calls Commander Spellbook or Scryfall.

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

- complete/partial classification and stable Commander Spellbook reference
- present, wrong-zone, missing, template-matched, and unresolved ingredients
- produced effects and combo steps
- mana needed, easy/notable prerequisites, and notes when available

Instructions explicitly state:

- Commander Spellbook is community catalog data, not official WotC rules
- inclusion is not proof of legality or executability
- official card text, WotC rulings, and Comprehensive Rules remain authoritative
- partial candidates must identify missing/incorrectly zoned pieces
- automatically supplied complete context is used only when relevant to the actual question

`AskAiRequest`, Zod schemas, success/error responses, provider selection, and `POST /api/ask-ai` remain unchanged.

## Failure behavior

- No match → omit the section entirely.
- Missing, empty, or malformed artifacts → omit combo enrichment, warn once per process/path, and continue the normal Ask AI request.
- Unresolved template → cannot complete automatic matching; may appear only as unresolved context on an explicitly requested partial candidate.
- No runtime fallback to Commander Spellbook or Scryfall.

## Verification focus

- deterministic paginated build, status filtering, source metadata, and stable serialization
- query-backed/explicit template expansion and unresolved-template preservation
- quantity-aware distinct-instance assignment and centralized zone mapping
- narrow intent positives plus broad-language non-triggers
- game complete/non-intent and game partial/explicit branches
- lookup explicit-attached and unrelated/no-card exclusion branches
- missing/wrong-zone annotations and stable top-five ranking
- fail-open missing/corrupt artifact behavior
- prompt ordering, community-source guardrails, mock exposure, and intentional eval goldens

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

## Product-truth references

- DEC-116 — static corpus and retrieval/prompt boundaries
- REQ-093 — committed Commander Spellbook combo corpus
- REQ-094 — deterministic intent/context matcher
- REQ-095 — bounded community-sourced prompt enrichment
- FLOW-015 — end-to-end combo enrichment flow
- DEC-013 — no deterministic rules/legality simulation
- DEC-021 / DEC-106 — existing game/lookup request modes
- DEC-029 / DEC-030 / DEC-046 — existing official rulings/rules enrichment authority

## External source references

- Commander Spellbook API: `https://backend.commanderspellbook.com/`
- Developer API documentation: `https://spacecowmedia.github.io/commander-spellbook-backend/api.html`
- Domain model: `https://spacecowmedia.github.io/commander-spellbook-backend/domain-model.html`
- Backend source/license: `https://github.com/SpaceCowMedia/commander-spellbook-backend`
