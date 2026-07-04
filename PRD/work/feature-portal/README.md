---
status: ideation
---

# feature-portal

Compact top-right feature portal (elevated from DEC-089) — extensible destination registry and frontend-only mode switch so users can move between suite features without cluttering the UI. Owns app navigation chrome; features register as destinations rather than shipping their own menu.

## Lookup suite sequence

Portal is the **first** package in the lookup-suite build order. Destinations that register here:

| Destination | Work package | Notes |
|---|---|---|
| MTG Assistant | (shipped) | Default / existing main flow |
| Card Trade Balancer | `card-trade-balancer` | Nav ownership moves from balancer slice B into this package |
| Card Lookup | `card-lookup-qa` | Lightweight Ask AI mode `"card"` |
| Rules Lookup | `rules-lookup` | Browse topics + Ask AI mode `"rules"` |

Suggested order after portal: Ask AI mode contract (`game` \| `card` \| `rules`) on existing `POST /api/ask-ai` → card-lookup UI → rules browse → rules ask.

See `IDEA.md` for the original idea. Refinement will align DEC-089 / REQ-067 / FLOW-010 and update `card-trade-balancer` so navigation ownership lives here.
