---
status: ideation
---

# commander-spellbook-combos

Integrate Commander Spellbook community combos into TheJudge (static artifact pipeline keyed by Scryfall `oracle_id`), with user-facing surfaces to be ordered in refinement.

## Related work

- May attach to or follow `card-lookup-qa` / `feature-portal` for card-centric UI entry.
- Prompt enrichment would follow the existing backend rulings pattern (`DEC-029` style), not a new product API.

## Exploration notes (for refinement)

- CSB: public REST API (`https://backend.commanderspellbook.com`), MIT, ~90k–100k variants; cards expose `oracleId`.
- Useful endpoints: `/variants/`, `/cards/`, `/find-my-combos/`.
- Full trimmed catalog is large (~90–100 MB); prefer compact `oracleId → combo` index plus lazy-loaded detail.
- Suggested phase order to validate in refinement: data pipeline → card combos UI → prompt enrichment → find-my-combos → full browser.

See `IDEA.md` for the original idea.
