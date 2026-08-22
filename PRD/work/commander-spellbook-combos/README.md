---
status: active
---

# commander-spellbook-combos

Integrate Commander Spellbook as a static, backend-only community combo enrichment corpus keyed by Scryfall `oracle_id`, with deterministic intent/context gates and no runtime upstream dependency.

> **Re-refined 2026-08-11**, then re-mapped the same day. Scope expanded on two owner-directed items: per-ingredient card state is now captured and surfaced, and answer-quality measurement is now in scope. The pre-expansion A–E plan was deleted and replaced by the A–F plan below.

## Refined outcome

- In-Depth Question receives automatic combo context only for complete quantity-aware identity + compatible-zone matches.
- Narrow explicit combo questions may receive up to five partial candidates with missing or incorrectly zoned pieces called out.
- Quick Question requires explicit combo intent plus an attached card.
- Only reviewed `OK` variants enter the corpus; `EXAMPLE` variants are rejected because upstream nulls their steps, prerequisites, mana, notes, and card state.
- Per-ingredient card state is stored zone-scoped, rendered for the zone a matched instance occupies, and never validated — the request carries no tapped/counter/control/commander data.
- No candidate is ever labeled "complete"; full assignment renders as all pieces present with card state unverified, plus an instruction to check that state against the board.
- Template matches are expanded during the human-approved build when the upstream source provides an authoritative query/mapping; unresolved templates cannot complete automatic matching.
- Combo data is labeled community-sourced and never overrides official card text, WotC rulings, or Comprehensive Rules.
- Whether the enrichment improves answers is measured by an opt-in, confirmation-gated, human-reviewed live-provider A/B — informational, never a build gate.
- No Known Combos UI, browser, feature-portal destination, find-my-combos flow, bracket estimation, new endpoint, or runtime Commander Spellbook call is included.

## Product truth

- DEC-116
- DEC-161
- DEC-162
- REQ-093
- REQ-094
- REQ-095
- REQ-146
- FLOW-015

See `DESIGN-BRIEF.md` for approved scope.

## Slices

Architecture, data flow, and the full verification checklist: `GAMEPLAN.md`.

| Slice | Objective | Depends on | Status |
|---|---|---|---|
| [G](./slice-g-corpus-build-pipeline-v2.md) | Bulk-export build, camelCase fix, lazy-access storage format | — | done |
| [H](./slice-h-lazy-runtime-loader.md) | Lazy runtime catalog loader | G | done |
| [I](./slice-i-matching-integration-at-scale.md) | Matching integration at real scale | H | done |
| [J](./slice-j-answer-quality-real-scenarios.md) | Real-scenario answer-quality comparison; ship gates | I | planned |

G→H→I→J are strictly sequential — each slice's design depends on the previous
slice's real interface. J carries the PRD promotion checklist and ship gates.

### Superseded — kept as evidence, not resumed

The 2026-08-12 amendment found the corpus build could not parse real upstream
data (DEC-162): slice A is invalidated outright, B and C are affected by
gzip-on-load and a 105,448-variant corpus, and F needs scenarios with real
oracle ids. D and E survived (E as a conformance reference; see slice G's
G9 criterion). These six docs record what the A–F implementation reported at
the time, kept as evidence of a false `ship-ready`; do not resume any of them.

| Slice | Objective | Depends on | Status |
|---|---|---|---|
| [A](./slice-a-corpus-build-pipeline.md) | Refresh + build scripts → two committed artifacts | — | superseded |
| [B](./slice-b-catalog-loader-and-config.md) | Runtime catalog loader, integrity validation, `COMBO_ENRICHMENT_ENABLED` | A | superseded |
| [C](./slice-c-intent-and-matching.md) | Intent detector, zone map, matcher/ranker with card-state annotations | B | superseded |
| [D](./slice-d-prompt-integration.md) | Prompt section rendering + both prompt paths | C | done — re-verified by I |
| [E](./slice-e-eval-fixtures-and-goldens.md) | Eval fixtures, goldens, branch coverage | D | done — kept as conformance reference (G9) |
| [F](./slice-f-answer-quality-comparison.md) | Answer-quality A/B script + reviewed conclusion | D | superseded |

