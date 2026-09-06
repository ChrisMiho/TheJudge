# Slice D — Contract, preparation contract, owner docs, catalog

## Status: planned

## Goal

The authority documents and the owner-facing docs say the same thing as the
skills: two PRs, `close` before `land`, one build worktree, `COMPLETE` at the
open code PR, and the working `graph:prune -- --apply` spelling.

## Requirements

1. `PRD/instructions/graph-workflow-contract.md` (D1–D4, D9): §Overall flow
   5–7 (build in one worktree; `close` before the owner's merge; `land` is the
   owner merging `-work → main`); §Propose/apply/close (close runs on the code
   branch before `land`); §The two runs (the docs PR is answered and merged as
   the build signal; the build half opens a second PR `thejudge-auto/<slug>-work
   → main` carrying code, truth, receipt, and deletion — two merges per
   package; run-two paragraph likewise); node table rows 8 `close` / 9 `land`
   with row 9's Advances-to cell "run complete — outside the run's ledger";
   "`land` has no cap" sentence kept; §Autonomous metadata (base = the branch
   the next PR targets, both halves; example shape unchanged); §Ledger
   (`Worktree` line covers the build worktree; a resume reads it there);
   §Instruction ledger "Node 6 carries the return-side half" → single prefix +
   launch-checkout porcelain check; §Boundaries "The one merge that matters"
   → node 9; §The ledger outlives the run (the driver appends the `close` row
   to the receipt; `close` writes the summary line); §Terminal states
   `COMPLETE` row.
2. `PRD/instructions/preparation-contract.md` `## Autonomous base`: one
   paragraph scoping "never defaults to `main`" to `thejudge-prepare` and
   naming the graph claim's one rewrite to `origin/main` as a recorded value.
3. `OPERATOR.md`: recipe 6 → "Merge the code PR" (the one merge that lands a
   package; nothing after it); recipe 7 drops the base→main reminder; "Where to
   look" table: ledger in `.worktrees/kickoff-<slug>/…` during spec-forming and
   `.worktrees/implement-<slug>/…` during build; prune row "add `-- --apply`".
4. `AGENT-SKILLS.md` graph rows (`graph-kickoff`: docs PR the owner answers and
   merges; `graph-implement`: code PR into `main` carrying the receipt, `close`
   before `land`). `PRD/README.md` line 130 (the code PR you merge carries the
   receipt and the folder deletion; nothing else to merge).
5. `.claude/skills/codehealth/SKILL.md` line 43: "an evolving base→main PR
   merged last" → "a docs PR the owner answers and merges, then a code PR into
   `main`" — attempted directly; if denied, record the `!` command for the owner
   in the receipt.
6. Part-1 receipt lines 17 and 83: `graph:prune --apply` → `graph:prune --
   --apply`.

## Acceptance criteria

- [ ] D1 The contract's node table reads `| 8 | close |` and `| 9 | land |`, and its `COMPLETE` row names the open code PR and `land` as the owner's merge
- [ ] D2 `grep -n "frozen once\|base→main hop\|merges it last" PRD/instructions/graph-workflow-contract.md OPERATOR.md AGENT-SKILLS.md PRD/README.md` finds nothing
- [ ] D3 `grep -rn "graph:prune --apply" PRD/ OPERATOR.md` finds nothing; `grep -n "add \`--apply\`" OPERATOR.md` finds nothing
- [ ] D4 `PRD/instructions/preparation-contract.md` `## Autonomous base` carries the graph-run scoping paragraph
- [ ] D5 `npm run quality:check` exit 0 (format:check covers the markdown)

## Verification

```bash
grep -n "frozen once\|base→main hop\|merges it last" PRD/instructions/graph-workflow-contract.md OPERATOR.md AGENT-SKILLS.md PRD/README.md
grep -rn "graph:prune --apply" PRD/ OPERATOR.md
npm run quality:check
```

## Files touched

- `PRD/instructions/graph-workflow-contract.md`
- `PRD/instructions/preparation-contract.md`
- `OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md`
- `.claude/skills/codehealth/SKILL.md` (attempt; `.agents/` mirror via sync)
- `PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md`
