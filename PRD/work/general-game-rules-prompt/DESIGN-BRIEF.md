# DESIGN-BRIEF — general-game-rules-prompt

## Status

Refined 2026-06-05. Ready for `thejudge-quality-check`, then `thejudge-map-out`.

## Problem

TheJudge enriches prompts with card oracle text, structured `gameContext`, the static MTG reference block (DEC-025), and per-card WotC Oracle rulings (DEC-029). It still lacks **general** Comprehensive Rules grounding — priority, stack mechanics, triggered/replacement effects, combat keywords, layers, etc. — so the model leans on training data alone.

## Outcome

Every `POST /api/ask-ai` prompt includes a **GAME RULES (reference)** section built from a committed artifact of verbatim WotC CR excerpts (~20–28 curated topics). The **entire curated library ships on every request** in current scope.

## Non-goals

- Entire Comprehensive Rules document in prompts (~900k chars)
- Rules engine / layer adjudication / board-state simulation
- Format-specific rules (Commander, Limited, etc.)
- Frontend or API contract changes
- Runtime Scryfall or CR fetch per request
- Paraphrased rule text (verbatim WotC wording only)
- Per-request context-driven topic selection (deferred mitigation — see Product risks)

## Decisions

| ID | Summary |
|----|---------|
| [DEC-030](../../sections/decisions.md) | Verbatim WotC CR excerpt library in every prompt; 35k char budget; prompt-only |
| [DEC-025](../../sections/decisions.md) | Static MTG reference block unchanged |
| [DEC-029](../../sections/decisions.md) | Per-card WotC rulings; ordering reference for new section |
| [DEC-001](../../sections/decisions.md) | Flow-validation assistant, not rules engine |
| [DEC-013](../../sections/decisions.md) | No legality validation or board-state logic |

## Requirements

| ID | Role |
|----|------|
| [REQ-022](../../sections/functional-requirements.md) | General game rules prompt enrichment (primary) |
| REQ-012 | Ask AI backend contract unchanged |
| REQ-013 | Plain-text response unchanged |
| REQ-019 | `AskAiRequest` shape unchanged |

## Flows

No new user-facing flow. Existing [FLOW](../../sections/user-flows.md) for Decrypt Stack / Ask AI is unchanged.

## Scope

### Data pipeline

```text
npm run data:refresh  →  download Scryfall + WotC CR, then build
npm run data:build    →  build-card-metadata && build-card-rulings && build-game-rules
```

**Paths:**

- Gitignored CR source: `apps/backend/data/cr/source.txt`
- Topic manifest (committed): `apps/backend/data/gameRulesTopicManifest.json`
- Committed artifact: `apps/backend/data/gameRulesByTopic.json`

**Graceful degradation (scripts never fail):**

- Refresh: skip unavailable downloads (Scryfall or CR), log warning, continue
- Build: missing CR source → log, keep committed `gameRulesByTopic.json`, exit 0
- Build: pending topic extract → log, keep prior committed excerpt for that topic

**Topic curation:** Final rule numbers and excerpts are curated and human-signed-off during **Slice B**. Refinement locks the process (manifest + build + committed artifact), not the exact rule list.

Each topic `excerpt` is exact CR prose by rule number (`405.1`, `613.4b`, etc.) — no paraphrase.

### Runtime behavior

1. Load `gameRulesByTopic.json` at startup (like card rulings)
2. `preparePromptInput` passes **all topics** to `buildPromptText`
3. `formatGameRulesSection` renders every topic in stable `id` order
4. Omit section only if artifact missing/empty (log warning)
5. No signal selection, pinning, or section char cap beyond global budget

### Prompt section order

```text
SYSTEM ROLE PREAMBLE
INSTRUCTIONS
MTG REFERENCE
GENERAL GAME CONTEXT
[ZONE sections]
GAME RULES (reference)   ← NEW
OFFICIAL RULINGS
SCOPE
QUESTION
```

**Disclaimer:**

```text
GAME RULES (reference)
Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text.
```

### Topic library (candidate areas — final list in Slice B)

| Area | Example CR refs |
|------|-----------------|
| Stack & timing | `405.x`, `117.x`, `601.x`, flash/instant |
| Abilities | `603.x`, `614.x`, countering, `115.x`, `707` |
| Combat | phase overview, shadow/flying/first strike/trample/lifelink/deathtouch |
| Layers (curated) | `613.1`–`613.1g`, `613.4` P/T, `613.7`, `613.8` |
| Zones & damage | hidden zones, `120.x`/`615.x`, ETB/dies triggers |

Target: ~20–28 topics, ~18–22k chars for the full library.

### Token budget

| Component | Chars (approx) |
|-----------|----------------|
| Full game-rules library | 18,000–22,000 |
| Rest of prompt (typical) | 3,000–3,500 |
| Static MTG REFERENCE | ~1,500 |
| Card rulings (max) | up to ~2,400 |
| **Total typical** | **~25,000–27,000** |
| **Worst case** | **~29,000–32,000** (under 35k cap) |

`MAX_PROMPT_CHAR_BUDGET` = **35,000**.

### Implementation touchpoints (map-out reference)

| Area | File(s) |
|------|---------|
| Rule loading | `apps/backend/src/gameRules.ts` (new) |
| Prompt assembly | `apps/backend/src/prompt/preparation.ts` |
| Prompt budget | `apps/backend/src/prompt/normalization.ts` |
| Bootstrap | `apps/backend/src/index.ts`, `createApp.ts` |
| Eval | `apps/backend/src/eval/contextEvaluationHarness.ts` |
| Refresh | `scripts/refresh-scryfall-data.mjs` |
| Build | `scripts/build-game-rules.mjs` (new) |

## Product risks

**Prompt size vs latency (NFR-002):** Shipping the full game-rules library on every request materially increases prompt size (~25–32k chars in typical/worst-case stacks). This is an **active product risk** against the 3-second AI latency target — not a scoped experiment to revisit later. Slice D records manual p50/p95 latency samples; if the risk materializes, context-driven topic selection is the primary mitigation path (deferred from current scope).

## Verification (slice-level detail in map-out)

- Unit: load + format all topics in stable order
- Eval: every fixture includes full GAME RULES block; under 35k cap (including eval-only `zero-cards`)
- Diagnostics: `gameRulesSectionChars`, `gameRulesTopicCount`
- Manual: 5–10 live scenarios; record latency p50/p95 + informal accuracy notes

## Slice preview

| Slice | Objective |
|-------|-----------|
| A | CR download + `build-game-rules.mjs` + `data:refresh`/`data:build` |
| B | Topic manifest curation + committed `gameRulesByTopic.json` |
| C | Backend prompt integration + 35k cap |
| D | Eval goldens + manual latency/accuracy spike + product-risk readout |

## PRD promotion (this refinement)

- [DEC-030](../../sections/decisions.md) added
- [REQ-022](../../sections/functional-requirements.md) added
- [integrations-and-data.md](../../sections/integrations-and-data.md) — Game Rules Data Strategy + prompt rules
- [NFR-002](../../sections/non-functional-requirements.md) — product-risk note on latency