## Implementation map

| Area | Paths | Slice |
|---|---|---|
| Build pipeline | `scripts/refresh-commander-spellbook-data.mjs`, `scripts/build-commander-spellbook-combos.mjs` | G |
| `data:refresh` wiring | `scripts/refresh-scryfall-data.mjs`, `package.json` | G |
| Committed artifacts (lazy-access format) | `apps/backend/data/commanderSpellbookCombos.json.gz`, `apps/backend/data/commanderSpellbookComboIndex.json.gz` | G (fixture-scale), J (real corpus) |
| Raw inputs (gitignored) | `apps/backend/data/commander-spellbook/` (bulk export) | G |
| Runtime loader | `apps/backend/src/commanderSpellbook/catalog.ts` | H |
| Matching | `apps/backend/src/commanderSpellbook/{zones,intent,matcher}.ts` | I |
| Prompt rendering (re-verification only) | `apps/backend/src/commanderSpellbook/formatting.ts`, `apps/backend/src/prompt/{preparation,promptAssembly}.ts` | I |
| Eval (conformance guard / re-verification) | `apps/backend/src/eval/fixtures/commander-spellbook-*` | G (guard), I |
| Measurement | `scripts/compare-combo-answer-quality.mjs` → gitignored `output/combo-answer-quality/` | J |

Untouched by design: `apps/frontend/**`, `apps/backend/src/validation/**`,
`apps/backend/src/routes/**`, `apps/backend/src/providers/**`,
`apps/backend/src/config/index.ts`, `runtime/createConfiguredApp.ts`,
`app/createApp.ts` (wired correctly by the superseded B–D work; unaffected by
this amendment).

## Owner-action checkpoints

Two steps an agent cannot self-authorize; neither blocks slices G–I.

1. **Production corpus refresh** (slice J) — live network calls, gated on explicit
   human approval by REQ-093, separate from the architecture approval already
   recorded in DEC-162. Slices G–I verify against fixture-scale/realistic
   sample inputs; the real artifacts land only when the owner separately
   approves invoking that live call.
2. **Live provider A/B** (slice J) — costs money, needs `ASK_AI_PROVIDER=openai`.
   The script ships complete and refuses to run without `--confirm-live-calls`.

## Autonomous metadata

- Autonomous base: origin/feature/enhancement-bangers

## Preparation gate

`thejudge-quality-check` — **PASS**, 2026-08-11. Three non-blocking issues were fixed
in-session with user approval: FLOW-015 step 5/6 updated for card-state annotation and
the never-"complete" rendering; REQ-146 + `system-map.md` given the planned script path,
`COMBO_ENRICHMENT_ENABLED` flag, and gitignored output location; stale GAMEPLAN/slice
docs removed.

`thejudge-quality-check` — **PASS**, 2026-08-21, re-checked against the
2026-08-12 DEC-162 amendment. No contradictions found; cleared straight to
map-out with no fixes needed.

## Outstanding owner actions

Start at `DESIGN-BRIEF.md` `## Amendments`. Re-mapped 2026-08-21 into slices
G–J (`GAMEPLAN.md`); slices G, H, and I are done, pushed to this PR's shared
branch. Only slice J remains.

1. **Production corpus refresh** — code is ready (slices G–I done); run
   through the `data:refresh` chain per DEC-162, gated on the owner's explicit
   approval of that specific live call (slice J, J6). The 2026-08-12 refresh
   attempt is already evidenced in the brief; the committed artifacts remain
   the empty bootstrap corpus (`variantCount: 0`).
2. **Answer-quality A/B** — unchanged in principle (`ASK_AI_PROVIDER=openai`,
   `--confirm-live-calls`, DEC-161 informs without blocking), but its curated
   scenarios must first point at real oracle ids; slice J (J1, J7) fixes the
   scenarios and records the run.

## Next step

`/thejudge-implement PRD/work/commander-spellbook-combos/ slice J`
