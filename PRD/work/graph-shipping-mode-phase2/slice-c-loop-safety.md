# Slice C — Loop safety

## Status: done

## Goal

Give the unattended `graph-implement` loop the same rails a single run has: the
stop sentinel halts it at a spec boundary, hook-liveness is proven per build, the
loop is bounded/fail-closed, and subagent fan-out is off by default with cost
logged. Applies REQ-172 and the edits to REQ-154 and REQ-159.

## Requirements

1. The stop sentinel `.worktrees/.graph-stop` halts the loop at a **spec
   boundary**: the in-flight build finishes, no next spec is picked up, no ledger
   is left half written. Document and (where scripted) enforce.
2. The hook-liveness canary at build start and the per-node heartbeat run for
   **every** build the loop performs; a failed proof ends that build at `BLOCKED`
   without halting the loop. Per-node caps apply per build as today.
3. Subagent/parallel fan-out inside a build is **off by default**; when enabled,
   per-run token cost is written to that run's `GRAPH-RUN.md` ledger.
4. The loop is bounded and fail-closed: it stops rather than spinning when no
   ready spec exists, and a liveness or lock failure ends the affected build
   rather than the whole repository.
5. Apply **REQ-172** truth (new) and the **REQ-154** and **REQ-159** edits to
   `PRD/sections/functional-requirements.md` by intent.
6. `npm run skills:ai-sync`.

## Acceptance criteria

- [ ] C1: `graph-implement` documents the stop sentinel halting at a spec boundary
      (current build finishes, no next pick-up).
- [ ] C2: The skill documents per-build canary/heartbeat and that a failed proof
      ends that build at `BLOCKED` without halting the loop.
- [ ] C3: The skill documents the subagent knob off-by-default with per-run cost
      logged to the ledger.
- [ ] C4: REQ-172 present in `functional-requirements.md`; REQ-154 and REQ-159
      carry the loop-coverage edits.
- [ ] C5: `.agents/skills/` mirrors `.claude/skills/`.
- [ ] C6: `npm run test:scripts` passes.

## Verification

```bash
grep -n "graph-stop\|canary\|heartbeat\|off by default\|cost" .claude/skills/graph-implement/SKILL.md
grep -n "REQ-172\|REQ-154\|REQ-159" PRD/sections/functional-requirements.md
diff -rq .claude/skills .agents/skills
npm run test:scripts
```

## Files touched

- `.claude/skills/graph-implement/SKILL.md`, `reference.md` (shared safety sections)
- `.agents/skills/**` (sync)
- `PRD/sections/functional-requirements.md` (REQ-172 new; REQ-154, REQ-159 edits by intent)
