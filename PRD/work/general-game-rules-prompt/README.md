# general-game-rules-prompt

## Status

`active` — map-out complete 2026-06-05. Implement slices A → D in order.

## Slug

`general-game-rules-prompt`

## Summary

Backend prompt enrichment: include a curated library of verbatim WotC Comprehensive Rules excerpts in every Ask AI request (v1 all-library-always), with a new CR data pipeline alongside existing Scryfall card/rulings flows.

## Agent read order

1. This README
2. [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) — product truth
3. [GAMEPLAN.md](./GAMEPLAN.md) — architecture, data flow, verification
4. The slice doc for the slice you are implementing
5. `PRD/sections/decisions.md` (DEC-030, DEC-029, DEC-025)
6. `PRD/sections/functional-requirements.md` (REQ-022)

## Work package files

| File | Purpose |
|------|---------|
| [IDEA.md](./IDEA.md) | Problem, outcome, non-goals |
| [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) | Refined scope, decisions, REQ references |
| [GAMEPLAN.md](./GAMEPLAN.md) | Architecture, data flow, verification checklist |
| [slice-a-cr-pipeline.md](./slice-a-cr-pipeline.md) | CR download + build script |
| [slice-b-topic-curation.md](./slice-b-topic-curation.md) | Manifest curation + committed artifact |
| [slice-c-backend-prompt.md](./slice-c-backend-prompt.md) | Runtime load + prompt integration |
| [slice-d-eval-latency-closeout.md](./slice-d-eval-latency-closeout.md) | Eval goldens + latency spike + ship gates |

## Slices

| Slice | File | Status | Depends on |
|-------|------|--------|------------|
| A | [slice-a-cr-pipeline.md](./slice-a-cr-pipeline.md) | planned | — |
| B | [slice-b-topic-curation.md](./slice-b-topic-curation.md) | planned | A |
| C | [slice-c-backend-prompt.md](./slice-c-backend-prompt.md) | planned | B |
| D | [slice-d-eval-latency-closeout.md](./slice-d-eval-latency-closeout.md) | planned | C |

## Implementation map

| Slice | Primary code / artifacts |
|-------|--------------------------|
| A | `scripts/refresh-scryfall-data.mjs`, `scripts/build-game-rules.mjs`, `package.json`, `.gitignore`, scaffold manifest |
| B | `gameRulesTopicManifest.json`, `gameRulesByTopic.json` |
| C | `apps/backend/src/gameRules.ts`, `prompt/preparation.ts`, `prompt/normalization.ts`, `index.ts`, `createApp.ts` |
| D | `eval/contextEvaluationHarness.ts`, eval golden fixtures, latency readout in slice D doc |

## Session openers

```
Attach thejudge-implement for PRD/work/general-game-rules-prompt/ slice A.
```

```
Attach thejudge-implement for PRD/work/general-game-rules-prompt/ next slice.
```

When all slices done:

```
Attach thejudge-cleanup for PRD/work/general-game-rules-prompt/.
```

## Related PRD

- [DEC-030](../../sections/decisions.md) — general game rules prompt enrichment
- [REQ-022](../../sections/functional-requirements.md) — acceptance criteria
- [DEC-029](../../sections/decisions.md) — per-card WotC Oracle rulings (ordering reference)
- [DEC-025](../../sections/decisions.md) — static MTG reference block
- [NFR-002](../../sections/non-functional-requirements.md) — latency product risk
