---
name: graph-preflight
description: >-
  Use before an autonomous graph run to guarantee a clean, freshly branched
  local checkout — resolving uncommitted work by auto-commit or stash and
  publishing the branch that worktrees and pull requests will target.
---

# Graph Preflight

## Goal

Leave the repository in exactly one state: a freshly created local branch,
pushed to `origin`, with no uncommitted work — and a recorded account of what
happened to anything that was uncommitted.

Read `PRD/instructions/graph-workflow-contract.md` before acting.

## Inputs

- `--branch <name>` (required). Never infer it, never reuse the current branch,
  never default to `main`.
- `--base <ref>` (optional; defaults to the current branch). The new branch
  becomes the autonomous base every later PR targets, so report the resolved
  `base:` line the script prints, not the flag you passed.
- `--run-id <id>` (optional; defaults to `graph-<YYYYMMDD>-<HHMMSS>` in UTC,
  which is unique per run so two same-day runs cannot share a stash message).
  Choose one id and pass that same `--run-id` to both the dry run and the real
  run — the default is timestamped to the second, so omitting it gives the two
  invocations different ids.

## Procedure

1. Run `npm run graph:preflight -- --branch <name> --run-id <id> --dry-run`
   first. Report the classification, the resolved base, the planned commands,
   and the two `profile sentinel:` / `Profile:` lines the script prints first —
   they are what `graph-run` records in the ledger, and they are an observation,
   never a restatement of what the user said at launch.
2. If the action is `blocked`, stop. Report the offending paths. Never
   hand-resolve a secret-bearing path to get past this.
3. Otherwise re-run the identical command without `--dry-run`, passing the same
   explicit `--run-id`. With `--run-id` omitted the two invocations generate
   different timestamped ids, so the stash name previewed in step 1 is not the
   one that lands — and the handoff record would name a stash that does not
   exist.
4. Confirm the end state with `git status --porcelain` (empty) and
   `git branch --show-current` (the requested branch).
5. When the action was `stash`, record the stash reference and the exact
   restore commands from the contract's "Stashed work handoff" section.

## When the real run fails

The script does not roll back, so a non-zero exit leaves the checkout exactly
where it stopped. Do not retry it and do not improvise a repair.

- Exit code 2 with a branch-name collision comes from the check that runs after
  `git fetch origin` and before any mutation: nothing changed. Pick a different
  `--branch` and start over.
- Exit code 1 during execution prints which commands ran, which did not, and —
  when a stash was taken — the `git stash list | grep graph-preflight/<run-id>`
  and `git stash apply <ref>` recovery lines. Relay that report verbatim,
  including those recovery lines, and stop.

Never drop, pop, re-stash, `git reset`, or force-push to tidy a failed run. An
interrupted resolution is a gate for the user, not a state to clean up.

## Profile sentinel

`.claude/graph-profile.json` carries `"env": { "THEJUDGE_GRAPH_PROFILE": "1" }`,
so the variable exists only in a session actually launched with
`claude --settings .claude/graph-profile.json`. The script reads it and prints
either `Profile: loaded (env sentinel)` or `Profile: unverified`. Report that
line verbatim.

It proves the **file was loaded**. It does not prove any individual deny rule
fired, and it cannot: `nohup` is stripped before rules match and a trailing `&`
is consumed as a separator, so neither is expressible as a rule at all. A run
cannot forge the sentinel — the profile denies edits to itself — but never
report it as proof that a boundary was enforced.

## Boundaries

The classification thresholds live in `scripts/graph-preflight.mjs` and are
covered by `scripts/graph-preflight.test.mjs`. Do not reimplement the
commit-versus-stash decision in prose, override it by judgment, or pass
`--max-files`/`--max-lines` to force a different branch of the logic.

Never drop, pop, or clear a stash. Never force-push.

## Next step

Report the branch, the classification, and the stash reference if one exists,
then continue the run:

`/graph-run PRD/work/<slug>/`

(`$graph-*` in Codex.)
