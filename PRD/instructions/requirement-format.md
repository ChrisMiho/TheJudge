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

## Story Dependency Rules

Behavioral guidance for story writing lives in `instructions/story-generation.md`.
This document only adds dependency-field rules for `PRD/stories/` entries:

- `parallel-ready`: list only non-blocking references (REQ/DEC/NFR, etc.); no prerequisite story IDs.
- `sequential`: include prerequisite story ID(s) and one-line reason per prerequisite.
- Always use concrete dependency entries; avoid vague values like "other stories" or "future work".
