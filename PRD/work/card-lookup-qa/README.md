---
status: ideation
---

# card-lookup-qa

Single-card lookup plus question and follow-ups, with the same backend card enrichment and conversation limits as main Ask AI — no user-staged game context.

## Sequence (lookup suite)

1. **Depends on** `feature-portal` for entry chrome (registers as a destination; does not ship its own nav).
2. **Shares** Ask AI mode contract (`mode: "card"`) on existing `POST /api/ask-ai` with `rules-lookup` (`mode: "rules"`). Prefer landing the mode contract before or with this UI.
3. **Ships before** `rules-lookup` UI (card metadata and search/scan already exist on the client; highest player familiarity).

See `IDEA.md` for the original idea.
