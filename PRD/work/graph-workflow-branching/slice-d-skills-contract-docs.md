# Slice D — skills, contract, and owner docs describe the new plan

## Status: planned

## Goal

Every skill, instruction, and owner document that described auto-commit,
stash, the base→main guard, the hand-made kickoff worktree, or "branch from
the current branch" now describes slice A's real behavior, the ledger's
`- Worktree:` line, claim-time worktree removal, and the two-session recipe.

## Requirements

1. `.claude/skills/graph-preflight/SKILL.md`: `## Inputs` (`--slug` required,
   `--base` defaults to `origin/main`), `## Procedure` (worktree plan; in-place
   plan; dirty refusal), `## Per-idea worktree isolation` rewritten around the
   two shapes (root → kickoff worktree; linked-worktree root → in place; the
   `git worktree add --detach .worktrees/session-<name> origin/main` recipe),
   `## base→main guard` removed, `## Boundaries` no longer mentions thresholds
   or stashes, `## When the real run fails` no stash recovery lines.
2. `.claude/skills/graph-kickoff/SKILL.md`: nodes 2–4 dispatched with
   `Working directory: <root>/.worktrees/kickoff-<slug>`; driver ledger
   commits via `git -C`; `- Worktree:` header line; resume reads
   `.worktrees/kickoff-<slug>/PRD/work/<slug>/GRAPH-RUN.md` and passes it to
   `graph-ledger-check.mjs`; missing worktree on resume → `BLOCKED`; the
   `## Intake` "why outside the working tree" paragraph rewritten (no stash);
   the park report names the worktree path.
3. `.claude/skills/graph-implement/SKILL.md` + `reference.md`: claim step
   removes `.worktrees/kickoff-<slug>` (`git worktree remove`, clean tree
   only, park otherwise) and keeps the local base branch.
4. `.claude/skills/codehealth/SKILL.md` lines 43 and 176 and
   `.claude/skills/graph-gate-review/reference.md:46`: guard/stash wording
   removed. `npm run skills:ai-sync` mirrors all of the above into
   `.agents/skills/`.
5. `PRD/instructions/graph-workflow-contract.md`: `## Overall flow` step 2;
   `## The two runs` guard sentence; ledger header gains `- Worktree:` and
   the example row loses `stash`; `## Stashed work handoff` removed;
   `## Human gates` trigger "any `blocked` preflight classification" → "a
   dirty in-place checkout"; `## One run at a time` rationale; the
   "one `git add -A` survives" paragraph removed; `## Boundaries` list
   unchanged.
6. `OPERATOR.md`: new recipe "Start a second idea while the first waits"
   (with the two-session sub-recipe and the one-session-per-root rule);
   recipe 5 loses "the system now refuses to start a new run…"; recipe 3
   states the per-root rule; `npm run graph:prune` listed under "Where to
   look".
7. `AGENT-SKILLS.md` `graph-preflight` row and the codehealth paragraph;
   `PRD/README.md` line 130 (worktree per idea is now automatic; two sessions
   for simultaneous runs).
8. Comments in `scripts/fixture-rig.mjs:141-144` and
   `scripts/fixture-rig.test.mjs:127` reworded; code unchanged.

## Acceptance criteria

- [ ] D1 `grep -rn "auto-commit\|git stash\|base→main guard\|classifyPendingBaseToMain\|kickoffWorktreeCommand\|resolved from the current HEAD\|Stashed work handoff\|thresholds" .claude/skills/graph-* .claude/skills/codehealth .claude/skills/graph-gate-review PRD/instructions/graph-workflow-contract.md OPERATOR.md AGENT-SKILLS.md PRD/README.md` returns nothing except the contract's historical "Before 2026-08-24" sentences, which are left as records
- [ ] D2 `npm run skills:ai-sync` leaves `git status --porcelain -- .agents/` empty afterwards (mirror in sync) and `diff -r .claude/skills .agents/skills` is empty
- [ ] D3 `OPERATOR.md` contains the recipe heading "Start a second idea while the first waits" and the exact command `git worktree add --detach .worktrees/session-<name> origin/main`
- [ ] D4 The contract's ledger template contains `- Worktree:` and `grep -c "## Stashed work handoff" PRD/instructions/graph-workflow-contract.md` is 0
- [ ] D5 `npm run format:check` passes for the touched markdown

## Verification

```bash
grep -rn "auto-commit\|git stash\|base→main guard\|classifyPendingBaseToMain\|kickoffWorktreeCommand\|resolved from the current HEAD\|Stashed work handoff\|thresholds" .claude/skills/graph-* .claude/skills/codehealth .claude/skills/graph-gate-review PRD/instructions/graph-workflow-contract.md OPERATOR.md AGENT-SKILLS.md PRD/README.md
npm run skills:ai-sync && diff -r .claude/skills .agents/skills && git status --porcelain -- .agents/
grep -n "Start a second idea while the first waits\|git worktree add --detach .worktrees/session-<name> origin/main" OPERATOR.md
grep -n "^- Worktree:" PRD/instructions/graph-workflow-contract.md; grep -c "## Stashed work handoff" PRD/instructions/graph-workflow-contract.md
npm run format:check
```

## Files touched

- `.claude/skills/graph-preflight/SKILL.md`
- `.claude/skills/graph-kickoff/SKILL.md`
- `.claude/skills/graph-implement/SKILL.md`, `.claude/skills/graph-implement/reference.md`
- `.claude/skills/codehealth/SKILL.md`, `.claude/skills/graph-gate-review/reference.md`
- `.agents/skills/**` (via `npm run skills:ai-sync` only)
- `PRD/instructions/graph-workflow-contract.md`
- `OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`
- `scripts/fixture-rig.mjs`, `scripts/fixture-rig.test.mjs` (comments only)
