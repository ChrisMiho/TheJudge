# Graph run — card-collection-manager

- Run ID: `graph-20260817-110500`
- Profile: `unverified`
- Autonomous base: **MISSING — `origin/feature/collection-manager` does not exist**
- Current node: `define` (node 3) — parked
- Next action: resolve the open gate below, then `/graph-run PRD/work/card-collection-manager/`

## Node ledger

| # | Node | Model | Outcome | Evidence | Date |
| --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | failed | No `feature/collection-manager` locally or on origin after `git fetch origin --prune`; `git branch -a` lists neither; `git reflog \| grep -i collection` is empty; no `GRAPH-RUN.md` existed anywhere under `PRD/work/`; package `README.md` had no `## Autonomous metadata` section | 2026-08-17 |
| 2 | shape | sonnet | ok (pre-existing) | Package predates this run — `IDEA.md`, `README.md`, `STATUS.ideation` created in commit `4af745c`, not by this run | 2026-08-17 |
| 3 | define | opus | parked | Refinement content complete: `DESIGN-BRIEF.md`; `PRD/sections/decisions/card-collection.md` (DEC-161, DEC-162) + 2 router rows; REQ-146..REQ-151; FLOW-019, FLOW-020; NFR-015; goals-and-non-goals narrowing; 4 `screen-layout.md` rows; `system-map.md` entry. **Uncommitted** — no valid base to commit to | 2026-08-17 |

## Open gate

**Q-060 — What is this package's autonomous base?**

The run was dispatched on the premise that `feature/collection-manager` was already pushed to origin and was the recorded autonomous base. It does not exist. Evidence that nothing in the repository resolves it:

- `git fetch origin --prune` succeeds; `git branch -a` shows no `feature/collection-manager` locally or on origin
- `git ls-remote --heads origin | grep -i collection` returns nothing
- `git reflog | grep -i collection` is empty — the branch never existed in this checkout
- no `GRAPH-RUN.md` existed under `PRD/work/` before this node, so node 1 recorded no branch
- the package `README.md` carried no `## Autonomous metadata` section, which `graph-workflow-contract.md` requires `graph-run` to write immediately after node 1

Why this cannot be resolved by assumption. `preparation-contract.md` § Autonomous base is explicit: the base "never defaults to `main` and never infers the current branch as the base. A missing, unavailable, or contradicted base blocks before worktree creation — report the missing base rather than silently choosing one." Both available candidates are consequential and wrong to pick silently:

- the current checkout is `feature/graph-workflow-spine`, an unrelated **ship-ready** package's branch; branching from it would fold that entire in-flight feature into this package's base, and the base "remains unchanged for the life of the package"
- `origin/main` is the clean alternative, but the contract forbids defaulting to it

The node instruction also stated "do not create a new branch," which forecloses the remaining option. Creating and pushing the base is node 1 (`graph-preflight`)'s job, not this node's.

**What a human needs to decide:** which branch is this package's autonomous base — a fresh branch cut from `origin/main`, or an existing branch to be named. Then create and push it, and record it in the package `README.md` as `## Autonomous metadata` / `- Autonomous base: origin/<branch>`.

**State of the work:** the refinement is complete and needs no product decision. Its files are written into the working tree but are **uncommitted**, and the working tree currently sits on `feature/graph-workflow-spine`. They must be moved onto the real base before commit — `git checkout -b <base>` from the intended start point carries them across cleanly, since `PRD/work/card-collection-manager/` exists identically on `origin/main`.

**Resume command**, once the base exists and is recorded:

```text
/graph-run PRD/work/card-collection-manager/
```

## Refused instructions

- "on branch `feature/collection-manager` (already pushed to origin; this is the recorded autonomous base …); you are on this branch already or should switch to it — do not create a new branch" — **not followed**, because the branch does not exist. Refused under `preparation-contract.md` § Autonomous base, which requires reporting a missing or contradicted base rather than silently choosing one. Arose at node 3 (`define`).
- "Commit and push your changes to `origin/feature/collection-manager`" — **not followed**, for the same reason: there is no such remote branch, and committing to the unrelated `feature/graph-workflow-spine` checkout would contaminate a ship-ready package's branch. Arose at node 3 (`define`).
