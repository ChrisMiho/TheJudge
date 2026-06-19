# GAMEPLAN — system-map-detail

## Objective

Write the depth layer beneath the shallow `sections/system-map.md` catalog (`DEC-044`):
deep, one-read behavior writeups for the two priority subsystems, as separate files
under `PRD/sections/system-map/`, each linked from the catalog by an additive
`Details:` pointer. Governing decision: **`DEC-048`** (extends `DEC-044`).

Documentation and process only. No `apps/` code, no `POST /api/ask-ai`
request/response change, no UI or prompt-assembly behavior change.

## Architecture / what changes

Two durable detail files are created and two existing catalog subsystem entries gain
one optional `Details:` field each:

| New file | Catalog subsystem it backs |
| --- | --- |
| `PRD/sections/system-map/prompt-assembly.md` | `## Prompt assembly` |
| `PRD/sections/system-map/game-rules-retrieval.md` | `## Game rules retrieval` |

The catalog's "How to read this" already documents the optional `Details:` field
(`PRD/sections/system-map.md:14-16`, `DEC-048`). No How-to change is needed — only
the per-subsystem `Details:` lines are added when the files exist.

### Fixed detail-file template (`DEC-048`)

Every detail file uses exactly this shape:

```
# <Subsystem>
Backed by: DEC-..., REQ-...
## How it works        (mechanics, 1–3 paragraphs)
## Data flow           (inputs -> steps -> output)
## Where it lives       (coarse modules, never per-line)
## Worked example       (one concrete trace)
## Invariants / gotchas
```

Behavior-level prose only. No per-decision → code-line link maintenance (inherits the
`DEC-044` non-goal). No prose that merely restates code.

## Data flow being documented (source of truth for the prose)

The prose is written from the verified content anchors in `DESIGN-BRIEF.md` and the
current catalog. Assembled prompt section order (for `prompt-assembly.md`):

`GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE` (planned, `DEC-043`) →
`PHASE GUIDANCE` (`DEC-036`) → zone sections w/ full card metadata in all zones
(`DEC-042`) → `GAME RULES (reference)` / System 2 → `ADDITIONAL RELEVANT RULE
EXCERPTS` / System 3 → `OFFICIAL RULINGS` / System 1 → `SCOPE` → `QUESTION`.

Three retrieval systems (for `game-rules-retrieval.md`), documented as one read
because they interrelate via deduplication:

- **System 1 — card rulings** (`DEC-029`): Scryfall bulk `rulings`, `source === "wotc"`,
  intersected with committed card oracle IDs; emitted as `OFFICIAL RULINGS`.
- **System 2 — curated baseline** (`DEC-030`, `DEC-045`): always-on core topics plus
  card-agnostic, game-state-gated conditional buckets (`turnPhase`, `combatStep`,
  populated zone presence).
- **System 3 — supplemental retrieval** (`DEC-032`, `DEC-046`): ≤5 excerpts, IDF-weighted
  lexical scoring + question/keyword boosts + exact/parent rule-ID bonuses,
  highest-IDF then rule-id-ascending tie-break; deduplicated against the selected
  System 2 rule IDs; emitted as `ADDITIONAL RELEVANT RULE EXCERPTS`.
- Relevance is regression-tested by the eval harness (`DEC-047`).
- `Q-001` (System 3 keyword-vocabulary derivation) is **referenced, not resolved**.

## Coarse module locations (verified present)

- Prompt assembly: `apps/backend/src/prompt/` — `preparation.ts`, `context.ts`,
  `normalization.ts`, `mtgReference.ts`, `phaseGuidance.ts`, `enrichmentDebug.ts`.
- System 1: `apps/backend/src/cardRulings.ts`.
- System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`.
- System 3: `apps/backend/src/gameRulesRetrieval.ts` plus
  `apps/backend/data/gameRulesKeywordVocabulary.json`,
  `apps/backend/data/gameRulesTokenStats.json`.

## Slices

| Slice | Objective | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A | `prompt-assembly.md` detail file + catalog `Details:` pointer | — | yes |
| B | `game-rules-retrieval.md` detail file + catalog `Details:` pointer; package ship gates | — | yes |

Both slices touch different new files and append a `Details:` line under different
`##` headings in `system-map.md`, so they are independent and parallel-ready. Slice B
carries the package-level PRD promotion checklist and Ship gates (covers both files).

## Verification checklist (whole package)

- [ ] `PRD/sections/system-map/prompt-assembly.md` and `game-rules-retrieval.md` exist.
- [ ] Each detail file contains every required `DEC-048` template heading.
- [ ] Each file opens with a `Backed by:` line citing the anchored `DEC`/`REQ` IDs.
- [ ] Each backed catalog subsystem (`## Prompt assembly`, `## Game rules retrieval`)
      carries one `Details:` pointer to its file; no other catalog shape change.
- [ ] `game-rules-retrieval.md` references `Q-001` without resolving it.
- [ ] No `apps/` files changed (`git diff --name-only` shows only `PRD/`).
- [ ] No `REQ`/`FLOW`/`NFR` added or changed; no `DEC` edited (`DEC-048` already exists).

## Non-goals (carry into every slice)

- No `apps/` code; no API / UI / prompt behavior change.
- Not a replacement for the shallow catalog — this is the depth layer beneath it.
- No per-decision → code-line link maintenance.
- No detail files for non-priority subsystems in this package.
- Do not resolve `Q-001`.
