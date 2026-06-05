# GAMEPLAN — general-game-rules-prompt

Captured from planning session 2026-06-05. Refinement skill should align this with `DESIGN-BRIEF.md` and promote durable decisions to `PRD/sections/`.

## Baseline

TheJudge is a flow-validation MTG assistant: staged zone context → Ask AI → non-authoritative explanation via `POST /api/ask-ai`.

**Already shipped:**

- Static **MTG REFERENCE** — `apps/backend/src/prompt/mtgReference.ts` (DEC-025)
- Per-card **OFFICIAL RULINGS** — Scryfall WotC rulings artifact (DEC-029)
- Card lookup/autocomplete — frontend local metadata

## Problem

Card rulings answer card-specific questions. General CR topics (priority, stack, triggered, replacement, combat, layers) are missing from prompts.

## v1 decision (confirmed)

**Ship the full curated game-rules library in every prompt.**

- ~20–28 topics, verbatim WotC CR text
- No per-request selection in v1
- Raise `MAX_PROMPT_CHAR_BUDGET` from 12,000 → **35,000**
- Measure latency + answer quality manually; selective inclusion is **v2** if needed

## Token budget

| Component | Chars (approx) | Tokens (approx) |
|-----------|----------------|-----------------|
| Full game-rules library | ~18,000–22,000 | ~4,500–5,500 |
| Rest of prompt (typical) | ~3,000–3,500 | ~750–875 |
| Static MTG REFERENCE | ~1,500 | ~375 |
| Card rulings (max) | up to ~2,400 | ~600 |
| **Total typical** | **~25,000–27,000** | **~6,500–7,000** |
| **Worst case (near-cap stack)** | **~29,000–32,000** | **~7,500–8,000** |

Cost on `gpt-4.1-mini` is acceptable; watch **latency** against NFR (~3s).

## Data sources

| Data | Source |
|------|--------|
| Cards + oracle text | Scryfall `default_cards` → `cardMetadata.json` |
| Per-card WotC rulings | Scryfall `rulings` → `cardRulingsByOracleId.json` |
| **General game rules** | **WotC CR TXT** from [magic.wizards.com/en/rules](https://magic.wizards.com/en/rules) |

Scryfall does **not** host Comprehensive Rules.

## npm pipeline (confirmed)

```text
npm run data:refresh   → download Scryfall + WotC CR, then build
npm run data:build     → transform local sources only (no network)
```

**Graceful degradation (never fail the script):**

- Refresh: skip unavailable downloads (Scryfall or CR), log warning, continue
- Build: if CR source missing → log, use committed `gameRulesByTopic.json`, exit 0
- Build: per-topic extract pending → log, keep prior committed excerpt
- Agent-run `data:refresh` still requires human approval before network (existing PRD policy)

**Build chain extension:**

```text
data:build = build-card-metadata.mjs && build-card-rulings.mjs && build-game-rules.mjs
```

**Paths:**

- Gitignored CR source: `apps/backend/data/cr/source.txt`
- Topic manifest: `apps/backend/data/gameRulesTopicManifest.json` (or co-located in build script)
- Committed artifact: `apps/backend/data/gameRulesByTopic.json`

## Verbatim CR text (confirmed)

- Topic `excerpt` = exact CR prose extracted by rule number (`405.1`, `613.4b`, `702.9a`, etc.)
- No paraphrase — MTG wording matters
- One-line prompt disclaimer is fine; rule body is untouched

## Runtime behavior (v1)

1. Load `gameRulesByTopic.json` at startup (like card rulings)
2. `preparePromptInput` → pass **all topics** to `buildPromptText`
3. `formatGameRulesSection` → render every topic in stable `id` order
4. Omit section only if artifact missing/empty (log warning)
5. No signal selection, pinning, or section char cap in v1

## Prompt section order

```
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

Disclaimer:

```text
GAME RULES (reference)
Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state, stack order, or card oracle text.
```

Keep static `MTG_PROMPT_REFERENCE` unchanged in v1 (DEC-025).

## Topic library (~20–28 excerpts — all in every prompt)

**Stack & timing:** `405.x`, `117.x`, `601.x` core, flash/instant timing

**Abilities:** triggered `603.x`, replacement `614.x` core, countering, targeting `115.x`, copy `707` core

**Combat:** phase overview, shadow `702.9`, flying, first strike, trample, lifelink, deathtouch

**Layers (curated 613 subsections, not full chapter):** `613.1`–`613.1g`, `613.4` P/T sublayers, `613.7` timestamp, `613.8` dependency, copy layer refs

**Zones & damage:** hidden zones, damage/prevention `120.x`/`615.x`, ETB/dies triggers

## Implementation touchpoints

| Area | File(s) | Change |
|------|---------|--------|
| Rule loading | `apps/backend/src/gameRules.ts` (new) | `loadGameRulesTopics()`, format all topics |
| Prompt assembly | `apps/backend/src/prompt/preparation.ts` | Pass full library |
| Prompt text | `apps/backend/src/prompt/normalization.ts` | `MAX_PROMPT_CHAR_BUDGET = 35000`, diagnostics |
| Bootstrap | `apps/backend/src/index.ts`, `createApp.ts` | Load artifact at startup |
| Eval | `apps/backend/src/eval/contextEvaluationHarness.ts` | Full library present, under 35k |
| Refresh | `scripts/refresh-scryfall-data.mjs` | Add WotC CR download |
| Build | `scripts/build-game-rules.mjs` (new) | Extract verbatim excerpts |

No `AskAiRequest` / frontend changes (same boundary as DEC-029).

## Testing

- Unit: load + format all topics in stable order
- Eval goldens: every fixture includes full GAME RULES block; under 35k cap
- Diagnostics: `gameRulesSectionChars`, `gameRulesTopicCount`
- Manual: `npm run dev:openai` — 5–10 scenarios, record latency p50/p95 + informal accuracy notes

## Phased delivery (slice preview)

### Slice A — Data pipeline

- Extend `data:refresh` for WotC CR TXT
- Add `build-game-rules.mjs` to `data:build`
- Graceful skip+log behavior
- Initial topic manifest

### Slice B — Artifact

- Build committed `gameRulesByTopic.json`
- Document char totals per topic + library sum

### Slice C — Prompt integration

- `gameRules.ts` + `preparePromptInput` / `buildPromptText`
- Cap → 35k
- Bootstrap load

### Slice D — Verification

- Eval golden updates
- Manual latency/accuracy spike
- Decide v2 selection need

## Deferred v2 (reference)

If all-on latency or answer focus disappoints:

- Context-driven selection: phase → zones → oracle → question
- Shadow pinning when combat-relevant
- Layer tier 1/2 with max-one-per-group
- Score-ranked topics until budget

Trigger metadata can live in manifest without affecting v1 runtime.

## PRD promotion (for refinement / cleanup)

- **DEC-030** in `sections/decisions.md`
- Update `sections/integrations-and-data.md` AI Prompt Context Rules
- Possible REQ addition for game-rules prompt enrichment

## Confirmed product choices

- v1: entire curated library every prompt
- `MAX_PROMPT_CHAR_BUDGET = 35,000`
- Scryfall for cards/rulings; WotC CR for general rules
- Verbatim CR wording
- `data:refresh` / `data:build` unified with graceful degradation
- Selection engine deferred to v2
