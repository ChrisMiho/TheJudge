# quick-lookup

Players usually need rules help about a particular card, or a freeform Magic question, without building full game state in MTG Assistant — and two separate lookup destinations split what should feel like one short ask path.

Outcome: one feature-portal destination where the player can optionally attach a single card (search or scan) and ask an MTG question, or ask a freeform Magic question with no card, then follow up under the same conversation limits as the main Ask AI path. The backend rides the existing Ask AI preparation and prompt-assembly path — branching and omitting game-state-only sections rather than forking enrichment — so when a card is present it still supplies full card metadata (including oracle text), WotC rulings, and question-driven official/supplemental rules retrieval; without a card it still runs question-driven rules enrichment. Non-MTG / off-domain questions must be refused or redirected so this path is not a general chatbot.

Non-goals: no user-staged zones, stack, or board; not a full Comprehensive Rules browser; not official judge authority; no separate conversation-limit policy; no new product-facing endpoint; no duplicated enrichment implementations.
