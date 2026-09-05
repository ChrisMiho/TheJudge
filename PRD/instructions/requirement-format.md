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

## Decisions (retired)

The decision log is retired. **Do not author a new `DEC-###` entry** — there is
no decision template. When a decision changes what a feature does, edit the
current-state feature spec at `sections/<feature>/README.md` and its cited
`REQ`/`FLOW` entries in place. An ID names a place in the product, not a moment
in time.

Existing `DEC-###` IDs stay resolvable via the `sections/decisions.md` index
(precedence #2, historical). The only two decisions that still carry a full body
are the deployment survivors DEC-084 / DEC-169 in
`sections/decisions/deployment.md`; do not add more.

## Formatting Rules
- Keep entries self-contained.
- One requirement per entry.
- One decision per entry.
- Use acceptance criteria to make implementation measurable.
- Use constraints for anything the agent must not overstep.
- Use dependencies to show external reliance or coupling.
- When a change touches a cross-cutting invariant (a rule asserted in 3+ files),
  enumerate its homes by grep and amend them together — see
  `instructions/writing-rules.md`, "Cross-cutting invariants (grep before amend)".

## Slice Dependency Rules

Slice dependency guidance lives in `thejudge-map-out/reference.md`.
This document adds dependency-field rules for `PRD/work/<slug>/slice-*.md` entries:

- `parallel-ready`: list only non-blocking references (REQ/DEC/NFR, etc.); no prerequisite slice IDs.
- `sequential`: include prerequisite slice ID(s) and one-line reason per prerequisite.
- Always use concrete dependency entries; avoid vague values like "other slices" or "future work".

## Slice Acceptance Criteria Rule

For any slice in `PRD/work/<slug>/`, each acceptance criterion must be verifiable (test command or explicit manual check). The final slice must include ship gates from `workflow-reference.md` and an acceptance criterion that records completion in an auditable place: update the relevant feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries, plus any other affected `sections/*.md`, when product truth changes; update `PRD/README.md` only when navigation guidance changes; and delete `PRD/work/<slug>/` when ephemeral planning was used. See `instructions/doc-lifecycle.md`.

## Slice Template (`PRD/work/<slug>/`)

Use the structure in `instructions/workflow-reference.md` (Slice Doc Template). Each slice file should include:

- Status (`planned` | `in-progress` | `done` | `blocked`)
- Goal (one objective)
- Requirements
- Acceptance criteria (verifiable)
- Verification (command or manual check)
- Files touched

Final slice docs append Ship gates from `workflow-reference.md`.
