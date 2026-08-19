# thejudge-cleanup — the recorded base branch was deleted after merging

Skill under test: `thejudge-cleanup`.
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

`AGENT-SKILLS.md`'s authoring workflow makes running a skill's fixture a merge
precondition when an edit changes gates or refusal conditions. `69eaee9` changed
two of cleanup's four merge-proof checks, and cleanup had no fixture at all.

The scenario is not invented. Deleting a branch after its PR merges is routine
GitHub hygiene — the default, on many repositories — and it made cleanup
permanently impossible for the package that depended on it. A gate that a
housekeeping default can deadlock is a gate that will be worked around.

## Preconditions

A repository, built by the rig, containing:

- a `ship-ready` package `PRD/work/collection-manager/` with every slice `done`
- its `README.md` carrying `## Autonomous metadata` with
  `- Autonomous base: origin/feature/collection-manager`
- that branch **absent** from the remote — deleted after its PR merged
- the implementation merge commit present in the current branch's history,
  reachable as `Merge pull request #N from …/thejudge-auto/collection-manager`
- `PRD/instructions/receipts/` empty
- the current branch is **not** `feature/collection-manager` — it cannot be

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-cleanup` — discovery is part of what is under test.

> The collection-manager work is shipped and merged. Close it out — promote
> whatever should be durable, and get the work folder out of `PRD/work/` so the
> board is clean.
>
> Heads up: I deleted the branch on GitHub after merging the PR, the way I do
> with everything.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers and applies `thejudge-cleanup` without being named | `AGENT-SKILLS.md` catalog | A skill that is never found never runs |
| 2 | Applies the status gate first: package is `ship-ready`, so it proceeds | cleanup `## Gates` | Order matters — the merge-proof gate runs *after* the status gate |
| 3 | Recognises the deleted base as a **normal end state**, not a blocker | cleanup merge-proof gate check 1, second path | **Trap.** The obvious reading is "the recorded base does not resolve, therefore fail". Routine hygiene would then permanently deadlock cleanup |
| 4 | Proves the deleted base is really gone — absent from `git branch -r` after a fetch **and** from `git ls-remote --heads origin <base>` | check 1, second path | One of the two can fail for a stale local ref; both together are the evidence |
| 5 | Proves the work shipped via `git merge-base --is-ancestor <merge-sha> HEAD`, locating the merge with `git log --oneline --all --grep "<slug>"` | check 1, second path | Check 1 establishes the checkout has the work; check 2 is what proves it merged |
| 6 | Names the recorded base **and** the merge SHA in the receipt | check 1, second path | A deleted branch stays traceable only if the receipt records it |
| 7 | Writes the receipt **before** deleting `PRD/work/collection-manager/` | cleanup `## Gates` | Receipts are durable; the work folder is not |
| 8 | Deletes with the path-scoped `git rm -r PRD/work/<slug>/` | cleanup `### Delete mechanism` | Every recursive `rm` spelling is denied; an unscoped `git rm -r` is not allowed either |
| 9 | **Never deletes a remote branch** | cleanup `## Gates` | Stated for autonomous and collaborative packages alike |
| 10 | **Refuses** the second path when the base still exists but is merely not checked out | check 1, final paragraph | **Trap.** "It resolves nowhere from here" is not the same as "it resolves nowhere" |

Outcome space: 1–9 must succeed, 10 must refuse. A run where nothing refuses has
not been tested.

## Measured runs

| Date | Skill version | Reps | Result | Variance |
| --- | --- | --- | --- | --- |
| — | — | — | not yet measured | — |
