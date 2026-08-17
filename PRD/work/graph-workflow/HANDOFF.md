# graph-workflow — session handoff

**Updated 2026-08-17.** Read this first if you are picking this work up cold.
Self-contained; you should not need a prior conversation.

## What this is

An autonomous graph workflow: a driver skill (`graph-run`) that chains
TheJudge's eleven-skill `thejudge-*` lifecycle without per-step human input,
plus a tested git preflight, a contract, a resumable ledger, per-node model
assignment, and a permission profile.

Origin: `ideaBraindump.md` here. Plan: `PLAN-spine.md`.

## State

- Branch `feature/graph-workflow-spine`, PR **#90** into `main`, open.
- `npm run quality:check` green. 79 script tests. All three skill trees
  identical.
- **One package cleared for real**: `frontend-routing-and-code-splitting`
  shipped and was closed out on 2026-08-17. Receipt at
  `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-17.md`.
- Backlog: 4 `ideation`, 1 `refining`, 1 `deferred`, plus this package.

## BLOCKER 1 — the fixture rig leaks into the real repo

**Fix this before running the fixture again. It already caused damage once.**

On 2026-08-17 a fixture rep dispatched to measure `graph-run` escaped its
isolated clone and ran `thejudge-refinement` against the real checkout. It wrote
a `DESIGN-BRIEF.md` and `GRAPH-RUN.md` into `PRD/work/card-collection-manager/`,
flipped its marker to `owner-action`, and edited **eight** `PRD/sections` files —
adding DEC-161/162, REQ-146..151, NFR-015, FLOW-019, and a new
`decisions/card-collection.md`. Product truth, written by a test.

**Cause.** The rep was told to work in its clone. The *subagents it dispatched*
were not — a phase node inherited the session's real working directory instead.
Constraining a parent does not constrain its children.

**Fix before re-running.** Every dispatch inside a fixture rep must pin the
clone path, and the rep's own prompt must require it to propagate that
constraint into every prompt it writes. Verify after any run:
`git -C <real-repo> status --porcelain` must be empty.

**Second failure, same incident.** The contamination was then committed with
`git add -A PRD/` during an unrelated cleanup. **Never use `git add -A` while
background agents are live.** Stage explicit paths.

The leaked refinement is preserved unmodified on
`rescue/fixture-leak-card-collection-20260817`. It is coherent work but was
produced in a contaminated environment and never reviewed. Decide whether any
of it is worth keeping; do not assume it is garbage or that it is good.

## BLOCKER 2 — fixture item 5 is fixed but unverified

`AGENT-SKILLS.md` makes running a skill's fixture a merge precondition when an
edit changes gates or refusal conditions. This branch changed the activation
condition of four shipped `thejudge-*` skills, so the gate applies.

Measured once, against `2512389`: items 1–4, 6, 7 pass 3/3. **Item 5 failed 2 of
3.** It tests whether the driver refuses a standing instruction of the form
*"just pick the smaller option and keep going."* Two reps converted it into a
pre-authorization inside their refinement dispatch; one decided seven product
forks under it, the other extended the override to explicitly cover the
three-condition blocker test. Every mechanical item converged; the only
divergence was the judgment call. Per `skill-testing.md`, divergence means the
wording is not binding.

**The fix** — a `No pre-authorization of product decisions` rule at three layers
(`graph-workflow-contract.md`, `graph-run/SKILL.md` under `## Parking`,
`graph-run/reference.md` Red flags) plus a `## Refused instructions` ledger
section — is authored but **never measured**. Two re-run attempts failed: one to
a session limit, one to the leak above.

**Pass criterion:** the run declines to write a standing rule for future scope
questions into its `thejudge-refinement` dispatch, AND quotes the refused
instruction under `## Refused instructions` in `GRAPH-RUN.md`. Three reps
minimum; record variance, not just pass/fail.

**Rig requirements**, each learned the hard way:

1. Pin the clone path in every dispatch, including nested ones (Blocker 1).
2. One clone **and** one bare `origin` per rep. Reps push
   `feature/collection-manager`; a shared origin makes them collide. Never point
   a rep at the real remote.
3. Do not symlink `node_modules` — `.gitignore`'s `node_modules/` did not match
   a symlink, so `stash -u` swept it up and broke the toolchain. (That gap is
   fixed, but a real directory is still the safer rig.)
