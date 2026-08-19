# Slice N — `thejudge-cleanup` fixture

## Status: in-progress

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

- [ ] `PRD/instructions/skill-fixtures/thejudge-cleanup/<scenario>.md` exists for
      both scenarios, following the shape of
      `skill-fixtures/graph-run/dirty-checkout-and-gate.md`
- [ ] **Deleted base branch:** measured; cleanup's behavior recorded — what it
      does when the recorded base branch no longer exists, and whether that is
      the intended behavior
- [ ] **`gh` HTTP 5xx:** measured; cleanup does **not** treat an outage as
      evidence about the work — it reports the external condition rather than
      concluding the merge proof failed
- [ ] Cleanup's gated behavior under `graph-run is controlling` is measured, not
      only its merge-proof checks
- [ ] Results recorded under `## Measured runs` with variance, not just
      pass/fail, and in a **separate commit** made after the clean-tree assertion
- [ ] `git status --porcelain` on the real repo is empty after every rep
- [ ] `npm run quality:check` green

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
