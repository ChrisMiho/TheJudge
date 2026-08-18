# Slice L — `define` parks on any `PRD/sections/` diff; `graph-gate-review`

## Status: planned

Scope items 12 **and** 13 — they ship together. A park with no way through it is
worse than no park. Depends on: **B** (the sync mirrors a new skill), **I** (the
lock releases on the new park), **K** (cleanup preserves the ledger).

## Goal

No code exists against product truth nobody has read, and resolving the gate is
one command rather than hand-editing a marker and a board row.

## Requirements — part 1, the gate (item 12)

1. The run writes durable product truth — `DEC-###`, `REQ-###`, `FLOW-###` — and
   `reference.md:77-85` commits it to the base branch before `build`. Node 8
   (`land`) is the first human touch, by which point code exists against
   unreviewed product truth. That is exactly the class of damage the 2026-08-17
   leak did.
2. After the `define` node returns `ok`, the driver diffs `PRD/sections/`. If the
   diff is non-empty it parks — **the existing park mechanism, no new
   machinery**: `STATUS.owner-action`, board row moved, `## Open gate` carrying
   the **complete diff** (not a summary) plus the list of new stable IDs and the
   resume command, then stop.
3. An empty diff advances straight to `gate-qc`. Refinement that only writes
   `DESIGN-BRIEF.md` never interrupts a run.
4. **The whole diff, not just new `DEC-###`.** The leak wrote DEC-161/162 *and*
   REQ-146..151, NFR-015, FLOW-019 — six requirements and a flow are product
   behavior as surely as two decisions are.
5. This is the one place autonomy is deliberately traded for control. Everything
   below the product layer — branching, stashing, slicing, commits, PR plumbing —
   stays unattended.

## Requirements — part 2, `graph-gate-review` (item 13)

6. A third graph skill, the owner-facing half of the gate:
   1. Reads `GRAPH-RUN.md`'s `## Open gate` and the recorded `PRD/sections/` diff.
   2. Walks the pending changes **one stable ID at a time** — the DEC or REQ
      restated in plain product terms first, then the diff — taking a verdict per
      item: `accept`, `edit` (the owner's correction applied to `PRD/sections/`),
      or `reject` (reverted, with the reason recorded).
   3. Writes every verdict into `GRAPH-RUN.md` under `## Gate verdicts`, quoting
      the reason for each `edit` and `reject`.
   4. Marks the gate resolved and restores the `STATUS.*` marker the node table
      expects at that lifecycle position — `refined` after a `define` gate — and
      moves the board row. **This is what makes it a loop rather than a dead
      end**, and it lands in the contract's existing seam: `reference.md:60`
      already says a package at `STATUS.owner-action` parks again *unless the
      recorded `## Open gate` is resolved*. No new resume path is invented.
   5. Ends with the exact resume command: `/graph-run PRD/work/<slug>/`.
7. Boundaries, so the reviewer cannot become a second author:
   - It never advances a node, never dispatches, never writes `DESIGN-BRIEF.md`,
     `GAMEPLAN.md`, or slice docs. It edits `PRD/sections/` only to apply an
     owner verdict, and only within the recorded diff.
   - A `reject` reverts the ID from `PRD/sections/` but leaves the stable number
     **burned** — never renumbered, per the refinement gate.
   - It refuses a package whose `## Open gate` is any gate it does not understand.
     A fourth `gate-qc` FAIL or a Critical review finding is not a diff to walk.

## Requirements — part 3, the five stale count-bearing lines

8. A third graph skill goes stale in **five** places, not two — both
   count-bearing files carry the number twice:

   | File | Line | Currently says | Becomes |
   | --- | --- | --- | --- |
   | `PRD/instructions/graph-workflow-contract.md` | 20 | "Exactly two graph skills exist in the spine" | three, naming `graph-gate-review` |
   | `AGENT-SKILLS.md` | 6 | "All **13** are model-invocable" | 14 |
   | `AGENT-SKILLS.md` | 97-98 | graph-skill table, one row per skill | a third row — when to use, what it writes, what it delegates to |
   | `PRD/instructions/workflow-reference.md` | 6-7 | "both `graph-*` skills — `graph-preflight` and `graph-run`" | all three, named |
   | `PRD/instructions/workflow-reference.md` | 8 | "the full **13-skill** catalog" | 14 |

9. `PRD/README.md:121` also changes — it is the owner-facing entry point and the
   gate is owner-facing:

   ```
   - Autonomous graph runs: `/graph-preflight` then `/graph-run PRD/work/<slug>/`;
     on a park, `/graph-gate-review PRD/work/<slug>/` walks the recorded diff and
     resumes the run.
   ```

10. **Already landed — do not look for it.** DEC-163's catalog count was updated
    during refinement: `PRD/sections/decisions/doc-process.md:167` already reads
    "the skill catalog becomes fourteen" and already names `graph-gate-review`.
    An implementer searching that file for "thirteen" will find nothing and
    should not conclude the edit is missing.
11. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] A `define` node that writes nothing to `PRD/sections/` advances to
      `gate-qc` **without parking**
- [ ] A `define` node that writes a single REQ row parks with that row's
      **complete diff** under `## Open gate`, plus the new stable IDs and the
      resume command
- [ ] The park uses the existing mechanism: `STATUS.owner-action` marker, board
      row moved in `PRD/work/STATUS.md`, README `status:` updated — no new
      machinery
- [ ] `graph-gate-review` run against a parked package leaves `STATUS.refined`, a
      resolved `## Open gate`, a `## Gate verdicts` section with **one row per
      stable ID**, and a `/graph-run` that resumes at `gate-qc` rather than
      parking again — the full loop observed end to end
- [ ] A `reject` verdict removes the ID from `PRD/sections/` **and** the number is
      not reused: confirm the next refinement allocates the following number
- [ ] `graph-gate-review` **refuses** a package whose `## Open gate` is a
      `gate-qc` FAIL or a Critical review finding, naming why
- [ ] `graph-gate-review` writes none of `DESIGN-BRIEF.md`, `GAMEPLAN.md`, or
      slice docs — verified by `git status` after a review run
- [ ] All five count-bearing lines in requirement 8 are updated;
      `git grep -n 'thirteen\|13-skill\|Exactly two graph skills'` returns no
      stale hit outside receipts and `PRD/work/graph-workflow/`
- [ ] `PRD/README.md:121` carries the three-command invocation line
- [ ] `.claude/skills/graph-gate-review/` exists and is mirrored:
      `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green

## Verification

```bash
git grep -n 'thirteen\|13-skill\|13 are model-invocable\|Exactly two graph skills' \
  -- ':!PRD/instructions/receipts' ':!PRD/work'
git grep -n 'graph-gate-review' AGENT-SKILLS.md PRD/README.md \
  PRD/instructions/workflow-reference.md PRD/instructions/graph-workflow-contract.md
ls .claude/skills/graph-gate-review/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/skills/graph-gate-review/SKILL.md` + `reference.md` (new, + mirror)
- `.claude/skills/graph-run/SKILL.md`, `…/reference.md` (:60, :77-85) (+ mirror)
- `PRD/instructions/graph-workflow-contract.md` (:20)
- `AGENT-SKILLS.md` (:6, :97-98)
- `PRD/instructions/workflow-reference.md` (:6-8)
- `PRD/README.md` (:121)
