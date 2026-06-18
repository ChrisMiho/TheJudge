# GAMEPLAN — prompt-context-retrieval-tuning

## Summary

Slim System 2 curated game-rules baseline from "all 23 topics every prompt" to an always-on core plus card-agnostic game-state-gated expansion (DEC-045). Replace System 3 flat lexical scoring with IDF-weighted, question-boosted, keyword-boosted retrieval and an improved tie-break (DEC-046). Extend the eval harness with labeled recall fixtures and a digestible relevance report (DEC-047, REQ-032).

System 2 and System 3 are **coupled** — `collectCuratedRuleIds` reflects selected System 2 topics, which defines System 3's exclusion pool. Tune and verify together.

## Architecture

### Data flow (after)

```
AskAiRequest
  → buildPromptContext() → PromptContext
  → selectGameRulesTopics(context, allTopicsFromArtifact)     ← System 2 (DEC-045)
  → formatGameRulesSection(selectedTopics)
  → collectCuratedRuleIds(selectedTopics) → excludeRuleIds
  → buildQueryTokensWithProvenance(context)                   ← System 3 (DEC-046)
  → scoreEntries(index, tokens, excludeRuleIds) → top-5
  → formatSupplementalRulesSection(selected)
  → buildPromptText(...)
```

### Startup artifacts

| Artifact | Role |
| --- | --- |
| `apps/backend/data/gameRulesByTopic.json` | Full topic excerpts (built from manifest) |
| `apps/backend/data/gameRulesTopicManifest.json` | Topic ids + rule numbers (human sign-off) |
| `apps/backend/data/gameRulesRuleIndex.json` | ~3,432 CR rules for System 3 |
| `apps/backend/data/gameRulesKeywordVocabulary.json` | **New** — static keyword tokens for boost |
| `apps/backend/data/gameRulesTokenStats.json` | **New** — per-token `df` (+ `N`) for IDF |

IDF stats are produced by `scripts/build-game-rules.mjs` alongside the rule index so runtime scoring stays static-artifact based (no request-time CR fetch).

### System 2 topic selection (DEC-045)

Signals only: `turnPhase`, `combatStep`, populated zone presence (stack non-empty, battlefield populated). No card names, oracle text, or keywords.

**Always-on core** (every prompt): `stack-and-priority`, `targets-basics`, `zones-basics`, `abilities-trigger-basics`.

**Conditional buckets** unioned with core; output sorted by stable topic `id`:

| Trigger | Topics added |
| --- | --- |
| `stack` zone non-empty | `spell-casting-choices`, `spell-casting-costs`, `effects-resolution-targets`, `copying-spells-abilities`, `effects-source-impossible` |
| `battlefield` zone populated | `replacement-effects-basics`, `replacement-etb-effects`, `layers-order`, `layers-power-toughness`, `layers-timestamps-dependencies`, `abilities-zone-change-triggers` |
| `turnPhase = combat` + `combatStep = declare_attackers` | `combat-phase-structure`, `combat-declare-attackers` |
| `turnPhase = combat` + `combatStep = declare_blockers` | `combat-phase-structure`, `combat-declare-blockers` |
| `turnPhase = combat` + `combatStep = combat_damage` | `combat-phase-structure`, `combat-damage-assignment`, `damage-basics`, `damage-marked-lethal`, `damage-lifelink-deathtouch` |
| `turnPhase = combat` + other/absent `combatStep` | all combat + damage topics above |
| `turnPhase ∈ {upkeep, draw, end_step, cleanup}` | `abilities-delayed-triggers` |

Selection logic: `apps/backend/src/gameRulesTopicSelection.ts` (or equivalent module). `preparePromptInput` selects per request; `index.ts` continues loading the full artifact at startup.

### System 3 scoring (DEC-046)

Replace flat `+1` per shared token with:

1. **IDF weight** per matched token: `log(N / max(df, 1))` using committed token stats.
2. **Question boost**: question-sourced tokens × `QUESTION_TOKEN_MULTIPLIER` (default **3**).
3. **Keyword boost**: vocabulary tokens × `KEYWORD_TOKEN_MULTIPLIER` (default **6** — strong vs oracle noise).
4. **Retain** exact rule-ID (+100) and parent-ID (+20) bonuses from DEC-032.
5. **Tie-break**: highest single-token IDF among matched tokens, then `ruleId` ascending.

