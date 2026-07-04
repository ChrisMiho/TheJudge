---
status: ideation
---

# rules-lookup

Browse or search curated rules topics, read them locally, and optionally ask AI about rules — same conversation limits as main Ask AI, no game-state setup.

## Sequence (lookup suite)

1. **Depends on** `feature-portal` for entry chrome (registers as a destination; does not ship its own nav).
2. **Shares** Ask AI mode contract on existing `POST /api/ask-ai` with `card-lookup-qa` (`mode: "rules"` here, `mode: "card"` there). Prefer landing the mode contract with or before card-lookup.
3. **Ships after** `card-lookup-qa` UI: rules browse (topic artifact + search), then rules ask (reuse conversation chrome from card lookup).

See `IDEA.md` for the original idea.
