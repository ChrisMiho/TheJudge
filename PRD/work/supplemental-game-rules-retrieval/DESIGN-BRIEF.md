# DESIGN-BRIEF — supplemental-game-rules-retrieval

## Scope

Backend-only. Extends the existing game-rules enrichment stack (DEC-030) with context-driven supplemental CR excerpts.

### In scope

- Unified CR parser in `build-game-rules.mjs` producing two artifacts from one parse of `cr/source.txt`
- New committed artifact: `apps/backend/data/gameRulesRuleIndex.json`
- New runtime module: `apps/backend/src/gameRulesRetrieval.ts`
- Prompt section: `ADDITIONAL RELEVANT RULE EXCERPTS` (max 5 rules, deduped against manifest)
- Startup load of rule index; graceful omission when artifact missing
- Unit tests, eval harness checks, golden fixture updates
- PRD promotion (DEC-031 or DEC-030 amendment)

### Out of scope

- Changes to `AskAiRequest`, Zod schema, or frontend
- New download sources (reuse existing WotC CR via `data:refresh`)
- Card rulings layer changes (DEC-029 unchanged)

## Decisions (draft — confirm during refinement)

### D-001 — Baseline unchanged

All 23 curated topics from `gameRulesByTopic.json` remain **always included** on every request. Supplemental rules are **additive**, not a replacement.

### D-002 — Single source, single parser, dual outputs

| Build input | Build outputs |
|-------------|---------------|
| `apps/backend/data/cr/source.txt` (gitignored WotC CR) | `gameRulesByTopic.json` (existing) |
| `apps/backend/data/gameRulesTopicManifest.json` | `gameRulesRuleIndex.json` (new) |

One parse pass in `build-game-rules.mjs`. No separate `build-game-rules-index.mjs`. No Joey-style alternate source path.

### D-003 — Retrieval strategy alignment

| Layer | Strategy | Rationale |
|-------|----------|-----------|
| Card rulings (DEC-029) | Lookup by `oracle_id` | Data keyed to submitted cards |
| Curated topics (DEC-030) | Static — all topics always | Human-signed-off baseline |
| Supplemental CR (NEW) | Context search + scoring | Rules have no card ID; infer from prompt text |

Within the CR family (baseline + supplemental), one query builder and one scoring implementation.

### D-004 — Dedupe against baseline

Before ranking supplemental results, exclude any `ruleId` already listed in a curated topic's `ruleNumbers` array from `gameRulesByTopic.json` / manifest.

### D-005 — Supplemental cap

Maximum **5** supplemental rules per request (matching PR #30 spike). Omit section entirely when no scored matches remain after dedupe.

### D-006 — Scoring approach (port from PR #30)

Query text built from: `finalQuestion`, `turnPhase`, `selectedZones`, stack card names/types/oracle text/notes, zone item names/details.

Scoring signals:
- Exact rule number mention in query → high boost (+100)
- Parent rule ID mention → medium boost (+20)
- Keyword token overlap in precomputed `searchText` → low boost (+1, +8 for rule-number-shaped tokens)

Stop-word filtering for tokenization. Sort by score desc, then rule ID asc. Take top 5.

### D-007 — Prompt section order

1. `GAME RULES (reference)` — curated baseline (existing)
2. `ADDITIONAL RELEVANT RULE EXCERPTS` — supplemental (new)
3. `OFFICIAL RULINGS (WotC reference)` — card rulings (existing)
4. `SCOPE` → `QUESTION`

### D-008 — Graceful degradation

Mirror existing game-rules build behavior:
- Missing `cr/source.txt` at build time → preserve prior committed artifacts for both outputs
- Missing or empty rule index at runtime → omit supplemental section; log warning once

## Index artifact shape

`apps/backend/data/gameRulesRuleIndex.json` — JSON array (~2 MB committed):

```typescript
type GameRulesRuleIndexEntry = {
  ruleId: string;           // e.g. "608.2b"
  sectionTitle: string;     // e.g. "Resolving Spells and Abilities"
  text: string;             // verbatim CR rule text
  searchText: string;       // lowercase ruleId + sectionTitle + text (build-time)
  parentRuleIds: string[];  // for parent-rule scoring boost
};
```

## PRD references

- [DEC-029](../../sections/decisions.md) — card rulings (unchanged)
- [DEC-030](../../sections/decisions.md) — curated baseline (unchanged intent)
- [REQ-022](../../sections/functional-requirements.md) — general game rules enrichment
- [integrations-and-data.md § Game Rules Data Strategy](../../sections/integrations-and-data.md)
- [NFR-002](../../sections/non-functional-requirements.md) — latency (additive prompt size risk)

## PR #30 disposition

Close without merge. Comment crediting retrieval spike; logic adapted here.
