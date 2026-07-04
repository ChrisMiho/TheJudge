# Idea: card-trade-balancer

**Problem:** Trading MTG cards fairly requires matching card values, often bundling multiple cards on one side to reach parity. With thousands of cards and shifting prices, doing this value math by hand at the table is slow and error-prone.

**Outcome:** Leverage the existing card-scan flow to let two traders each build a scanned list of cards. Show each list's total value and the difference between the two sides so players can see at a glance whether a trade is balanced and by how much.

**Enabler:** Extend the Scryfall-derived metadata extract (`cardMetadata.json`) so it also carries card price, giving the frontend a local price to sum without new runtime price lookups.

**Non-goals (initial):** No live/real-time price API sync, no trade history/persistence, no marketplace or transaction handling, no automated "suggest cards to balance" logic — just scan two lists and show values + diff.
