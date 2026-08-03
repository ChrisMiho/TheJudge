---
name: thejudge-implement-parallel
description: >-
  Dispatches every slice in a wave from PRD/work/<slug>/ across concurrent
  agents using the host runtime's parallel-agent mechanism (or sequentially if
  the runtime has none), then independently re-verifies each result before
  marking it done. Use after map-out-parallel, when a whole wave — not a
  single slice — is ready to implement. For executing one slice in this
  session, use thejudge-implement instead.
---

# TheJudge Implement (Parallel)

## Goal

Execute every slice in a wave from `PRD/work/<slug>/`, dispatched concurrently when the host runtime supports it, with the orchestrator independently verifying each result.

This skill describes a contract, not a CLI. It names no dispatch mechanism, tool, or flag — the human picks the runtime and starts the session; the orchestrating agent in that session uses whatever parallel-agent primitive the runtime provides.

## Inputs

Work slug or `PRD/work/<slug>/` path. Optional wave number or slice letter — if omitted, select the earliest wave with any slice not `done`.

## Reads

The orchestrator reads these itself, before dispatching anything — orientation is not delegable:

1. `PRD/work/<slug>/README.md` (slice table + wave plan)
2. `PRD/work/<slug>/GAMEPLAN.md`
3. Every selected wave's `PRD/work/<slug>/slice-*.md`
4. `Files touched` for each selected slice
5. This skill's `reference.md` for the binding implementation constraints

## Writes

- Product code and tests within each dispatched slice's `Files touched`
- Slice doc status lines (see `reference.md`)
- `PRD/work/<slug>/README.md` slice table / wave status

## Gates

- Every slice's dependencies must be `done` before its wave dispatches.
- Same-wave slices with overlapping `Files touched` run sequentially regardless of wave assignment.
- **Verification is non-delegable.** The orchestrator re-runs each slice's verification commands in its own session and reads the output. A dispatched agent's success claim never promotes a slice to `done` by itself.
- Each dispatched agent receives: the slice doc path, the GAMEPLAN path, its `Files touched`, its verification commands, the binding implementation constraints from `reference.md`, and an explicit instruction not to touch other slices' files.
- **No dispatch recipes.** Never shell out to another agent CLI or juggle background processes to improvise a mechanism the runtime doesn't provide.
- When the runtime has no parallel-agent mechanism (for example, the Codex CLI has no in-session subagent primitive), state that plainly and execute the wave's slices one at a time under every gate above — only the concurrency is lost.
- Mark a slice `done` only after the orchestrator's own verification is green; otherwise keep `in-progress`, or `blocked` if unresolvable in-session.
- Never run `thejudge-map-out-parallel`, rewrite `GAMEPLAN.md`/slice docs beyond status, dispatch slices whose `Files touched` overlap in parallel, run cleanup, or promote durable PRD truth.

## Next step

More waves remain → `/thejudge-implement-parallel PRD/work/<slug>/ wave <next>`.
All slices done → `/thejudge-cleanup PRD/work/<slug>/`.

(`$thejudge-*` in Codex — sequential mode, per the runtime-without-a-parallel-mechanism gate above.)