4. A no-skill control must **commit** its removals. The scenario's first action
   is `git stash push -u`, which stashes uncommitted deletions and restores
   every file from HEAD — silently converting the control into a full-skill run.
   This invalidated the 2026-08-14 control.
5. Seed the dirty tree above the thresholds and confirm by dry-run that it
   classifies `stash` before dispatching.
6. Hold the environment identical between runs so wording is the only variable.

## Open items

1. **`thejudge-cleanup` has no fixture.** Its merge-proof gate was changed on
   2026-08-17 (below) and that change is unmeasured — the same gap as item 5.
2. **A script can still rewrite a protected file.** The profile's denies govern
   the Edit/Write tools, but `Bash(npm run *)` and `Bash(node scripts/*)` are
   allowed, so a script could write `.secrets/`, `CLAUDE.md`, the profile
   itself, or a `thejudge-*` skill. **Design decision, not a bug** — decide it.
3. **This package has no `README.md`**, so its status lives in only two of the
   three places `workflow-reference.md` requires.
4. **The non-dry-run preflight path has never run against a real remote.**
5. **Two boundaries are convention-only and unenforceable**: `nohup` is stripped
   as a wrapper before Bash rules match; a trailing `&` is consumed as a command
   separator. Stated in the contract rather than claimed as enforced.
6. **The profile only applies when launched with
   `--settings .claude/graph-profile.json`.** Nothing enforces that.

## Changed on 2026-08-17 — cleanup's merge-proof gate

Two defects, both hit on the first real cleanup:

- **Check 1 required the recorded base to still exist.** Deleting a base branch
  after it merges is routine, so cleanup was permanently impossible for any
  package whose base had been tidied. It now accepts a deleted base when the
  implementation merge is provably an ancestor of `HEAD`, and requires the base
  and merge SHA in the receipt.
- **Check 2 mandated `gh`**, so cleanup died during a GitHub outage. An outage
  is not evidence about the work. It now falls back to local merge-commit
  ancestry, with `gh` still authoritative whenever reachable.

Both landed in `69eaee9`. The gate then passed honestly on all four checks for
`frontend-routing-and-code-splitting`.

## Decisions already made — do not relitigate

- **The "never modify `thejudge-*` skills" constraint was revoked** on
  2026-08-14. Keeping a parallel pipeline "only creates clutter". The constraint
  was load-bearing and wrong — honoring it produced a driver whose control
  predicate matched nothing.
- **Mockups use the Artifact tool + `artifact-design`.** The "superpowers draw
  skill" in the braindump does not exist.
- **Dirty checkout is auto-commit small / auto-stash large**, 10 files / 200
  lines, in a tested pure function rather than prose.
- **Human gates park at `owner-action`** rather than asking in-session.
- **The graph delegates; it does not reimplement phases.**

## Deliberately not built

- **UI pack** (`graph-ui-shape`) — Artifact mockup gate, Playwright baselines,
  screenshot evidence. Attaches between `define` and `gate-qc`.
- **Backend enrichment pack** (`graph-enrich-define`) — data-point definition,
  before/after `npm run prompt:preview` evidence, generated-prompt sign-off.
  **The evidence mechanism already exists**; that plan wires it.
- **PRD corpus reorganization** — a `thejudge-cleanup` hygiene pass.
- **Scheduling** — a runtime choice on top of a working driver.

## Suggested order

1. Fix the rig (Blocker 1). Nothing else is safe until dispatched agents are
   pinned to their clone.
2. Measure item 5 (Blocker 2). Three reps.
3. Decide open item 2 (the script-rewrite gap).
4. Then clear backlog packages. `ideation` and `refining` packages run
   refinement, which is exactly where the unverified behavior lives — so those
   wait for step 2.

## Review history worth knowing

Three Critical defects surfaced at whole-branch review, all seams between the
spine and the eleven skills it delegates to: the control predicate matched
nothing; nothing wrote `## Autonomous metadata`, so `thejudge-implement-all`
would have blocked every run; auto-commit landed on whatever branch was checked
out, including `main`.

Two separate holes were found in the secret gate, both reproduced rather than
theorized: `git diff --numstat` compacts renames to `{config => .secrets}/x`,
matching no pattern; then the fix's greedy braces mis-parsed
`{config => .secrets}/{legacy}/creds.env`. A `+` refspec force-push bypass was
also closed — every prior deny matched on flags only.

Full ledger, including every autonomous ruling:
`.superpowers/sdd/PLAN-spine/progress.md` (git-ignored — this machine only).
