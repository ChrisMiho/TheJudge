# Slice B — Change-detection and no-op path

## Status: done

## Goal

Wire the no-op path into `scripts/refresh-and-open-pr.mjs`: when the pipeline
ran but none of the explicit committed artifacts changed, the script exits
cleanly with no branch left behind, no commit, no push, and no PR — a weekly
run with nothing new never opens an empty pull request. Also cover graceful
degradation: a pipeline failure never reaches the commit/push/PR steps.

## Requirements

1. Export a function that classifies "changed" vs "no-op" from a git diff/
   status of the explicit path list (e.g. `git diff --name-only` restricted to
   those eleven paths) — pure, takes the diff output as input.
2. Wire `main()`'s control flow: dirty-tree refusal → branch cut → pipeline →
   change classification → **no-op**: delete the local branch, print a
   "no changes; nothing to refresh" message, exit 0, no `git add`/commit/push/
   `gh pr create` call happens (unit-testable by asserting the injected
   commit/push/PR functions are never invoked on this path).
3. Wire the **changed** path: proceeds to Slice A's commit/push/PR steps
   unchanged.
4. A pipeline step (`data:refresh` or `data:build`) that throws stops before
   any git mutation beyond the already-cut local branch — no `git add`,
   commit, push, or PR call happens, and the local branch is left in place
   (not deleted) so the partial state is inspectable, matching the "keep
   partial state" pattern in `refresh-commander-spellbook-data.mjs`'s
   `main().catch()`. The script exits non-zero and the error surfaces.
5. `main()`'s exit codes: `0` for both a successful PR-opening run and a clean
   no-op; non-zero for a dirty-tree refusal or a pipeline/git/gh failure.

## Acceptance criteria

- [ ] B1: a change-classification test where the diff over the explicit path
      list is empty returns "no-op"; a non-empty diff over those paths returns
      "changed"
- [ ] B2: on the no-op path, the injected commit/push/PR-open functions are
      never called (assert call counts are zero) and the injected
      branch-delete function is called
- [ ] B3: on the changed path, the injected commit/push/PR-open functions are
      each called exactly once, in that order
- [ ] B4: a pipeline failure (injected `data:build` runner throws) means the
      injected commit/push/PR-open functions are never called, and the
      branch-delete function is also never called (partial state preserved)
- [ ] B5: `node --test scripts/refresh-and-open-pr.test.mjs` passes, covering
      B1–B4, and never invokes a real refresh/build/git-network operation

## Verification

```bash
node --test scripts/refresh-and-open-pr.test.mjs
```

## Files touched

- `scripts/refresh-and-open-pr.mjs`
- `scripts/refresh-and-open-pr.test.mjs`
