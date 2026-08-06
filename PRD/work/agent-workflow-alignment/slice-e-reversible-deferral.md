# Slice E — Reversible deferral

## Status: done

## Goal

Add `thejudge-defer` as a reversible lifecycle toggle, fix the missing
`deferred` row in the status vocabulary table, and republish the skill
catalog at its final ten-skill state.

## Requirements

### New skill

1. Create `.cursor/skills/thejudge-defer/SKILL.md` (no `reference.md`
   needed — the contract is short enough for one file, matching
   `thejudge-quality-check` and `thejudge-cleanup`):
   - Frontmatter `name: thejudge-defer`, `description` covering: use to park
     a package that is not next work, or to restore a previously deferred
     package; reversible; preserves all artifacts/Git state; refuses
     `ship-ready` packages and `active` packages with an `in-progress` slice.
   - **Goal**: toggle a package between its current status and `deferred`
     without losing any artifact, worktree, branch, or PR.
   - **Inputs**: work slug. Optional short reason (required on the deferring
     invocation if not already supplied in the same message — ask once if
     missing rather than writing an empty reason).
   - **Reads**: `PRD/work/<slug>/README.md`, `PRD/work/<slug>/STATUS.*`
     marker, `PRD/work/STATUS.md`, `PRD/instructions/workflow-reference.md`.
   - **Writes / toggle behavior**:
     - Deferring (package is not currently `deferred`): refuse if
       `status: ship-ready`. Refuse if `status: active` and any slice doc's
       status line is `in-progress` (report which slice). Otherwise, add a
       `## Deferral record` section to `README.md`:
       ```markdown
       ## Deferral record

       - Previous status: <status>
       - Reason: <short reason>
       ```
       Change the `status:` field to `deferred`, replace the marker with
       `STATUS.deferred`, and move the board row to `## deferred` in
       `PRD/work/STATUS.md`.
     - Restoring (package is currently `deferred`): read `## Deferral
       record`'s "Previous status", set `status:` back to that value, replace
       the marker with `STATUS.<previous status>`, move the board row back to
       that section, and remove the `## Deferral record` section entirely.
   - **Gates**: never touch `GAMEPLAN.md`, slice docs (beyond what the status
     duty table already allows other skills), worktrees, branches, or PRs —
     deferral is a status-and-board operation only. Never defer a package
     with no `README.md`/marker (report it as not a valid package instead).
   - **Next step**: deferred → no required handoff (parked); restored →
     name the typical next skill for the restored status per
     `workflow-reference.md`'s vocabulary table (e.g. restored to `active` →
     `thejudge-implement`).

### Status vocabulary fix

2. `PRD/instructions/workflow-reference.md` "Work package status vocabulary"
   table currently omits a `deferred` row even though `STATUS.deferred` is
   already an allowed marker name. Add:
   ```markdown
   | `deferred` | Parked; not next work | `thejudge-defer` (to restore) |
   ```
3. Same file, "Skill status duties" table: add a row —
   `| \`thejudge-defer\` | Toggle current status ⇄ \`deferred\`, recording/restoring prior status and reason |`.
4. Same file's intro line ("All 11 `thejudge-*` skills...", already changed
   to 9 in Slice A): update the count to 10, the final target.

### Catalog republication (final state)

5. `AGENT-SKILLS.md`: add a `thejudge-defer` row to the skill catalog table
   (When: package should be parked or restored; Writes: README deferral
   record, marker, board row; Status: toggles current ⇄ `deferred`; Next:
   none when deferring, typical next skill for the restored status when
   restoring). Update the intro paragraph's skill count to 10. No mermaid
   diagram change is required — deferral is a side-channel toggle, not a
   forward workflow edge — but add one sentence under the diagram noting
   `thejudge-defer` can move any non-`ship-ready` package to `deferred` and
   back, orthogonal to the pipeline shown.
6. `PRD/work/STATUS.md` header comment references
   `PRD/instructions/workflow-reference.md` for vocabulary — no change
   needed there; confirm the existing `## deferred` section heading already
   matches (it does — `commander-spellbook-combos` is already listed there).
7. Run `npm run skills:ai-sync` and verify byte-identical trees.

## Acceptance criteria

- [ ] `.cursor/skills/thejudge-defer/SKILL.md` exists, is synced to
      `.agents/skills/` and `.claude/skills/`, and defines both toggle
      directions plus both refusal conditions
- [ ] `workflow-reference.md` has a `deferred` row in the status table and a
      `thejudge-defer` row in the skill status duties table
- [ ] `AGENT-SKILLS.md` lists 10 skills including `thejudge-defer`
- [ ] `grep -rn "map-out-parallel\|implement-parallel"` across the repo
      (excluding the durable historical receipt) still returns nothing
- [ ] `npm run skills:ai-sync` run; all three skill trees byte-identical

## Verification

```bash
test -f .cursor/skills/thejudge-defer/SKILL.md
grep -n "deferred" PRD/instructions/workflow-reference.md
grep -n "thejudge-defer" AGENT-SKILLS.md
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `.cursor/skills/thejudge-defer/SKILL.md` (new)
- `.agents/skills/thejudge-defer/SKILL.md`, `.claude/skills/thejudge-defer/SKILL.md` (new, synced)
- `PRD/instructions/workflow-reference.md`
- `AGENT-SKILLS.md`
