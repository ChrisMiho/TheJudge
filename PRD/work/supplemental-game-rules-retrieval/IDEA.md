# IDEA — supplemental-game-rules-retrieval

## Problem

DEC-030 ships a curated library of 23 Comprehensive Rules topics (~22k chars) on **every** backend prompt. That baseline covers common mechanics (priority, stack, combat, layers, etc.) but cannot cover the full CR (~3,000+ individual rules).

When a user submits a question involving mechanics **outside** the curated manifest — obscure keywords, specific rule numbers, or card-type interactions not in the baseline — the model lacks official CR text for those rules unless it already knows them from training.

## Outcome

Add a **supplemental dynamic layer** on top of the existing baseline:

1. **Always include** all 23 curated topics (`gameRulesByTopic.json`) — no change to baseline behavior.
2. **Search** a committed rule-level index (`gameRulesRuleIndex.json`) using context clues from the submission (question, stack, zones, turn phase).
3. **Add up to 5** matching individual CR rules that are **not already** in the baseline manifest.
4. Render as a new prompt section: `ADDITIONAL RELEVANT RULE EXCERPTS` (after `GAME RULES`, before `OFFICIAL RULINGS`).

No API, frontend, or product contract changes.

## Why not Scryfall?

Scryfall bulk data provides cards and **per-card Oracle rulings** (`source === "wotc"`). It does **not** host the Comprehensive Rules document. General rules (117.x priority, 613.x layers, 704.x state-based actions, etc.) come **only** from WotC CR TXT — already downloaded to `apps/backend/data/cr/source.txt` via `data:refresh`.

## Inspiration

PR [#30](https://github.com/ChrisMiho/TheJudge/pull/30) (Joey Manning) explored full-CR dynamic retrieval with keyword/rule-id scoring. That spike is **not merged** — this work package adapts the retrieval approach into the existing DEC-030 pipeline:

- Same WotC source (`cr/source.txt`)
- Same build script (`build-game-rules.mjs`), extended — not a duplicate pipeline
- Curated baseline preserved; supplemental layer additive

## Non-goals

- Replacing the curated 23-topic baseline with dynamic-only retrieval
- Selecting a subset of curated topics per request (deferred DEC-030 latency mitigation — separate future slice)
- Semantic vector search / embeddings / Pinecone
- Runtime CR downloads or Scryfall fetches
- Frontend game-rules UI or product-facing rules endpoint
- Merging PR #30 wholesale
- Format rules, commander validation, or rules-engine behavior

## Open questions for refinement

- Exact supplemental section disclaimer wording (mirror DEC-030 spirit)
- Whether to log retrieved rule IDs in request diagnostics only or also in debug payload
- Eval fixture scenarios: which out-of-manifest rule numbers to golden-test first
- Prompt budget impact: accept additive size vs add a supplemental section char cap
