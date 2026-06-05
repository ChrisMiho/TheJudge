# Slice A — Workflow reference + receipts folder

## Status: planned

## Goal

Create the durable operator reference and receipts directory used by all five skills.

## Requirements

1. Create `PRD/instructions/receipts/` (empty `.gitkeep` or README stub OK).
2. Create `PRD/instructions/workflow-reference.md` containing:
   - Skill sequence diagram (text or mermaid)
   - Tri-platform paths table (`.cursor`, `.codex`, `.claude`)
   - Session openers (copy-paste examples for each skill)
   - Slice doc template (from `card-wotc-rule-enrichment` pattern)
   - Quality-check checklist (contradictions, terminology, DEC compliance, stack-ordering, technical-design-rules)
   - Terminology table (retire → replace)
   - Work folder lifecycle: `ideation` → `refined` → `active` → deleted
   - Receipt convention (`PRD/instructions/receipts/<slug>-<date>.md`)
3. Update `PRD/README.md` instruction inventory — add `workflow-reference.md` row and skill routing note (do not link this work folder from control plane).

## Acceptance criteria

- [ ] `PRD/instructions/workflow-reference.md` is ≤ ~120 lines (lean)
- [ ] `PRD/instructions/receipts/` exists
- [ ] `PRD/README.md` lists workflow-reference in instruction inventory
- [ ] No MVP/Phase A/B in new workflow-reference content

## Verification

```bash
test -f PRD/instructions/workflow-reference.md
test -d PRD/instructions/receipts
```

## Files touched

- `PRD/instructions/workflow-reference.md` (create)
- `PRD/instructions/receipts/` (create)
- `PRD/README.md` (update inventory)
