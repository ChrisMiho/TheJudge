# rules-lookup

Players often need to understand a rules concept (priority, the stack, layers, and similar) without building full game state in MTG Assistant and without tying the question to a specific card.

Outcome: a feature where the player browses or searches curated rules topics (reusing topic text and retrieval already used in Ask AI prompt assembly), reads the reference locally, and can optionally ask a question so the backend runs rules-focused enrichment with the same conversation limits as the main flow. Shares the lightweight Ask AI entry pattern with card-lookup-qa — a mode on the existing endpoint, not a separate API — and registers as a feature-portal destination.

Non-goals: not a full Comprehensive Rules browser; not official judge authority; no zones, stack, or game setup; no separate conversation-limit policy; no new product-facing backend endpoints.
