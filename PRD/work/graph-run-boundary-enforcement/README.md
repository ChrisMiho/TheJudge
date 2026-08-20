---
status: active
---

# graph-run-boundary-enforcement

Make every safety boundary in the autonomous graph-run contract enforced by a
mechanism that fires without a launch flag, give node 7 a genuinely independent
reviewer, and give the owner a way to stop a run in flight.

Captured by `thejudge-kickoff` from `docs/whatIsGraph/graph-hardening-handoff.md`,
which carries the findings, evidence, and grounded current-state statements.

See `IDEA.md` for the idea and the six ranked findings, `DESIGN-BRIEF.md` for
the approved scope, decisions, stated limits, and DEC/REQ/NFR/FLOW references,
and `GAMEPLAN.md` for the architecture and verification checklist.

## Autonomous metadata

- Autonomous base: origin/feature/graph-workflow-hardening

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/graph-run-boundary-enforcement/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Objective | Requirements | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-hook-and-universal-tier.md) ✅ | Hook exists, is always on, denies the universal tier | REQ-152, NFR-016 | — |
| [B](./slice-b-graph-tier.md) ✅ | Graph tier gated by the run lock | REQ-153, REQ-152, NFR-016 | A |
| [C](./slice-c-kill-switch.md) | Owner kill switch with a clean halt | REQ-154, FLOW-020 | A |
| [D](./slice-d-tool-call-cap.md) | Per-dispatch tool-call cap | REQ-156 | A |
| [E](./slice-e-hook-liveness.md) | Canary at run start, heartbeat between nodes | REQ-159, NFR-016 | A, B, D |
| [F](./slice-f-default-fail-criteria.md) | Slice criteria start `false`, flip on observed evidence | REQ-157 | A, B |
| [G](./slice-g-independent-reviewer.md) | Node 7 reviewer with no write tools | REQ-155 | — |
| [H](./slice-h-no-preauth-reread.md) | No-pre-authorization rule re-read at every dispatch | REQ-158 | — |
| [I](./slice-i-contract-retirement.md) | Contract retirement, stated limits, promotion | all | A–H |

G and H touch skill and contract text only and are parallel-ready with the hook
chain. E is the one genuinely sequential slice: it proves the hook A and B built
and reads the counter D writes.

## Implementation map

| Area | Files |
| --- | --- |
| Hook entry point | `.claude/settings.json`, `scripts/graph-boundary-hook.mjs` |
| Decision logic | `scripts/lib/boundary-rules.mjs`, `scripts/lib/protected-paths.mjs` |
| Run records | `.worktrees/.graph-run.lock`, `.graph-run-state.json`, `.graph-node-calls.json`, `.graph-evidence.jsonl`, `.graph-stop` |
| Driver and preflight | `.claude/skills/graph-run/`, `.claude/skills/graph-preflight/`, `scripts/graph-preflight.mjs` |
| Phase skills | `.claude/skills/thejudge-map-out/`, `.claude/skills/thejudge-implement-all/` |
| Durable truth | `PRD/instructions/graph-workflow-contract.md`, `AGENT-SKILLS.md` |

## Build it interactively

Slice A creates `.claude/settings.json` and slice F edits `thejudge-*` skills.
Both are inside the protected set that the graph tier denies while a run holds
the lock, so a graph run building this package would be denied by the boundary
it is building. Implement in a session holding no lock. See `GAMEPLAN.md`.
