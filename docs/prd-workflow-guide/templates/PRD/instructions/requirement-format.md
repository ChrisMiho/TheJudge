# requirement-format.md

Canonical templates. Skills cite this file when writing an entry.

## Functional Requirement — `REQ-###`

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

## Non-Functional Requirement — `NFR-###`

    ### NFR-###
    - Title:
    - Description:
    - Constraints:
      - ...
    - Dependencies:
      - ...
    - Notes:

## User Flow — `FLOW-###`

    ### FLOW-###
    - Name:
    - Trigger:
    - Preconditions:
    - Main Flow:
      1. ...
    - Edge Cases:
      - ...
    - Notes:

## Open Question — `Q-###`

    ### Q-###
    - Question:
    - Context:
    - Why it matters:
    - Options under consideration:
      - ...
    - Recommended next step:

## Decision — `DEC-###`

    ### DEC-###
    - Decision:
    - Status: confirmed
    - Context:
    - Impact:
    - Related requirements:
    - Notes:

Decision bodies live in `sections/decisions/<domain>.md`. Every body also
requires one index row in `sections/decisions.md`.

## Formatting Rules

- One requirement per entry. One decision per entry.
- Acceptance criteria are measurable or observable.
- Constraints state what the implementation must not overstep.
- Dependencies list bare IDs of things this entry relies on.

## Slice Dependency Rules

- `parallel-ready` — references only non-blocking IDs; names no prerequisite
  slice.
- `sequential` — names the prerequisite slice letter(s) **and** a one-line
  reason for each.
- Vague values such as "depends on other slices" or "after future work" are
  forbidden. A dependency that cannot be named is not a dependency; it is an
  unfinished plan.

## Slice Acceptance Criteria Rule

Every criterion must be verifiable by a named command or an explicitly
described manual check. The final slice additionally carries the ship gates and
an auditable completion criterion covering promotion, navigation update, and
work-folder deletion.

## Slice Template — `PRD/work/<slug>/slice-<letter>-<name>.md`

    # Slice A — <name>

    ## Status: planned

    ## Goal

    <one objective>

    ## Requirements

    1. <requirement>

    ## Acceptance criteria

    - [ ] <check>

    ## Verification

    <the exact command that proves it>

    ## Files touched

    - `<path>`

## Ship Gates — appended to the final slice only

    ## Ship gates

    - [ ] Slice acceptance criteria satisfied and verified
    - [ ] Tests updated; `<quality-command>` green for touched areas
    - [ ] Public contracts unchanged unless this slice scoped a change
    - [ ] No secrets committed
    - [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
