# requirement-format.md

## Functional Requirement Template

### REQ-###
- Title:
- Priority:
- Description:
- Acceptance Criteria:
  - ...
- Constraints:
  - ...
- Dependencies:
  - ...
- Notes:

## Non-Functional Requirement Template

### NFR-###
- Title:
- Description:
- Constraints:
  - ...
- Dependencies:
  - ...
- Notes:

## User Flow Template

### FLOW-###
- Name:
- Trigger:
- Preconditions:
- Main Flow:
  1. ...
  2. ...
- Edge Cases:
  - ...
- Notes:

## Open Question Template

### Q-###
- Question:
- Context:
- Why it matters:
- Options under consideration:
  - ...
- Recommended next step:

## Decision Template

Decision bodies live in the relevant `sections/decisions/<domain>.md` file. Add or update the matching router index line in `sections/decisions.md` whenever recording a decision.

### DEC-###
- Decision:
- Status: confirmed
- Context:
- Impact:
- Related requirements:
- Notes:

## Formatting Rules
- Keep entries self-contained.
- One requirement per entry.
- One decision per entry.
- Use acceptance criteria to make implementation measurable.
- Use constraints for anything the agent must not overstep.
- Use dependencies to show external reliance or coupling.

## Slice Dependency Rules

Slice dependency guidance lives in `thejudge-map-out/reference.md` and `thejudge-map-out-parallel/reference.md`.
This document adds dependency-field rules for `PRD/work/<slug>/slice-*.md` entries:

- `parallel-ready`: list only non-blocking references (REQ/DEC/NFR, etc.); no prerequisite slice IDs.
- `sequential`: include prerequisite slice ID(s) and one-line reason per prerequisite.
- Always use concrete dependency entries; avoid vague values like "other slices" or "future work".

## Slice Acceptance Criteria Rule

For any slice in `PRD/work/<slug>/`, each acceptance criterion must be verifiable (test command or explicit manual check). The final slice must include ship gates from `workflow-reference.md` and an acceptance criterion that records completion in an auditable place: update the relevant `sections/decisions/<domain>.md` file, the router index line in `sections/decisions.md`, and affected `sections/*.md` when product truth changes; update `PRD/README.md` only when navigation guidance changes; and delete `PRD/work/<slug>/` when ephemeral planning was used. See `instructions/doc-lifecycle.md`.

## Slice Template (`PRD/work/<slug>/`)

Use the structure in `instructions/workflow-reference.md` (Slice Doc Template). Each slice file should include:

- Status (`planned` | `in-progress` | `done` | `blocked`)
- Goal (one objective)
- Requirements
- Acceptance criteria (verifiable)
- Verification (command or manual check)
- Files touched

Final slice docs append Ship gates from `workflow-reference.md`.
