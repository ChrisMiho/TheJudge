# Rules retrieval decisions

WotC rulings and Comprehensive Rules enrichment: curated baseline, supplemental retrieval, and eval coverage.

### DEC-029
- Decision: Published WotC Oracle rulings may enrich backend prompts for submitted cards without changing the product API or UI.
- Status: confirmed
- Context: TheJudge already sends card oracle text and structured game context to the backend prompt. Card-specific WotC rulings can improve grounding for timing, replacement effects, triggered abilities, and card-specific exceptions while preserving the assistant's non-authoritative scope.
- Impact:
  - WotC rulings enrichment is prompt-only and backend-only
  - `POST /api/ask-ai` request and response shapes remain unchanged
  - no frontend rulings UI or product-facing rulings endpoint is added
  - rulings are sourced from Scryfall bulk type `rulings`, filtered to `source === "wotc"`, and intersected with the committed card metadata `cardId` / oracle ID set
  - raw Scryfall rulings bulk data is not committed; the trimmed static backend artifact is `apps/backend/data/cardRulingsByOracleId.json`
  - existing `POST /api/ask-ai` handling looks up rulings during `preparePromptInput`; there is no separate product-facing rulings endpoint
  - prompt text may include `OFFICIAL RULINGS (WotC reference)` after populated zone sections and before `SCOPE`
  - the rulings block is omitted entirely when no submitted card has matching WotC data
  - ruling output is capped by per-card count, per-comment length, and total-section budget so `MAX_PROMPT_CHAR_BUDGET` remains authoritative
  - Scryfall download and refresh workflows require explicit human approval before agents run networked download commands
- Related requirements:
  - REQ-012
  - REQ-013
  - REQ-019
- Notes:
  - this decision does not make the product an official judge or rules engine

