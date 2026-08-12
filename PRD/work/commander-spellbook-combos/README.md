---
status: refined
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

> **Superseded 2026-08-12 — pending re-map.** The statuses below record what the
> A–F implementation reported and are kept as evidence; they do not describe
> shippable work. The corpus build could not parse real upstream data (DEC-162),
> so slice A is invalidated outright, B and C are affected by gzip-on-load and a
> 105,448-variant corpus, and F needs scenarios with real oracle ids. D and E are
> expected to survive. `thejudge-map-out` re-slices this; do not resume A–F as-is.

Architecture, data flow, and the full verification checklist: `GAMEPLAN.md`
(also superseded on the corpus-source and wire-format points).

| Slice | Objective | Depends on | Status |
|---|---|---|---|
| [A](./slice-a-corpus-build-pipeline.md) | Refresh + build scripts → two committed artifacts | — | done |
| [B](./slice-b-catalog-loader-and-config.md) | Runtime catalog loader, integrity validation, `COMBO_ENRICHMENT_ENABLED` | A | done |
| [C](./slice-c-intent-and-matching.md) | Intent detector, zone map, matcher/ranker with card-state annotations | B | done |
| [D](./slice-d-prompt-integration.md) | Prompt section rendering + both prompt paths | C | done |
| [E](./slice-e-eval-fixtures-and-goldens.md) | Eval fixtures, goldens, branch coverage | D | done |
| [F](./slice-f-answer-quality-comparison.md) | Answer-quality A/B script + reviewed conclusion | D | done |

A→B→C→D are sequential by type dependency — each consumes the previous slice's
contract. E and F depend only on D and are parallel-ready. F carries the PRD
promotion checklist and ship gates.

## Implementation map

| Area | Paths |
|---|---|
| Build pipeline | `scripts/refresh-commander-spellbook-data.mjs`, `scripts/build-commander-spellbook-combos.mjs` |
| Committed artifacts | `apps/backend/data/commanderSpellbookCombos.json.gz`, `apps/backend/data/commanderSpellbookComboIndex.json.gz` |
| Raw inputs (gitignored) | `apps/backend/data/commander-spellbook/` (bulk export) |
| Runtime modules | `apps/backend/src/commanderSpellbook/{catalog,zones,intent,matcher,formatting}.ts` |
| Wiring | `apps/backend/src/config/index.ts`, `runtime/createConfiguredApp.ts`, `app/createApp.ts`, `prompt/{preparation,promptAssembly}.ts` |
| Eval | `apps/backend/src/eval/fixtures/commander-spellbook-*` |
| Measurement | `scripts/compare-combo-answer-quality.mjs` → gitignored `output/combo-answer-quality/` |

Untouched by design: `apps/frontend/**`, `apps/backend/src/validation/**`,
`apps/backend/src/routes/**`, `apps/backend/src/providers/**`.

## Owner-action checkpoints

Two steps an agent cannot self-authorize; neither blocks the surrounding slices.

1. **Production corpus refresh** (slice A) — live network calls, gated on explicit
   human approval by REQ-093. Slice A verifies against committed sample inputs;
   the real artifacts land when approved.
2. **Live provider A/B** (slice F) — costs money, needs `ASK_AI_PROVIDER=openai`.
   The script ships complete and refuses to run without `--confirm-live-calls`.

## Autonomous metadata

- Autonomous base: origin/feature/enhancement-bangers

## Preparation gate

`thejudge-quality-check` — **PASS**, 2026-08-11. Three non-blocking issues were fixed
in-session with user approval: FLOW-015 step 5/6 updated for card-state annotation and
the never-"complete" rendering; REQ-146 + `system-map.md` given the planned script path,
`COMBO_ENRICHMENT_ENABLED` flag, and gitignored output location; stale GAMEPLAN/slice
docs removed.

## Outstanding owner actions

Start at `DESIGN-BRIEF.md` `## Amendments`. (The former `HANDOFF.md` was deleted on
2026-08-12: it predated DEC-162 and instructed a cold agent to run the refresh and
merge, both of which are now wrong.)

Implementation is **not** complete: the corpus build cannot parse real upstream data
(DEC-162). The refresh cannot usefully run until that is fixed, because the build
rejects the very first real variant.

1. **Production corpus refresh** — blocked on the re-mapped build work, then run
   through the `data:refresh` chain per DEC-162. The 2026-08-12 refresh attempt is
   already evidenced in the brief; the committed artifacts remain the empty bootstrap
   corpus (`variantCount: 0`).
2. **Answer-quality A/B** — unchanged in principle (`ASK_AI_PROVIDER=openai`,
   `--confirm-live-calls`, DEC-161 informs without blocking), but its curated
   scenarios must first point at real oracle ids; the current ones reuse synthetic
   eval-fixture ids and would make both legs identical.

## Next step

`/thejudge-quality-check PRD/work/commander-spellbook-combos/`
