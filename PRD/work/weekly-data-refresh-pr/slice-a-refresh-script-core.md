# Slice A — Refresh-and-PR script core

## Status: done

## Goal

Build `scripts/refresh-and-open-pr.mjs` as an injectable-effects module: the
dirty-tree refusal, the branch cut off `origin/main`, the `data:refresh` →
`data:build` pipeline invocation, the explicit-path commit, the push, and the
`gh pr create` call — every git/gh/pipeline effect passed in as a function so
the whole thing is unit-testable with no real git remote, GitHub, or network
call.

## Requirements

1. Export a pure `parseDirtyTree(porcelainOutput)` (or equivalently named)
   function: non-empty `git status --porcelain` output means refuse; empty
   means proceed. Never invokes git itself — takes the string as input, same
   shape as `classifyInPlaceTree` in `scripts/graph-preflight.mjs`.
2. Export a function that plans the git branch-cut commands (fetch `origin`,
   create `chore/data-refresh-<YYYY-MM-DD>` off `origin/main`) as a list of
   argv arrays, given a date — never invokes git itself. Mirrors
   `planActions()` in `scripts/graph-preflight.mjs`.
3. Export a function that runs the pipeline (`npm run data:refresh` then
   `npm run data:build`, in that order) through an injectable runner
   (`runPipelineImpl` or equivalent, default wraps `execFileSync`/`spawnSync`),
   aborting immediately with the underlying error if either step exits
   non-zero — the second step never runs after the first fails.
4. Export a function that builds the explicit `git add` path list from the
   constant array documented in `GAMEPLAN.md`'s "Explicit committed-artifact
   path list" — hard-coded in the script, not derived by globbing or by
   parsing the `data:build` npm script string. `git add -A`, `git add --all`,
   and `git add .` never appear anywhere in the file (`grep -n` on the file
   after writing it).
5. Export a function that commits with a dated message (e.g.
   `chore: refresh data artifacts (<YYYY-MM-DD>)`), given the explicit path
   list and an injectable git-command runner.
6. Export a function that pushes the branch via `git push origin <branch>` —
   never a `--force`/`-f`/`--force-with-lease` flag anywhere in the file.
7. Export a function that opens the PR via an injectable `gh` runner —
   `gh pr create --base main --head <branch> ...` — and returns the PR URL
   from the runner's stdout.
8. When the injected `gh` runner throws (simulating `gh` unauthenticated or
   missing), the function propagates a clear error identifying the failure as
   the PR-creation step, distinct from a pipeline or git failure — it does not
   swallow the error or report success.
9. A thin `main()` wires the real `execFileSync`/`spawnSync` implementations
   into the exported functions and runs behind
   `import.meta.url === pathToFileURL(process.argv[1]).href` (same guard as
   `refresh-commander-spellbook-data.mjs`), so importing the module for tests
   never runs anything.

## Acceptance criteria

- [ ] A1: `parseDirtyTree("")` (or equivalent) returns "proceed"; a non-empty
      porcelain string returns "refuse" naming the reason
- [ ] A2: the branch-plan function returns commands that fetch `origin` before
      creating the branch, and the create command's start point is
      `origin/main`
- [ ] A3: the pipeline runner invokes `data:refresh` before `data:build`, and
      a thrown/non-zero first step means the second step's runner is never
      called (unit test asserts call count/order via an injected fake)
- [ ] A4: the explicit path list contains exactly the eleven paths listed in
      `GAMEPLAN.md` and no others; `grep -n -- '-A\|--all\|"\."'`-style search
      of the file for `git add -A` / `git add --all` / `git add .` finds none
- [ ] A5: the commit-message function's output contains the run date in
      `YYYY-MM-DD` form
- [ ] A6: `grep -n -- '--force\|-f \|force-with-lease' scripts/refresh-and-open-pr.mjs`
      finds no push using any force flag
- [ ] A7: the PR-open function returns the URL its injected `gh` runner's
      stdout provides
- [ ] A8: an injected `gh` runner that throws makes the PR-open function
      reject/throw with an error message identifying PR creation as the
      failed step, not swallow it into a false success
- [ ] A9: `node --test scripts/refresh-and-open-pr.test.mjs` passes, and the
      test file never calls `npm run data:refresh`, `npm run data:build`, or
      any live `git`/`gh` network operation

## Verification

```bash
node --test scripts/refresh-and-open-pr.test.mjs
grep -n -- '-A\|--all' scripts/refresh-and-open-pr.mjs
grep -n -- 'force' scripts/refresh-and-open-pr.mjs
```

## Files touched

- `scripts/refresh-and-open-pr.mjs`
- `scripts/refresh-and-open-pr.test.mjs`
