# Map-out reference

Templates loaded on demand by `proj-map-out`.

## Slice document

    # Slice A — <name>

    ## Status: planned

    ## Goal

    <one objective>

    ## Dependencies

    parallel-ready
    <!-- or: sequential — requires Slice A, because <one-line reason> -->

    ## Requirements

    1. <requirement>

    ## Acceptance criteria

    - [ ] <check>

    ## Verification

    <the exact command that proves it>

    ## Files touched

    - `<path>`

## Ship gates — final slice only

    ## Ship gates

    - [ ] Slice acceptance criteria satisfied and verified
    - [ ] Tests updated; `<quality-command>` green for touched areas
    - [ ] Public contracts unchanged unless this slice scoped a change
    - [ ] No secrets committed
    - [ ] Durable outcomes promoted to `PRD/sections/`
    - [ ] `PRD/work/<slug>/` ready to delete

## Browser-risk acceptance criterion

Add to any slice with browser-observable risk, per
`PRD/instructions/runtime-process-hygiene.md`:

    - [ ] Browser closed, owned servers stopped, ports released; captures
          written to `PRD/work/<slug>/.playwright-mcp/`

## Slice sizing heuristics

- One objective per slice. An "and" in the goal sentence means two slices.
- A slice should be completable and verifiable in one working session.
- A shared abstraction is its own slice, ahead of everything that consumes it.
- The final slice is integration plus ship gates, and it is allowed to be thin.
- Four to eight slices is typical. More than ten usually means the package
  should have been two packages.
