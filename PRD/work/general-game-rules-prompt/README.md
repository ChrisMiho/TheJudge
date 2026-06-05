# general-game-rules-prompt

## Status

`ideation` — planning captured from kickoff session; ready for `thejudge-refinement`.

## Slug

`general-game-rules-prompt`

## Summary

Backend prompt enrichment: include a curated library of verbatim WotC Comprehensive Rules excerpts in every Ask AI request (v1 all-library-always), with a new CR data pipeline alongside existing Scryfall card/rulings flows.

## Work package files

| File | Purpose |
|------|---------|
| [IDEA.md](./IDEA.md) | Problem, outcome, non-goals |
| [GAMEPLAN.md](./GAMEPLAN.md) | Full scoped plan from planning session (architecture, data, slices, decisions) |

## Next skill

Attach **`thejudge-refinement`** with slug `general-game-rules-prompt` to produce `DESIGN-BRIEF.md` and promote `DEC-030` into `PRD/sections/`.

After refinement and quality-check, attach **`thejudge-map-out`** for lettered slice docs.

## Related shipped work

- [DEC-029](../../sections/decisions.md) — per-card WotC Oracle rulings prompt enrichment (Scryfall)
- [DEC-025](../../sections/decisions.md) — static MTG reference block in every prompt

## Implementation map (preview — not active until map-out)

| Slice | Objective | Status |
|-------|-----------|--------|
| A | CR download + `build-game-rules.mjs` + `data:refresh`/`data:build` | pending |
| B | Topic manifest + committed `gameRulesByTopic.json` | pending |
| C | Backend prompt integration + 35k cap | pending |
| D | Eval goldens + manual latency/accuracy spike | pending |
