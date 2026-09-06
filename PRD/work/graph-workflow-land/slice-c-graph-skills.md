# Slice C — `graph-*` skills: claim is the branch, one worktree, `close` before `land`

## Status: planned

## Goal

The two graph drivers describe the build half as the brief defines it: claim by
branch and worktree, every node in that worktree, driver commits between nodes,
code PR into `main`, `close` at node 8, `land` at node 9 outside the ledger, and
no `git -C` in any agent-run command.

## Requirements

1. `graph-implement/SKILL.md` (D1, D3, D5, D9; REQ-193, REQ-194): `## Goal and
   inputs` and `## Resolving the gate` sequences read `plan → build → review →
   close → land`; `## The build loop` items 1–4 rewritten (sync via `git fetch`
   + `git show origin/main:…`; ready adds no-branch/no-worktree; claim = kickoff
   worktree first (clean → remove, dirty → report and skip unclaimed), then
   `git worktree add … -b thejudge-auto/<slug>-work origin/main`, first commit
   (README `## Autonomous metadata` → `origin/main`, ledger header), push;
   marker stays `refined`); `## Loop` item 3 (node 8 `close` dispatched, node 9
   `land` never dispatched; node 6 assertion = launch checkout porcelain
   unchanged + paths under the worktree, root-relative); `## Resolving the
   gate` last paragraph (docs PR is merged by the owner as the build signal; the
   code PR is a second PR into `main`); `## Next step` (ends `COMPLETE` at
   `close` with the PR open; nothing resumes after the merge); the `git -C` at
   line 57 → `cd <path> && git status --porcelain`.
2. `graph-implement/reference.md`: node table 8/9; entry-point table + rows
   for post-`close` (no package folder: append the `close` row if missing, else
   nothing) and remote-branch-no-worktree (`git worktree add … -b … origin/…`);
   the "run `graph-preflight` first" paragraph removed for the build half;
   §Publishing before build → `-work` branch from the build worktree; §The base
   is frozen — removed; §Worktree and branch shape (driver creates the worktree;
   builder works in place); §Node 8 → `## Node 9 (land)`; §Node 6 return-side
   assertion rewritten.
3. `graph-kickoff/SKILL.md`: line 42 `git -C` → `cd <path> && git …`; step 2's
   "grows into / merges it last" and "hold the PR open (not merge yet)" →
   answer-then-merge, second PR from the build half; "Package sections the
   driver owns" base definition (both halves). `graph-kickoff/reference.md`
   node-4 note.
4. `graph-preflight/SKILL.md` line 212 `git -C` → `cd … && git branch
   --show-current` (line 52 stays: script-run).
5. `graph-gate-review/SKILL.md`: "node 8 (`land`)" → node 9; one sentence: when
   dispatched by `graph-implement` it runs in the build worktree named by
   `Working directory:`.
6. Fixture `graph-implement/build-loop-ready-detection.md` rewritten per D5
   (preconditions on `origin/main`; items 2, 3, 6; rationale).
7. `npm run skills:ai-sync`; both trees identical.

## Acceptance criteria

- [ ] C1 `grep -rn "git -C" .claude/skills/graph-*/SKILL.md` finds only `graph-preflight/SKILL.md` line 52
- [ ] C2 `grep -n "land → close\|land\` → \`close" .claude/skills/graph-implement/SKILL.md .claude/skills/graph-implement/reference.md` finds nothing
- [ ] C3 `.claude/skills/graph-implement/SKILL.md` names the claim as the branch + worktree with the marker left `refined`, and the `COMPLETE` end at `close`
- [ ] C4 `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md` item 6 observes the `-work` branch and worktree, not `STATUS.active` on `main`
- [ ] C5 `diff -rq .claude/skills .agents/skills` prints nothing after `npm run skills:ai-sync`

## Verification

```bash
grep -rn "git -C" .claude/skills/graph-*/SKILL.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/skills/graph-implement/SKILL.md`, `.claude/skills/graph-implement/reference.md`
- `.claude/skills/graph-kickoff/SKILL.md`, `.claude/skills/graph-kickoff/reference.md`
- `.claude/skills/graph-preflight/SKILL.md`
- `.claude/skills/graph-gate-review/SKILL.md`
- `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md`
- `.agents/skills/` mirror of the above