`buildQueryText` splits into provenance-aware tokenization: question tokens vs oracle/context tokens. Oracle tokens from cards and `contextNotes` share the base weight (no question boost).

Initial keyword vocabulary: manually curated in `gameRulesKeywordVocabulary.json` (cascade, prowess, deathtouch, lifelink, trample, etc.). Derivation may evolve (Q-001); artifact stays separate from scorer.

### Measurement (DEC-047)

Fixture `expected` block (optional per fixture):

```json
"expected": {
  "expectedSystem2TopicIds": ["stack-and-priority", "..."],
  "expectedSupplementalRuleIds": ["702.85", "603.2"],
  "forbiddenSupplementalRuleIds": ["100.1"]
}
```

Harness checks: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded`.

Scenario coverage: stack-resolution (Counterspell), combat-damage/deathtouch, upkeep-trigger, extend `cascade-keyword` and `state-based-actions`.

Relevance report: script or harness helper — one table per scenario with System 2 topics, System 3 top-5 + scores, recall hit/miss.

### Files touched (rollup)

**Backend core:**
- `apps/backend/src/gameRulesTopicSelection.ts` — **new**
- `apps/backend/src/gameRules.ts` — optional exports / re-exports
- `apps/backend/src/gameRulesRetrieval.ts` — provenance query, IDF scoring, tie-break
- `apps/backend/src/prompt/preparation.ts` — per-request topic selection
- `apps/backend/src/index.ts` — pass full topic list; selection at request time

**Data / build:**
- `apps/backend/data/gameRulesKeywordVocabulary.json` — **new**
- `apps/backend/data/gameRulesTokenStats.json` — **new** (build output)
- `scripts/build-game-rules.mjs` — emit token stats

**Eval:**
- `apps/backend/src/eval/contextEvaluationHarness.ts` — new checks + `expected` type
- `apps/backend/src/eval/contextEvaluationHarness.test.ts` — selection + relevance wiring
- `apps/backend/src/eval/fixtures/*.fixture.json` — new + extended scenarios
- `apps/backend/src/eval/fixtures/README.md` — document `expected` block

**Scripts:**
- `scripts/retrieval-relevance-report.mjs` — **new** (or harness export)
- `package.json` — optional `retrieval:report` npm script

**Tests:**
- `apps/backend/src/gameRulesTopicSelection.test.ts` — **new**
- `apps/backend/src/gameRulesRetrieval.test.ts` — scoring regressions
- `apps/backend/src/gameRules.test.ts` — if selection integrated here

## Slice sequencing

Sequential A → B → C → D → E. System 3 exclusion pool depends on System 2 selection; relevance fixtures depend on both scorers.

| Slice | Focus |
| --- | --- |
| A | System 2 conditional topic selection |
| B | System 3 IDF + boosts + keyword vocabulary + build artifact |
| C | Eval harness relevance checks + labeled fixtures |
| D | Relevance report script |
| E | Ship gates |

## Verification checklist

- [ ] `selectGameRulesTopics` returns core-only for minimal `main_1` with empty zones
- [ ] Stack-populated scenarios add stack conditional topics; combat scenarios add combat/damage topics
- [ ] `preparePromptInput` emits fewer curated topics for phase-irrelevant requests vs today
- [ ] System 3 top-5 shifts toward question/keyword-relevant rules (cascade, prowess, deathtouch, SBA)
- [ ] `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded` pass on labeled fixtures
- [ ] Existing structural harness checks unchanged and passing
- [ ] `npm --workspace apps/backend run test:eval` green
- [ ] `npm run quality:check` green at ship
- [ ] Relevance report readable for tuning review (one table per scenario)
- [ ] No `AskAiRequest`, Zod schema, or frontend changes
- [ ] `MAX_PROMPT_CHAR_BUDGET` unchanged (DEC-042)

## Out of scope (cleanup, not implement)

- `sections/system-map.md` catalog updates — promotion gate at cleanup
- PRD section promotion — cleanup receipt
