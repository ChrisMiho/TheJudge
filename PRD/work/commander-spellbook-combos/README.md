---
status: active
---

# commander-spellbook-combos

Integrate Commander Spellbook as a static, backend-only community combo enrichment corpus keyed by Scryfall `oracle_id`, with deterministic intent/context gates and no runtime upstream dependency.

## Refined outcome

- In-Depth Question receives automatic combo context only for complete quantity-aware identity + compatible-zone matches.
- Narrow explicit combo questions may receive up to five partial candidates with missing or incorrectly zoned pieces called out.
- Quick Question requires explicit combo intent plus an attached card.
- Template matches are expanded during the human-approved build when the upstream source provides an authoritative query/mapping; unresolved templates cannot complete automatic matching.
- Combo data is labeled community-sourced and never overrides official card text, WotC rulings, or Comprehensive Rules.
- No Known Combos UI, browser, feature-portal destination, find-my-combos flow, bracket estimation, new endpoint, or runtime Commander Spellbook call is included.

## Product truth

- DEC-116
- REQ-093
- REQ-094
- REQ-095
- FLOW-015

See `DESIGN-BRIEF.md` for approved scope and `GAMEPLAN.md` for architecture, interfaces, dependency order, and verification.

## Slices

| Slice | Objective | Depends on | Requirements |
| --- | --- | --- | --- |
| [A](slice-a-static-corpus-pipeline.md) | Human-approved refresh/build + committed static corpus | — | REQ-093, DEC-116 |
| [B](slice-b-runtime-catalog-loader.md) | Typed fail-open runtime catalog loader | A | REQ-093 failure behavior |
| [C](slice-c-deterministic-matching.md) | Intent gate, quantity/zone matcher, annotations, ranking | B | REQ-094, FLOW-015 steps 1–5 |
| [D](slice-d-prompt-runtime-integration.md) | Prompt section + startup/app/route preparation wiring | C | REQ-095, FLOW-015 steps 6–7 |
| [E](slice-e-eval-and-ship.md) | Eval goldens, full regression gate, PRD cleanup handoff | D | REQ-095 verification, FLOW-015 |

All slices are sequential. A fixes the artifact contract consumed by B; B fixes the normalized catalog consumed by C; C fixes the match/annotation contract consumed by D; E must capture D's final prompt/runtime behavior in intentional goldens. Parallel implementation would duplicate or guess those interfaces.

## Implementation map

| Concern | Location |
| --- | --- |
| Human-approved raw refresh | `scripts/refresh-commander-spellbook-data.mjs` → gitignored `apps/backend/data/commander-spellbook/` |
| Deterministic artifact build | `scripts/build-commander-spellbook-combos.mjs` → `apps/backend/data/commanderSpellbookCombos.json` + `commanderSpellbookComboIndex.json` |
| Runtime types + loading | `apps/backend/src/commanderSpellbook/types.ts`, `catalog.ts` |
| Intent, assignment, annotations, ranking | `apps/backend/src/commanderSpellbook/intent.ts`, `matcher.ts` |
| Prompt formatting | `apps/backend/src/commanderSpellbook/promptSection.ts` |
| Prompt/runtime wiring | `prompt/preparation.ts`, `prompt/promptAssembly.ts`, `runtime/createConfiguredApp.ts`, existing app/route dependency injection |
| Eval coverage | `apps/backend/src/eval/` + `fixtures/commander-spellbook-*` |
| Frozen contracts | No `AskAiRequest`, Zod, response-shape, provider, endpoint, or frontend destination change |

## Next step

`$thejudge-implement PRD/work/commander-spellbook-combos/ slice A`
