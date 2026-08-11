# Slice A — <name>

## Status: planned

<!-- planned | in-progress | done | blocked

     If you stop before `done`, append the handoff block directly below this
     line, replacing any prior one:

     ### Handoff
     - Done: <what is verified so far, or "nothing verified yet">
     - Next: <the concrete next action, specific enough to start cold>
     - Stopped because: <usage limit / blocker / session end>

     Remove the handoff block when the slice reaches `done`. -->

## Goal

<One objective, one sentence. If it needs an "and", split the slice.>

## Dependencies

parallel-ready

<!-- or: sequential — requires Slice A, because <one-line reason> -->

## Requirements

1. <Specific, checkable requirement.>
2. <Another.>

## Acceptance criteria

- [ ] <Verifiable check — a test assertion, a command result, or an explicitly
      described manual check.>
- [ ] <For browser-risk slices: browser closed, owned servers stopped, ports
      released, captures written to `PRD/work/<slug>/.playwright-mcp/`>

## Verification

    <the exact command that proves this slice works>

## Files touched

- `<path>`

<!-- A real prediction, not a formality. It is what lets a fanout orchestrator
     detect collisions between packages, and it is a useful accuracy signal in
     review. -->

## Verification evidence

<!-- Filled in during implementation: commands run, output summary, runtime
     cleanup results. -->

<!-- ============================================================
     THE FINAL SLICE ALSO CARRIES THIS BLOCK:

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `<quality-command>` green for touched areas
- [ ] Public contracts unchanged unless this slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted to `PRD/sections/`
- [ ] `PRD/work/<slug>/` ready to delete
     ============================================================ -->
