# Slice B — game-rules-retrieval detail file

## Status: planned

## Goal

Write `PRD/sections/system-map/game-rules-retrieval.md` — a one-read behavior writeup
covering System 1 (card rulings), System 2 (curated baseline), and System 3
(supplemental retrieval) as a single coherent read because they interrelate via
deduplication — and link it from the catalog's `## Game rules retrieval` subsystem
with an additive `Details:` pointer (`DEC-048`). Carries the package ship gates.

Documentation only. No `apps/` code, no retrieval behavior change.

## Requirements

1. Create `PRD/sections/system-map/game-rules-retrieval.md` using the fixed `DEC-048`
   template, with these headings in order:
   - `# Game rules retrieval`
   - `Backed by:` line citing `DEC-029`, `DEC-030`, `DEC-032`, `DEC-045`, `DEC-046`,
     `DEC-047`, `REQ-022`, `REQ-032`.
   - `## How it works`
   - `## Data flow`
   - `## Where it lives`
   - `## Worked example`
   - `## Invariants / gotchas`
2. `## How it works` covers all three systems and how they interrelate:
   - **System 1 — card rulings (`DEC-029`):** Scryfall bulk `rulings`, filtered to
     `source === "wotc"`, intersected with committed card metadata oracle IDs; emitted
     as `OFFICIAL RULINGS`; omitted when no submitted card matches.
   - **System 2 — curated baseline (`DEC-030`, `DEC-045`):** always-on core topics plus
     card-agnostic, game-state-gated conditional buckets (`turnPhase`, `combatStep`,
     populated zone presence — no card names / oracle text / keywords). Replaces the
     prior "all topics every request" baseline.
   - **System 3 — supplemental retrieval (`DEC-032`, `DEC-046`):** max 5 excerpts per
     request, IDF-weighted lexical scoring with question boost, keyword boost, exact /
     parent rule-ID bonuses, highest-IDF then rule-id-ascending tie-break; deduplicated
     against the selected System 2 rule IDs; emitted as `ADDITIONAL RELEVANT RULE
     EXCERPTS`.
3. `## Invariants / gotchas` states that relevance is regression-tested by the eval
   harness (`DEC-047`) and that **System 3 is deduplicated against the System 2
   selection** so the same rule never appears twice.
4. Reference `Q-001` (System 3 keyword-vocabulary derivation strategy) as an open
   question — point at it, do **not** resolve it.
5. `## Where it lives` lists only coarse modules: System 1 →
   `apps/backend/src/cardRulings.ts`; System 2 →
   `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`; System 3 →
   `apps/backend/src/gameRulesRetrieval.ts` plus
   `apps/backend/data/gameRulesKeywordVocabulary.json`,
   `gameRulesTokenStats.json`. Never per-line citations.
6. Add exactly one `Details:` field under the catalog's `## Game rules retrieval` entry
   in `PRD/sections/system-map.md`, pointing to `system-map/game-rules-retrieval.md`.
   Do not change any other catalog field or the "How to read this" section.
7. Behavior-level prose only — no prose that merely restates code, no per-decision →
   code-line link maintenance.

## Acceptance criteria

- [ ] `PRD/sections/system-map/game-rules-retrieval.md` exists with all six template
      headings plus the `Backed by:` line.
- [ ] All three systems are described, including the System 3 ↔ System 2 deduplication.
- [ ] `Q-001` is referenced and explicitly left unresolved.
- [ ] `## Where it lives` cites only the coarse modules listed above.
- [ ] `## Game rules retrieval` in `system-map.md` carries one `Details:` pointer; no
      other catalog change.
- [ ] `git diff --name-only` shows only `PRD/` files.

## Verification

```bash
cd /Users/chrismiho/Coding/Projects/TheJudge
F=PRD/sections/system-map/game-rules-retrieval.md
test -f "$F" && echo "file present"
for h in "# Game rules retrieval" "Backed by:" "## How it works" "## Data flow" \
  "## Where it lives" "## Worked example" "## Invariants / gotchas"; do
  grep -qF "$h" "$F" && echo "OK: $h" || echo "MISSING: $h"
done
grep -qF "Q-001" "$F" && echo "OK: references Q-001" || echo "MISSING: Q-001"
grep -n "Details:.*system-map/game-rules-retrieval.md" PRD/sections/system-map.md
git diff --name-only | grep -v '^PRD/' && echo "NON-PRD CHANGES (fail)" || echo "PRD-only OK"
```

Manual: read the file once top-to-bottom — the three systems and their dedup
relationship should be understandable without the source open.

## Files touched

- `PRD/sections/system-map/game-rules-retrieval.md` (new)
- `PRD/sections/system-map.md` (one `Details:` line under `## Game rules retrieval`)

## PRD promotion checklist (executed by `thejudge-cleanup`)

The detail files are written directly into durable `PRD/sections/`, so promotion is
mostly confirmation rather than moving content:

- [ ] Both detail files live under `PRD/sections/system-map/` and are linked by their
      catalog `Details:` pointers.
- [ ] `DEC-048` already records this decision — no decisions.md change needed; confirm
      it is not edited.
- [ ] No `REQ`/`FLOW`/`NFR` added or changed; no `DEC` `Status:` field edited.
- [ ] `system-map.md` catalog `Status:` fields unchanged (docs-only; no code shipped by
      this package, so no `shipped` flip).
- [ ] Write the receipt at `PRD/instructions/receipts/system-map-detail-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/system-map-detail/` after promotion is confirmed.

## Ship gates

- [ ] Slice A and Slice B acceptance criteria satisfied and verified.
- [ ] Both detail files present, template-complete, and linked from the catalog.
- [ ] Public contract unchanged (documentation/process only — no `apps/` diff).
- [ ] No secrets committed.
- [ ] Durable outcomes promoted; `PRD/work/system-map-detail/` ready to delete.
