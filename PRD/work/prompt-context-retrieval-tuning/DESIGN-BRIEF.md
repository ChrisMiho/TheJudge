# Design Brief — prompt-context-retrieval-tuning

## Goal

Draw a clear responsibility boundary between System 2 (card-agnostic curated baseline) and System 3 (card/question-driven adaptive retrieval), tune each to that boundary, and verify relevance with the eval harness — not assertion.

## Boundary (locked 2026-06-18)

Defined **by signal source** (see `IDEA.md`):

| System | Question it answers | Signal source | Selection |
| --- | --- | --- | --- |
| **System 1** | What do official WotC rulings say about these cards? | Oracle ID per submitted card | Exact lookup — out of scope |
| **System 2** | What rules does this game situation always need? | `turnPhase`, `combatStep`, populated zones, stack non-empty | Curated, deterministic, explainable |
| **System 3** | What additional rules do these cards and this question need that System 2 didn't cover? | Question + card oracle text + context notes | Adaptive lexical scoring, top-5 |

System 2 curated rule IDs are excluded from System 3's candidate pool (`collectCuratedRuleIds` → `excludeRuleIds`). The systems are **coupled** — slimming System 2 shifts responsibility onto System 3, so they must be tuned and measured together.

## Scope

### System 2 — slim always-on core + conditional expansion (balanced)

Replace "all 23 topics on every prompt" with an **always-on core** plus **game-state-gated** topics. Signals are strictly card-agnostic — no card names, oracle text, or keywords.

**Always-on core** (every prompt):

- `stack-and-priority`
- `targets-basics`
- `zones-basics`
- `abilities-trigger-basics`

**Conditional buckets** (unioned with core; stable `id` order within output):

| Trigger | Topics added |
| --- | --- |
| `stack` zone non-empty | `spell-casting-choices`, `spell-casting-costs`, `effects-resolution-targets`, `copying-spells-abilities`, `effects-source-impossible` |
| `battlefield` zone populated | `replacement-effects-basics`, `replacement-etb-effects`, `layers-order`, `layers-power-toughness`, `layers-timestamps-dependencies`, `abilities-zone-change-triggers` |
| `turnPhase = combat` + `combatStep = declare_attackers` | `combat-phase-structure`, `combat-declare-attackers` |
| `turnPhase = combat` + `combatStep = declare_blockers` | `combat-phase-structure`, `combat-declare-blockers` |
| `turnPhase = combat` + `combatStep = combat_damage` | `combat-phase-structure`, `combat-damage-assignment`, `damage-basics`, `damage-marked-lethal`, `damage-lifelink-deathtouch` |
| `turnPhase = combat` + other/absent `combatStep` | all combat + damage topics above |
| `turnPhase ∈ {upkeep, draw, end_step, cleanup}` | `abilities-delayed-triggers` |

Topic rule numbers remain in `gameRulesTopicManifest.json`; human sign-off on mapping during implementation (DEC-030 precedent). Selection logic lives in backend (`gameRules.ts` or a dedicated selector module).

**Non-goals:** card-driven topic selection; keyword-based System 2 curation.

### System 3 — relevance-aware lexical scoring

Replace flat +1-per-shared-word scoring (DEC-032) with per-token weighted scoring:

1. **IDF weighting** — token contribution uses `log(N/df)` where `df` = rules containing the token (computed from `gameRulesRuleIndex.json` at build or startup).
2. **Question boost** — tokens from the user's question carry a multiplier over tokens from card oracle text / context notes (requires token provenance in `buildQueryText`).
3. **Keyword boost** — tokens in a committed static keyword vocabulary (`apps/backend/data/gameRulesKeywordVocabulary.json` or equivalent) carry a strong multiplier. Vocabulary derivation may evolve (see Q-001).
4. **Retain** exact rule-ID (+100) and parent-ID (+20) bonuses from DEC-032.
5. **Tie-break** — highest single-token IDF among matched tokens, then ruleId ascending for determinism. Replaces "lowest rule number wins."

Still lexical, static-artifact, top-5, deduplicated against System 2. Embeddings/semantic retrieval is an explicit non-goal; decide only after lexical tuning is measured.

### Measurement — labeled recall

Extend eval fixtures with an `expected` block:

- `expectedSystem2TopicIds` — topics that must appear in the curated baseline for this scenario
- `expectedSupplementalRuleIds` — rule IDs that must appear in System 3 top-5
- `forbiddenSupplementalRuleIds` — rule IDs that must not appear in top-5 (noise regression)

New harness checks: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded`.

New scenario fixtures covering the signal taxonomy (e.g. Counterspell stack-resolution, combat-damage/deathtouch, upkeep-trigger). Reuse and extend `cascade-keyword` and `state-based-actions`.

Add a digestible **before/after relevance report** (one table per scenario: System 2 topics selected, System 3 top-5 + scores, recall hit/miss) — replaces the hard-to-read multi-file preview for tuning review.

## Non-goals

- Prompt-format redesign
- Runtime CR retrieval or external API calls at request time
- Embeddings / semantic retrieval (possible measured follow-up)
- System 1 (official card rulings) behavior changes
- `AskAiRequest`, Zod schema, or frontend changes
- Re-tightening `MAX_PROMPT_CHAR_BUDGET` (stays at `EFFECTIVELY_UNLIMITED_CHARS` per DEC-042)
- PRD/documentation hygiene (`prd-doc-traceability`)

## Decisions

| ID | Summary |
| --- | --- |
| DEC-045 | System 2 conditional baseline selection (supersedes DEC-030 "all topics every request") |
| DEC-046 | System 3 relevance-aware scoring (supersedes DEC-032 scoring formula) |
| DEC-047 | Retrieval relevance measurement in eval harness |

## Requirements

| ID | Relationship |
| --- | --- |
| REQ-022 | Amended — conditional System 2, tuned System 3 |
| REQ-032 | New — retrieval relevance measurement |

## Open questions

| ID | Summary |
| --- | --- |
| Q-001 | Keyword vocabulary derivation strategy may evolve (static manual → Scryfall-derived or generated) |

## Implementation notes (for map-out)

- System 2 and System 3 are coupled; measure together. Slice sequencing (one sequence vs separate slices) is a map-out decision.
- Eval goldens regenerate intentionally for behavior changes.
- `system-map.md` catalog updates deferred to cleanup (promotion gate).

## Related work

- `prd-doc-traceability` — documentation hygiene (split out)
- `PRD/work/system-map-detail/` — deep subsystem behavior prose (deferred)
