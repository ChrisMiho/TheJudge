# Framing decisions

Core product framing: what the assistant is and is not.

### DEC-001
- Decision: TheJudge is an MTG assistant with a suite of features that help players — not an official judge or a deterministic/gameplay-accurate rules engine. (Product label updated by DEC-094; the scope guardrail is unchanged.)
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
- Notes: Documentation/framing change only. Refines the label of DEC-001; does not supersede DEC-001/DEC-002/DEC-013. Label further refined by DEC-094.

### DEC-094
- Decision: Retire current-tense "rules assistant" and any remaining "flow-validation" product labels as the app identity. TheJudge is positioned as an MTG assistant with a suite of player-help features. **MTG Assistant** is the primary feature (staged game context + Ask AI for rules/gameplay guidance), not the name of the whole app. Other features (card scanning, personalization, planned Trade Balancer, and future tools) sit alongside it. Scope guardrails from DEC-001, DEC-002, and DEC-013 are preserved: assistant, not an official judge or deterministic rules engine. Production is live on AWS (`DEC-084`); focus is gathering feedback and refining the suite.
- Status: confirmed
- Context: DEC-080 correctly retired the "flow-validation" label but replaced it with "rules assistant," which still undersells the product as a single-purpose rules tool and conflates the app (TheJudge) with its primary feature (MTG Assistant). Agents and onboarding docs kept echoing "flow-validation MTG assistant (staged zone flow + Ask AI)" because kickoff skills and README status bullets never fully adopted suite framing. Trade Balancer, scanning, personalization, and feature-portal work already treat TheJudge as a multi-feature app.
- Impact:
  - current-tense app identity uses suite framing in `overview.md`, `goals-and-non-goals.md`, `problem-statement.md`, root and PRD `README` files, `agent-working-rules.md`, and kickoff skills
  - **MTG Assistant** is reserved for the primary staged-context + Ask AI feature; **TheJudge** is the app
  - DEC-001 label pointer updated to DEC-094; DEC-080 body retained as historical record of retiring flow-validation
  - historical "flow-validation" and "rules assistant" references inside past decision contexts remain verbatim
  - no product behavior, contract, endpoint, prompt-assembly, or stack-ordering change; no new rules-engine capability
- Related requirements:
  - GOAL-001
  - GOAL-002
  - GOAL-003
- Notes: Documentation/framing change only. Refines the label of DEC-001 and DEC-080; does not supersede DEC-001/DEC-002/DEC-013.

