# Slice A — Scripts: prune keep rule, write scope, digest

## Status: done

Verified 2026-09-06: `npm run test:scripts` 464/464; `npm run quality:check`
exit 0; `grep` for `KEEP_PACKAGE_ON_MAIN|packageSlug|parsePackagesOnMain|ls-tree`
in `scripts/graph-prune.mjs` empty; `npm run graph:digest` prints
`## PRs waiting on you` and the two-root empty message.

## Goal

The three scripts the design touches say what the contract now says: prune
deletes any merged `thejudge-auto/*` branch, the node 6 write scope is the build
worktree alone, and the digest sees ledgers inside worktrees.

## Requirements

1. `scripts/graph-prune.mjs`: remove `KEEP_PACKAGE_ON_MAIN`, `packageSlug`,
   `parsePackagesOnMain`, the `packagesOnMain` input, and the `git ls-tree`
   call; `classifyBranch` deletes any branch merged into `origin/main` with the
   reason `merged into origin/main` and keeps an unmerged one (D6, REQ-192).
2. `scripts/graph-prune.test.mjs`: drop the tests and inputs D6 enumerates; add
   one asserting a merged docs branch whose package is still on `main` is
   deletable; rework the `formatReport` test's keep line and counts.
3. `scripts/graph-ledger-check.mjs`: `buildWriteScope(slug)` returns
   `[".worktrees/implement-<slug>/"]`; `classifyBuildWrites` evidence text
   follows; tests updated (D1, REQ-193).
4. `scripts/graph-digest.mjs`: scan `.worktrees/*/PRD/work/*/GRAPH-RUN.md` as
   well as `PRD/work/*/GRAPH-RUN.md`, preferring the worktree copy per slug;
   heading `## PRs waiting on you`; header comment, the line-101 message (both
   roots), test names, and the identifiers `OPEN_GRAPH_PRS_COMMAND` /
   `pendingGraphPRs` (D7). Tests updated.
5. `scripts/lib/boundary-rules.mjs` comment "node 8 is a human PR merge" →
   node 9; `boundary-rules.test.mjs` message likewise. `NODE_CALL_CAPS`
   unchanged.

## Acceptance criteria

- [x] A1 `npm run test:scripts` passes with the new prune, ledger-check, and digest tests
- [x] A2 `scripts/graph-prune.mjs` contains no `KEEP_PACKAGE_ON_MAIN`, `packageSlug`, `parsePackagesOnMain`, or `ls-tree`
- [x] A3 `buildWriteScope("demo")` deep-equals `[".worktrees/implement-demo/"]` (asserted in `graph-ledger-check.test.mjs`)
- [x] A4 `scripts/graph-digest.mjs` lists a ledger found under `.worktrees/<dir>/PRD/work/<slug>/GRAPH-RUN.md` (asserted in `graph-digest.test.mjs`) and prints `## PRs waiting on you`
- [x] A5 `npm run quality:check` exit 0

## Verification

```bash
npm run test:scripts
npm run quality:check
grep -n "KEEP_PACKAGE_ON_MAIN\|packageSlug\|parsePackagesOnMain\|ls-tree" scripts/graph-prune.mjs   # expect no output
```

## Files touched

- `scripts/graph-prune.mjs`, `scripts/graph-prune.test.mjs`
- `scripts/graph-ledger-check.mjs`, `scripts/graph-ledger-check.test.mjs`
- `scripts/graph-digest.mjs`, `scripts/graph-digest.test.mjs`
- `scripts/lib/boundary-rules.mjs`, `scripts/lib/boundary-rules.test.mjs`
