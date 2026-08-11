# Combo retrieval decisions

Static Commander Spellbook catalog ingestion and context-aware prompt enrichment.

### DEC-116
- Decision: TheJudge uses Commander Spellbook as a **community-sourced, backend-only combo enrichment corpus** built into committed static artifacts through a human-approved refresh. Combo data never appears merely because one submitted card is a known combo piece: game-mode requests without explicit combo intent receive only variants whose complete ingredient multiset is present in compatible submitted zones, while explicit combo questions may additionally receive partial variants with missing or incorrectly zoned ingredients called out. Lookup mode requires both explicit combo intent and an attached card. Template ingredients are expanded at build time from authoritative upstream mappings or Scryfall queries; unresolved templates remain available to explicit-question retrieval but cannot satisfy automatic completion. At most five variants enter a prompt, and runtime never calls Commander Spellbook or Scryfall.
- Status: confirmed
- Context: Players benefit from known combo context when the submitted cards actually form a cataloged combo or when they explicitly ask how a card can combo, but broad per-card enrichment would inject unrelated staples and noise. Commander Spellbook provides public reviewed variants keyed by Scryfall `oracle_id`, which is already TheJudge's `cardId`; its community catalog is useful context but is not an official rules source or proof that a combo is executable.
- Impact:
  - a deterministic, human-approved build produces compact backend combo detail and oracle/template indexes from public Commander Spellbook data
  - an explicit lexical intent detector recognizes narrow combo language; broad synergy language does not activate partial retrieval
  - game-mode automatic matching is quantity-aware, does not reuse one submitted card instance for multiple ingredient slots, and requires compatible starting zones
  - explicit combo questions may retrieve partial candidates anchored to submitted cards and must identify missing or incorrectly zoned pieces
  - unresolved template ingredients, mana availability, commander status, card state, and prose prerequisites are never silently treated as satisfied
  - per-ingredient card state is zone-scoped and is rendered for the zone a matched instance actually occupies, so the model can weigh state that TheJudge cannot deterministically verify
  - the prompt never labels a candidate "complete"; a fully assigned candidate is labeled as all pieces present with card state explicitly unverified
  - prompt output labels the corpus as community-sourced and keeps WotC card text, rulings, and Comprehensive Rules authoritative
  - `AskAiRequest`, success/error response shapes, provider selection, and the single `POST /api/ask-ai` endpoint remain unchanged
- Related requirements:
  - REQ-093
  - REQ-094
  - REQ-095
  - FLOW-015
- Notes:
  - no visible Known Combos panel, combo browser, find-my-combos flow, bracket estimation, legality validation, or deterministic executability validation enters this scope
  - the artifact and prompt section must retain Commander Spellbook attribution and a stable variant reference
  - only reviewed `OK` variants enter the corpus; upstream nulls steps, prerequisites, mana needed, notes, and every card-state field for `EXAMPLE` variants, so they cannot carry the state context this decision depends on (REQ-093)

### DEC-161
- Decision: The effect of Commander Spellbook enrichment on answer quality is measured by an **opt-in, human-reviewed A/B comparison against the live provider**, never by an automated gate. A confirmation-gated script answers curated combo scenarios twice — once with the committed catalog loaded and once with combo enrichment disabled through backend runtime configuration — and writes both answers for human review. The reviewed conclusion is recorded and read before the combo work ships, but it never blocks a build, never becomes a golden, and never enters `npm run quality:check`.
- Status: confirmed
- Context: TheJudge's eval harness scores prompt and context *structure* through `buildPromptContext()` / `buildPromptText()` goldens, and `prompt:preview` only extracts assembled prompt text from the mock provider. Nothing observes the answer the model actually returns. Combo enrichment is justified entirely by "the answer gets better," which without an instrument is unfalsifiable. Model answers are non-deterministic, so an exact-match gate would be brittle and would fail builds for reasons unrelated to correctness.
- Impact:
  - a dedicated script compares enriched and unenriched real provider answers over curated combo scenarios
  - combo enrichment is disabled for the comparison via backend runtime configuration, so no request/response contract, schema, route, or provider selection changes
  - the provider call is explicitly confirmation-gated because it costs money, matching the human-approved gate on the corpus network refresh
  - raw comparison output stays gitignored; only the dated reviewed conclusion becomes durable history
  - the comparison informs the ship decision without blocking it, and is carried into the cleanup receipt
- Related requirements:
  - REQ-146
  - REQ-093
  - REQ-094
  - REQ-095
- Notes:
  - a broad answer-quality baseline across the whole fixture corpus is deliberately out of scope here and remains its own work
  - automated answer-quality gating in `quality:check` is an explicit non-goal, not an unbuilt future step
