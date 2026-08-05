# thejudge-implement reference

## Implementation constraints

1. No deterministic rules-engine, legality validation, or board-state simulation.
2. No API request/response shape changes without a cited confirmed decision.
3. No new product-facing endpoints without a cited confirmed decision.
4. Stack ordering semantics are preserved across UI, API, prompt, and tests.
5. Any Scryfall download or network refresh requires explicit human approval, and that approval is never delegated to a subagent.
6. Never commit unless the user explicitly asks.

Also preserve active product decisions from `PRD/sections/decisions/` and `PRD/instructions/technical-design-rules.md`.

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, as a single status line near the top of the slice doc:

```markdown
## Status: in-progress
```

If a slice already uses another status format, preserve the format and change only the value.

Stopping before a slice reaches `done` (session end, usage limit, blocker): append the `### Handoff` block defined in `PRD/instructions/workflow-reference.md` under the status line before stopping.
