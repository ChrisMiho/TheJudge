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
