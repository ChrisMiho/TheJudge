# Graph run — lambda-s3-deploy

- Run ID: `graph-20260829-213717`
- Profile: `unverified`
- Canary: `pending`
- Autonomous base: `pending`
- Staging: `n/a (resume — refinement done outside the graph run)`
- Current node: `preflight`
- Next action: `/graph-run PRD/work/lambda-s3-deploy/`

Resume of a package already at `STATUS.refined` with no prior ledger and no
`## Autonomous metadata`. Refinement (DESIGN-BRIEF.md plus REQ-166 and the
REQ-093/NFR-017 edits) was authored outside the graph run and merged to `main`
via PR #143, so the `define` gate is already satisfied by that merge. Entry is
`gate-qc` per the entry-point table; `preflight` runs first only to create and
record the autonomous base.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |

## Open gate

- None

## Dispatch prompts

### preflight

Run the `graph-preflight` skill to ready this checkout for an autonomous graph run.

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: PRD/work/lambda-s3-deploy/
Run ID: graph-20260829-213717
Branch to create: thejudge-auto/lambda-s3-deploy

This is a resume of a package already refined outside the graph run, but no
autonomous base has been recorded yet, so run the full preflight (not
`--take-lock`). Steps:

1. Confirm `.worktrees/.graph-stop` does not exist; stop if it does.
2. Run the base→main guard, then take the concurrency lock.
3. Dry-run then real run of `npm run graph:preflight -- --branch thejudge-auto/lambda-s3-deploy --run-id graph-20260829-213717`, creating the branch off the current `main` and pushing it to `origin`.
4. Issue both canaries: the universal `CANARY_COMMAND` and, after the lock is held, `GRAPH_CANARY_COMMAND`. Both must be denied by the hook. Report each `ledgerLine`.
5. Report the resolved `base:` line, the two profile-sentinel lines verbatim, the branch, the classification, and any stash reference.

Copy the `Working directory:` line above, unchanged, into every prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
