# IDEA — general-game-rules-prompt

## Problem

TheJudge already enriches prompts with card oracle text, game context, a static MTG reference block, and per-card WotC Oracle rulings (DEC-029). It still lacks **general** Magic rules grounding—priority, stack mechanics, triggered/replacement effects, combat keywords, layers, etc.—so the model must infer from training data alone. Example: a priority-only question with no cards (`zero-cards` eval fixture) has no CR text to cite.

## Outcome

Every `POST /api/ask-ai` prompt includes a **GAME RULES (reference)** section built from a committed artifact of verbatim WotC Comprehensive Rules excerpts (~20–28 curated topics). v1 ships the **entire library on every request** to maximize context while we measure answer quality and latency; context-driven selection is deferred to v2 if needed.

## Non-goals

- Entire Comprehensive Rules document in prompts (~900k chars)
- Rules engine / layer adjudication / board-state simulation
- Format-specific rules (Commander, Limited, etc.)
- Frontend or API contract changes
- Runtime Scryfall or CR fetch per request
- Paraphrased rule text (verbatim WotC wording only)
