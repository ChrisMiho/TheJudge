# Slice E — Sections terminology pass

## Status: planned

## Goal

Modernize `PRD/sections/` and READMEs to **core product** framing. Remove stale open questions.

## Depends on

None (may run parallel with slices B–D).

## Requirements

### Terminology

| Retire | Replace with |
| ------ | ------------ |
| MVP1 / MVP2 (forward-looking) | **Core product** |
| UX Wave 2 (in progress) | **Core product** or omit |
| Phase A / B | **Provider modes** |
| Bedrock | remove |
| MVP simplifications | **Intentional constraints** |

### `overview.md`

Add **Current Product Status** section:

- Product: flow-validation MTG assistant
- Shipped baseline: staged zone flow, `GameContext`, plain-text answers
- Provider: `mock` default, `openai` live (DEC-020)
- Intentional constraints: pointer to goals-and-non-goals

Retire or rewrite **MVP1 Summary** section to historical context or merge into Current Product Status.

### `open-questions.md`

Delete Q-001, Q-002, Q-003 entirely. Replace with:

```markdown
# open-questions.md

No open questions as of <ISO date>.

Add `Q-###` only for genuine unresolved product ambiguity.
```

### `goals-and-non-goals.md`

- Rename **MVP1 In-Scope Outcomes** → **Shipped capabilities**
- Add **Intentional constraints** section (duplicate block, 10-card cap, no rules engine)
- Update scope notes — core product, not MVP

### `integrations-and-data.md`

- Replace **Phase A / Phase B** § with **Provider modes**
- Remove Bedrock references

### `decisions.md`

- DEC-003, DEC-011, DEC-019: add `Status: superseded` where DEC-020/DEC-021 override
- Update Impact/Notes using new vocabulary where describing current behavior
- Do **not** delete DEC IDs

### `functional-requirements.md` + `user-flows.md`

- REQ-004–REQ-010: zone-aware wording (stack rules within multi-zone flow)
- FLOW-004: intentional constraint framing, not "MVP1 simplification"

### `PRD/README.md` + root `README.md`

- Replace MVP1/UX Wave 2 phase bullets with Current Product Status summary
- Add skill paths note (`.cursor`, `.codex`, `.claude`)

### Instructions touch-up

- `story-generation.md`: remove "Phase A and Phase B separate"
- `technical-design-rules.md`: replace MVP1 with core product where forward-looking
- `DEFINITION-OF-DONE.md`: replace "MVP2+" with core product / active story execution

### Do not add

WotC rulings to sections until `card-wotc-rule-enrichment` slice D promotes.

## Acceptance criteria

- [ ] `overview.md` has Current Product Status
- [ ] `open-questions.md` is empty stub
- [ ] Grep `Bedrock|Phase A|Phase B` in `PRD/sections/` — only in historical DEC Context if at all
- [ ] Forward-looking `MVP1` grep in sections reduced to intentional-constraint callouts only

## Verification

```bash
rg 'Bedrock|Phase A|Phase B' PRD/sections/
rg 'MVP1' PRD/sections/  # review each hit
```

## Files touched

- `PRD/sections/*.md`
- `PRD/README.md`
- `README.md`
- `PRD/instructions/story-generation.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/stories/DEFINITION-OF-DONE.md`
