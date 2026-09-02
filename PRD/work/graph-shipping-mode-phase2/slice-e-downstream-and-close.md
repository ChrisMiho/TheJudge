# Slice E — Downstream, docs, fixtures, final verification

## Status: planned

## Goal

Finish every reference the rename ripples into, update the downstream skill that
drives the workflow, move the fixtures, and prove the whole change green.

## Requirements

1. **`overnight-codehealth`**: point it at `graph-kickoff` (start) and
   `graph-implement` (build loop); revisit its "one graph run at a time" assertion
   under per-worktree isolation; update its run-one/run-two narrative to the new
   names.
2. **Owner/docs**: `OPERATOR.md` recipes (`/graph-run "…"` → `graph-kickoff`;
   `/graph-run PRD/work/<slug>/` → `graph-implement`); `PRD/README.md` contract
   pointer + usage; `docs/whatIsGraph/graph-hardening-handoff.md` narrative
   (lock/driver mentions).
3. **`AGENT-SKILLS.md`**: the `## Workflow sequence` mermaid diagram (two nodes:
   `graph-kickoff` controls kickoff→gate-qc, `graph-implement` controls the build
   loop); the `## Graph workflow skills` paragraph + table (four `graph-*` skills);
   the header skill counts; the off-lifecycle `thejudge-investigate` handoff
   target; the predicate mention.
4. **Fixtures**: move `PRD/instructions/skill-fixtures/graph-run/` scenarios to a
   `graph-kickoff/` dir (they are run-one scenarios); add a `graph-implement/`
   fixture scaffold for the loop; update the `graph-gate-review` fixture's resume
   command if it names `graph-run`.
5. **Remaining tests**: `graph-digest.test.mjs` resume-command strings; any
   residual `graph-run` literal in `scripts/*.test.mjs`; confirm
   `protected-write-guard.test.mjs` still passes with the new skill dirs.
6. **Final verification**: `npm run quality:check` green for touched areas; full
   `grep` sweep shows no `graph-run` outside receipts; mirror clean.
7. **PRD promotion**: confirm REQ-170/171/172 + REQ-154/159/160 edits are present
   and coherent across `functional-requirements.md`,
   `non-functional-requirements.md`, and `user-flows.md` (execution of the durable
   promotion happens in cleanup; this slice ensures the truth is applied and
   consistent).

## Acceptance criteria

- [ ] E1: `overnight-codehealth` drives `graph-kickoff`/`graph-implement` and no
      longer asserts a global one-at-a-time rule contradicted by isolation.
- [ ] E2: `AGENT-SKILLS.md` shows four `graph-*` skills in the table, paragraph,
      and diagram; header counts match.
- [ ] E3: No `graph-run` name remains anywhere in the canonical tree except
      `PRD/instructions/receipts/` (historical).
- [ ] E4: Fixtures moved to `graph-kickoff/`; a `graph-implement/` fixture scaffold
      exists; no fixture names `graph-run` in a resume command.
- [ ] E5: `npm run quality:check` is green for touched areas.
- [ ] E6: REQ-170/171/172 present and REQ-154/159/160 edits applied and coherent
      across the three section files.

## Verification

```bash
grep -rn "graph-run" . --include=*.md --include=*.mjs | grep -v receipts | grep -v .worktrees | grep -v node_modules || echo "clean"
grep -n "graph-kickoff\|graph-implement" AGENT-SKILLS.md
npm run quality:check
```

## Files touched

- `.claude/skills/overnight-codehealth/SKILL.md`
- `OPERATOR.md`, `PRD/README.md`, `docs/whatIsGraph/graph-hardening-handoff.md`
- `AGENT-SKILLS.md`
- `PRD/instructions/skill-fixtures/graph-kickoff/**` (moved), `graph-implement/**` (new), `graph-gate-review/**`
- `scripts/graph-digest.test.mjs`, other residual test literals
- `PRD/sections/{functional-requirements,non-functional-requirements,user-flows}.md` (coherence)
- `.agents/skills/**` (sync)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/graph-shipping-mode-phase2/` ready to delete
