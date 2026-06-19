# Design Brief — system-map-detail

## Summary

The depth layer beneath the shallow `sections/system-map.md` catalog (`DEC-044`),
deferred until `prompt-context-retrieval-tuning` landed so the volatile prompt /
retrieval prose is written once. Documentation and process only — no `apps/` code,
no `POST /api/ask-ai` request/response change, no UI or prompt-assembly behavior change.

Governing decision: **`DEC-048`** (extends `DEC-044`).

## Scope

Write deep, one-read behavior writeups for the **priority subsystems only**, as
separate files under `PRD/sections/system-map/`, each linked from the catalog by a
`Details:` pointer:

1. `PRD/sections/system-map/prompt-assembly.md` — how the backend assembles the
   LLM prompt end to end.
2. `PRD/sections/system-map/game-rules-retrieval.md` — System 1 (card rulings),
   System 2 (curated baseline), System 3 (supplemental retrieval), as one coherent
   read because they interrelate via deduplication.

Each detail file follows a fixed lightweight template:

```
# <Subsystem>
Backed by: DEC-..., REQ-...
## How it works        (mechanics, 1–3 paragraphs)
## Data flow           (inputs -> steps -> output)
## Where it lives       (coarse modules, never per-line)
## Worked example       (one concrete trace)
## Invariants / gotchas
```

Behavior-level prose only. No per-decision → code-line link maintenance (inherits
the `DEC-044` non-goal). No prose that merely restates code.

## Decisions

- **`DEC-048`** — depth layer lives as separate per-subsystem files under
  `PRD/sections/system-map/`, linked by an optional additive `Details:` catalog
  field, written to a fixed lightweight template; coverage by need (priority
  subsystems first); revisit a detail file only when its subsystem behavior
  changes, per the `DEC-044` commit convention.

## Content anchors (so the docs are written once, correctly)

### prompt-assembly.md
- Assembled section order: `GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE`
  (planned, `DEC-043`) → `PHASE GUIDANCE` (`DEC-036`) → zone sections with full card
  metadata in all zones (`DEC-042`) → `GAME RULES (reference)` / System 2 →
  `ADDITIONAL RELEVANT RULE EXCERPTS` / System 3 → `OFFICIAL RULINGS` / System 1 →
  `SCOPE` → `QUESTION`.
- Static `MTG_PROMPT_REFERENCE` framing and merged zone scope sentence (`DEC-025`).
- Budget = `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) with diagnostics preserved
  (`DEC-042`); enrichment-debug sidecar is mock-only (`DEC-033`).
- Coarse modules: `apps/backend/src/prompt/`
  (`preparation.ts`, `context.ts`, `normalization.ts`, `mtgReference.ts`,
  `phaseGuidance.ts`, `enrichmentDebug.ts`).

### game-rules-retrieval.md
- **System 1 — card rulings (`DEC-029`):** Scryfall bulk `rulings`, filtered to
  `source === "wotc"`, intersected with committed card metadata oracle IDs; emitted
  as `OFFICIAL RULINGS`; omitted when no submitted card matches.
  Lives in `apps/backend/src/cardRulings.ts`.
- **System 2 — curated baseline (`DEC-030`, `DEC-045`):** always-on core topics plus
  card-agnostic, game-state-gated conditional buckets (`turnPhase`, `combatStep`,
  populated zone presence — no card names / oracle text / keywords). Replaces the
  prior "all topics every request" baseline. Lives in
  `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`.
- **System 3 — supplemental retrieval (`DEC-032`, `DEC-046`):** max 5 excerpts per
  request, IDF-weighted lexical scoring with question boost, keyword boost, exact /
  parent rule-ID bonuses, highest-IDF then rule-id-ascending tie-break; deduplicated
  against the selected System 2 rule IDs; emitted as `ADDITIONAL RELEVANT RULE
  EXCERPTS`. Lives in `apps/backend/src/gameRulesRetrieval.ts` plus
  `gameRulesKeywordVocabulary.json`, `gameRulesTokenStats.json`.
- Relevance is regression-tested by the eval harness (`DEC-047`).
- **Reference, do not resolve:** `Q-001` (System 3 keyword-vocabulary derivation
  strategy) is open; the prose should point at it, not decide it.

## Non-goals

- No `apps/` code; no API / UI / prompt behavior change.
- Not a replacement for the shallow catalog — this is the depth layer beneath it.
- No per-decision → code-line link maintenance.
- No detail files for non-priority subsystems in this package (added later by need).
- Do not resolve `Q-001`.

## Backing IDs

- Decisions: `DEC-048` (new), extends `DEC-044`.
- Anchored by: `DEC-025`, `DEC-029`, `DEC-030`, `DEC-032`, `DEC-033`, `DEC-036`,
  `DEC-042`, `DEC-043`, `DEC-045`, `DEC-046`, `DEC-047`.
- Open question referenced: `Q-001`.
- No `REQ`/`FLOW`/`NFR` added or changed (documentation/process only).