### DEC-030
- Decision: Backend prompts include a curated library of verbatim WotC Comprehensive Rules excerpts on every request, without changing the product API or UI.
- Status: confirmed (amended — see Notes)
- Context: Card-specific WotC rulings (DEC-029) do not cover general CR topics such as priority, stack mechanics, layers, and combat keywords. A static committed artifact mirrors the existing card-metadata and rulings pipeline.
- Impact:
  - game-rules enrichment is prompt-only and backend-only
  - `POST /api/ask-ai` request and response shapes remain unchanged
  - no frontend game-rules UI or product-facing rules endpoint is added
  - source is WotC Comprehensive Rules TXT from [magic.wizards.com/en/rules](https://magic.wizards.com/en/rules); Scryfall remains the source for cards and per-card rulings only
  - gitignored source: `apps/backend/data/cr/source.txt`
  - committed topic manifest: `apps/backend/data/gameRulesTopicManifest.json`
  - committed artifact: `apps/backend/data/gameRulesByTopic.json`
  - topic rule numbers and excerpts are curated and human-signed-off during implementation Slice B
  - current scope includes **all** curated topics on every request; no per-request signal-based selection
  - prompt text includes `GAME RULES (reference)` after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
  - disclaimer states rules are shared vocabulary and do not override submitted game state, stack order, zones, targets, notes, or card oracle text
  - section omitted only when artifact missing or empty (warning logged)
  - `npm run data:refresh` and `npm run data:build` extend the existing Scryfall pipeline with graceful degradation; agent-run network refresh still requires explicit human approval
  - larger prompts create active product risk against NFR-002; context-driven topic selection is a deferred mitigation path if latency risk materializes
- Related requirements:
  - REQ-012
  - REQ-013
  - REQ-019
  - REQ-022
- Notes:
  - static MTG reference block (DEC-025) remains unchanged
  - this decision does not make the product an official judge or rules engine
  - **Amendment (DEC-042):** `MAX_PROMPT_CHAR_BUDGET` and related truncation/enrichment constants are raised to effectively unlimited test values via a shared `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` constant; all diagnostic and enforcement infrastructure remains; revisit cap values after latency/cost sampling
  - **Superseded in part (DEC-045):** per-request inclusion of all curated topics is replaced by always-on core plus game-state-gated conditional expansion; the "all topics every request" impact bullet above is historical

### DEC-032
- Decision: Backend prompts include up to 5 supplemental WotC Comprehensive Rules excerpts per request, dynamically retrieved from a committed rule index artifact, deduplicated against the curated baseline manifest.
- Status: confirmed
- Context: DEC-030 curated baseline covers 23 topic areas but cannot cover every rule. Questions about state-based actions, obscure keywords, or specific rule numbers reference rules outside the curated manifest. Signal-based retrieval against a pre-built index fills this gap without increasing baseline prompt size for unrelated requests.
- Impact:
  - supplemental retrieval is prompt-only and backend-only; no API or UI changes
  - DEC-030 curated baseline always included; supplemental rules coexist and never replace it
  - max 5 supplemental rules per request; deduplicated against manifest rule numbers so curated rules are never repeated
  - source is same WotC CR TXT and `build-game-rules.mjs` pipeline used for DEC-030
  - committed artifact: `apps/backend/data/gameRulesRuleIndex.json` (built alongside `gameRulesByTopic.json`)
  - `scripts/build-game-rules.mjs` extended with dual-output: topic JSON + rule index JSON
  - scoring: exact rule ID match (100 pts), parent rule ID match (20 pts), dotted-token match (8 pts), keyword token match (1 pt); rules with score 0 excluded
  - section label: `ADDITIONAL RELEVANT RULE EXCERPTS`, positioned after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - section omitted when index missing, empty, or no rules score above 0
  - eval harness extended with checklist IDs: `supplemental-rules-section-present`, `supplemental-rules-after-game-rules`, `supplemental-rules-before-rulings`
  - eval fixtures added: `state-based-actions` (704.5g SBA scenario), `cascade-keyword` (cascade + prowess interaction)
- Related requirements:
  - REQ-022
- Notes:
  - supplemental section disclaimer matches DEC-030 curated baseline disclaimer pattern
  - this decision does not make the product an official judge or rules engine
  - **Superseded in part (DEC-046):** flat lexical scoring formula (+1 per shared word, lowest rule-number tie-break) is replaced by IDF-weighted, question-boosted, keyword-boosted scoring per DEC-046; the scoring impact bullet above is historical

### DEC-045
- Decision: System 2 curated game-rules baseline uses an always-on core plus card-agnostic game-state-gated topic expansion, replacing inclusion of all curated topics on every request.
- Status: confirmed
- Context: DEC-030 ships all 23 curated topics on every prompt regardless of game state, producing phase-irrelevant bloat and missing situation-specific coverage. The System 2 / System 3 boundary (locked 2026-06-18) assigns card-agnostic game-state signals to System 2; card-driven retrieval belongs in System 3. Because System 2 rule IDs are excluded from System 3's pool, a balanced slimming strategy is safe — topics dropped from the baseline become eligible for System 3 when genuinely relevant.
- Impact:
  - game-rules enrichment remains prompt-only and backend-only; no API or UI changes
  - **always-on core** (every prompt): `stack-and-priority`, `targets-basics`, `zones-basics`, `abilities-trigger-basics`
  - **conditional buckets** (unioned with core, stable `id` order):
    - `stack` zone non-empty → `spell-casting-choices`, `spell-casting-costs`, `effects-resolution-targets`, `copying-spells-abilities`, `effects-source-impossible`
    - `battlefield` zone populated → `replacement-effects-basics`, `replacement-etb-effects`, `layers-order`, `layers-power-toughness`, `layers-timestamps-dependencies`, `abilities-zone-change-triggers`
    - `turnPhase = combat` + `combatStep = declare_attackers` → `combat-phase-structure`, `combat-declare-attackers`
    - `turnPhase = combat` + `combatStep = declare_blockers` → `combat-phase-structure`, `combat-declare-blockers`
    - `turnPhase = combat` + `combatStep = combat_damage` → `combat-phase-structure`, `combat-damage-assignment`, `damage-basics`, `damage-marked-lethal`, `damage-lifelink-deathtouch`
    - `turnPhase = combat` + other or absent `combatStep` → all combat and damage topics above
    - `turnPhase ∈ {upkeep, draw, end_step, cleanup}` → `abilities-delayed-triggers`
  - selection uses only `turnPhase`, `combatStep`, and populated zone presence — no card names, oracle text, or keywords
  - topic rule numbers remain in `gameRulesTopicManifest.json`; mapping is human-signed-off during implementation
  - selection logic lives in backend (`gameRules.ts` or dedicated selector module)
  - `preparePromptInput` passes selected topics (not all topics) to `formatGameRulesSection`
  - `collectCuratedRuleIds` reflects selected topics only for System 3 deduplication
  - eval harness asserts conditional selection per scenario (REQ-032)
  - supersedes DEC-030 impact bullet requiring all curated topics on every request
- Related requirements:
  - REQ-022
  - REQ-032
- Notes:
  - NFR-002 latency mitigation: smaller baseline for phase-irrelevant requests; re-sample p50/p95 after ship
  - `MAX_PROMPT_CHAR_BUDGET` stays at `EFFECTIVELY_UNLIMITED_CHARS` (DEC-042) during tuning

### DEC-046
- Decision: System 3 supplemental rule retrieval uses relevance-aware lexical scoring with IDF weighting, question boost, keyword boost, and an improved tie-break, replacing DEC-032's flat +1-per-shared-word formula.
- Status: confirmed
- Context: DEC-032's scorer treats all shared words equally (+1), lets full oracle text drown out the user's question, and tie-breaks toward the lowest rule number — producing common, general, early-numbered rules instead of card/question-relevant ones. The System 2 / System 3 boundary assigns all card-driven retrieval (including oracle-keyword signals) to System 3; keyword matches must carry strong scoring weight to preserve quality when keyword-related topics are not curated into System 2.
- Impact:
  - supplemental retrieval remains prompt-only and backend-only; max 5 rules, deduplicated against selected System 2 rule IDs
  - **IDF weighting:** each matched token contributes `log(N/df)` where `df` = rules containing the token (computed from `gameRulesRuleIndex.json` at build or startup)
  - **question boost:** tokens from the user's question carry a multiplier over tokens from card oracle text and context notes; `buildQueryText` tracks token provenance
  - **keyword boost:** tokens in a committed static keyword vocabulary carry a strong multiplier; initial vocabulary is manually curated (`apps/backend/data/gameRulesKeywordVocabulary.json` or equivalent); derivation strategy may evolve (Q-001)
  - **retain** exact rule-ID (+100) and parent-ID (+20) bonuses from DEC-032
  - **tie-break:** highest single-token IDF among matched tokens, then ruleId ascending for determinism; replaces lowest-rule-number tie-break
  - `enrichmentDebug` continues to expose scores, selected rules, and runner-ups
  - eval harness asserts labeled supplemental recall per REQ-032
  - embeddings/semantic retrieval is not committed; lexical tuning first, measured follow-up only if needed
- Related requirements:
  - REQ-022
  - REQ-032
- Notes:
  - supersedes DEC-032 scoring formula impact bullet; section label, positioning, and dedup behavior unchanged
  - keyword vocabulary is a standalone artifact so derivation can change without scorer logic changes

### DEC-047
- Decision: The eval harness verifies game-rules retrieval relevance using labeled expected outcomes for System 2 topic selection and System 3 supplemental rule recall.
- Status: confirmed
- Context: Existing eval checks assert section presence and ordering but not which rules are pulled. Tuning System 2 and System 3 together requires measurable before/after relevance, not manual inspection of multi-file `prompt:preview` output.
- Impact:
  - eval fixtures may include an `expected` block: `expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, optional `forbiddenSupplementalRuleIds`
  - new harness checks: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded`
  - new or extended scenario fixtures cover the signal taxonomy (stack-resolution, combat-damage/deathtouch, upkeep-trigger, keyword interaction, out-of-manifest SBA)
  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics, System 3 top-5 + scores, recall hit/miss)
  - existing structural checks and `npm run test:eval` gate remain unchanged
  - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
- Related requirements:
  - REQ-032
  - REQ-022
- Notes:
  - does not replace `prompt:preview` for general prompt inspection; adds automated relevance regression
  - full prompt golden regeneration only for intentional structural changes

