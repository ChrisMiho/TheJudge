# Framing decisions

Core product framing: what the assistant is and is not.

### DEC-001
- Decision: The core product is a rules assistant that helps players navigate MTG rules — not an official judge or a deterministic/gameplay-accurate rules engine. (Product label updated by DEC-080; the scope guardrail is unchanged.)
- Status: confirmed
- Context: Historical MVP1 framing was meant to prove the core user flow without taking on full MTG rules complexity.
- Impact:
  - temporary simplifications are allowed
  - some real gameplay cases may be excluded
- Related requirements:
  - REQ-009
  - REQ-010
  - REQ-011
- Notes:

### DEC-002
- Decision: The product is an assistant, not an authoritative judge.
- Status: confirmed
- Context: The system uses AI explanations and should not present itself as official or deterministic.
- Impact:
  - response language should avoid false certainty
  - backend should not become a rules engine
- Related requirements:
  - REQ-012
  - REQ-013
- Notes:

### DEC-013
- Decision: The backend must not implement legality validation, deterministic rules simulation, board-state logic, or format enforcement in the core product.
- Status: confirmed
- Context: Heavy rules behavior is explicitly out of scope.
- Impact:
  - backend only validates request shape and builds model prompt context
- Related requirements:
  - REQ-012
- Notes:

### DEC-080
- Decision: Retire the "flow-validation" product label. The core product is positioned as a rules assistant that helps players navigate MTG rules — explicitly not an official judge or a deterministic/gameplay-accurate rules engine. The product lifecycle is updated from "still validating the core loop" to: the core loop is validated (past MVP), and the app is now being refined toward a first production deployment to gather real user feedback (not yet deployed to production). Replaces GOAL-003 with a production-readiness goal.
- Status: confirmed
- Context: The app has moved well past its original MVP1 / flow-validation phase — staged zone context, `GameContext`, scanning, personalization, and UI polish have all shipped or been promoted into the truth layer, and a first production deployment is on the horizon. The "flow-validation" label now mis-describes both the product's maturity and its purpose. This decision updates the current-tense product positioning and status wording across the truth layer without changing product scope.
- Impact:
  - the scope guardrails in DEC-001, DEC-002, and DEC-013 are preserved and sharpened (assistant, not a judge or rules engine); scope is not loosened
  - current-tense "flow-validation" product labels and "still validating" status prose are reframed in `overview.md`, `goals-and-non-goals.md`, the root and PRD `README` files, `agent-working-rules.md`, and `functional-requirements.md` (REQ-009 constraint wording)
  - GOAL-003 is replaced with a production-readiness goal
  - historical "flow-validation" references inside past decision contexts (e.g. DEC-019, DEC-050, DEC-079) are retained verbatim as accurate record of the validation phase
  - no product behavior, contract, endpoint, prompt-assembly, or stack-ordering change; no new rules-engine capability
- Related requirements:
  - GOAL-001
  - GOAL-002
  - GOAL-003 (replaced)
  - REQ-009 (constraint wording)
- Notes: Documentation/framing change only. Refines the label of DEC-001; does not supersede DEC-001/DEC-002/DEC-013.

