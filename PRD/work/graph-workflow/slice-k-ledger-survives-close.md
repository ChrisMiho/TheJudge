# Slice K — The run ledger survives `close`

## Status: planned

Scope item 10. Depends on: **J** (same `thejudge-cleanup` skill files).

## Goal

The proof that a run refused a pre-authorization outlives the run's success.

## Requirements

1. `thejudge-cleanup` deletes `PRD/work/<slug>/`, which holds `GRAPH-RUN.md` —
   the node ledger, the evidence column, and slice G's `## Instruction ledger`.
   Receipts are durable (`thejudge-cleanup/SKILL.md:64`) but carry no graph run
   record, so today that proof survives exactly until the run succeeds.
2. `thejudge-cleanup` gains one required receipt section, written **before the
   delete**, populated only when `GRAPH-RUN.md` exists:

   ```markdown
   ## Graph run

   - Run ID: `<id>` | Profile: `<value>` | Terminal state: `<state>`
   - <the complete `## Node ledger` table, verbatim>
   - <the complete `## Instruction ledger` table, verbatim>
   ```
3. **Verbatim, not summarized.** A summary of a refusal ledger is the driver
   grading its own compliance.
4. Cleanup **refuses to delete the package folder** when `GRAPH-RUN.md` exists
   and this section is absent from the receipt.
5. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] A `thejudge-cleanup` run against a scratch package holding a `GRAPH-RUN.md`
      **refuses** to delete the folder until the receipt carries `## Graph run`
      with both tables verbatim — observed and recorded, not asserted
- [ ] With the section present, the same run completes and the receipt contains
      both tables **byte-identical** to the source `GRAPH-RUN.md` tables (compare
      with `diff`, not by eye)
- [ ] A package with **no** `GRAPH-RUN.md` cleans up normally, with no empty
      `## Graph run` section added
- [ ] The section is written **before** the delete — verified by the refusal path
      above, which cannot pass if the order is reversed
- [ ] The receipt convention in `thejudge-cleanup/SKILL.md` documents the section
      and the refusal condition
- [ ] `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green

## Verification

```bash
git grep -n 'Graph run' .claude/skills/thejudge-cleanup/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

Scratch-package dry runs: record the refusal text, the completed receipt path,
and the `diff` result proving the tables are verbatim. Remove the scratch package
afterward.

## Files touched

- `.claude/skills/thejudge-cleanup/SKILL.md` (+ reference, + mirror)
- `PRD/instructions/graph-workflow-contract.md` — if the receipt convention is
  referenced there
