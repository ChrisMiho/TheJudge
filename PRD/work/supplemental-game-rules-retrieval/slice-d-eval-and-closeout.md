# Slice D — Eval, PRD promotion, and closeout

## Status

`pending`

## Goal

Lock behavior with eval fixtures, promote durable PRD outcomes, close PR #30, write receipt, delete work folder.

## Depends on

Slice C (full prompt pipeline wired).

## Acceptance criteria

- [ ] Eval harness checklist IDs added: `supplemental-rules-section-present`, `supplemental-rules-after-game-rules`, `supplemental-rules-before-rulings`
- [ ] At least 2 eval fixtures target out-of-manifest rules (candidates: state-based actions 704.x, obscure keyword rules)
- [ ] Golden prompt fixtures regenerated deterministically
- [ ] `npm run quality:check` passes
- [ ] DEC-031 promoted (or DEC-030 amended) in `sections/decisions.md`
- [ ] `sections/functional-requirements.md` updated (REQ-023 or REQ-022 extension)
- [ ] `sections/integrations-and-data.md` updated with rule index artifact + dual-output build
- [ ] Receipt written to `PRD/instructions/receipts/supplemental-game-rules-retrieval-YYYY-MM-DD.md`
- [ ] PR #30 closed with credit to Joey's retrieval spike
- [ ] `PRD/work/supplemental-game-rules-retrieval/` deleted per doc-lifecycle

## Eval fixture candidates

| Scenario | Why | Example rule outside manifest |
|----------|-----|--------------------------------|
| State-based actions | Common rules question, not in 23 topics | 704.5 |
| Specific keyword in question | Keyword scoring path | Question mentions "prowess" or "cascade" |
| Explicit rule number in question | Exact ID boost path | User asks about "rule 800.4" |

Confirm final fixture set during refinement.

## PRD promotion draft (DEC-031)

Decision stub for refinement:

- Supplemental CR retrieval is prompt-only and backend-only
- Coexists with DEC-030 curated baseline (always included)
- Max 5 supplemental rules per request; deduped against manifest rule numbers
- Source: same WotC CR TXT and `build-game-rules.mjs` pipeline
- Committed artifact: `apps/backend/data/gameRulesRuleIndex.json`
- Section: `ADDITIONAL RELEVANT RULE EXCERPTS` between game rules and card rulings
- Omitted when index missing, empty, or no scored matches

## Verification

```bash
npm run quality:check
```

Review eval checklist report golden for new IDs.

## Closeout

Follow [doc-lifecycle.md](../../instructions/doc-lifecycle.md): promote → receipt → delete work folder.
