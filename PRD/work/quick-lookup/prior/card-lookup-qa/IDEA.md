# card-lookup-qa

Players often need rules help on a single card without building full game state (zones, stack, or multi-card context) in the main MTG Assistant flow.

Outcome: a feature where the player looks up one card (search or scan), reads oracle text, asks a question, and the backend applies the same automatic card enrichment the main Ask AI path already uses for cards in prompt assembly (for example WotC rulings and card metadata for the model). The player can then follow up in a conversation thread under the same message-count and text-length limits as the main flow. Implemented as a lightweight Ask AI entry mode on the existing endpoint (shared pattern with rules-lookup), repackaging existing card search, scan, and conversation UI, and registering as a feature-portal destination.

Non-goals: no user-staged zones, stack, or other board state; no multi-card game setup; no separate conversation-limit policy from the main MTG Assistant flow; no new product-facing backend endpoints.
