# Gameplan — graph-workflow-land

Manual package (`OPERATOR.md` recipe 9) on `fix/graph-workflow-land` off
`origin/main` (`8d29ce4`), in `.worktrees/graph-workflow-land`. One PR to
`main`, the owner merges. Design record: `DESIGN-BRIEF.md` (D1–D9); product
truth: `GATE-QUESTIONS.md` (REQ-193, REQ-194 new; REQ-171, REQ-191, REQ-192,
REQ-164, FLOW-021, FLOW-022 amended).

## Architecture in one paragraph

The build half of the graph workflow gets one folder and one branch. At claim,
`graph-implement` cuts `thejudge-auto/<slug>-work` from `origin/main` into
`.worktrees/implement-<slug>`; every build-half node works there; the driver
commits between nodes on the same branch; the code PR targets `main`; `close`
(`thejudge-cleanup`, now node 8) runs on that branch before the owner merges
(`land`, node 9), so the receipt and the package deletion ride in the code PR.
No base branch is re-created; `delete_branch_on_merge` stays on. The change is
docs, skills, and three scripts — no product code under `apps/`.

## Slices

| Slice | Objective | Files | Depends on |
| --- | --- | --- | --- |
| A | Scripts: prune keep-rule removed, write scope narrowed, digest sees worktree ledgers | `scripts/graph-prune.mjs` (+test), `scripts/graph-ledger-check.mjs` (+test), `scripts/graph-digest.mjs` (+test), `scripts/lib/boundary-rules.mjs` comment (+test message) | — |
| B | `thejudge-*` skills: implement-all works in place under graph control; cleanup gains the pre-merge PR-ready path; fixtures | `.claude/skills/thejudge-implement-all/{SKILL,reference}.md`, `.claude/skills/thejudge-cleanup/SKILL.md`, `PRD/instructions/skill-fixtures/thejudge-cleanup/*` (+ new `close-inside-the-code-pr.md`), `.agents/skills/` mirror | — |
| C | `graph-*` skills: claim = branch, one worktree, `close` before `land`, `cd && git`, no `git -C` | `.claude/skills/graph-implement/{SKILL,reference}.md`, `.claude/skills/graph-kickoff/{SKILL,reference}.md`, `.claude/skills/graph-preflight/SKILL.md`, `.claude/skills/graph-gate-review/SKILL.md`, `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md`, `.agents/skills/` mirror | — |
| D | Contract, preparation contract, owner docs, catalog, receipt typo | `PRD/instructions/graph-workflow-contract.md`, `PRD/instructions/preparation-contract.md`, `OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`, `.claude/skills/codehealth/SKILL.md` (attempt), `PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md` | — |
| E | Product truth applied by intent; final sweeps, rehearsal, ship gates | `PRD/sections/functional-requirements.md`, `PRD/sections/user-flows.md` | A, B, C, D (the grep sweeps read the finished tree) |

Slices A–D are parallel-ready; E is sequential because its sweeps grade the
whole tree.

## Data flow (what changes hands)

- Claim: `git show origin/main:PRD/work/…` → `git worktree add … -b … origin/main`
  → first commit (README `## Autonomous metadata`, ledger header) → push.
- Nodes: dispatch `Working directory: <root>/.worktrees/implement-<slug>`; driver
  commits between nodes with `cd <worktree> && git add … && git commit …`;
  pushes `git push -u origin thejudge-auto/<slug>-work`.
- Build: `thejudge-implement-all` in place; PR `--base main`; return-side check
  = launch checkout `git status --porcelain` unchanged + `classifyBuildWrites`
  over root-relative paths with the single prefix.
- Close: `thejudge-cleanup` PR-ready path (PR open) → receipt with `- PR:` and
  `Terminal state: COMPLETE — land: …` → `git rm -r PRD/work/<slug>/` → board,
  system-map → `quality:check` → commit, push. Driver appends the `close` row,
  releases the lock, ends `COMPLETE`.
- Owner merges. Prune lists the worktree and both branches as merged leftovers.

## Verification checklist (package level)

- `npm run quality:check` exit 0 after every slice.
- `npm run skills:ai-sync` then `diff -rq .claude/skills .agents/skills` empty
  (slices B, C).
- `Current:` excerpts byte-verified before slice E edits `PRD/sections/`
  (`scratchpad/verify-current.mjs`, 13/13).
- Grep sweeps per `DESIGN-BRIEF.md` `## Verification`, with the named
  survivors, after slice E.
- Local rehearsal, no push (slice E): `git worktree add .worktrees/implement-smoke
  -b thejudge-auto/smoke-land-work origin/main`, a `cd … && git commit`, the
  `git show origin/main:PRD/work/` read, then `git worktree remove` and the
  owner-run `git branch -D`.
- Receipt written before the PR (cleanup), then one PR to `main`.
