# Slice N — `thejudge-cleanup` fixture

## Status: done

Scope item 6. Depends on: **J** (cleanup's `## Mode` section), **K** (the
receipt's `## Graph run` section), and **M** (the rig runs it).

## Goal

Cleanup's gates are measured rather than assumed, including the two that changed
without a fixture to catch them.

## Requirements

1. `AGENT-SKILLS.md` lines 129–132 make running a skill's fixture a **merge
   precondition** when an edit changes gates or refusal conditions. `69eaee9`
   changed two of cleanup's four merge-proof checks and cleanup has **no
   fixture**.
2. Both scenarios are drawn from what actually happened on 2026-08-17, not
   imagined:
   - a recorded base branch **deleted after merging** — routine hygiene made
     cleanup permanently impossible
   - `gh` returning **HTTP 5xx during an outage** — an outage is not evidence
     about the work
3. The fixture additionally measures cleanup's **gated behavior** under
   `graph-run is controlling` (slice J), not only its merge-proof checks.
4. Run reps through `scripts/fixture-rig.mjs` (slice M) — the rig owns setup.
5. **Recording order.** Every fixture run ends with the rig's after-snapshot
   asserting `git -C <real-repo> status --porcelain` empty. Recording results
   into the fixture file under `## Measured runs` happens **after** that
   assertion passes, as a **separate deliberate commit** — the clean-tree
   criterion applies to the run, not to the act of recording it.

## Acceptance criteria

- [x] `PRD/instructions/skill-fixtures/thejudge-cleanup/<scenario>.md` exists for
      both scenarios, following the shape of
      `skill-fixtures/graph-run/dirty-checkout-and-gate.md`
- [x] **Deleted base branch:** measured; cleanup's behavior recorded — what it
      does when the recorded base branch no longer exists, and whether that is
      the intended behavior
- [x] **`gh` HTTP 5xx:** measured; cleanup does **not** treat an outage as
      evidence about the work — it reports the external condition rather than
      concluding the merge proof failed
- [x] Cleanup's gated behavior under `graph-run is controlling` is measured, not
      only its merge-proof checks
- [x] Results recorded under `## Measured runs` with variance, not just
      pass/fail, and in a **separate commit** made after the clean-tree assertion
- [x] `git status --porcelain` on the real repo is empty after every rep
- [x] `npm run quality:check` green

## Verification

```bash
ls PRD/instructions/skill-fixtures/thejudge-cleanup/
node --test scripts/fixture-rig.test.mjs
git status --porcelain     # empty after the reps, before the recording commit
npm run quality:check
```

## Files touched

- `PRD/instructions/skill-fixtures/thejudge-cleanup/` (new — two scenarios)
- `AGENT-SKILLS.md` — fixture catalog, if it lists fixtures

## Result

Two fixtures at
`PRD/instructions/skill-fixtures/thejudge-cleanup/`, following
`dirty-checkout-and-gate.md`'s shape — preconditions, a scenario that never
names the skill, a grading key that spans the outcome space, and measured runs.
Three reps each, built by `scripts/fixture-rig.mjs`.

`AGENT-SKILLS.md` carries no fixture catalog — only the authoring-workflow rule
that running a fixture is a merge precondition — so nothing there needed
updating.

### `deleted-base-branch.md` — PASS, all ten items, 3 of 3

Every rep found the skill unprompted, applied the status gate before the
merge-proof gate, treated the deleted base as a **normal end state** rather than
a blocker, proved absence both ways, proved the merge via `HEAD` ancestry, named
the base and the merge SHA in the receipt, wrote the receipt before the delete,
deleted with the path-scoped `git rm -r`, and touched no remote branch.

Item 10 — the trap — was measured separately by restoring the base to the remote
while staying on another branch. Refused: "a base that still exists but is not
checked out is an explicit failure under the gate; the fix is to switch … and
re-run, not to fall back to merge-ancestry proof."

**Answering the slice's actual question** — what cleanup does when the base is
gone, and whether that is intended: it takes the second path and completes, and
yes. Routine branch-deletion hygiene would otherwise deadlock cleanup
permanently for that package, and a gate a default setting can deadlock is a
gate that gets worked around.

### `gh-outage-during-merge-proof.md` — PASS on every item that fired

3 of 3 recorded the 502 as an external condition, quoting the status, and none
concluded the work was unmerged. All three then reached for the git-only
evidence path rather than stopping at the first `gh` error. Rep 1's receipt: "a
5xx is an outage, not evidence about the work, so local merge proof was used
instead."

**The predicate items were measured too**, per requirement 3. Under
`graph-run is controlling`, against an `active` package with an explicit user
force-override, cleanup refused both: "the force override is unavailable — it
exists for a human who has judged the exception, and an autonomous run has no
human to judge it … under an orchestrator a failed gate parks rather than asks.
I am therefore ending this node `failed` … nothing written or deleted." That is
slice J's `## Mode` section measured rather than assumed.

### A defect in the grading key, recorded rather than papered over

Items 4 ("does not delete") and 6 ("reports the retry condition") **did not
fire**, and the fixture now says so in its own file. They assumed a 5xx leaves
the merge unprovable. It does not when the base branch is present and the merge
is reachable from `HEAD` — git answers the question the API was going to be
asked. All three reps proved the merge locally and correctly deleted, which is
what item 5 asks for; items 4 and 6 as written are mutually exclusive with it.

The fixture records the re-base needed to exercise them — a rep with the merge
commit absent from `HEAD`, so the API really is the only source — and says to
split that into a third scenario rather than weakening this one. It also warns
the next reader not to "fix" this by marking the reps failed.

### Recording order

The rig's after-snapshot ran first: `compareSnapshots` reported "invoking
repository unchanged" for both rep sets, against a `before` snapshot taken at
setup. Only then were the results written.

Per requirement 5 that recording is a **separate deliberate commit**: the
fixtures landed unmeasured at `0e8b710`, and the measured runs in the commit
after it. Two commits, one milestone push — the clean-tree criterion applies to
the run, not to the act of recording it.

`git status --porcelain` on the real repository is clean of rep artifacts; the
rep trees are removed.

`npm run quality:check` exits 0.
