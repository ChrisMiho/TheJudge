# graph-run-boundary-enforcement

An autonomous graph run's safety boundaries are mostly convention. `.claude/graph-profile.json` binds only in a session launched with `claude --settings .claude/graph-profile.json`, so every entry is inert without that flag; the contract's own reach table records raw Bash writes (`cp`, `rsync`, redirection) as enforcement "none"; and two boundaries can never fire even with the profile loaded, because `nohup` is stripped as a wrapper and a trailing `&` is consumed as a separator before any rule sees the command text. Alongside that, node 7's code reviewer grades work it helped produce, the owner has no way to stop a run short of Ctrl-C (which leaves the lock held and the ledger mid-node), and no run has a turn or spend cap.

Outcome: every boundary in `PRD/instructions/graph-workflow-contract.md` is enforced by a mechanism that fires whether or not anyone remembered a launch flag — a project-level `PreToolUse` hook that reads the command text rather than matching a rule pattern; node 7's independence is real rather than nominal, via a fresh-context reviewer with no Write/Edit tools and a brief that names the slice's stated requirements as its rubric; and the owner can halt a run in flight through a `.worktrees/.graph-stop` sentinel that writes a terminal state and releases the lock.

Non-goals: not rewriting the node table, not changing the lifecycle, and not adopting a graph framework — the "graph shell, loop nodes" hybrid is settled. Also not re-litigating what the source research confirms is already right: the `define` gate, per-node checkpoints, fresh-subagent retries, and parking instead of prompting.

## Source material

- `docs/whatIsGraph/graph-hardening-handoff.md` — the full findings, evidence, and grounded "what is true today" statements. Hand refinement this whole file.
- `docs/whatIsGraph/loop-vs-graph-engineering.md` (1,230 lines, compiled 17 Aug 2026) — the research the handoff was compiled from; section numbers in the handoff refer to it.

## Findings carried in (ranked)

1. **Move boundaries from the profile into hooks** — highest leverage. A `PreToolUse` hook in the project's `.claude/settings.json` fires unconditionally, catches raw-Bash writes into protected paths, and sees wrappers the rule matcher strips.
2. **Node 7 reviewer: no write tools, narrow brief** — the named failure is self-preferential bias; the counter-risk is a reviewer that manufactures findings, which matters because `review` may only loop to `build` twice before parking.
3. **A kill switch** — `.worktrees/.graph-stop`, checked by the same hook. The `steer` half is a user instruction arriving mid-run and needs instruction-ledger treatment.
4. **No run has a spend or turn cap** — subagent spend counts toward `max_budget_usd`, which matters for a driver whose whole job is dispatching subagents.
5. **The no-pre-authorization rule is compaction-fragile** — it lives only in files read once at run start; the rule most likely to evaporate is the one written to prevent the 2026-08-17 failure.
6. **Node 6's `ok` is a self-report** — a default-FAIL criteria file would make it ground truth. The largest of the six and the most likely to want its own package.

## Open shaping questions (for refinement)

**Scope.** One package for all six findings, or split 1–3 (enforcement and control) from 4–6 (budget, durability, verification)? Does hook work replace `.claude/graph-profile.json` or sit alongside it? Is finding 6 in scope now or parked as a follow-on?

**Mechanism.** Does the hook live in committed project settings and stay always-on — affecting every ordinary session in this repo — or get scoped to graph runs only? Does the kill switch halt at the next tool call or at the node boundary? Ship `steer` with `stop`, or stop first?

**Contract surface.** Which existing contract text gets retired — the reach table's third row, the env sentinel, the `Profile:` ledger field, the two convention-only boundary notes? Do budget caps park as `PARKED` or need a fifth terminal state? Does the no-write reviewer replace `superpowers:requesting-code-review` at node 7, or wrap it?
